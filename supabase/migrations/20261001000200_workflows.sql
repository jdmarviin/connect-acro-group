create function connect.submit_form(assignment uuid,answers jsonb,whatsapp_number text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare a connect.form_assignments; q connect.form_questions; val jsonb; submission uuid; kind text; selected text;
begin
 if not private.can_answer_assignment(assignment) then raise exception 'Form unavailable' using errcode='42501'; end if;
 select * into a from connect.form_assignments where id=assignment for share;
 if a.opens_at>now() or (a.closes_at is not null and a.closes_at<=now()) then raise exception 'Response window closed'; end if;
 if jsonb_typeof(answers) is distinct from 'object' or octet_length(answers::text)>100000 then raise exception 'Invalid answers'; end if;
 select t.kind into kind from connect.form_versions v join connect.form_templates t on t.id=v.form_template_id where v.id=a.form_version_id;
 -- Serialize submissions for this person, including onboarding through different assignments.
 perform 1 from connect.user_journeys where user_id=auth.uid() for update;
 if kind='onboarding' then
  if exists(select 1 from connect.user_journeys where user_id=auth.uid() and onboarding_completed_at is not null) then raise exception 'Onboarding already submitted'; end if;
  if whatsapp_number is null or length(trim(whatsapp_number)) not between 6 and 30 then raise exception 'WhatsApp required'; end if;
 end if;
 if exists(select 1 from connect.form_submissions where assignment_id=assignment and user_id=auth.uid() and status='submitted') then raise exception 'Already submitted'; end if;
 if exists(select 1 from jsonb_object_keys(answers) k where not exists(select 1 from connect.form_questions where form_version_id=a.form_version_id and question_key=k)) then raise exception 'Unknown question'; end if;
 insert into connect.form_submissions(assignment_id,user_id) values(assignment,auth.uid())
 on conflict(assignment_id,user_id) do update set updated_at=now() returning id into submission;
 delete from connect.form_answers where submission_id=submission;
 for q in select * from connect.form_questions where form_version_id=a.form_version_id order by position loop
  val=answers->q.question_key;
  if val is null or val='null'::jsonb or val='""'::jsonb or val='[]'::jsonb then
   if q.is_required then raise exception 'Required question: %',q.question_key; end if;
   continue;
  end if;
  if q.question_type in ('short_text','long_text','single_choice') then
   if jsonb_typeof(val)<>'string' or length(trim(val#>>'{}'))=0 or length(val#>>'{}')>coalesce((q.validation->>'max_length')::int,2000) then raise exception 'Invalid text: %',q.question_key; end if;
   if q.question_type='single_choice' and not exists(select 1 from connect.form_question_options where question_id=q.id and value=val#>>'{}') then raise exception 'Invalid option'; end if;
   insert into connect.form_answers(submission_id,question_id,value_text) values(submission,q.id,val#>>'{}');
  elsif q.question_type='boolean' then
   if jsonb_typeof(val)<>'boolean' then raise exception 'Invalid boolean'; end if;
   insert into connect.form_answers(submission_id,question_id,value_boolean) values(submission,q.id,(val#>>'{}')::boolean);
  elsif q.question_type in ('number','scale') then
   if jsonb_typeof(val)<>'number' then raise exception 'Invalid number'; end if;
   if (q.validation ? 'min' and (val#>>'{}')::numeric<(q.validation->>'min')::numeric) or (q.validation ? 'max' and (val#>>'{}')::numeric>(q.validation->>'max')::numeric) then raise exception 'Number out of range'; end if;
   insert into connect.form_answers(submission_id,question_id,value_number) values(submission,q.id,(val#>>'{}')::numeric);
  elsif q.question_type='date' then
   if jsonb_typeof(val)<>'string' or (val#>>'{}') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid date'; end if;
   insert into connect.form_answers(submission_id,question_id,value_date) values(submission,q.id,(val#>>'{}')::date);
  else
   if jsonb_typeof(val)<>'array' then raise exception 'Invalid options'; end if;
   if exists(select 1 from jsonb_array_elements(val) item where jsonb_typeof(item)<>'string') then raise exception 'Invalid options'; end if;
   for selected in select jsonb_array_elements_text(val) loop
    if not exists(select 1 from connect.form_question_options where question_id=q.id and value=selected) then raise exception 'Invalid option'; end if;
   end loop;
   insert into connect.form_answers(submission_id,question_id,value_json) values(submission,q.id,val);
  end if;
 end loop;
 update connect.form_submissions set status='submitted',submitted_at=now() where id=submission;
 if kind='onboarding' then
  update connect.profiles set whatsapp=trim(whatsapp_number) where id=auth.uid();
  update connect.user_journeys set onboarding_completed_at=now() where user_id=auth.uid();
 end if;
 insert into connect.user_activity_events(user_id,event_type,entity_type,entity_id) values(auth.uid(),'form_submit','form_submissions',submission);
 return submission;
end $$;
revoke all on function connect.submit_form(uuid,jsonb,text) from public,anon;
grant execute on function connect.submit_form(uuid,jsonb,text) to authenticated;

create function private.notify_reflection(target_meeting uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into connect.notifications(user_id,event_type,title,body,action_url,entity_type,entity_id,deduplication_key)
 select distinct s.user_id,'form_available','Como foi a reunião?','Registre seu aprendizado no diário.',
 '/dashboard/diario/'||a.id,'form_assignments',a.id,'reflection:'||a.id||':'||s.user_id
 from connect.form_assignments a join connect.meeting_attendance_sessions s on s.meeting_id=a.meeting_id
 join connect.profiles p on p.id=s.user_id
 where a.meeting_id=target_meeting and s.joined_at is not null and not p.is_blocked
 and not exists(select 1 from connect.user_roles r where r.user_id=s.user_id and r.role in ('owner','admin'))
 on conflict(deduplication_key) do nothing;
end $$;
create function private.meeting_workflow() returns trigger language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
 if new.status='ended' then
  select fv.id into v from connect.form_versions fv join connect.form_templates t on t.id=fv.form_template_id
  where t.slug='post-meeting-reflection' and t.is_active and fv.status='published';
  -- Keep the version assigned at the first end event even when publication changes later.
  if v is not null and not exists(select 1 from connect.form_assignments where meeting_id=new.id) then
   insert into connect.form_assignments(form_version_id,meeting_id,opens_at) values(v,new.id,now()) on conflict do nothing;
  end if;
  perform private.notify_reflection(new.id);
 elsif new.status='live' and new.notification_enabled then
  insert into connect.notifications(user_id,event_type,title,body,action_url,entity_type,entity_id,deduplication_key)
  select p.id,'meeting_started','Reunião ao vivo',new.title,'/reuniao/'||r.external_meeting_id,'meetings',new.id,'live:'||new.id||':'||p.id
  from connect.profiles p join connect.user_journeys j on j.user_id=p.id cross join connect.meeting_rooms r
  where r.id=new.room_id and not p.is_blocked and j.onboarding_completed_at is not null
  and (j.trial_ends_at>now() or j.status='active_student')
  and not exists(select 1 from connect.user_roles ur where ur.user_id=p.id and ur.role in ('owner','admin'))
  on conflict(deduplication_key) do nothing;
 end if;
 return new;
end $$;
create trigger meeting_workflow after insert or update of status on connect.meetings for each row execute function private.meeting_workflow();
create function private.late_attendance() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from connect.meetings where id=new.meeting_id and status='ended') then perform private.notify_reflection(new.meeting_id); end if;
 return new;
end $$;
create trigger late_attendance after insert or update on connect.meeting_attendance_sessions for each row execute function private.late_attendance();
create function private.in_app_delivery() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into connect.notification_deliveries(notification_id,channel,status,sent_at,delivered_at) values(new.id,'in_app','delivered',now(),now());
 return new;
end $$;
create trigger in_app_delivery after insert on connect.notifications for each row execute function private.in_app_delivery();

-- Called only by a verified payment integration. No public endpoint can mark orders paid.
create function private.grant_paid_courses() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='paid' and old.status is distinct from 'paid' then
  insert into connect.course_enrollments(user_id,course_id,source)
  select distinct new.user_id,pc.course_id,'purchase' from connect.order_items i join connect.product_courses pc on pc.product_id=i.product_id where i.order_id=new.id
  on conflict(user_id,course_id) do update set status='active',source='purchase',expires_at=null;
  update connect.user_journeys set status='active_student',student_since=coalesce(student_since,now()) where user_id=new.user_id;
 end if;
 return new;
end $$;
create trigger paid_courses after update of status on connect.orders for each row execute function private.grant_paid_courses();

create function connect.record_lesson_progress(lesson uuid,seconds integer,completed boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare target connect.course_lessons;
begin
 select * into target from connect.course_lessons where id=lesson;
 if not found or not private.can_access_module(target.module_id) then raise exception 'Lesson unavailable' using errcode='42501'; end if;
 if seconds<0 or (target.duration_seconds is not null and seconds>target.duration_seconds) then raise exception 'Invalid progress'; end if;
 insert into connect.lesson_progress(user_id,lesson_id,status,progress_seconds,started_at,completed_at,last_watched_at)
 values(auth.uid(),lesson,case when completed then 'completed' else 'in_progress' end,seconds,now(),case when completed then now() end,now())
 on conflict(user_id,lesson_id) do update set progress_seconds=greatest(lesson_progress.progress_seconds,excluded.progress_seconds),
 status=case when lesson_progress.status='completed' then 'completed' else excluded.status end,
 completed_at=coalesce(lesson_progress.completed_at,excluded.completed_at),last_watched_at=now();
end $$;
revoke all on function connect.record_lesson_progress(uuid,integer,boolean) from public,anon;
grant execute on function connect.record_lesson_progress(uuid,integer,boolean) to authenticated;

create function connect.record_visit() returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active_user() then raise exception 'Forbidden' using errcode='42501'; end if;
 update connect.user_journeys set last_seen_at=now() where user_id=auth.uid();
 insert into connect.user_activity_events(user_id,event_type) select auth.uid(),'login' where not exists(
 select 1 from connect.user_activity_events where user_id=auth.uid() and event_type='login' and occurred_at>now()-interval '15 minutes');
end $$;
revoke all on function connect.record_visit() from public,anon;
grant execute on function connect.record_visit() to authenticated;

create view connect.meeting_attendance_summary with(security_invoker=true) as
select meeting_id,user_id,count(*) sessions,coalesce(sum(duration_seconds),0) duration_seconds
from connect.meeting_attendance_sessions where source<>'legacy' and participant_role_snapshot='member'
and user_id is not null and not exists(select 1 from connect.user_roles where user_id=meeting_attendance_sessions.user_id and role in ('admin','owner'))
group by meeting_id,user_id;
create view connect.user_engagement_summary with(security_invoker=true) as
select p.id user_id,
 (select count(distinct (e.occurred_at at time zone 'America/Sao_Paulo')::date) from connect.user_activity_events e where e.user_id=p.id) active_days,
 (select max(e.occurred_at) from connect.user_activity_events e where e.user_id=p.id) last_seen_at,
 (select count(*) from connect.meeting_attendance_summary s where s.user_id=p.id) meetings_attended,
 (select coalesce(sum(s.duration_seconds),0) from connect.meeting_attendance_summary s where s.user_id=p.id) duration_seconds,
 (select count(*) from connect.form_submissions s where s.user_id=p.id and s.status='submitted') forms_submitted
from connect.profiles p;
create view connect.course_progress_summary with(security_invoker=true) as
select e.user_id,e.course_id,count(l.id) eligible_lessons,
 count(l.id) filter(where p.status='completed') completed_lessons,
 case when count(l.id)=0 then 0 else round(100.0*count(l.id) filter(where p.status='completed')/count(l.id),2) end progress_percent
from connect.course_enrollments e join connect.course_modules m on m.course_id=e.course_id
join connect.course_lessons l on l.module_id=m.id left join connect.lesson_progress p on p.lesson_id=l.id and p.user_id=e.user_id
group by e.user_id,e.course_id;
create view connect.admin_user_overview with(security_invoker=true) as
select p.id,p.full_name,p.email,p.whatsapp,j.status,j.trial_started_at,j.trial_ends_at,j.onboarding_completed_at,e.active_days,e.duration_seconds,e.meetings_attended,e.forms_submitted
from connect.profiles p join connect.user_journeys j on j.user_id=p.id join connect.user_engagement_summary e on e.user_id=p.id;
grant select on connect.meeting_attendance_summary,connect.user_engagement_summary,connect.course_progress_summary,connect.admin_user_overview to authenticated;
revoke execute on all functions in schema private from public,anon;
