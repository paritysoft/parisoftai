-- ParitySoft AI — core schema
-- Tables, enums, helper functions and triggers. RLS policies live in the next migration.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.staff_role as enum ('super_admin', 'admin', 'editor');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost');
create type public.project_ownership as enum ('client', 'company');
create type public.notification_status as enum ('pending', 'sent', 'failed', 'skipped');

-- ---------------------------------------------------------------------------
-- Generic triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_table_name <> 'profiles' then
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles & profiles
-- ---------------------------------------------------------------------------
create table public.admin_roles (
  role public.staff_role primary key,
  label text not null,
  rank smallint not null unique check (rank between 1 and 10),
  description text not null
);

insert into public.admin_roles (role, label, rank, description) values
  ('editor', 'Editor', 1, 'Creates and edits draft content and uploads media. Cannot publish, delete, or manage users.'),
  ('admin', 'Admin', 2, 'Manages and publishes content, portfolio, products, leads and media.'),
  ('super_admin', 'Super Admin', 3, 'Full access including users, settings, SEO and audit logs.');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text check (char_length(full_name) <= 120),
  role public.staff_role references public.admin_roles (role),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role) where role is not null;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_fields();

-- Every auth user gets a profile with NO role. Access is granted explicitly.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Rank of a user: 0 = no access, 1 = editor, 2 = admin, 3 = super_admin
create or replace function public.staff_rank(uid uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select r.rank::integer
       from public.profiles p
       join public.admin_roles r on r.role = p.role
      where p.id = uid and p.is_active),
    0);
$$;

create or replace function public.is_staff() returns boolean
language sql stable set search_path = '' as $$ select public.staff_rank() >= 1 $$;
create or replace function public.is_admin() returns boolean
language sql stable set search_path = '' as $$ select public.staff_rank() >= 2 $$;
create or replace function public.is_super_admin() returns boolean
language sql stable set search_path = '' as $$ select public.staff_rank() >= 3 $$;

-- Role management is only possible through these functions (column grants block direct updates).
create or replace function public.set_staff_role(target uuid, new_role public.staff_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role_value public.staff_role;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can change roles' using errcode = '42501';
  end if;
  select role into current_role_value from public.profiles where id = target;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if current_role_value = 'super_admin' and (new_role is distinct from 'super_admin')
     and (select count(*) from public.profiles where role = 'super_admin' and is_active) <= 1 then
    raise exception 'At least one active super admin is required' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

create or replace function public.set_staff_active(target uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can change account status' using errcode = '42501';
  end if;
  if target = auth.uid() and not active then
    raise exception 'You cannot deactivate your own account' using errcode = '42501';
  end if;
  if not active and (select role from public.profiles where id = target) = 'super_admin'
     and (select count(*) from public.profiles where role = 'super_admin' and is_active) <= 1 then
    raise exception 'At least one active super admin is required' using errcode = '42501';
  end if;
  update public.profiles set is_active = active where id = target;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pages (structured content) & revisions
-- ---------------------------------------------------------------------------
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9-]{2,40}$'),
  title text not null check (char_length(title) between 1 and 120),
  status public.content_status not null default 'draft',
  published_content jsonb,
  published_at timestamptz,
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint pages_published_has_content check (status <> 'published' or published_content is not null)
);
create trigger pages_updated before update on public.pages
  for each row execute function public.set_updated_fields();

create table public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  kind text not null check (kind in ('draft', 'published')),
  content jsonb not null,
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null default auth.uid()
);
create index page_revisions_page_idx on public.page_revisions (page_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 2 and 120),
  short_description text not null check (char_length(short_description) <= 320),
  full_description text not null default '',
  icon text,
  cover_image text,
  problems text[] not null default '{}',
  features jsonb not null default '[]' check (jsonb_typeof(features) = 'array'),
  benefits text[] not null default '{}',
  approach jsonb not null default '[]' check (jsonb_typeof(approach) = 'array'),
  technologies text[] not null default '{}',
  faq jsonb not null default '[]' check (jsonb_typeof(faq) = 'array'),
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create index services_public_idx on public.services (status, sort_order);
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_fields();

-- ---------------------------------------------------------------------------
-- Portfolio
-- ---------------------------------------------------------------------------
create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 2 and 120),
  summary text not null check (char_length(summary) <= 320),
  description text not null default '',
  category text not null check (char_length(category) between 2 and 60),
  ownership public.project_ownership not null,
  platforms text[] not null default '{}'
    check (platforms <@ array['ios', 'android', 'macos', 'windows', 'web']::text[]),
  technologies text[] not null default '{}',
  cover_image text,
  challenge text,
  solution text,
  results text[] not null default '{}',
  external_links jsonb not null default '[]' check (jsonb_typeof(external_links) = 'array'),
  attribution text check (char_length(attribution) <= 200),
  featured boolean not null default false,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create index portfolio_public_idx on public.portfolio_projects (status, featured, sort_order);
