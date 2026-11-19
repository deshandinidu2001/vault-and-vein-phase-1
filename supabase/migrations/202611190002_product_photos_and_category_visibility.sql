begin;

alter table public.gem_categories add column is_visible boolean not null default true;

revoke all on public.gem_categories from public, anon, authenticated, service_role;
grant select on public.gem_categories to anon, authenticated, service_role;
grant update (is_visible) on public.gem_categories to service_role;
alter policy public_gem_categories on public.gem_categories using (is_visible);

alter table public.products add column image_url text check (
  image_url ~ '^https://res[.]cloudinary[.]com/[a-zA-Z0-9_-]+/image/upload/v[0-9]+/vault-and-vein/products/[a-f0-9-]{36}[.](jpg|jpeg|png|webp)$'
);
create unique index products_photo_unique on public.products (image_url) where image_url is not null;

alter policy public_catalogue on public.products using (
  is_published and archived_at is null and exists (
    select 1 from public.gem_categories as c where c.slug = products.gem_type and c.is_visible
  )
);

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
revoke execute on function public.require_visible_stock_category() from public, anon, authenticated;
create trigger stock_hold_category_visible before insert on public.stock_holds
  for each row execute function public.require_visible_stock_category();

commit;
