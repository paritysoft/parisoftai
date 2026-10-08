-- Extended portfolio/product fields (parity with the Git-backed content files).
-- Safe to run on an existing database: only adds columns and widens checks.

-- Platforms: add Flutter and AI
alter table public.portfolio_projects drop constraint if exists portfolio_projects_platforms_check;
alter table public.portfolio_projects add constraint portfolio_projects_platforms_check
  check (platforms <@ array['ios', 'android', 'flutter', 'macos', 'windows', 'web', 'ai']::text[]);
alter table public.products drop constraint if exists products_platforms_check;
alter table public.products add constraint products_platforms_check
  check (platforms <@ array['ios', 'android', 'flutter', 'macos', 'windows', 'web', 'ai']::text[]);

alter table public.portfolio_projects
  add column if not exists client_approved boolean not null default false,
  add column if not exists key_features text[] not null default '{}',
  add column if not exists project_url text check (project_url ~ '^https://'),
  add column if not exists app_store_url text check (app_store_url ~ '^https://'),
  add column if not exists google_play_url text check (google_play_url ~ '^https://'),
  add column if not exists microsoft_store_url text check (microsoft_store_url ~ '^https://'),
  add column if not exists og_image text,
  add column if not exists published_at timestamptz;

-- Anything already published was approved by an admin under the previous rules.
update public.portfolio_projects set client_approved = true where status = 'published';
update public.portfolio_projects set published_at = updated_at where status = 'published' and published_at is null;

alter table public.products
  add column if not exists categories text[] not null default '{}',
  add column if not exists og_image text,
  add column if not exists published_at timestamptz;

update public.products set categories = array[category] where cardinality(categories) = 0;
update public.products set published_at = updated_at where status = 'published' and published_at is null;

-- Client work can only be published with authorisation.
alter table public.portfolio_projects add constraint portfolio_client_authorised
  check (status <> 'published' or ownership <> 'client' or client_approved);
