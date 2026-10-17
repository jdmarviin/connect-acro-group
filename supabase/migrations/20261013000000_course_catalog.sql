-- Manual course access. Purchases keep using private.grant_paid_courses().
create function connect.set_course_enrollment(course uuid,member_email text,active boolean)
returns void language plpgsql security definer set search_path='' as $$
declare member uuid;
begin
 if not private.is_manager() then raise exception 'Forbidden' using errcode='42501'; end if;
 select id into member from connect.profiles where email=lower(trim(member_email));
 if not found then raise exception 'Member not found' using errcode='P0002'; end if;
 if not exists(select 1 from connect.courses where id=course) then raise exception 'Course not found' using errcode='P0002'; end if;
 if active then
  insert into connect.course_enrollments(user_id,course_id,source) values(member,course,'manual')
  on conflict(user_id,course_id) do update set status='active',expires_at=null;
 else
  update connect.course_enrollments set status='cancelled' where user_id=member and course_id=course;
 end if;
end $$;
revoke all on function connect.set_course_enrollment(uuid,text,boolean) from public,anon;
grant execute on function connect.set_course_enrollment(uuid,text,boolean) to authenticated;
