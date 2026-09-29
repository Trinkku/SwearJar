create table if not exists public.purses (
  id             uuid primary key default gen_random_uuid(),
  app_name       text        not null default 'Kiroilukassa',
  invite_code    text        not null unique,
  price_cents    integer     not null default 20 check (price_cents > 0),
  currency       text        not null default 'EUR',
  settlement_day integer     not null default 30 check (settlement_day between 1 and 31),
  created_at     timestamptz not null default now()
);

alter table public.purses
  add column if not exists max_devices integer not null default 4;

alter table public.purses
  drop constraint if exists purses_max_devices_check;

alter table public.purses
  add constraint purses_max_devices_check check (max_devices between 1 and 8);

create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  purse_id   uuid        not null references public.purses (id) on delete cascade,
  name       text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purse_access (
  purse_id  uuid        not null references public.purses (id) on delete cascade,
  user_id   uuid        not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (purse_id, user_id)
);

create table if not exists public.settlements (
  id          text primary key,
  purse_id    uuid        not null references public.purses (id) on delete cascade,
  period_key  text        not null,
  total_cents integer     not null,
  entry_count integer     not null,
  currency    text        not null,
  settled_at  timestamptz not null,
  settled_by  uuid        references public.members (id) on delete set null
);

create table if not exists public.entries (
  id            text primary key,
  purse_id      uuid        not null references public.purses (id) on delete cascade,
  member_id     uuid        not null references public.members (id) on delete cascade,
  amount_cents  integer     not null,
  currency      text        not null,
  created_at    timestamptz not null,
  deleted_at    timestamptz,
  settlement_id text        references public.settlements (id) on delete set null,
  period_key    text        not null
);

create index if not exists entries_purse_open_idx
  on public.entries (purse_id)
  where deleted_at is null and settlement_id is null;

create index if not exists entries_purse_created_idx
  on public.entries (purse_id, created_at desc);

create index if not exists settlements_purse_idx
  on public.settlements (purse_id, settled_at desc);

create or replace function public.has_purse_access(target_purse uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.purse_access
    where purse_id = target_purse
      and user_id = auth.uid()
  );
$$;

alter table public.purses       enable row level security;
alter table public.members      enable row level security;
alter table public.purse_access enable row level security;
alter table public.entries      enable row level security;
alter table public.settlements  enable row level security;

drop policy if exists purses_select on public.purses;
create policy purses_select on public.purses
  for select using (public.has_purse_access(id));

drop policy if exists purses_update on public.purses;
create policy purses_update on public.purses
  for update using (public.has_purse_access(id))
  with check (public.has_purse_access(id));

drop policy if exists purses_delete on public.purses;
create policy purses_delete on public.purses
  for delete using (public.has_purse_access(id));

drop policy if exists purse_access_select on public.purse_access;
create policy purse_access_select on public.purse_access
  for select using (public.has_purse_access(purse_id));

drop policy if exists members_all on public.members;
create policy members_all on public.members
  for all using (public.has_purse_access(purse_id))
  with check (public.has_purse_access(purse_id));

drop policy if exists entries_all on public.entries;
create policy entries_all on public.entries
  for all using (public.has_purse_access(purse_id))
  with check (public.has_purse_access(purse_id));

drop policy if exists settlements_all on public.settlements;
create policy settlements_all on public.settlements
  for all using (public.has_purse_access(purse_id))
  with check (public.has_purse_access(purse_id));

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for _ in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.purses where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.create_purse(
  app_name text,
  member_names text[],
  price_cents integer default 20,
  currency text default 'EUR',
  settlement_day integer default 30
)
returns public.purses
language plpgsql
security definer
set search_path = public
as $$
declare
  new_purse public.purses;
  member_name text;
  position integer := 0;
  device_limit integer;
begin
  if auth.uid() is null then
    raise exception 'Kirjautuminen vaaditaan';
  end if;
  if coalesce(array_length(member_names, 1), 0) = 0 then
    raise exception 'Kassaan tarvitaan vähintään yksi jäsen';
  end if;

  device_limit := greatest(array_length(member_names, 1), 2);

  insert into public.purses
    (app_name, invite_code, price_cents, currency, settlement_day, max_devices)
  values (
    coalesce(nullif(btrim(app_name), ''), 'Kiroilukassa'),
    public.generate_invite_code(),
    price_cents,
    currency,
    settlement_day,
    device_limit
  )
  returning * into new_purse;

  insert into public.purse_access (purse_id, user_id)
  values (new_purse.id, auth.uid());

  foreach member_name in array member_names loop
    insert into public.members (purse_id, name, sort_order)
    values (new_purse.id, member_name, position);
    position := position + 1;
  end loop;

  return new_purse;
end;
$$;

create or replace function public.join_purse(code text)
returns public.purses
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.purses;
  device_count integer;
begin
  if auth.uid() is null then
    raise exception 'Kirjautuminen vaaditaan';
  end if;

  select * into target
  from public.purses
  where invite_code = upper(btrim(code))
  for update;

  if target.id is null then
    raise exception 'Kutsukoodia ei löydy';
  end if;

  if exists (
    select 1 from public.purse_access
    where purse_id = target.id and user_id = auth.uid()
  ) then
    return target;
  end if;

  select count(*) into device_count
  from public.purse_access
  where purse_id = target.id;

  if device_count >= target.max_devices then
    raise exception 'Kassa on täynnä: siinä on jo % laitetta', target.max_devices;
  end if;

  insert into public.purse_access (purse_id, user_id)
  values (target.id, auth.uid());

  return target;
end;
$$;

create or replace function public.rotate_invite_code()
returns public.purses
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.purses;
begin
  if auth.uid() is null then
    raise exception 'Kirjautuminen vaaditaan';
  end if;

  select p.* into target
  from public.purses p
  join public.purse_access a on a.purse_id = p.id
  where a.user_id = auth.uid()
  order by a.joined_at desc
  limit 1;

  if target.id is null then
    raise exception 'Kassaa ei löydy';
  end if;

  update public.purses
  set invite_code = public.generate_invite_code()
  where id = target.id
  returning * into target;

  return target;
end;
$$;

create or replace function public.my_purse()
returns public.purses
language sql
security definer
stable
set search_path = public
as $$
  select p.*
  from public.purses p
  join public.purse_access a on a.purse_id = p.id
  where a.user_id = auth.uid()
  order by a.joined_at desc
  limit 1;
$$;

do $$
begin
  alter publication supabase_realtime add table public.entries;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.settlements;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.members;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.purses;
exception when duplicate_object then null;
end $$;
