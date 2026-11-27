begin;
create role vault_store_runtime nologin;
grant usage on schema public to vault_store_runtime;
alter table public.payment_events add column event_id uuid not null default gen_random_uuid();
alter table public.payment_events drop constraint payment_events_pkey, add primary key(event_id);
create index payment_events_order_status on public.payment_events(order_id,status_code);

create table public.admin_unlocks (
  session_hash text primary key,
  proof_hash text not null,
  expires_at timestamptz not null
);
alter table public.admin_unlocks enable row level security;
create or replace function public.apply_payment(p_order_id uuid, p_amount numeric, p_payment_id text, p_status text)
returns boolean language plpgsql set search_path = '' as $$
declare
  placed public.orders;
  next_status text;

begin
  perform public.expire_checkouts();
  select * into placed from public.orders where id = p_order_id for update;
  if not found or placed.total_lkr is distinct from p_amount or p_status is null or p_status not in ('2','0','-1','-2','-3') then
    return false;
  end if;

  -- The order row is locked. Historical duplicate receipts remain available for audit.
  if exists (select from public.payment_events where order_id = p_order_id and status_code = p_status) then
    return true;
  end if;
  insert into public.payment_events (payment_id, status_code, order_id)
    values (p_payment_id, p_status, p_order_id);

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

grant select, insert, update on public.products to vault_store_runtime;
create policy runtime_access on public.products to vault_store_runtime using (true) with check (true);
grant select, insert, update on public.shop_filter_settings to vault_store_runtime;
create policy runtime_access on public.shop_filter_settings to vault_store_runtime using (true) with check (true);
grant select, insert, update on public.gem_categories to vault_store_runtime;
create policy runtime_access on public.gem_categories to vault_store_runtime using (true) with check (true);
grant select, insert, update on public.store_admin_pin to vault_store_runtime;
create policy runtime_access on public.store_admin_pin to vault_store_runtime using (true) with check (true);
grant select, insert, update, delete on public.admin_unlocks to vault_store_runtime;
create policy runtime_access on public.admin_unlocks to vault_store_runtime using (true) with check (true);
grant select, insert, update(read_at) on public.inbox to vault_store_runtime;
create policy runtime_access on public.inbox to vault_store_runtime using (true) with check (true);
grant select on public.order_items to vault_store_runtime;
create policy runtime_access on public.order_items to vault_store_runtime using (true) with check (true);
grant select, update(status, shipped_at) on public.orders to vault_store_runtime;
create policy runtime_orders_read on public.orders for select to vault_store_runtime using (true);
create policy runtime_dispatch on public.orders for update to vault_store_runtime using (status = 'paid') with check (status = 'shipped');
alter function public.apply_payment(uuid,numeric,text,text) security definer;
grant execute on function public.apply_payment(uuid,numeric,text,text) to vault_store_runtime;
alter function public.expire_checkouts() security definer;
grant execute on function public.expire_checkouts() to vault_store_runtime;
alter function public.reserve_checkout(uuid[],jsonb,integer,uuid) security definer;
grant execute on function public.reserve_checkout(uuid[],jsonb,integer,uuid) to vault_store_runtime;
alter function public.permit_store_request(text,text,integer) security definer;
grant execute on function public.permit_store_request(text,text,integer) to vault_store_runtime;
grant execute on function public.valid_product_gallery(text,text[]) to vault_store_runtime;
commit;
