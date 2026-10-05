-- Older Payload versions rounded each interval to whole minutes. Preserve the
-- historical report total while retaining exact timestamp-derived seconds for audit.
-- New webhook sessions have no legacy_duration_minutes and use exact seconds.
create or replace view connect.meeting_attendance_summary with(security_invoker=true) as
select meeting_id,user_id,count(*) sessions,
 coalesce(sum(coalesce(legacy_duration_minutes*60,duration_seconds)),0) duration_seconds
from connect.meeting_attendance_sessions where source<>'legacy' and participant_role_snapshot='member'
and user_id is not null and not exists(select 1 from connect.user_roles where user_id=meeting_attendance_sessions.user_id and role in ('admin','owner'))
group by meeting_id,user_id;
