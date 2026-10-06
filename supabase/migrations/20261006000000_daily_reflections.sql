-- One daily reflection per member, released only by confirmed attendance completion.
alter table connect.form_assignments add column reflection_day date;
alter table connect.form_assignments add constraint daily_reflection_has_owner
  check(reflection_day is null or (user_id is not null and meeting_id is not null));
alter table connect.form_assignments drop constraint form_assignments_meeting_id_form_version_id_key;
create unique index one_shared_meeting_assignment on connect.form_assignments(meeting_id,form_version_id)
  where user_id is null;
create unique index one_daily_reflection on connect.form_assignments(user_id,reflection_day)
  where reflection_day is not null;

-- Carry the first submitted legacy response into its daily assignment without deleting
-- answers or additional historical submissions. Days follow the existing Brasília convention.
do $$ declare r record; target uuid; begin
 for r in
  select distinct on (s.user_id,(coalesce(m.actual_ended_at,m.actual_started_at,a.created_at) at time zone 'America/Sao_Paulo')::date)
    s.id submission_id,s.user_id,a.form_version_id,a.meeting_id,a.opens_at,
    (coalesce(m.actual_ended_at,m.actual_started_at,a.created_at) at time zone 'America/Sao_Paulo')::date as reflection_date
  from connect.form_submissions s join connect.form_assignments a on a.id=s.assignment_id
  join connect.meetings m on m.id=a.meeting_id
  join connect.form_versions v on v.id=a.form_version_id
  join connect.form_templates t on t.id=v.form_template_id
  where s.status='submitted' and t.slug='post-meeting-reflection'
  order by s.user_id,(coalesce(m.actual_ended_at,m.actual_started_at,a.created_at) at time zone 'America/Sao_Paulo')::date,s.submitted_at,s.id
 loop
  insert into connect.form_assignments(user_id,form_version_id,meeting_id,reflection_day,opens_at)
    values(r.user_id,r.form_version_id,r.meeting_id,r.reflection_date,r.opens_at) returning id into target;
  update connect.form_submissions set assignment_id=target where id=r.submission_id;
 end loop;
end $$;

create or replace function private.notify_reflection(target_meeting uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v uuid; r record; assignment uuid;
begin
 select fv.id into v from connect.form_versions fv join connect.form_templates t on t.id=fv.form_template_id
 where t.slug='post-meeting-reflection' and t.is_active and fv.status='published';
 if v is null then return; end if;
 for r in
  select distinct s.user_id,
   (coalesce(s.left_at,m.actual_ended_at) at time zone 'America/Sao_Paulo')::date as reflection_date
  from connect.meeting_attendance_sessions s join connect.meetings m on m.id=s.meeting_id
  join connect.profiles p on p.id=s.user_id
  where s.meeting_id=target_meeting and s.source<>'legacy' and s.participant_role_snapshot='member'
   and s.joined_at is not null and not p.is_blocked
   and (s.left_at>=s.joined_at or (m.status='ended' and m.actual_ended_at>=s.joined_at))
   and not exists(select 1 from connect.user_roles ur where ur.user_id=s.user_id and ur.role in ('owner','admin'))
 loop
  insert into connect.form_assignments(user_id,form_version_id,meeting_id,reflection_day)
   values(r.user_id,v,target_meeting,r.reflection_date)
   on conflict(user_id,reflection_day) where reflection_day is not null do nothing;
  select id into assignment from connect.form_assignments where user_id=r.user_id and reflection_day=r.reflection_date;
  if not exists(select 1 from connect.form_submissions where assignment_id=assignment and user_id=r.user_id and status='submitted') then
   insert into connect.notifications(user_id,event_type,title,body,action_url,entity_type,entity_id,deduplication_key)
    values(r.user_id,'form_available','Questionário do dia','Sua participação foi confirmada. Registre o que aprendeu hoje.',
     '/dashboard/diario/'||assignment,'form_assignments',assignment,'daily-reflection:'||r.user_id||':'||r.reflection_date)
    on conflict(deduplication_key) do nothing;
  end if;
 end loop;
end $$;

create or replace function private.meeting_workflow() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='ended' then
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

create or replace function private.late_attendance() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.joined_at is not null and (new.left_at is not null or exists(select 1 from connect.meetings where id=new.meeting_id and status='ended')) then
  perform private.notify_reflection(new.meeting_id);
 end if;
 return new;
end $$;

create or replace function private.can_answer_assignment(assignment uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active_user() and exists(
  select 1 from connect.form_assignments a join connect.form_versions v on v.id=a.form_version_id
  join connect.form_templates t on t.id=v.form_template_id
  where a.id=assignment and (a.user_id is null or a.user_id=auth.uid())
  and v.status in ('published','archived') and t.is_active
  and (a.meeting_id is null or (
   a.user_id=auth.uid() and a.reflection_day is not null and exists(
    select 1 from connect.meeting_attendance_sessions s join connect.meetings m on m.id=s.meeting_id
    where s.meeting_id=a.meeting_id and s.user_id=auth.uid() and s.source<>'legacy'
    and s.participant_role_snapshot='member' and s.joined_at is not null
    and (s.left_at>=s.joined_at or (m.status='ended' and m.actual_ended_at>=s.joined_at))
   )
  )))
$$;

-- Historical answers stay readable even if a form is retired or the trial expires.
drop policy read_assignments on connect.form_assignments;
create policy read_assignments on connect.form_assignments for select to authenticated using(
 private.is_manager() or private.can_answer_assignment(id) or (private.is_active_user() and exists(
  select 1 from connect.form_submissions s where s.assignment_id=form_assignments.id and s.user_id=auth.uid() and s.status='submitted'
 ))
);

update connect.notifications set read_at=coalesce(read_at,now()) where deduplication_key like 'reflection:%';
do $$ declare r record; begin
 for r in select distinct meeting_id from connect.meeting_attendance_sessions where meeting_id is not null loop
  perform private.notify_reflection(r.meeting_id);
 end loop;
end $$;
revoke all on function private.notify_reflection(uuid),private.meeting_workflow(),private.late_attendance() from public,anon,authenticated;
