begin;
set local lock_timeout = '5s';

alter table public.products
  drop constraint products_status_check,
  drop constraint archived_products_are_unpublished,
  add constraint products_status_check check (status in ('available', 'unavailable', 'reserved', 'sold')),
  add constraint archived_products_are_unpublished
    check (archived_at is null or (not is_published and status in ('available', 'unavailable')));

commit;
