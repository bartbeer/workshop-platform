-- Postgres 42703: column workshops.image_path does not exist
-- Voer dit uit op je Supabase-project als `workshops` ouder is dan deze kolom.
alter table public.workshops add column if not exists image_path text;
