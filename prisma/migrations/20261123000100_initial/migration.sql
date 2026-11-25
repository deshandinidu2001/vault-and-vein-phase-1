BEGIN;

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
alter table public.inbox enable row level security;
alter table public.rate_limits enable row level security;

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
revoke execute on function public.consume_rate_limit(text,integer,integer) from public;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid unique not null,
  customer jsonb not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','expired','review','shipped')),
  total_lkr integer not null check (total_lkr > 0),
  shipping_lkr integer not null check (shipping_lkr >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '20 minutes'),
  paid_at timestamptz,
  shipped_at timestamptz
);

create table public.order_items (
  order_id uuid not null references public.orders(id),
  product_id uuid not null references public.products(id),
  name text not null,
  price_lkr integer not null,
  primary key (order_id, product_id)
);

create table public.stock_holds (
  product_id uuid primary key references public.products(id),
  order_id uuid not null references public.orders(id)
);
create index stock_holds_order on public.stock_holds (order_id);
create index orders_pending on public.orders (expires_at) where status = 'pending';

create table public.payment_events (
  payment_id text not null,
  status_code text not null,
  order_id uuid not null references public.orders(id),
  received_at timestamptz not null default now(),
  primary key (payment_id, status_code)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_holds enable row level security;
alter table public.payment_events enable row level security;

create function public.expire_checkouts()
returns void language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(902163);
  update public.orders set status = 'expired' where status = 'pending' and expires_at <= now();
  update public.products as p set status = 'available', reserved_until = null
    from public.stock_holds h, public.orders o
    where p.id = h.product_id and h.order_id = o.id and o.status = 'expired';
  delete from public.stock_holds as h using public.orders o
    where h.order_id = o.id and o.status = 'expired';
end;
$$;

create function public.reserve_checkout(p_ids uuid[], p_customer jsonb, p_shipping integer, p_token uuid)
returns jsonb language plpgsql set search_path = '' as $$
declare
  item_count integer;
  total integer;
  placed public.orders;
begin
  if coalesce(cardinality(p_ids), 0) not between 1 and 12 or p_shipping is null or p_shipping not between 0 and 1000000 or p_token is null then
    raise exception 'Invalid checkout' using errcode = '22023';
  end if;

  perform public.expire_checkouts();

  select * into placed from public.orders where public_token = p_token;
  if found then
    if placed.status = 'pending' and placed.customer = p_customer and placed.shipping_lkr = p_shipping and
      (select array_agg(product_id order by product_id) from public.order_items where order_id = placed.id) =
      (select array_agg(product_id order by product_id) from unnest(p_ids) as selected(product_id)) then
      return jsonb_build_object('id', placed.id, 'public_token', placed.public_token, 'total_lkr', placed.total_lkr);
    end if;
    raise exception 'Checkout attempt already used' using errcode = 'P0001';
  end if;

  -- Coordinate with catalogue edits by locking the rows before reading prices and state.
  perform 1 from public.products where id = any(p_ids) order by id for update;
  select count(*), sum(price_lkr) into item_count, total
    from public.products where id = any(p_ids) and is_published and not is_sample and status = 'available';

  if item_count <> cardinality(p_ids) then
    raise exception 'One or more stones are unavailable' using errcode = 'P0001';
  end if;

  insert into public.orders (public_token, customer, total_lkr, shipping_lkr)
    values (p_token, p_customer, total + p_shipping, p_shipping) returning * into placed;
  insert into public.order_items (order_id, product_id, name, price_lkr)
    select placed.id, id, name, price_lkr from public.products where id = any(p_ids);
  insert into public.stock_holds (order_id, product_id)
    select placed.id, id from public.products where id = any(p_ids);
  update public.products set status = 'reserved', reserved_until = placed.expires_at where id = any(p_ids);
  return jsonb_build_object('id', placed.id, 'public_token', placed.public_token, 'total_lkr', placed.total_lkr);
end;
$$;

create function public.apply_payment(p_order_id uuid, p_amount numeric, p_payment_id text, p_status text)
returns boolean language plpgsql set search_path = '' as $$
declare
  placed public.orders;
  next_status text;
  changed integer;
begin
  perform public.expire_checkouts();
  select * into placed from public.orders where id = p_order_id for update;
  if not found or placed.total_lkr is distinct from p_amount or p_status not in ('2','0','-1','-2','-3') then
    return false;
  end if;

  insert into public.payment_events (payment_id, status_code, order_id)
    values (p_payment_id, p_status, p_order_id) on conflict do nothing;
  get diagnostics changed = row_count;
  if changed = 0 then
    return exists (
      select 1 from public.payment_events
      where payment_id = p_payment_id and status_code = p_status and order_id = p_order_id
    );
  end if;

  case
    when p_status = '2' and placed.status = 'pending' then next_status := 'paid';
    when p_status = '2' and placed.status in ('paid','shipped') then return true;
    when p_status in ('2', '-3') then next_status := 'review';
    when p_status = '-1' and placed.status = 'pending' then next_status := 'cancelled';
    when p_status = '-2' and placed.status = 'pending' then next_status := 'failed';
    else return true;
  end case;

  update public.orders set status = next_status,
    paid_at = case when p_status = '2' then coalesce(paid_at, now()) else paid_at end
    where id = p_order_id;

  update public.products as p set
    status = case when next_status in ('paid', 'review') then 'sold' else 'available' end,
    reserved_until = null
    from public.stock_holds as h where h.order_id = p_order_id and p.id = h.product_id;
  delete from public.stock_holds where order_id = p_order_id;
  return true;
end;
$$;

revoke execute on function public.expire_checkouts(), public.reserve_checkout(uuid[],jsonb,integer,uuid),
  public.apply_payment(uuid,numeric,text,text) from public;

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

alter table public.products
  drop constraint products_gem_type_check,
  add constraint products_gem_type_fkey foreign key (gem_type) references public.gem_categories (slug),
  add column archived_at timestamptz,
  add constraint archived_products_are_unpublished check (archived_at is null or (not is_published and status = 'available'));

create index products_gem_type on public.products (gem_type);

alter table public.gem_categories add column is_visible boolean not null default true;


alter table public.products add column image_url text check (
  image_url ~ '^https://res[.]cloudinary[.]com/[a-zA-Z0-9_-]+/image/upload/v[0-9]+/vault-and-vein/products/[a-f0-9-]{36}[.](jpg|jpeg|png|webp)$'
);
create unique index products_photo_unique on public.products (image_url) where image_url is not null;


create function public.require_visible_stock_category()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Serialize a new reservation with the category visibility update.
  perform 1 from public.products as p join public.gem_categories as c on c.slug = p.gem_type
    where p.id = new.product_id and c.is_visible for share of c;
  if not found then
    raise exception 'One or more stones are unavailable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.require_visible_stock_category() from public;
create trigger stock_hold_category_visible before insert on public.stock_holds
  for each row execute function public.require_visible_stock_category();

create table public.shop_filter_settings (
  filter_key text not null check (filter_key in ('q','sort','type','collection','cut','colour','origin','certified','carat','price')),
  value text not null default '' check (char_length(value) <= 120 and value = lower(btrim(value))),
  label text not null default '' check (char_length(label) <= 120 and label = btrim(label)),
  is_visible boolean not null default true,
  primary key (filter_key, value),
  check (
    (value = '' and label = '') or (
      value <> '' and label <> '' and (
        filter_key in ('cut','colour','origin')
        or (filter_key in ('type','collection') and char_length(value) <= 80 and value ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
        or (filter_key = 'sort' and value in ('featured','price-asc','price-desc','carat-desc','name'))
      )
    )
  )
);

alter table public.shop_filter_settings enable row level security;

alter table public.products drop constraint products_cut_check, drop constraint products_collections_check;
alter table public.products
  add constraint products_cut_check check (char_length(btrim(cut)) between 1 and 120),
  add constraint products_collections_check check (cardinality(collections) <= 32 and array_position(collections, null) is null);

create function public.valid_product_gallery(cover text, photos text[])
returns boolean language sql immutable set search_path = '' as $$
  select cardinality(photos) <= 7
    and array_position(photos, null) is null
    and (cardinality(photos) = 0 or cover is not null)
    and cardinality(photos) = (
      select count(distinct photo) from unnest(photos) as gallery(photo)
      where photo <> cover
        and photo ~ '^https://res[.]cloudinary[.]com/[a-zA-Z0-9_-]+/image/upload/v[0-9]+/vault-and-vein/products/[a-f0-9-]{36}[.](jpg|jpeg|png|webp)$'
    )
$$;

revoke execute on function public.valid_product_gallery(text, text[]) from public;

alter table public.products
  add column gallery_urls text[] not null default '{}',
  add column gallery_revision uuid not null default gen_random_uuid(),
  add constraint products_gallery_check check (public.valid_product_gallery(image_url, gallery_urls));

create index if not exists rate_limits_window_start on public.rate_limits (window_start);

-- Consume both limits in one trip. Keep the original keys and counters across upgrades.
create function public.permit_store_request(p_source text, p_identity text, p_source_max integer)
returns boolean language plpgsql set search_path = '' as $$
begin
  -- Expired buckets from one-off identities should not accumulate indefinitely.
  delete from public.rate_limits where key in (
    select key from public.rate_limits where window_start < now() - interval '1 day'
    order by window_start limit 16 for update skip locked
  );
  if not public.consume_rate_limit(p_source, p_source_max, 600) then return false; end if;
  return public.consume_rate_limit(p_identity, 6, 600);
end;
$$;

revoke all on function public.permit_store_request(text,text,integer) from public;

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (email = lower(btrim(email))),
  password_hash text not null
);

create table public.admin_sessions (
  token_hash text primary key,
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  expires_at timestamptz not null
);

create index admin_sessions_admin_id_idx on public.admin_sessions (admin_id);
alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;

COMMIT;
