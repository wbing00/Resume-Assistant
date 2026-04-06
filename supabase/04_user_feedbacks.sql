-- JobMatch AI V1 - User Feedbacks Table
-- This migration adds a user feedbacks table for collecting product feedback

begin;

-- Create user_feedbacks table
create table if not exists public.user_feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('bug', 'feature', 'ui', 'experience', 'other')),
  title text not null,
  description text not null,
  rating integer check (rating between 1 and 5),
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'in_progress', 'completed', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for better query performance
create index if not exists user_feedbacks_user_id_idx on public.user_feedbacks (user_id);
create index if not exists user_feedbacks_feedback_type_idx on public.user_feedbacks (feedback_type);
create index if not exists user_feedbacks_status_idx on public.user_feedbacks (status);
create index if not exists user_feedbacks_created_at_idx on public.user_feedbacks (created_at);

-- Create trigger for updated_at
create or replace trigger user_feedbacks_set_updated_at
before update on public.user_feedbacks
for each row
execute function public.set_updated_at();

-- Enable Row Level Security
alter table public.user_feedbacks enable row level security;

-- RLS Policies

-- Users can view their own feedbacks
drop policy if exists "user_feedbacks_select_own" on public.user_feedbacks;
create policy "user_feedbacks_select_own"
on public.user_feedbacks
for select
to authenticated
using (auth.uid() = user_id);

-- Users can insert their own feedbacks
drop policy if exists "user_feedbacks_insert_own" on public.user_feedbacks;
create policy "user_feedbacks_insert_own"
on public.user_feedbacks
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can update their own feedbacks (only before admin review)
drop policy if exists "user_feedbacks_update_own" on public.user_feedbacks;
create policy "user_feedbacks_update_own"
on public.user_feedbacks
for update
to authenticated
using (auth.uid() = user_id and status = 'new')
with check (auth.uid() = user_id and status = 'new');

-- Admins can do everything
drop policy if exists "user_feedbacks_all_admin" on public.user_feedbacks;
create policy "user_feedbacks_all_admin"
on public.user_feedbacks
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Allow anonymous feedback (optional - uncomment if needed)
-- drop policy if exists "user_feedbacks_insert_anonymous" on public.user_feedbacks;
-- create policy "user_feedbacks_insert_anonymous"
-- on public.user_feedbacks
-- for insert
-- to anon
-- with check (user_id is null);

-- Add comment to table
comment on table public.user_feedbacks is 'User feedbacks for product improvement (bugs, features, UI, experience, etc.)';

-- Add comments to columns
comment on column public.user_feedbacks.feedback_type is 'Type of feedback: bug, feature, ui, experience, other';
comment on column public.user_feedbacks.title is 'Brief title/summary of the feedback';
comment on column public.user_feedbacks.description is 'Detailed description of the feedback';
comment on column public.user_feedbacks.rating is 'User satisfaction rating (1-5 stars)';
comment on column public.user_feedbacks.status is 'Status: new, reviewed, planned, in_progress, completed, rejected';
comment on column public.user_feedbacks.admin_notes is 'Admin notes and responses';

commit;