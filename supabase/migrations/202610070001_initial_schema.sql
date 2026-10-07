-- UPSC Study Desk schema. Apply with `supabase db push` to a dedicated Supabase project.
-- Personal tables are isolated by auth.uid() RLS. Shared-source rows are read-only to signed-in
-- users; the app additionally restricts all app routes and actions to OWNER_EMAIL.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_year smallint check (target_year between 2026 and 2100),
  daily_minutes smallint check (daily_minutes between 30 and 720),
  prep_level text check (prep_level in ('starting', 'building', 'revision')),
  preferred_language text check (preferred_language in ('English', 'Hindi', 'Bilingual')),
  optional_subject text,
  include_history_optional boolean not null default false,
  exam_scope text check (exam_scope in ('upsc', 'upsc_ssc', 'broad')),
  eligibility_context text check (char_length(eligibility_context) <= 800),
  email_alerts boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null,
  task_date date not null,
  type text not null check (type in ('study', 'recall', 'pyq', 'current_affairs', 'weekly_review', 'answer_practice', 'error_log')),
  title text not null check (char_length(title) between 1 and 180),
  details text not null default '',
  topic_id text,
  minutes smallint not null check (minutes between 1 and 720),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'done')),
  source text not null default 'generated' check (source in ('generated', 'manual')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, plan_key)
);
alter table public.study_tasks add column if not exists completed_at timestamptz;
create index if not exists study_tasks_user_date_idx on public.study_tasks (user_id, task_date);

create table if not exists public.topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null,
  status text not null default 'learning' check (status in ('not_started', 'learning', 'reviewing', 'confident')),
  confidence smallint not null default 1 check (confidence between 0 and 5),
  last_studied_on date,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);
drop trigger if exists topic_progress_set_updated_at on public.topic_progress;
create trigger topic_progress_set_updated_at before update on public.topic_progress
for each row execute function public.set_updated_at();

create table if not exists public.topic_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null,
  content text not null default '' check (char_length(content) <= 20000),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);
drop trigger if exists topic_notes_set_updated_at on public.topic_notes;
create trigger topic_notes_set_updated_at before update on public.topic_notes
for each row execute function public.set_updated_at();

create table if not exists public.review_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text,
  prompt text not null check (char_length(prompt) between 3 and 1200),
  answer text not null check (char_length(answer) between 1 and 4000),
  next_due_on date not null default current_date,
  interval_days integer not null default 0 check (interval_days between 0 and 3650),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 4.00),
  repetitions integer not null default 0 check (repetitions >= 0),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists review_cards_due_idx on public.review_cards (user_id, next_due_on);

create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_card_id uuid not null references public.review_cards(id) on delete cascade,
  rating smallint not null check (rating in (1, 3, 4, 5)),
  previous_interval_days integer not null default 0 check (previous_interval_days between 0 and 3650),
  next_interval_days integer not null default 0 check (next_interval_days between 0 and 3650),
  reviewed_at timestamptz not null default now()
);
alter table public.review_events add column if not exists previous_interval_days integer not null default 0;
alter table public.review_events add column if not exists next_interval_days integer not null default 0;
create index if not exists review_events_user_date_idx on public.review_events (user_id, reviewed_at desc);

create table if not exists public.current_affairs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique check (source_url like 'https://%'),
  source_name text not null default 'Press Information Bureau (PIB)',
  title text not null check (char_length(title) between 1 and 300),
  description text,
  published_at timestamptz,
  stage text not null check (stage in ('Prelims', 'Mains', 'Both')),
  paper text not null,
  subject text not null,
  topic_id text not null,
  why_matters text not null,
  static_connection text not null,
  exam_relevance text not null,
  action text not null check (action in ('study', 'revise', 'monitor')),
  priority text not null check (priority in ('core', 'important', 'lower priority')),
  practice_question text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists current_affairs_published_idx on public.current_affairs (published_at desc nulls last);
drop trigger if exists current_affairs_set_updated_at on public.current_affairs;
create trigger current_affairs_set_updated_at before update on public.current_affairs
for each row execute function public.set_updated_at();

create table if not exists public.exam_alerts (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique check (source_url like 'https://%'),
  source_page_url text not null check (source_page_url like 'https://%'),
  source_name text not null,
  exam_name text not null,
  title text not null,
  notification_date date,
  application_deadline date,
  exam_date date,
  eligibility_summary text,
  relevance_rationale text not null,
  overlap text[] not null default '{}',
  detection_status text not null default 'potential' check (detection_status in ('potential', 'verified')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists exam_alerts_deadline_idx on public.exam_alerts (application_deadline);
drop trigger if exists exam_alerts_set_updated_at on public.exam_alerts;
create trigger exam_alerts_set_updated_at before update on public.exam_alerts
for each row execute function public.set_updated_at();

create table if not exists public.exam_alert_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_id uuid not null references public.exam_alerts(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, alert_id)
);

create table if not exists public.source_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  trigger_kind text not null check (trigger_kind in ('cron', 'manual')),
  status text not null check (status in ('success', 'partial', 'failed')),
  items_added integer not null default 0 check (items_added >= 0),
  message text,
  created_at timestamptz not null default now()
);
create index if not exists source_sync_runs_created_idx on public.source_sync_runs (created_at desc);

