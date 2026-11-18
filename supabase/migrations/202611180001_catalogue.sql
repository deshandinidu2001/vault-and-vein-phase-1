create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name text not null,
  gem_type text not null check (gem_type in ('sapphire','spinel','garnet','alexandrite','chrysoberyl')),
  cut text not null check (cut in ('Oval','Cushion','Round','Emerald','Pear','Trillion')),
  carat numeric(8,2) not null check (carat > 0),
  length_mm numeric(8,2) not null check (length_mm > 0),
  width_mm numeric(8,2) not null check (width_mm > 0),
  depth_mm numeric(8,2) not null check (depth_mm > 0),
  colour text not null, clarity text not null, treatment text not null, origin text not null,
  description text not null,
  price_lkr integer not null check (price_lkr > 0 and price_lkr <= 100000000),
  status text not null default 'available' check (status in ('available','reserved','sold')),
  reserved_until timestamptz,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  is_sample boolean not null default false,
  model_key text generated always as (cut) stored,
  tint text not null check (tint ~ '^#[0-9a-fA-F]{6}$'),
  certified boolean not null default false,
  collections text[] not null default '{}' check (collections <@ array['engagement','rare','parcels']::text[]),
  check ((status = 'reserved') = (reserved_until is not null))
);
create index products_public on public.products (is_published, is_featured desc, slug);
create index products_reservations on public.products (reserved_until) where status = 'reserved';
alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
create policy public_catalogue on public.products for select to anon, authenticated using (is_published);

create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.inbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact','enquiry')),
  email text not null,
  payload jsonb not null,
  created_at timestamptz not null default current_timestamp,
  read_at timestamptz
);
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null
);
alter table public.admin_users enable row level security;
alter table public.inbox enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.admin_users, public.inbox, public.rate_limits from anon, authenticated;
grant all on public.admin_users, public.inbox, public.rate_limits to service_role;

create function public.consume_rate_limit(p_key text, p_max integer, p_seconds integer)
returns boolean language plpgsql set search_path = '' as $$
declare count_hits integer;
begin
  insert into public.rate_limits as r values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start <= now() - make_interval(secs => p_seconds) then 1 else least(r.hits + 1, p_max + 1) end,
    window_start = case when r.window_start <= now() - make_interval(secs => p_seconds) then now() else r.window_start end
  returning hits into count_hits;
  return count_hits <= p_max;
end;
$$;
revoke execute on function public.consume_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
