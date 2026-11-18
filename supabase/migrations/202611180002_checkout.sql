create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid(),
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
revoke all on public.orders, public.order_items, public.stock_holds, public.payment_events from anon, authenticated;
grant all on public.orders, public.order_items, public.stock_holds, public.payment_events to service_role;

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

create function public.reserve_checkout(p_ids uuid[], p_customer jsonb, p_shipping integer)
returns public.orders language plpgsql set search_path = '' as $$
declare
  item_count integer;
  total integer;
  placed public.orders;
begin
  if coalesce(cardinality(p_ids), 0) not between 1 and 12 or p_shipping is null or p_shipping not between 0 and 1000000 then
    raise exception 'Invalid checkout' using errcode = '22023';
  end if;

  perform public.expire_checkouts();

  -- Coordinate with catalogue edits by locking the rows before reading prices and state.
  perform 1 from public.products where id = any(p_ids) order by id for update;
  select count(*), sum(price_lkr) into item_count, total
    from public.products where id = any(p_ids) and is_published and not is_sample and status = 'available';

  if item_count <> cardinality(p_ids) then
    raise exception 'One or more stones are unavailable' using errcode = 'P0001';
  end if;

  insert into public.orders (customer, total_lkr, shipping_lkr)
    values (p_customer, total + p_shipping, p_shipping) returning * into placed;
  insert into public.order_items (order_id, product_id, name, price_lkr)
    select placed.id, id, name, price_lkr from public.products where id = any(p_ids);
  insert into public.stock_holds (order_id, product_id)
    select placed.id, id from public.products where id = any(p_ids);
  update public.products set status = 'reserved', reserved_until = placed.expires_at where id = any(p_ids);
  return placed;
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

revoke execute on function public.expire_checkouts(), public.reserve_checkout(uuid[],jsonb,integer),
  public.apply_payment(uuid,numeric,text,text) from public, anon, authenticated;
grant execute on function public.expire_checkouts(), public.reserve_checkout(uuid[],jsonb,integer),
  public.apply_payment(uuid,numeric,text,text) to service_role;
