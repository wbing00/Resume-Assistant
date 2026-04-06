-- JobMatch AI V1 schema and RLS policies
-- Run this file in the Supabase SQL editor for the initial project setup.

begin;

create extension if not exists "pgcrypto";

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_path text not null,
  original_file_name text not null,
  parsed_text text,
  structured_json jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  raw_text text not null,
  company_name text,
  job_title text,
  structured_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  jd_id uuid not null references public.job_descriptions (id) on delete cascade,
  match_score integer check (match_score between 0 and 100),
  strengths_json jsonb,
  gaps_json jsonb,
  suggestions_json jsonb,
  generated_intro text,
  generated_resume_bullets jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  analysis_id uuid references public.analyses (id) on delete set null,
  company_name text not null,
  job_title text not null,
  channel text,
  applied_at timestamptz,
  used_ai_suggestion boolean not null default false,
  status text not null default 'draft' check (
    status in ('draft', 'applied', 'responded', 'interviewing', 'rejected', 'offer')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid not null unique references public.applications (id) on delete cascade,
  response_result text,
  interview_stage text,
  user_rating integer check (user_rating between 1 and 5),
  user_comment text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists resumes_user_id_idx on public.resumes (user_id);
create index if not exists job_descriptions_user_id_idx on public.job_descriptions (user_id);
create index if not exists analyses_user_id_idx on public.analyses (user_id);
create index if not exists analyses_resume_id_idx on public.analyses (resume_id);
create index if not exists analyses_jd_id_idx on public.analyses (jd_id);
create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists applications_analysis_id_idx on public.applications (analysis_id);
create index if not exists applications_status_idx on public.applications (status);
create index if not exists feedbacks_user_id_idx on public.feedbacks (user_id);
create index if not exists feedbacks_application_id_idx on public.feedbacks (application_id);
create index if not exists events_user_id_idx on public.events (user_id);
create index if not exists events_event_name_idx on public.events (event_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
before update on public.resumes
for each row
execute function public.set_updated_at();

drop trigger if exists job_descriptions_set_updated_at on public.job_descriptions;
create trigger job_descriptions_set_updated_at
before update on public.job_descriptions
for each row
execute function public.set_updated_at();

drop trigger if exists analyses_set_updated_at on public.analyses;
create trigger analyses_set_updated_at
before update on public.analyses
for each row
execute function public.set_updated_at();

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

drop trigger if exists feedbacks_set_updated_at on public.feedbacks;
create trigger feedbacks_set_updated_at
before update on public.feedbacks
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.analyses enable row level security;
alter table public.applications enable row level security;
alter table public.feedbacks enable row level security;
alter table public.events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "resumes_manage_own" on public.resumes;
create policy "resumes_manage_own"
on public.resumes
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "job_descriptions_manage_own" on public.job_descriptions;
create policy "job_descriptions_manage_own"
on public.job_descriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "analyses_manage_own" on public.analyses;
create policy "analyses_manage_own"
on public.analyses
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "applications_manage_own" on public.applications;
create policy "applications_manage_own"
on public.applications
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "feedbacks_manage_own" on public.feedbacks;
create policy "feedbacks_manage_own"
on public.feedbacks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own"
on public.events
for insert
to authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own"
on public.events
for select
to authenticated
using (user_id is null or auth.uid() = user_id);

commit;