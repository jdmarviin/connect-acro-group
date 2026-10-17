-- Internal checkout: term-limited access, guarded order lifecycle and refund revocation.
alter table connect.products add column access_days integer check(access_days>0);

create function private.guard_order_status() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status=old.status then return new; end if;
 if not (old.status='pending' and new.status in ('paid','cancelled','failed') or old.status='paid' and new.status='refunded') then
  raise exception 'Invalid order transition: % -> %',old.status,new.status using errcode='23514';
 end if;
 if new.status='paid' then new.paid_at=coalesce(new.paid_at,now()); end if;
 return new;
end $$;
create trigger guard_status before update of status on connect.orders for each row execute function private.guard_order_status();

-- Renewals extend remaining time; lifetime access is never shortened; existing manual access keeps its source.
create or replace function private.grant_paid_courses() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='paid' and old.status is distinct from 'paid' then
  insert into connect.course_enrollments as e(user_id,course_id,source,expires_at)
  select new.user_id,pc.course_id,'purchase',case when bool_or(p.access_days is null) then null else now()+max(p.access_days)*interval '1 day' end
  from connect.order_items i join connect.product_courses pc on pc.product_id=i.product_id join connect.products p on p.id=i.product_id
  where i.order_id=new.id group by pc.course_id
  on conflict(user_id,course_id) do update set
   status=case when e.status='completed' then 'completed' else 'active' end,
   source=case when e.status in ('active','completed') and (e.expires_at is null or e.expires_at>now()) then e.source else 'purchase' end,
   expires_at=case
    when not (e.status in ('active','completed') and (e.expires_at is null or e.expires_at>now())) then excluded.expires_at
    when e.expires_at is null or excluded.expires_at is null then null
    else e.expires_at+(excluded.expires_at-now()) end;
  update connect.user_journeys set status='active_student',student_since=coalesce(student_since,now()) where user_id=new.user_id;
 end if;
 return new;
end $$;

create function private.revoke_refunded_courses() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='refunded' and old.status='paid' then
  update connect.course_enrollments e set status='cancelled'
  where e.user_id=new.user_id and e.source='purchase' and e.status in ('active','completed')
   and e.course_id in (select pc.course_id from connect.order_items i join connect.product_courses pc on pc.product_id=i.product_id where i.order_id=new.id)
   and not exists(select 1 from connect.orders o join connect.order_items i on i.order_id=o.id join connect.product_courses pc on pc.product_id=i.product_id
    where o.user_id=new.user_id and o.status='paid' and pc.course_id=e.course_id);
  if not exists(select 1 from connect.orders where user_id=new.user_id and status='paid') then
   update connect.user_journeys set status='inactive_student' where user_id=new.user_id and status='active_student';
  end if;
 end if;
 return new;
end $$;
create trigger refunded_courses after update of status on connect.orders for each row execute function private.revoke_refunded_courses();

-- Creates the pending order from server-side prices. Only a verified payment webhook may mark it paid.
create function connect.start_checkout(product uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare buyer uuid=auth.uid(); item connect.products; price connect.product_prices; result uuid;
begin
 if not private.is_active_user() then raise exception 'Forbidden' using errcode='42501'; end if;
 select * into item from connect.products where id=product and status='published' and checkout_mode='internal';
 if not found or not exists(select 1 from connect.product_courses where product_id=product) then raise exception 'Product unavailable' using errcode='P0002'; end if;
 select * into price from connect.product_prices where product_id=product and is_active and amount_cents>0 and valid_from<=now() and (valid_until is null or valid_until>now())
 order by valid_from desc limit 1;
 if not found then raise exception 'Price unavailable' using errcode='P0002'; end if;
 if not exists(select 1 from connect.product_courses pc where pc.product_id=product and not exists(select 1 from connect.course_enrollments e
  where e.user_id=buyer and e.course_id=pc.course_id and e.status in ('active','completed') and e.expires_at is null)) then
  raise exception 'Already owned' using errcode='23505';
 end if;
 if (select count(*) from connect.orders where user_id=buyer and status='pending' and created_at>now()-interval '1 hour')>=10 then
  raise exception 'Too many pending orders' using errcode='54000';
 end if;
 insert into connect.orders(user_id,subtotal_cents,total_cents,currency,provider) values(buyer,price.amount_cents,price.amount_cents,price.currency,'stripe') returning id into result;
 insert into connect.order_items(order_id,product_id,product_name_snapshot,unit_amount_cents) values(result,product,item.name,price.amount_cents);
 return result;
end $$;
revoke all on function connect.start_checkout(uuid) from public,anon;
grant execute on function connect.start_checkout(uuid) to authenticated;
