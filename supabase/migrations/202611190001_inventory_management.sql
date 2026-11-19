begin;

create table public.gem_categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name text not null check (length(btrim(name)) between 1 and 80),
  is_builtin boolean not null default false
);

create unique index gem_categories_name_unique on public.gem_categories (lower(btrim(name)));

insert into public.gem_categories (slug, name, is_builtin) values
  ('sapphire', 'Sapphire', true),
  ('spinel', 'Spinel', true),
  ('garnet', 'Garnet', true),
  ('alexandrite', 'Alexandrite', true),
  ('chrysoberyl', 'Chrysoberyl', true);

alter table public.gem_categories enable row level security;
revoke all on public.gem_categories from anon, authenticated;
grant select on public.gem_categories to anon, authenticated;
grant all on public.gem_categories to service_role;
create policy public_gem_categories on public.gem_categories for select to anon, authenticated using (true);

alter table public.products
  drop constraint products_gem_type_check,
  add constraint products_gem_type_fkey foreign key (gem_type) references public.gem_categories (slug),
  add column archived_at timestamptz,
  add constraint archived_products_are_unpublished check (archived_at is null or (not is_published and status = 'available'));

create index products_gem_type on public.products (gem_type);
alter policy public_catalogue on public.products using (is_published and archived_at is null);

commit;
