-- Owner-only Workshop catalog writes (#8)

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

-- Teachers may read Bookings on Sessions assigned to them (#3)
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

-- Booker contact labels for assigned Teachers (#3)
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
