-- Isolated application schema: coexist with existing Payload tables in public.
-- Existing connect tables cause a safe failure; run through the versioned migration runner.
create schema if not exists connect;
grant usage on schema connect to authenticated,service_role;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
alter default privileges in schema connect revoke all on tables from anon, authenticated;
alter default privileges in schema connect revoke execute on functions from public;
create type connect.user_role as enum ('owner','admin','member');
create type connect.journey_status as enum ('trial','awaiting_evaluation','approved','needs_preparation','not_continuing','active_student','inactive_student');
create type connect.notification_channel as enum ('in_app','web_push','email','whatsapp');

create table connect.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  whatsapp text,
  avatar_url text,
  avatar_bucket text,
  avatar_path text,
  zoom_user_id text unique,
  locale text not null default 'pt-BR' check(locale in ('pt-BR','ht-HT')),
  timezone text not null default 'America/Sao_Paulo',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.user_roles (
  user_id uuid references connect.profiles(id) on delete cascade,
  role connect.user_role not null default 'member',
  assigned_by uuid references connect.profiles(id) on delete set null,
  primary key(user_id,role),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.user_journeys (
  user_id uuid primary key references connect.profiles(id) on delete cascade,
  status connect.journey_status not null default 'trial',
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now()+interval '30 days'),
  onboarding_completed_at timestamptz,
  evaluation_requested_at timestamptz,
  approved_at timestamptz,
  student_since timestamptz,
  last_seen_at timestamptz,
  status_changed_by uuid references connect.profiles(id),
  status_changed_at timestamptz not null default now(),
  check(trial_ends_at >= trial_started_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.user_journey_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  from_status connect.journey_status,
  to_status connect.journey_status not null,
  reason text,
  changed_by uuid references connect.profiles(id),
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  consent_type text not null check(consent_type in ('terms','privacy','marketing_email','marketing_whatsapp','analytics')),
  document_version text not null,
  granted boolean not null,
  occurred_at timestamptz not null default now(),
  source text not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.admin_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  author_id uuid not null references connect.profiles(id),
  body text not null check(length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.user_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  event_type text not null,
  occurred_at timestamptz not null default now(),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.meeting_rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid references connect.profiles(id),
  provider text not null default 'zoom',
  external_meeting_id text not null,
  room_type text not null check(room_type in ('scheduled','recurring','personal')),
  room_key text unique,
  title text not null,
  duration_minutes integer not null default 60 check(duration_minutes between 1 and 1440),
  is_active boolean not null default true,
  unique(provider,external_meeting_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.meetings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references connect.meeting_rooms(id),
  title text not null,
  status text not null default 'scheduled' check(status in ('scheduled','live','ended','cancelled')),
  external_uuid text unique,
  scheduled_starts_at timestamptz,
  actual_started_at timestamptz,
  actual_ended_at timestamptz,
  planned_duration_minutes integer not null default 60 check(planned_duration_minutes>0),
  notification_enabled boolean not null default true,
  created_by uuid references connect.profiles(id),
  check(actual_ended_at is null or actual_started_at is null or actual_ended_at>=actual_started_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.meeting_attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references connect.meetings(id),
  user_id uuid references connect.profiles(id) on delete set null,
  session_key text not null unique,
  provider_participant_id text,
  participant_name text,
  participant_email text,
  participant_role_snapshot text not null default 'unknown' check(participant_role_snapshot in ('owner','admin','member','unknown')),
  joined_at timestamptz,
  left_at timestamptz,
  duration_seconds numeric(16,4),
  status text not null default 'incomplete' check(status in ('joined','left','incomplete')),
  source text not null default 'zoom_webhook' check(source in ('zoom_webhook','reconciliation','legacy')),
  legacy_external_meeting_id text,
  legacy_external_uuid text,
  legacy_duration_minutes numeric,
  check(left_at is null or joined_at is null or left_at>=joined_at),
  check(duration_seconds is null or duration_seconds>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.meeting_access_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  meeting_id uuid references connect.meetings(id),
  room_id uuid not null references connect.meeting_rooms(id),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.form_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check(kind in ('onboarding','post_meeting','evaluation','survey')),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references connect.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.form_versions (
  id uuid primary key default gen_random_uuid(),
  form_template_id uuid not null references connect.form_templates(id),
  version integer not null check(version>0),
  title jsonb not null default '{}',
  description jsonb not null default '{}',
  status text not null default 'draft' check(status in ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid references connect.profiles(id),
  unique(form_template_id,version),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.form_questions (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references connect.form_versions(id),
  question_key text not null,
  label jsonb not null,
  help_text jsonb not null default '{}',
  question_type text not null check(question_type in ('short_text','long_text','single_choice','multiple_choice','boolean','number','scale','date')),
  is_required boolean not null default false,
  position integer not null check(position>0),
  validation jsonb not null default '{}',
  unique(form_version_id,question_key),
  unique(form_version_id,position),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.form_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references connect.form_questions(id),
  value text not null,
  label jsonb not null,
  position integer not null,
  unique(question_id,value),
  unique(question_id,position),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.form_assignments (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references connect.form_versions(id),
  user_id uuid references connect.profiles(id),
  meeting_id uuid references connect.meetings(id),
  opens_at timestamptz not null default now(),
  closes_at timestamptz,
  is_required boolean not null default false,
  unique(meeting_id,form_version_id),
  check(closes_at is null or closes_at>opens_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.form_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references connect.form_assignments(id),
  user_id uuid not null references connect.profiles(id),
  status text not null default 'draft' check(status in ('draft','submitted')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique(assignment_id,user_id),
  check((status='submitted')=(submitted_at is not null)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.form_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references connect.form_submissions(id),
  question_id uuid not null references connect.form_questions(id),
  value_text text,
  value_number numeric,
  value_boolean boolean,
  value_date date,
  value_json jsonb,
  unique(submission_id,question_id),
  check(num_nonnulls(value_text,value_number,value_boolean,value_date,value_json)=1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.notification_templates (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  channel connect.notification_channel not null,
  locale text not null,
  title_template text not null,
  body_template text not null,
  is_active boolean not null default true,
  unique(event_type,channel,locale),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  event_type text not null,
  title text not null,
  body text not null,
  action_url text check(action_url is null or (action_url like '/%' and action_url not like '//%')),
  entity_type text,
  entity_id uuid,
  deduplication_key text not null unique,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references connect.notifications(id),
  channel connect.notification_channel not null,
  status text not null default 'pending' check(status in ('pending','processing','sent','delivered','failed','cancelled')),
  attempt_count integer not null default 0 check(attempt_count>=0),
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  provider_message_id text,
  last_error_code text,
  last_error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  unique(notification_id,channel),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.notification_preferences (
  user_id uuid not null references connect.profiles(id),
  channel connect.notification_channel not null,
  event_type text not null,
  enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  primary key(user_id,channel,event_type),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  endpoint_hash text not null unique,
  endpoint_encrypted text not null,
  keys_encrypted text not null,
  user_agent text,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_bucket text,
  cover_path text,
  status text not null default 'draft' check(status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references connect.courses(id),
  title text not null,
  description text,
  position integer not null check(position>0),
  release_rule text not null default 'immediate' check(release_rule in ('immediate','days_after_enrollment','previous_module')),
  release_after_days integer not null default 0 check(release_after_days>=0),
  unique(course_id,position),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references connect.course_modules(id),
  title text not null,
  description text,
  content_type text not null check(content_type in ('video','text','live','download')),
  content_bucket text,
  content_path text,
  external_url text,
  duration_seconds integer check(duration_seconds>=0),
  position integer not null check(position>0),
  is_preview boolean not null default false,
  unique(module_id,position),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  course_id uuid not null references connect.courses(id),
  status text not null default 'active' check(status in ('active','completed','suspended','cancelled','expired')),
  source text not null check(source in ('purchase','manual','migration')),
  enrolled_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(user_id,course_id),
  check(expires_at is null or expires_at>enrolled_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.lesson_progress (
  user_id uuid not null references connect.profiles(id),
  lesson_id uuid not null references connect.course_lessons(id),
  status text not null default 'not_started' check(status in ('not_started','in_progress','completed')),
  progress_seconds integer not null default 0 check(progress_seconds>=0),
  started_at timestamptz,
  completed_at timestamptz,
  last_watched_at timestamptz,
  primary key(user_id,lesson_id),
  check((status='completed')=(completed_at is not null)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_bucket text,
  cover_path text,
  thumbnail_url text,
  status text not null default 'draft' check(status in ('draft','published','archived')),
  checkout_mode text not null default 'external' check(checkout_mode in ('external','internal')),
  external_checkout_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.product_courses (
  product_id uuid not null references connect.products(id),
  course_id uuid not null references connect.courses(id),
  primary key(product_id,course_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references connect.products(id),
  amount_cents bigint not null check(amount_cents>=0),
  currency char(3) not null default 'BRL',
  installments_max integer not null default 1 check(installments_max>0),
  is_active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  check(valid_until is null or valid_until>valid_from),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references connect.profiles(id),
  status text not null default 'pending' check(status in ('pending','paid','cancelled','refunded','failed')),
  subtotal_cents bigint not null check(subtotal_cents>=0),
  total_cents bigint not null check(total_cents>=0),
  currency char(3) not null default 'BRL',
  provider text not null,
  provider_order_id text,
  paid_at timestamptz,
  unique(provider,provider_order_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references connect.orders(id),
  product_id uuid not null references connect.products(id),
  product_name_snapshot text not null,
  unit_amount_cents bigint not null check(unit_amount_cents>=0),
  quantity integer not null default 1 check(quantity>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table connect.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references connect.orders(id),
  provider text not null,
  provider_transaction_id text not null,
  type text not null check(type in ('charge','refund','chargeback')),
  method text check(method in ('pix','card')),
  status text not null check(status in ('pending','succeeded','failed')),
  amount_cents bigint not null check(amount_cents>=0),
  payload jsonb not null default '{}',
  processed_at timestamptz,
  unique(provider,provider_transaction_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.meeting_room_secrets (
  room_id uuid primary key references connect.meeting_rooms(id),
  join_url_encrypted text not null,
  passcode_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.zoom_credentials (
  user_id uuid primary key references connect.profiles(id),
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.integration_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_key text not null,
  event_type text not null,
  external_entity_id text,
  payload jsonb not null,
  processing_status text not null default 'processed' check(processing_status in ('received','processed','ignored','failed')),
  error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider,event_key),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.legacy_entity_map (
  entity_type text not null,
  legacy_id text not null,
  new_id uuid not null,
  primary key(entity_type,legacy_id),
  unique(entity_type,new_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_unique on connect.profiles(lower(email));
create unique index one_owner on connect.user_roles(role) where role='owner';
create unique index one_published_version on connect.form_versions(form_template_id) where status='published';
create unique index one_global_assignment on connect.form_assignments(form_version_id) where user_id is null and meeting_id is null;
create unique index one_user_assignment on connect.form_assignments(user_id,form_version_id) where meeting_id is null and user_id is not null;
create index journeys_status_trial on connect.user_journeys(status,trial_ends_at);
create index sessions_user_time on connect.meeting_attendance_sessions(user_id,joined_at desc);
create index sessions_meeting_user on connect.meeting_attendance_sessions(meeting_id,user_id);
create index sessions_connection_time on connect.meeting_attendance_sessions(meeting_id,provider_participant_id,joined_at);
create index meetings_status_time on connect.meetings(status,scheduled_starts_at);
create index meetings_room_time on connect.meetings(room_id,actual_started_at desc);
create index activity_user_time on connect.user_activity_events(user_id,occurred_at desc);
create index submissions_user_time on connect.form_submissions(user_id,submitted_at desc);
create index notifications_inbox on connect.notifications(user_id,read_at,created_at desc);
create index delivery_queue on connect.notification_deliveries(status,next_attempt_at);
-- Index every referencing column (including foreign keys not leading in a composite key).
do $$ declare r record; begin
 for r in select t.relname table_name,a.attname column_name
 from pg_constraint c join pg_class t on t.oid=c.conrelid
 join pg_namespace n on n.oid=t.relnamespace
 cross join lateral unnest(c.conkey) k(attnum)
 join pg_attribute a on a.attrelid=t.oid and a.attnum=k.attnum
 where c.contype='f' and n.nspname='connect'
 loop execute format('create index if not exists %I on connect.%I(%I)',left(r.table_name||'_'||r.column_name||'_fk_idx',63),r.table_name,r.column_name); end loop;
end $$;
create function private.set_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger updated_at before update on connect.profiles for each row execute function private.set_updated_at();
alter table connect.profiles enable row level security;
revoke all on connect.profiles from anon,authenticated;
create trigger updated_at before update on connect.user_roles for each row execute function private.set_updated_at();
alter table connect.user_roles enable row level security;
revoke all on connect.user_roles from anon,authenticated;
create trigger updated_at before update on connect.user_journeys for each row execute function private.set_updated_at();
alter table connect.user_journeys enable row level security;
revoke all on connect.user_journeys from anon,authenticated;
create trigger updated_at before update on connect.user_journey_status_history for each row execute function private.set_updated_at();
alter table connect.user_journey_status_history enable row level security;
revoke all on connect.user_journey_status_history from anon,authenticated;
create trigger updated_at before update on connect.user_consents for each row execute function private.set_updated_at();
alter table connect.user_consents enable row level security;
revoke all on connect.user_consents from anon,authenticated;
create trigger updated_at before update on connect.admin_notes for each row execute function private.set_updated_at();
alter table connect.admin_notes enable row level security;
revoke all on connect.admin_notes from anon,authenticated;
create trigger updated_at before update on connect.user_activity_events for each row execute function private.set_updated_at();
alter table connect.user_activity_events enable row level security;
revoke all on connect.user_activity_events from anon,authenticated;
create trigger updated_at before update on connect.meeting_rooms for each row execute function private.set_updated_at();
alter table connect.meeting_rooms enable row level security;
revoke all on connect.meeting_rooms from anon,authenticated;
create trigger updated_at before update on connect.meetings for each row execute function private.set_updated_at();
alter table connect.meetings enable row level security;
revoke all on connect.meetings from anon,authenticated;
create trigger updated_at before update on connect.meeting_attendance_sessions for each row execute function private.set_updated_at();
alter table connect.meeting_attendance_sessions enable row level security;
revoke all on connect.meeting_attendance_sessions from anon,authenticated;
create trigger updated_at before update on connect.meeting_access_tickets for each row execute function private.set_updated_at();
alter table connect.meeting_access_tickets enable row level security;
revoke all on connect.meeting_access_tickets from anon,authenticated;
create trigger updated_at before update on connect.form_templates for each row execute function private.set_updated_at();
alter table connect.form_templates enable row level security;
revoke all on connect.form_templates from anon,authenticated;
create trigger updated_at before update on connect.form_versions for each row execute function private.set_updated_at();
alter table connect.form_versions enable row level security;
revoke all on connect.form_versions from anon,authenticated;
create trigger updated_at before update on connect.form_questions for each row execute function private.set_updated_at();
alter table connect.form_questions enable row level security;
revoke all on connect.form_questions from anon,authenticated;
create trigger updated_at before update on connect.form_question_options for each row execute function private.set_updated_at();
alter table connect.form_question_options enable row level security;
revoke all on connect.form_question_options from anon,authenticated;
create trigger updated_at before update on connect.form_assignments for each row execute function private.set_updated_at();
alter table connect.form_assignments enable row level security;
revoke all on connect.form_assignments from anon,authenticated;
create trigger updated_at before update on connect.form_submissions for each row execute function private.set_updated_at();
alter table connect.form_submissions enable row level security;
revoke all on connect.form_submissions from anon,authenticated;
create trigger updated_at before update on connect.form_answers for each row execute function private.set_updated_at();
alter table connect.form_answers enable row level security;
revoke all on connect.form_answers from anon,authenticated;
create trigger updated_at before update on connect.notification_templates for each row execute function private.set_updated_at();
alter table connect.notification_templates enable row level security;
revoke all on connect.notification_templates from anon,authenticated;
create trigger updated_at before update on connect.notifications for each row execute function private.set_updated_at();
alter table connect.notifications enable row level security;
revoke all on connect.notifications from anon,authenticated;
create trigger updated_at before update on connect.notification_deliveries for each row execute function private.set_updated_at();
alter table connect.notification_deliveries enable row level security;
revoke all on connect.notification_deliveries from anon,authenticated;
create trigger updated_at before update on connect.notification_preferences for each row execute function private.set_updated_at();
alter table connect.notification_preferences enable row level security;
revoke all on connect.notification_preferences from anon,authenticated;
create trigger updated_at before update on connect.push_subscriptions for each row execute function private.set_updated_at();
alter table connect.push_subscriptions enable row level security;
revoke all on connect.push_subscriptions from anon,authenticated;
create trigger updated_at before update on connect.courses for each row execute function private.set_updated_at();
alter table connect.courses enable row level security;
revoke all on connect.courses from anon,authenticated;
create trigger updated_at before update on connect.course_modules for each row execute function private.set_updated_at();
alter table connect.course_modules enable row level security;
revoke all on connect.course_modules from anon,authenticated;
create trigger updated_at before update on connect.course_lessons for each row execute function private.set_updated_at();
alter table connect.course_lessons enable row level security;
revoke all on connect.course_lessons from anon,authenticated;
create trigger updated_at before update on connect.course_enrollments for each row execute function private.set_updated_at();
alter table connect.course_enrollments enable row level security;
revoke all on connect.course_enrollments from anon,authenticated;
create trigger updated_at before update on connect.lesson_progress for each row execute function private.set_updated_at();
alter table connect.lesson_progress enable row level security;
revoke all on connect.lesson_progress from anon,authenticated;
create trigger updated_at before update on connect.products for each row execute function private.set_updated_at();
alter table connect.products enable row level security;
revoke all on connect.products from anon,authenticated;
create trigger updated_at before update on connect.product_courses for each row execute function private.set_updated_at();
alter table connect.product_courses enable row level security;
revoke all on connect.product_courses from anon,authenticated;
create trigger updated_at before update on connect.product_prices for each row execute function private.set_updated_at();
alter table connect.product_prices enable row level security;
revoke all on connect.product_prices from anon,authenticated;
create trigger updated_at before update on connect.orders for each row execute function private.set_updated_at();
alter table connect.orders enable row level security;
revoke all on connect.orders from anon,authenticated;
create trigger updated_at before update on connect.order_items for each row execute function private.set_updated_at();
alter table connect.order_items enable row level security;
revoke all on connect.order_items from anon,authenticated;
create trigger updated_at before update on connect.payment_transactions for each row execute function private.set_updated_at();
alter table connect.payment_transactions enable row level security;
revoke all on connect.payment_transactions from anon,authenticated;
grant usage on schema private to service_role;
grant all on all tables in schema connect,private to service_role;
revoke execute on all functions in schema private from public,anon,authenticated;
