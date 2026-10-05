-- The retired Payload tables remain available to the trusted database owner
-- for audit/recovery, but must no longer be exposed through the public Data API.
-- Exact legacy table names only: do not change unrelated public objects.
do $$
declare legacy_table text;
begin
  foreach legacy_table in array array[
    'users','meetings','meeting_logs','meeting_tickets','zoom_events','zoom_credentials','products',
    'payload_locked_documents_rels','payload_locked_documents','payload_kv','payload_migrations',
    'payload_preferences','payload_preferences_rels'
  ] loop
    if to_regclass(format('public.%I',legacy_table)) is not null then
      execute format('revoke all privileges on table public.%I from anon,authenticated,public',legacy_table);
    end if;
  end loop;
end $$;
