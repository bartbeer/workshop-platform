-- Booking attendance: present spot count per confirmed Booking (Teacher on assigned Session, Owner override)

drop policy if exists "bookings_owner_read" on public.workshop_bookings;
create policy "bookings_owner_read"
  on public.workshop_bookings for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

create table if not exists public.booking_attendance (
  booking_id uuid primary key references public.workshop_bookings(id) on delete cascade,
  present_count integer not null check (present_count >= 0),
  marked_at timestamptz not null default now(),
  marked_by_user_id uuid not null references auth.users(id) on delete restrict
);

create index if not exists booking_attendance_marked_by_idx
  on public.booking_attendance(marked_by_user_id);

alter table public.booking_attendance enable row level security;

drop policy if exists "booking_attendance_teacher_owner_read" on public.booking_attendance;
create policy "booking_attendance_teacher_owner_read"
  on public.booking_attendance for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
    or exists (
      select 1
      from public.workshop_bookings b
      join public.workshop_sessions s on s.id = b.workshop_session_id
      where b.id = booking_id
        and s.teacher_user_id = auth.uid()
    )
  );

drop policy if exists "booking_attendance_teacher_owner_write" on public.booking_attendance;
create policy "booking_attendance_teacher_owner_write"
  on public.booking_attendance for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
    or exists (
      select 1
      from public.workshop_bookings b
      join public.workshop_sessions s on s.id = b.workshop_session_id
      where b.id = booking_id
        and s.teacher_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
    or exists (
      select 1
      from public.workshop_bookings b
      join public.workshop_sessions s on s.id = b.workshop_session_id
      where b.id = booking_id
        and s.teacher_user_id = auth.uid()
    )
  );
