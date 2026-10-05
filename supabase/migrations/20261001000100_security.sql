-- Security boundary: clients read through RLS; state transitions use restricted RPCs.
create function private.is_manager() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from connect.user_roles r join connect.profiles p on p.id=r.user_id
 where r.user_id=auth.uid() and r.role in ('owner','admin') and not p.is_blocked)
$$;
create function private.is_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from connect.user_roles where user_id=auth.uid() and role='owner') and private.is_manager()
$$;
create function private.is_active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from connect.profiles where id=auth.uid() and not is_blocked)
$$;
create function private.has_live_access() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active_user() and (private.is_manager() or exists(select 1 from connect.user_journeys
 where user_id=auth.uid() and onboarding_completed_at is not null and (trial_ends_at>now() or status='active_student')))
$$;
create function private.can_answer_assignment(assignment uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active_user() and exists(
 select 1 from connect.form_assignments a join connect.form_versions v on v.id=a.form_version_id
 join connect.form_templates t on t.id=v.form_template_id
 where a.id=assignment and (a.user_id is null or a.user_id=auth.uid())
 and v.status in ('published','archived') and t.is_active
 and (a.meeting_id is null or exists(select 1 from connect.meeting_attendance_sessions s
 where s.meeting_id=a.meeting_id and s.user_id=auth.uid() and s.joined_at is not null)))
$$;
create function private.can_access_module(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active_user() and (private.is_manager() or exists(
 select 1 from connect.course_modules m join connect.courses c on c.id=m.course_id
 join connect.course_enrollments e on e.course_id=c.id and e.user_id=auth.uid()
 where m.id=target and c.status='published' and e.status in ('active','completed')
 and (e.expires_at is null or e.expires_at>now())
 and (m.release_rule='immediate'
 or (m.release_rule='days_after_enrollment' and now()>=e.enrolled_at+make_interval(days=>m.release_after_days))
 or (m.release_rule='previous_module' and not exists(
 select 1 from connect.course_modules prev join connect.course_lessons l on l.module_id=prev.id
 where prev.course_id=m.course_id and prev.position<m.position and not exists(
 select 1 from connect.lesson_progress p where p.user_id=auth.uid() and p.lesson_id=l.id and p.status='completed'))))))
$$;
-- A private function can be used by a policy without exposing private tables.
grant usage on schema private to authenticated;
revoke all on all tables in schema private from anon,authenticated;
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_manager(),private.is_owner(),private.is_active_user(),private.has_live_access(),private.can_answer_assignment(uuid),private.can_access_module(uuid) to authenticated;
grant select on connect.profiles to authenticated;
create policy read_profiles on connect.profiles for select to authenticated using(private.is_active_user() and (id=auth.uid() or private.is_manager()));
grant select on connect.user_roles to authenticated;
create policy read_user_roles on connect.user_roles for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.user_journeys to authenticated;
create policy read_user_journeys on connect.user_journeys for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.user_journey_status_history to authenticated;
create policy read_user_journey_status_history on connect.user_journey_status_history for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.user_consents to authenticated;
create policy read_user_consents on connect.user_consents for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.user_activity_events to authenticated;
create policy read_user_activity_events on connect.user_activity_events for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.form_submissions to authenticated;
create policy read_form_submissions on connect.form_submissions for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.notifications to authenticated;
create policy read_notifications on connect.notifications for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.course_enrollments to authenticated;
create policy read_course_enrollments on connect.course_enrollments for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.lesson_progress to authenticated;
create policy read_lesson_progress on connect.lesson_progress for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.orders to authenticated;
create policy read_orders on connect.orders for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.meeting_rooms to authenticated;
create policy read_meeting_rooms on connect.meeting_rooms for select to authenticated using(private.has_live_access() or (private.is_active_user() and exists(select 1 from connect.meeting_attendance_sessions s where s.user_id=auth.uid() and exists(select 1 from connect.meetings m where m.id=s.meeting_id and m.room_id=meeting_rooms.id))));
grant select on connect.meetings to authenticated;
create policy read_meetings on connect.meetings for select to authenticated using(private.has_live_access() or (private.is_active_user() and exists(select 1 from connect.meeting_attendance_sessions s where s.user_id=auth.uid() and s.meeting_id=meetings.id)));
grant select on connect.meeting_attendance_sessions to authenticated;
create policy read_attendance on connect.meeting_attendance_sessions for select to authenticated using(private.is_active_user() and (user_id=auth.uid() or private.is_manager()));
grant select on connect.form_assignments to authenticated;
create policy read_assignments on connect.form_assignments for select to authenticated using(private.is_manager() or private.can_answer_assignment(id));
grant select on connect.form_answers to authenticated;
create policy read_answers on connect.form_answers for select to authenticated using(exists(select 1 from connect.form_submissions s where s.id=submission_id));
grant select on connect.form_templates to authenticated;
create policy read_form_templates on connect.form_templates for select to authenticated using(private.is_active_user());
grant select on connect.form_versions to authenticated;
create policy read_form_versions on connect.form_versions for select to authenticated using(private.is_active_user());
grant select on connect.form_questions to authenticated;
create policy read_form_questions on connect.form_questions for select to authenticated using(private.is_active_user());
grant select on connect.form_question_options to authenticated;
create policy read_form_question_options on connect.form_question_options for select to authenticated using(private.is_active_user());
grant select,insert,update,delete on connect.admin_notes to authenticated;
create policy manage_admin_notes on connect.admin_notes for all to authenticated using(private.is_manager()) with check(private.is_manager() and author_id=auth.uid());
grant select,insert,update,delete on connect.notification_templates to authenticated;
create policy manage_notification_templates on connect.notification_templates for all to authenticated using(private.is_manager()) with check(private.is_manager());
grant select,insert,update,delete on connect.notification_preferences to authenticated;
create policy own_preferences on connect.notification_preferences for all to authenticated using(user_id=auth.uid() and private.is_active_user()) with check(user_id=auth.uid() and private.is_active_user());
grant insert on connect.user_consents to authenticated;
create policy give_consent on connect.user_consents for insert to authenticated with check(user_id=auth.uid() and private.is_active_user() and occurred_at between now()-interval '1 minute' and now()+interval '1 minute');
grant update(full_name,whatsapp,locale,timezone) on connect.profiles to authenticated;
create policy edit_profile on connect.profiles for update to authenticated using(id=auth.uid() and private.is_active_user()) with check(id=auth.uid());
grant update(read_at) on connect.notifications to authenticated;
create policy mark_notification on connect.notifications for update to authenticated using(user_id=auth.uid() and private.is_active_user()) with check(user_id=auth.uid());
grant select on connect.courses,connect.course_modules,connect.course_lessons,connect.products,connect.product_courses,connect.product_prices,connect.order_items,connect.payment_transactions to authenticated;
create policy read_courses on connect.courses for select to authenticated using(private.is_active_user() and (status='published' or private.is_manager()));
create policy read_modules on connect.course_modules for select to authenticated using(private.can_access_module(id));
create policy read_lessons on connect.course_lessons for select to authenticated using(private.can_access_module(module_id));
create policy read_products on connect.products for select to authenticated using(private.is_active_user() and (status='published' or private.is_manager()));
create policy read_product_courses on connect.product_courses for select to authenticated using(exists(select 1 from connect.products p where p.id=product_id));
create policy read_prices on connect.product_prices for select to authenticated using(exists(select 1 from connect.products p where p.id=product_id));
create policy read_order_items on connect.order_items for select to authenticated using(exists(select 1 from connect.orders o where o.id=order_id));
create policy read_transactions on connect.payment_transactions for select to authenticated using(exists(select 1 from connect.orders o where o.id=order_id));
grant insert,update,delete on connect.courses to authenticated;
create policy manage_courses on connect.courses for all to authenticated using(private.is_manager()) with check(private.is_manager());
grant insert,update,delete on connect.course_modules to authenticated;
create policy manage_course_modules on connect.course_modules for all to authenticated using(private.is_manager()) with check(private.is_manager());
grant insert,update,delete on connect.course_lessons to authenticated;
create policy manage_course_lessons on connect.course_lessons for all to authenticated using(private.is_manager()) with check(private.is_manager());
grant insert,update,delete on connect.products to authenticated;
create policy manage_products on connect.products for all to authenticated using(private.is_manager()) with check(private.is_manager());
grant insert,update,delete on connect.product_courses to authenticated;
create policy manage_product_courses on connect.product_courses for all to authenticated using(private.is_manager()) with check(private.is_manager());
grant insert,update,delete on connect.product_prices to authenticated;
create policy manage_product_prices on connect.product_prices for all to authenticated using(private.is_manager()) with check(private.is_manager());

create function private.handle_new_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into connect.profiles(id,email,full_name) values(new.id,lower(new.email),coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''));
 insert into connect.user_roles(user_id,role) values(new.id,'member');
 insert into connect.user_journeys(user_id,trial_started_at,trial_ends_at) values(new.id,new.created_at,new.created_at+interval '30 days');
 return new;
end $$;
create trigger connect_new_user after insert on auth.users for each row execute function private.handle_new_auth_user();
create function private.sync_auth_email() returns trigger language plpgsql security definer set search_path='' as $$
begin update connect.profiles set email=lower(new.email) where id=new.id; return new; end $$;
create trigger connect_email after update of email on auth.users for each row execute function private.sync_auth_email();

create function private.protect_owner() returns trigger language plpgsql set search_path='' as $$
begin
 if old.role='owner' and (tg_op='DELETE' or new.role<>'owner' or new.user_id<>old.user_id) then raise exception 'Owner cannot be removed or demoted'; end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger protect_owner before update or delete on connect.user_roles for each row execute function private.protect_owner();

create function private.record_status() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status is distinct from new.status then
  new.status_changed_at=now(); new.status_changed_by=auth.uid();
  insert into connect.user_journey_status_history(user_id,from_status,to_status,changed_by) values(new.user_id,old.status,new.status,auth.uid());
 end if;
 return new;
end $$;
create trigger journey_history before update on connect.user_journeys for each row execute function private.record_status();
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.audit_logs(actor_user_id,action,entity_type,entity_id,before_data,after_data)
 values(auth.uid(),tg_op,tg_table_name,coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id',to_jsonb(new)->>'user_id',to_jsonb(old)->>'user_id'),
 case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger audit_change after insert or update or delete on connect.user_roles for each row execute function private.audit_change();
create trigger audit_change after insert or update or delete on connect.user_journeys for each row execute function private.audit_change();
create trigger audit_change after insert or update or delete on connect.admin_notes for each row execute function private.audit_change();
create trigger audit_change after insert or update or delete on connect.course_enrollments for each row execute function private.audit_change();
create trigger audit_change after insert or update or delete on connect.orders for each row execute function private.audit_change();

create function private.attendance_duration() returns trigger language plpgsql set search_path='' as $$
begin
 if new.source<>'legacy' then
 new.duration_seconds=case when new.joined_at is not null and new.left_at is not null then extract(epoch from new.left_at-new.joined_at) else null end;
 end if;
 new.status=case when new.joined_at is null then 'incomplete' when new.left_at is null then 'joined' else 'left' end;
 return new;
end $$;
create trigger attendance_duration before insert or update on connect.meeting_attendance_sessions for each row execute function private.attendance_duration();

-- Administrators use a constrained transition instead of arbitrary profile/role updates.
create function connect.manage_member(target uuid,new_status connect.journey_status default null,blocked boolean default null,admin_access boolean default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_manager() then raise exception 'Forbidden' using errcode='42501'; end if;
 if exists(select 1 from connect.user_roles where user_id=target and role='owner') then raise exception 'Owner protected'; end if;
 if admin_access is not null then
  if not private.is_owner() then raise exception 'Only owner can manage administrators' using errcode='42501'; end if;
  if admin_access then insert into connect.user_roles(user_id,role,assigned_by) values(target,'admin',auth.uid()) on conflict do nothing;
  else delete from connect.user_roles where user_id=target and role='admin'; end if;
 end if;
 if not private.is_owner() and exists(select 1 from connect.user_roles where user_id=target and role='admin') then raise exception 'Administrator protected'; end if;
 if new_status is not null then update connect.user_journeys set status=new_status where user_id=target; end if;
 if blocked is not null then
  update connect.profiles set is_blocked=blocked where id=target;
  insert into private.audit_logs(actor_user_id,action,entity_type,entity_id,after_data) values(auth.uid(),'block','profiles',target::text,jsonb_build_object('is_blocked',blocked));
 end if;
end $$;
revoke all on function connect.manage_member(uuid,connect.journey_status,boolean,boolean) from public,anon;
grant execute on function connect.manage_member(uuid,connect.journey_status,boolean,boolean) to authenticated;

-- Freeze published form content. Archival remains allowed, for future versions.
create function private.freeze_form_content() returns trigger language plpgsql security definer set search_path='' as $$
declare v uuid; old_v uuid; state text;
begin
 if tg_table_name='form_versions' then
  if old.status<>'draft' and (tg_op='DELETE' or (to_jsonb(new)-'status'-'updated_at') is distinct from (to_jsonb(old)-'status'-'updated_at') or new.status='draft') then raise exception 'Published form is immutable'; end if;
 else
  if tg_table_name='form_questions' then
   v=coalesce(new.form_version_id,old.form_version_id);
   if tg_op<>'INSERT' then old_v=old.form_version_id; end if;
  else
   select form_version_id into v from connect.form_questions where id=coalesce(new.question_id,old.question_id);
   if tg_op<>'INSERT' then select form_version_id into old_v from connect.form_questions where id=old.question_id; end if;
  end if;
  select status into state from connect.form_versions where id=v;
  if state<>'draft' then raise exception 'Published form is immutable'; end if;
  if old_v is not null and exists(select 1 from connect.form_versions where id=old_v and status<>'draft') then raise exception 'Published form is immutable'; end if;
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger freeze_version before update or delete on connect.form_versions for each row execute function private.freeze_form_content();
create trigger freeze_question before insert or update or delete on connect.form_questions for each row execute function private.freeze_form_content();
create trigger freeze_option before insert or update or delete on connect.form_question_options for each row execute function private.freeze_form_content();
revoke execute on all functions in schema private from public,anon;
