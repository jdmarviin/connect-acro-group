import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_users_operates_in_financial_market" AS ENUM('yes', 'no'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_users_took_courses_before" AS ENUM('yes', 'no'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_users_trading_intention" AS ENUM('profession', 'extra_income'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_meeting_logs_participant_role" AS ENUM('admin', 'user', 'unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_meeting_logs_source" AS ENUM('zoom', 'browser'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_meeting_logs_webhook_status" AS ENUM('joined', 'left'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_meetings_status" AS ENUM('scheduled', 'live', 'ended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'user' NOT NULL,
  	"whatsapp" varchar,
  	"zoom_id" varchar,
  	"avatar_url" varchar,
  	"operates_in_financial_market" "enum_users_operates_in_financial_market",
  	"trading_knowledge_time" varchar,
  	"took_courses_before" "enum_users_took_courses_before",
  	"current_profession" varchar,
  	"available_time" varchar,
  	"main_goal" varchar,
  	"trading_intention" "enum_users_trading_intention",
  	"biggest_difficulty" varchar,
  	"expectations30_days" varchar,
  	"onboarding_completed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "meeting_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_key" varchar,
  	"meeting_u_u_i_d" varchar,
  	"participant_role" "enum_meeting_logs_participant_role" DEFAULT 'unknown',
  	"source" "enum_meeting_logs_source" DEFAULT 'zoom',
  	"user_id" integer,
  	"zoom_user_id" varchar,
  	"participant_name" varchar,
  	"participant_email" varchar,
  	"meeting_id" varchar NOT NULL,
  	"join_time" timestamp(3) with time zone,
  	"leave_time" timestamp(3) with time zone,
  	"duration_minutes" numeric,
  	"webhook_status" "enum_meeting_logs_webhook_status" DEFAULT 'joined',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "meetings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_meetings_status" DEFAULT 'scheduled',
  	"meeting_u_u_i_d" varchar,
  	"started_at" timestamp(3) with time zone,
  	"ended_at" timestamp(3) with time zone,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"zoom_link" varchar NOT NULL,
  	"zoom_meeting_id" varchar,
  	"notify_participants" boolean DEFAULT false,
  	"duration_minutes" numeric DEFAULT 60,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "zoom_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_key" varchar NOT NULL,
  	"event" varchar NOT NULL,
  	"body" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "meeting_tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"user_id" integer NOT NULL,
  	"meeting_id" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"meeting_logs_id" integer,
  	"meetings_id" integer,
  	"zoom_events_id" integer,
  	"meeting_tickets_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "meeting_logs" ADD COLUMN IF NOT EXISTS "session_key" varchar;
  ALTER TABLE "meeting_logs" ADD COLUMN IF NOT EXISTS "meeting_u_u_i_d" varchar;
  ALTER TABLE "meeting_logs" ADD COLUMN IF NOT EXISTS "participant_role" "enum_meeting_logs_participant_role" DEFAULT 'unknown';
  ALTER TABLE "meeting_logs" ADD COLUMN IF NOT EXISTS "source" "enum_meeting_logs_source" DEFAULT 'zoom';
  ALTER TABLE "meeting_logs" ADD COLUMN IF NOT EXISTS "participant_name" varchar;
  ALTER TABLE "meeting_logs" ADD COLUMN IF NOT EXISTS "participant_email" varchar;
  ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "status" "enum_meetings_status" DEFAULT 'scheduled';
  ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "meeting_u_u_i_d" varchar;
  ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "started_at" timestamp(3) with time zone;
  ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "ended_at" timestamp(3) with time zone;
  ALTER TABLE "meetings" ALTER COLUMN "notify_participants" SET DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "zoom_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "meeting_tickets_id" integer;
  UPDATE "meeting_logs" SET "source" = 'browser' WHERE "zoom_user_id" LIKE 'web-sdk-%';
  UPDATE "meeting_logs" AS logs SET "participant_role" = users."role"::text::"enum_meeting_logs_participant_role"
    FROM "users" WHERE logs."user_id" = users."id" AND logs."participant_role" = 'unknown';

  DO $$ BEGIN ALTER TABLE "meeting_logs" ADD CONSTRAINT "meeting_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "meeting_tickets" ADD CONSTRAINT "meeting_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_meeting_logs_fk" FOREIGN KEY ("meeting_logs_id") REFERENCES "public"."meeting_logs"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_meetings_fk" FOREIGN KEY ("meetings_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_zoom_events_fk" FOREIGN KEY ("zoom_events_id") REFERENCES "public"."zoom_events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_meeting_tickets_fk" FOREIGN KEY ("meeting_tickets_id") REFERENCES "public"."meeting_tickets"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX IF NOT EXISTS "meeting_logs_session_key_idx" ON "meeting_logs" USING btree ("session_key");
  CREATE INDEX IF NOT EXISTS "meeting_logs_meeting_u_u_i_d_idx" ON "meeting_logs" USING btree ("meeting_u_u_i_d");
  CREATE INDEX IF NOT EXISTS "meeting_logs_user_idx" ON "meeting_logs" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "meeting_logs_zoom_user_id_idx" ON "meeting_logs" USING btree ("zoom_user_id");
  CREATE INDEX IF NOT EXISTS "meeting_logs_meeting_id_idx" ON "meeting_logs" USING btree ("meeting_id");
  CREATE INDEX IF NOT EXISTS "meeting_logs_updated_at_idx" ON "meeting_logs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "meeting_logs_created_at_idx" ON "meeting_logs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "meetings_status_idx" ON "meetings" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "meetings_meeting_u_u_i_d_idx" ON "meetings" USING btree ("meeting_u_u_i_d");
  CREATE INDEX IF NOT EXISTS "meetings_updated_at_idx" ON "meetings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "meetings_created_at_idx" ON "meetings" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "zoom_events_event_key_idx" ON "zoom_events" USING btree ("event_key");
  CREATE INDEX IF NOT EXISTS "zoom_events_updated_at_idx" ON "zoom_events" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "zoom_events_created_at_idx" ON "zoom_events" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "meeting_tickets_key_idx" ON "meeting_tickets" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "meeting_tickets_user_idx" ON "meeting_tickets" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "meeting_tickets_meeting_id_idx" ON "meeting_tickets" USING btree ("meeting_id");
  CREATE INDEX IF NOT EXISTS "meeting_tickets_updated_at_idx" ON "meeting_tickets" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "meeting_tickets_created_at_idx" ON "meeting_tickets" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_meeting_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("meeting_logs_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_meetings_id_idx" ON "payload_locked_documents_rels" USING btree ("meetings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_zoom_events_id_idx" ON "payload_locked_documents_rels" USING btree ("zoom_events_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_meeting_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("meeting_tickets_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down(): Promise<void> {
  throw new Error('Migração inicial preserva dados existentes. Restaure o backup para reverter; downgrade destrutivo automático foi desabilitado.')
}
