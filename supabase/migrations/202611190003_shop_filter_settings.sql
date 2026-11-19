begin;

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
revoke all on public.shop_filter_settings from public, anon, authenticated, service_role;
grant select on public.shop_filter_settings to anon, authenticated, service_role;
grant insert, update (is_visible) on public.shop_filter_settings to service_role;
create policy public_shop_filter_settings on public.shop_filter_settings for select to anon, authenticated using (true);

alter table public.products drop constraint products_cut_check, drop constraint products_collections_check;
alter table public.products
  add constraint products_cut_check check (char_length(btrim(cut)) between 1 and 120),
  add constraint products_collections_check check (cardinality(collections) <= 32 and array_position(collections, null) is null);

commit;
