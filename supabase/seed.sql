-- =============================================================================
-- SEED DATA (development / demo)
-- =============================================================================
-- Vereiste:
--   1) Eerst `supabase/schema.sql` uitvoeren.
--   2) Maak in Supabase Authentication eerst deze gebruikers aan (of signup in app):
--        - één account dat als organisator op de demo-workshop staat (teacher of owner)
--        - twee "klant"-accounts (gewone users)
--   3) Vervang in dit bestand overal:
--        CHANGE_ME_TEACHER@example.com
--        CHANGE_ME_CUSTOMER_A@example.com
--        CHANGE_ME_CUSTOMER_B@example.com
--      door jouw echte Auth-e-mails.
--   4) Run dit script in de SQL Editor.
--
-- Herhaald uitvoeren: idempotent voor workshop/sessies (slug `seed-pottery-101`);
-- boekingen worden ge-upsert.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Profielen als guest voor klanten (bestaande rol wordt niet overschreven)
-- -----------------------------------------------------------------------------
insert into public.profiles (id, role)
select u.id, 'guest'::text
from auth.users u
where u.email in (
  'CHANGE_ME_CUSTOMER_A@example.com',
  'CHANGE_ME_CUSTOMER_B@example.com'
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 2) Demo-workshop + sessies (één keer)
-- -----------------------------------------------------------------------------
insert into public.workshops (slug, title, description, price_cents, teacher_user_id)
select
  'seed-pottery-101',
  'Pottery 101 (seed)',
  'Demo-cursus voor tests. Veilig verwijderen: delete uit workshops waar slug like ''seed-%''.',
  4500,
  t.id
from auth.users t
where t.email = 'CHANGE_ME_TEACHER@example.com'
  and not exists (select 1 from public.workshops w where w.slug = 'seed-pottery-101');

insert into public.workshop_sessions (workshop_id, starts_at, location, max_participants, price_cents)
select w.id, ts.starts_at, ts.loc, ts.max_p, ts.pc
from public.workshops w
cross join lateral (
  values
    ('2026-07-05T14:00:00+02:00'::timestamptz, 'Brussel', 12, 4500),
    ('2026-08-16T10:30:00+02:00'::timestamptz, 'Antwerpen', 8, 4500)
) as ts(starts_at, loc, max_p, pc)
where w.slug = 'seed-pottery-101'
  and not exists (
    select 1
    from public.workshop_sessions s
    where s.workshop_id = w.id
  );

-- -----------------------------------------------------------------------------
-- 3) Boekingen: klant A op eerste sessie (2 personen), klant B op tweede sessie (1 persoon)
-- -----------------------------------------------------------------------------
with w as (
  select id from public.workshops where slug = 'seed-pottery-101' limit 1
),
sessions_ordered as (
  select
    s.id as session_id,
    row_number() over (order by s.starts_at asc) as rn
  from public.workshop_sessions s
  join w on w.id = s.workshop_id
)
insert into public.workshop_bookings (user_id, workshop_session_id, participant_count, status)
select u.id, so.session_id, v.participants, 'confirmed'::text
from (values
  ('CHANGE_ME_CUSTOMER_A@example.com', 1, 2),
  ('CHANGE_ME_CUSTOMER_B@example.com', 2, 1)
) as v(email, session_rn, participants)
join auth.users u on u.email = v.email
join sessions_ordered so on so.rn = v.session_rn
on conflict (user_id, workshop_session_id) do update set
  participant_count = excluded.participant_count,
  status = excluded.status;

-- -----------------------------------------------------------------------------
-- Klaar. Controle:
--   select * from public.workshops where slug = 'seed-pottery-101';
--   select * from public.workshop_sessions where workshop_id = (select id from public.workshops where slug = 'seed-pottery-101');
--   select * from public.workshop_bookings b join auth.users u on u.id = b.user_id;
-- =============================================================================