-- Personal rows are accessible only to the authenticated owner of each row.
alter table public.profiles enable row level security;
alter table public.study_tasks enable row level security;
alter table public.topic_progress enable row level security;
alter table public.topic_notes enable row level security;
alter table public.review_cards enable row level security;
alter table public.review_events enable row level security;
alter table public.exam_alert_dismissals enable row level security;

drop policy if exists "profile owner can read" on public.profiles;
create policy "profile owner can read" on public.profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "profile owner can create" on public.profiles;
create policy "profile owner can create" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "profile owner can update" on public.profiles;
create policy "profile owner can update" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "task owner can read" on public.study_tasks;
create policy "task owner can read" on public.study_tasks for select to authenticated using (auth.uid() = user_id);
drop policy if exists "task owner can create" on public.study_tasks;
create policy "task owner can create" on public.study_tasks for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "task owner can update" on public.study_tasks;
create policy "task owner can update" on public.study_tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "task owner can delete" on public.study_tasks;
create policy "task owner can delete" on public.study_tasks for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "progress owner can read" on public.topic_progress;
create policy "progress owner can read" on public.topic_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists "progress owner can create" on public.topic_progress;
create policy "progress owner can create" on public.topic_progress for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "progress owner can update" on public.topic_progress;
create policy "progress owner can update" on public.topic_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "note owner can read" on public.topic_notes;
create policy "note owner can read" on public.topic_notes for select to authenticated using (auth.uid() = user_id);
drop policy if exists "note owner can create" on public.topic_notes;
create policy "note owner can create" on public.topic_notes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "note owner can update" on public.topic_notes;
create policy "note owner can update" on public.topic_notes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "note owner can delete" on public.topic_notes;
create policy "note owner can delete" on public.topic_notes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "review card owner can read" on public.review_cards;
create policy "review card owner can read" on public.review_cards for select to authenticated using (auth.uid() = user_id);
drop policy if exists "review card owner can create" on public.review_cards;
create policy "review card owner can create" on public.review_cards for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "review card owner can update" on public.review_cards;
create policy "review card owner can update" on public.review_cards for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "review card owner can delete" on public.review_cards;
create policy "review card owner can delete" on public.review_cards for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "review event owner can read" on public.review_events;
create policy "review event owner can read" on public.review_events for select to authenticated using (auth.uid() = user_id);
drop policy if exists "review event owner can create" on public.review_events;
create policy "review event owner can create" on public.review_events for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "alert dismissal owner can read" on public.exam_alert_dismissals;
create policy "alert dismissal owner can read" on public.exam_alert_dismissals for select to authenticated using (auth.uid() = user_id);
drop policy if exists "alert dismissal owner can create" on public.exam_alert_dismissals;
create policy "alert dismissal owner can create" on public.exam_alert_dismissals for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "alert dismissal owner can delete" on public.exam_alert_dismissals;
create policy "alert dismissal owner can delete" on public.exam_alert_dismissals for delete to authenticated using (auth.uid() = user_id);

-- Shared public-source records contain government release metadata, not aspirant notes or progress.
-- Only signed-in users can read them through the Data API; writes are reserved for service_role cron.
alter table public.current_affairs enable row level security;
alter table public.exam_alerts enable row level security;
alter table public.source_sync_runs enable row level security;
drop policy if exists "signed in users can read current affairs" on public.current_affairs;
create policy "signed in users can read current affairs" on public.current_affairs for select to authenticated using (auth.uid() is not null);
drop policy if exists "signed in users can read official exam alerts" on public.exam_alerts;
create policy "signed in users can read official exam alerts" on public.exam_alerts for select to authenticated using (auth.uid() is not null);
drop policy if exists "signed in users can read sync history" on public.source_sync_runs;
create policy "signed in users can read sync history" on public.source_sync_runs for select to authenticated using (auth.uid() is not null);

revoke all on public.profiles, public.study_tasks, public.topic_progress, public.topic_notes,
  public.review_cards, public.review_events, public.current_affairs, public.exam_alerts,
  public.exam_alert_dismissals, public.source_sync_runs from anon;

grant select, insert, update, delete on public.profiles, public.study_tasks, public.topic_progress,
  public.topic_notes, public.review_cards, public.review_events, public.exam_alert_dismissals to authenticated;
grant select on public.current_affairs, public.exam_alerts, public.source_sync_runs to authenticated;
grant all on public.profiles, public.study_tasks, public.topic_progress, public.topic_notes,
  public.review_cards, public.review_events, public.current_affairs, public.exam_alerts,
  public.exam_alert_dismissals, public.source_sync_runs to service_role;
