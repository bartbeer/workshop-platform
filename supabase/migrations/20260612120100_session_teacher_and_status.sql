-- Session-level teacher assignment and status (see CONTEXT.md)

alter table public.workshop_sessions
  add column if not exists teacher_user_id uuid references auth.users(id);

alter table public.workshop_sessions
  add column if not exists status text not null default 'scheduled';

alter table public.workshop_sessions drop constraint if exists workshop_sessions_status_check;

alter table public.workshop_sessions
  add constraint workshop_sessions_status_check
  check (status in ('scheduled', 'cancelled'));

update public.workshop_sessions s
set teacher_user_id = w.teacher_user_id
from public.workshops w
where s.workshop_id = w.id
  and s.teacher_user_id is null
  and w.teacher_user_id is not null;

create index if not exists workshop_sessions_teacher_idx
  on public.workshop_sessions(teacher_user_id);

create index if not exists workshop_sessions_status_idx
  on public.workshop_sessions(status);

-- Public read: teacher display labels (no email exposed)
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

-- Session writes: Owner only (Teachers manage assigned sessions in later slices)
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

-- Teachers may still create workshops until Owner-only creation lands (#8);
-- re-allow session insert for workshop teachers via workshop ownership.
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
