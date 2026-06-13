-- Run this in Supabase SQL editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'participant' check (role in ('participant', 'teacher', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workshop_type text not null,
  experience text not null,
  motivation text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists teacher_applications_user_id_idx
  on public.teacher_applications(user_id);
create index if not exists teacher_applications_status_idx
  on public.teacher_applications(status);

alter table public.profiles enable row level security;
alter table public.teacher_applications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "teacher_apps_insert_own" on public.teacher_applications;
create policy "teacher_apps_insert_own"
  on public.teacher_applications for insert
  with check (auth.uid() = user_id);

drop policy if exists "teacher_apps_select_own" on public.teacher_applications;
create policy "teacher_apps_select_own"
  on public.teacher_applications for select
  using (auth.uid() = user_id);

drop policy if exists "teacher_apps_owner_read" on public.teacher_applications;
create policy "teacher_apps_owner_read"
  on public.teacher_applications for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

drop policy if exists "teacher_apps_owner_update" on public.teacher_applications;
create policy "teacher_apps_owner_update"
  on public.teacher_applications for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  )
  with check (true);

-- Owner mag profielen voor andere users aanmaken (nodig voor teacher-approval upsert)
drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

-- Core workshops
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  image_path text,
  starts_at timestamptz,
  location text,
  price_cents integer,
  teacher_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.workshops add column if not exists image_path text;

-- Multiple dates / sessions per workshop
create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  starts_at timestamptz not null,
  location text,
  max_participants integer not null check (max_participants > 0),
  price_cents integer,
  session_description text,
  duration_minutes integer,
  extra_info text,
  teacher_user_id uuid references auth.users(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint workshop_sessions_duration_check
    check (duration_minutes is null or duration_minutes > 0)
);
create index if not exists workshop_sessions_workshop_idx
  on public.workshop_sessions(workshop_id);
create index if not exists workshop_sessions_teacher_idx
  on public.workshop_sessions(teacher_user_id);
create index if not exists workshop_sessions_status_idx
  on public.workshop_sessions(status);

-- Bestaande databases: kolommen toevoegen zonder de tabel te droppen
alter table public.workshop_sessions add column if not exists session_description text;
alter table public.workshop_sessions add column if not exists duration_minutes integer;
alter table public.workshop_sessions add column if not exists teacher_user_id uuid references auth.users(id);
alter table public.workshop_sessions add column if not exists status text not null default 'scheduled';
do $$
begin
  alter table public.workshop_sessions
    add constraint workshop_sessions_status_check
    check (status in ('scheduled', 'cancelled'));
exception
  when duplicate_object then null;
end $$;
do $$
begin
  alter table public.workshop_sessions
    add constraint workshop_sessions_duration_check
    check (duration_minutes is null or duration_minutes > 0);
exception
  when duplicate_object then null;
end $$;

-- Booking = one account booking N participants for one session
create table if not exists public.workshop_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workshop_session_id uuid not null references public.workshop_sessions(id) on delete cascade,
  participant_count integer not null default 1 check (participant_count > 0 and participant_count <= 20),
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique(user_id, workshop_session_id)
);
create index if not exists workshop_bookings_user_idx
  on public.workshop_bookings(user_id);
create index if not exists workshop_bookings_session_idx
  on public.workshop_bookings(workshop_session_id);

-- Legacy table kept for backwards compatibility
create table if not exists public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique(user_id, workshop_id)
);
create index if not exists workshop_registrations_user_idx
  on public.workshop_registrations(user_id);

alter table public.workshops enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.workshop_bookings enable row level security;
alter table public.workshop_registrations enable row level security;

drop policy if exists "workshops_public_read" on public.workshops;
create policy "workshops_public_read"
  on public.workshops for select
  using (true);

drop policy if exists "workshops_teacher_write" on public.workshops;

drop policy if exists "workshops_owner_write" on public.workshops;
create policy "workshops_owner_write"
  on public.workshops for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

drop policy if exists "sessions_public_read" on public.workshop_sessions;
create policy "sessions_public_read"
  on public.workshop_sessions for select
  using (true);

drop policy if exists "sessions_teacher_write" on public.workshop_sessions;
drop policy if exists "sessions_owner_write" on public.workshop_sessions;
create policy "sessions_owner_write"
  on public.workshop_sessions for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

drop policy if exists "sessions_workshop_teacher_insert" on public.workshop_sessions;
create policy "sessions_workshop_teacher_insert"
  on public.workshop_sessions for insert
  with check (
    exists (
      select 1 from public.workshops w
      where w.id = workshop_id
        and (
          w.teacher_user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'owner'
          )
        )
    )
  );

