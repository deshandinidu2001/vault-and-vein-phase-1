begin;

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

revoke all on function public.permit_store_request(text,text,integer) from public, anon, authenticated;
grant execute on function public.permit_store_request(text,text,integer) to service_role;
commit;
