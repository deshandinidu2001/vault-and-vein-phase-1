create table public.store_admin_pin (
  email text primary key check (email = 'vault8vein@gmail.com'),
  pin_hash text not null,
  revision uuid not null default gen_random_uuid()
);

alter table public.store_admin_pin enable row level security;
revoke all on table public.store_admin_pin from public;
