-- Run once in Supabase SQL editor.
-- Tables have RLS on with no policies: the anon key can only call the functions below.

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  code text
);
insert into settings (id, code) values (1, null) on conflict do nothing;

create table if not exists orders (
  name text primary key,
  items jsonb not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;
alter table orders enable row level security;

create or replace function check_code(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_code is null or not exists (select 1 from settings where code = p_code) then
    raise exception 'invalid_code';
  end if;
end $$;

create or replace function get_orders(p_code text) returns setof orders
language plpgsql security definer set search_path = public as $$
begin
  perform check_code(p_code);
  return query select * from orders order by updated_at;
end $$;

create or replace function submit_order(p_code text, p_name text, p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_items jsonb;
begin
  perform check_code(p_code);
  if length(v_name) not between 1 and 40 then
    raise exception 'invalid_name';
  end if;
  if jsonb_typeof(p_items) is distinct from 'object' or exists (
    select 1 from jsonb_each(p_items)
    -- keep in sync with src/menu.js ids
    where key not in ('foul', 'foul_tahina', 'falafel', 'falafel_tahina', 'falafel_kiri', 'potato_roumi', 'potato_roumi_mozz')
       or jsonb_typeof(value) <> 'number'
       or value::numeric <> trunc(value::numeric)
       or value::numeric not between 0 and 20
  ) then
    raise exception 'invalid_items';
  end if;

  select jsonb_object_agg(key, value::int) into v_items
  from jsonb_each(p_items) where value::int > 0;
  if v_items is null then
    raise exception 'empty_order';
  end if;

  insert into orders (name, items) values (v_name, v_items)
  on conflict (name) do update set items = excluded.items, updated_at = now();
end $$;

create or replace function delete_order(p_code text, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform check_code(p_code);
  delete from orders where name = regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
end $$;

-- Called only by /api/admin with the service role key.
create or replace function reset_orders(p_new_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from orders where true;
  update settings set code = p_new_code where id = 1;
end $$;

revoke execute on function check_code(text), get_orders(text), submit_order(text, text, jsonb),
  delete_order(text, text), reset_orders(text) from public, anon, authenticated;
grant execute on function get_orders(text), submit_order(text, text, jsonb), delete_order(text, text)
  to anon, authenticated;
grant execute on function reset_orders(text) to service_role;