create trigger portfolio_updated before update on public.portfolio_projects
  for each row execute function public.set_updated_fields();

create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portfolio_projects (id) on delete cascade,
  url text not null,
  alt text not null default '' check (char_length(alt) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index portfolio_images_project_idx on public.portfolio_images (project_id, sort_order);

-- ---------------------------------------------------------------------------
-- Products (company-owned software)
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(name) between 2 and 80),
  tagline text not null check (char_length(tagline) <= 200),
  description text not null default '',
  category text not null check (char_length(category) between 2 and 60),
  icon text,
  platforms text[] not null default '{}'
    check (platforms <@ array['ios', 'android', 'macos', 'windows', 'web']::text[]),
  features text[] not null default '{}',
  app_store_url text check (app_store_url ~ '^https://'),
  google_play_url text check (google_play_url ~ '^https://'),
  microsoft_store_url text check (microsoft_store_url ~ '^https://'),
  website_url text check (website_url ~ '^https://'),
  featured boolean not null default false,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create index products_public_idx on public.products (status, featured, sort_order);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_fields();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '' check (char_length(alt) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Slug redirects (old published URLs keep working)
-- ---------------------------------------------------------------------------
create table public.slug_redirects (
  from_path text primary key check (from_path ~ '^/'),
  to_path text not null check (to_path ~ '^/'),
  created_at timestamptz not null default now()
);

create or replace function public.record_slug_redirect()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prefix text := tg_argv[0];
  old_path text;
  new_path text;
begin
  if old.slug is distinct from new.slug and old.status = 'published' then
    old_path := prefix || old.slug;
    new_path := prefix || new.slug;
    -- re-point any existing chain at the new destination
    update public.slug_redirects set to_path = new_path where to_path = old_path;
    delete from public.slug_redirects where from_path = new_path;
    insert into public.slug_redirects (from_path, to_path) values (old_path, new_path)
      on conflict (from_path) do update set to_path = excluded.to_path;
  end if;
  return new;
end;
$$;

create trigger services_slug_redirect after update of slug on public.services
  for each row execute function public.record_slug_redirect('/services/');
create trigger portfolio_slug_redirect after update of slug on public.portfolio_projects
  for each row execute function public.record_slug_redirect('/work/');
create trigger products_slug_redirect after update of slug on public.products
  for each row execute function public.record_slug_redirect('/products/');

-- ---------------------------------------------------------------------------
-- Leads (website inquiries) — never readable by the public
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company_name text check (char_length(company_name) <= 160),
  service_required text not null check (char_length(service_required) <= 120),
  estimated_budget text check (char_length(estimated_budget) <= 80),
  preferred_timeline text check (char_length(preferred_timeline) <= 80),
  project_description text not null check (char_length(project_description) between 20 and 5000),
  consent_given boolean not null default false,
  status public.lead_status not null default 'new',
  is_read boolean not null default false,
  assigned_to uuid references public.profiles (id) on delete set null,
  ip_hash text,
  notification_status public.notification_status not null default 'pending',
  notification_attempts integer not null default 0,
  notification_error text,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status, created_at desc);
create index leads_ip_idx on public.leads (ip_hash, created_at desc);
create trigger leads_updated before update on public.leads
  for each row execute function public.set_updated_fields();

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

-- Server-only rate limiting buckets (hashed keys, no raw IPs)
create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  bucket text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_lookup_idx on public.rate_limit_events (bucket, key_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null unique,
  public_url text not null,
  file_name text not null check (char_length(file_name) <= 200),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml')),
  size_bytes integer not null check (size_bytes > 0),
  width integer,
  height integer,
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  title text check (char_length(title) <= 120),
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create index media_created_idx on public.media_assets (created_at desc);
create trigger media_updated before update on public.media_assets
  for each row execute function public.set_updated_fields();

-- ---------------------------------------------------------------------------
-- SEO overrides per public path
-- ---------------------------------------------------------------------------
create table public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  path text not null unique
    check (path ~ '^/' and path !~ '^/(admin|api|auth)(/|$)' and char_length(path) <= 200),
  title text check (char_length(title) <= 70),
  description text check (char_length(description) <= 170),
  og_title text check (char_length(og_title) <= 90),
  og_description text check (char_length(og_description) <= 200),
  og_image text,
  canonical_url text check (canonical_url ~ '^https://'),
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create trigger seo_updated before update on public.seo_metadata
  for each row execute function public.set_updated_fields();

-- ---------------------------------------------------------------------------
-- Site settings (non-secret configuration only)
-- ---------------------------------------------------------------------------
create table public.site_settings (
  key text primary key check (key in ('general', 'branding', 'seo', 'notifications', 'contact_form')),
  value jsonb not null default '{}' check (jsonb_typeof(value) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create trigger settings_updated before update on public.site_settings
  for each row execute function public.set_updated_fields();

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  resource_type text not null check (char_length(resource_type) <= 60),
  resource_id text check (char_length(resource_id) <= 120),
  summary text check (char_length(summary) <= 500),
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);
