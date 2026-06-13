-- Rename profile role guest → participant (see CONTEXT.md)

update public.profiles set role = 'participant' where role = 'guest';

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  alter column role set default 'participant';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('participant', 'teacher', 'owner'));
