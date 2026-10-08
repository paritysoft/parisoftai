-- ParitySoft AI — Row Level Security
-- Public visitors: read published content only.
-- editor (rank 1): drafts only, no publishing, no deletes, no leads.
-- admin (rank 2): content, publishing, portfolio, products, leads, media.
-- super_admin (rank 3): everything incl. users, settings, SEO, audit logs.

alter table public.admin_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.page_revisions enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.slug_redirects enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.rate_limit_events enable row level security;
alter table public.media_assets enable row level security;
alter table public.seo_metadata enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Defence in depth: tables the public must never touch.
revoke all on public.leads, public.lead_notes, public.rate_limit_events, public.audit_logs, public.media_assets, public.page_revisions
  from anon;
revoke all on public.rate_limit_events from authenticated;

-- Roles reference table ---------------------------------------------------------
create policy "staff read roles" on public.admin_roles for select to authenticated using (public.is_staff());

-- Profiles ----------------------------------------------------------------------
-- Role and status can only change through set_staff_role / set_staff_active.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy "read own profile or staff directory" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy "update own name" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Pages -------------------------------------------------------------------------
create policy "public reads published pages" on public.pages for select to anon, authenticated
  using (status = 'published' or public.is_staff());
create policy "admins update pages" on public.pages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "super admins create pages" on public.pages for insert to authenticated
  with check (public.is_super_admin());
create policy "super admins delete pages" on public.pages for delete to authenticated
  using (public.is_super_admin());

create policy "staff read revisions" on public.page_revisions for select to authenticated
  using (public.is_staff());
create policy "staff write draft revisions, admins publish" on public.page_revisions for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      (kind = 'draft' and public.is_staff())
      or (kind = 'published' and public.is_admin())
    )
  );

-- Content collections (services, portfolio_projects, products) -------------------
do $$
declare
  t text;
begin
  foreach t in array array['services', 'portfolio_projects', 'products'] loop
    execute format(
      'create policy "public reads published %1$s" on public.%1$I for select to anon, authenticated
         using (status = ''published'' or public.is_staff())', t);
    execute format(
      'create policy "staff create %1$s drafts" on public.%1$I for insert to authenticated
         with check (public.is_admin() or (public.is_staff() and status = ''draft''))', t);
    execute format(
      'create policy "staff edit %1$s drafts, admins edit all" on public.%1$I for update to authenticated
         using (public.is_admin() or (public.is_staff() and status = ''draft''))
         with check (public.is_admin() or (public.is_staff() and status = ''draft''))', t);
    execute format(
      'create policy "admins delete %1$s" on public.%1$I for delete to authenticated
         using (public.is_admin())', t);
  end loop;
end;
$$;

-- Gallery images follow the parent record's visibility/editability
create policy "public reads published project images" on public.portfolio_images for select to anon, authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.portfolio_projects p where p.id = project_id and p.status = 'published')
  );
create policy "staff manage project images" on public.portfolio_images for all to authenticated
  using (
    public.is_admin()
    or (public.is_staff() and exists (select 1 from public.portfolio_projects p where p.id = project_id and p.status = 'draft'))
  )
  with check (
    public.is_admin()
    or (public.is_staff() and exists (select 1 from public.portfolio_projects p where p.id = project_id and p.status = 'draft'))
  );

create policy "public reads published product images" on public.product_images for select to anon, authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "staff manage product images" on public.product_images for all to authenticated
  using (
    public.is_admin()
    or (public.is_staff() and exists (select 1 from public.products p where p.id = product_id and p.status = 'draft'))
  )
  with check (
    public.is_admin()
    or (public.is_staff() and exists (select 1 from public.products p where p.id = product_id and p.status = 'draft'))
  );

-- Redirects are public knowledge (old URLs); written only by trigger / admins
create policy "anyone reads redirects" on public.slug_redirects for select to anon, authenticated using (true);
create policy "admins manage redirects" on public.slug_redirects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Leads: inserted only by the server (service role). Admins manage.
create policy "admins read leads" on public.leads for select to authenticated using (public.is_admin());
create policy "admins update leads" on public.leads for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins delete leads" on public.leads for delete to authenticated using (public.is_admin());

create policy "admins read lead notes" on public.lead_notes for select to authenticated using (public.is_admin());
create policy "admins add lead notes" on public.lead_notes for insert to authenticated
  with check (public.is_admin() and author_id = auth.uid());
create policy "authors or super admins delete notes" on public.lead_notes for delete to authenticated
  using (public.is_super_admin() or (public.is_admin() and author_id = auth.uid()));

-- rate_limit_events: no policies => service role only.

-- Media
create policy "staff read media" on public.media_assets for select to authenticated using (public.is_staff());
create policy "staff upload media" on public.media_assets for insert to authenticated
  with check (public.is_staff() and uploaded_by = auth.uid());
create policy "staff edit media metadata" on public.media_assets for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "admins delete media" on public.media_assets for delete to authenticated using (public.is_admin());

-- SEO overrides: public read (rendered into <head>), super admin write
create policy "anyone reads seo" on public.seo_metadata for select to anon, authenticated using (true);
create policy "super admins manage seo" on public.seo_metadata for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Settings: notification recipients are private
create policy "public reads public settings" on public.site_settings for select to anon, authenticated
  using (key <> 'notifications' or public.is_super_admin());
create policy "super admins manage settings" on public.site_settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Audit logs: append-only, readable by super admins
create policy "staff append own audit entries" on public.audit_logs for insert to authenticated
  with check (public.is_staff() and actor_id = auth.uid());
create policy "super admins read audit log" on public.audit_logs for select to authenticated
  using (public.is_super_admin());
revoke update, delete on public.audit_logs from authenticated;

-- Function execution: helpers are callable by signed-in users; role changes are self-guarded.
revoke execute on function public.set_staff_role(uuid, public.staff_role) from public, anon;
revoke execute on function public.set_staff_active(uuid, boolean) from public, anon;
grant execute on function public.set_staff_role(uuid, public.staff_role) to authenticated;
grant execute on function public.set_staff_active(uuid, boolean) to authenticated;