drop policy if exists "bookings_select_own" on public.workshop_bookings;
create policy "bookings_select_own"
  on public.workshop_bookings for select
  using (auth.uid() = user_id);

drop policy if exists "bookings_insert_own" on public.workshop_bookings;
create policy "bookings_insert_own"
  on public.workshop_bookings for insert
  with check (auth.uid() = user_id);

drop policy if exists "bookings_update_own" on public.workshop_bookings;
create policy "bookings_update_own"
  on public.workshop_bookings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Totaal bevestigde deelnemers per sessie (publiek nodig voor vrije plaatsen; RLS laat geen SELECT op andermans rijen toe)
create or replace function public.confirmed_participants_by_sessions(p_session_ids uuid[])
returns table (workshop_session_id uuid, total_participants integer)
language sql
security definer
set search_path = public
stable
as $$
  select
    b.workshop_session_id,
    sum(b.participant_count)::integer as total_participants
  from public.workshop_bookings b
  where b.status = 'confirmed'
    and b.workshop_session_id = any (coalesce(p_session_ids, '{}'::uuid[]))
  group by b.workshop_session_id;
$$;

grant execute on function public.confirmed_participants_by_sessions(uuid[]) to anon, authenticated;

create or replace function public.teacher_labels_by_user_ids(p_user_ids uuid[])
returns table (user_id uuid, label text)
language sql
security definer
set search_path = public
stable
as $$
  select
    u.id as user_id,
    coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      split_part(u.email, '@', 1)
    ) as label
  from auth.users u
  where u.id = any(p_user_ids);
$$;

revoke all on function public.teacher_labels_by_user_ids(uuid[]) from public;
grant execute on function public.teacher_labels_by_user_ids(uuid[]) to anon, authenticated;

create or replace function public.booker_labels_by_user_ids(p_user_ids uuid[])
returns table (user_id uuid, label text, email text)
language sql
security definer
set search_path = public
stable
as $$
  select
    u.id as user_id,
    coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      split_part(u.email, '@', 1)
    ) as label,
    u.email::text as email
  from auth.users u
  where u.id = any(p_user_ids);
$$;

revoke all on function public.booker_labels_by_user_ids(uuid[]) from public;
grant execute on function public.booker_labels_by_user_ids(uuid[]) to authenticated;

drop policy if exists "bookings_teacher_read_assigned" on public.workshop_bookings;
create policy "bookings_teacher_read_assigned"
  on public.workshop_bookings for select
  using (
    exists (
      select 1 from public.workshop_sessions s
      where s.id = workshop_session_id
        and s.teacher_user_id = auth.uid()
    )
  );

-- Public workshop images in Supabase Storage
insert into storage.buckets (id, name, public)
values ('workshop-images', 'workshop-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "workshop_images_public_read" on storage.objects;
create policy "workshop_images_public_read"
  on storage.objects for select
  using (bucket_id = 'workshop-images');

drop policy if exists "workshop_images_auth_insert" on storage.objects;
create policy "workshop_images_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'workshop-images');

drop policy if exists "workshop_images_auth_update" on storage.objects;
create policy "workshop_images_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'workshop-images')
  with check (bucket_id = 'workshop-images');

drop policy if exists "workshop_images_auth_delete" on storage.objects;
create policy "workshop_images_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'workshop-images');

-- Server-side (service role): lookup auth user by e-mail voor checkout/webhook (geen publieke execute)
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = auth
stable
as $$
  select id
  from users
  where email = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public;
grant execute on function public.get_user_id_by_email(text) to service_role;

-- Idempotente Stripe-afhandeling (één rij per checkout session id)
create table if not exists public.workshop_checkout_fulfillments (
  stripe_checkout_session_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  workshop_session_id uuid references public.workshop_sessions(id) on delete set null,
  participant_count integer,
  created_at timestamptz not null default now()
);

alter table public.workshop_checkout_fulfillments enable row level security;

-- Legacy policies
 drop policy if exists "registrations_select_own" on public.workshop_registrations;
create policy "registrations_select_own"
  on public.workshop_registrations for select
  using (auth.uid() = user_id);

drop policy if exists "registrations_insert_own" on public.workshop_registrations;
create policy "registrations_insert_own"
  on public.workshop_registrations for insert
  with check (auth.uid() = user_id);

drop policy if exists "registrations_update_own" on public.workshop_registrations;
create policy "registrations_update_own"
  on public.workshop_registrations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Make first owner (replace EMAIL)
-- insert into public.profiles (id, role)
-- select id, 'owner' from auth.users where email = 'YOUR_OWNER_EMAIL@example.com'
-- on conflict (id) do update set role = excluded.role;