begin;

grant insert (slug, name) on public.gem_categories to service_role;

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

revoke execute on function public.valid_product_gallery(text, text[]) from public, anon, authenticated;
grant execute on function public.valid_product_gallery(text, text[]) to service_role;

alter table public.products
  add column gallery_urls text[] not null default '{}',
  add column gallery_revision uuid not null default gen_random_uuid(),
  add constraint products_gallery_check check (public.valid_product_gallery(image_url, gallery_urls));

commit;
