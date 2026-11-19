-- Run in Supabase SQL editor. Safe to re-run: it creates what's missing and updates functions.
-- Tables have RLS on with no policies: the anon key can only call the functions below.

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  code text
);
insert into settings (id, code) values (1, null) on conflict do nothing;
alter table settings add column if not exists delivery_fee numeric(8, 2) not null default 0 check (delivery_fee >= 0);

create table if not exists orders (
  name text primary key,
  items jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists menu_items (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(btrim(name)) between 1 and 40),
  price numeric(8, 2) not null check (price >= 0),
  category text not null check (length(btrim(category)) between 1 and 30),
  created_at timestamptz not null default now()
);

-- Seed the original menu once (ids match orders saved before the menu moved to the DB).
insert into menu_items (id, name, price, category, created_at)
select id, name, price, category, now() + make_interval(secs => n)
from (values
  (1, 'foul', 'فول', 10, 'فول'),
  (2, 'foul_tahina', 'فول طحينة', 12, 'فول'),
  (3, 'falafel', 'فلافل', 10, 'فلافل'),
  (4, 'falafel_tahina', 'فلافل طحينة', 12, 'فلافل'),
  (5, 'falafel_kiri', 'فلافل كيري', 20, 'فلافل'),
  (6, 'potato_roumi', 'بطاطس رومي', 0, 'بطاطس'),
  (7, 'potato_roumi_mozz', 'بطاطس رومي موتزريلا', 38, 'بطاطس')
) as v(n, id, name, price, category)
where not exists (select 1 from menu_items);

alter table settings enable row level security;
alter table orders enable row level security;
alter table menu_items enable row level security;

create or replace function check_code(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_code is null or not exists (select 1 from settings where code = p_code) then
    raise exception 'invalid_code';
  end if;
end $$;

drop function if exists get_orders(text);

create or replace function get_state(p_code text) returns json
language plpgsql security definer set search_path = public as $$
begin
  perform check_code(p_code);
  return json_build_object(
    'orders', coalesce((select json_agg(o order by o.updated_at) from orders o), '[]'),
    'menu', coalesce((select json_agg(m order by m.created_at) from menu_items m), '[]'),
    'delivery_fee', (select delivery_fee from settings where id = 1)
  );
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
    where key not in (select id from menu_items)
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

-- Called only by /api/admin: removes the item and strips it from today's orders.
create or replace function delete_menu_item(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from menu_items where id = p_id;
  update orders set items = items - p_id where items ? p_id;
  delete from orders where items = '{}'::jsonb;
end $$;

revoke execute on function check_code(text), get_state(text), submit_order(text, text, jsonb),
  delete_order(text, text), reset_orders(text), delete_menu_item(text) from public, anon, authenticated;
grant execute on function get_state(text), submit_order(text, text, jsonb), delete_order(text, text)
  to anon, authenticated;
grant execute on function reset_orders(text), delete_menu_item(text) to service_role;
