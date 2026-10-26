-- ========================== COUNTRIES (catálogo que crece con el uso) =======

create table public.countries (
  id          uuid primary key default gen_random_uuid(),
  code        char(2) not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

alter table public.countries enable row level security;

create policy "countries are public"
  on public.countries for select
  using (true);

-- ========================== USER LOCATIONS (historial) ======================

create table public.user_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  country_id  uuid not null references public.countries(id),
  city        text,
  timezone    text not null,
  is_current  boolean not null default true,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  created_at  timestamptz not null default now()
);

create unique index user_locations_one_current_idx
  on public.user_locations(user_id) where is_current;

create index user_locations_user_started_idx
  on public.user_locations(user_id, started_at desc);

alter table public.user_locations enable row level security;

create policy "users own locations"
  on public.user_locations for select
  using (auth.uid() = user_id);

-- ========================== FOODS por país =================================

alter table public.foods
  add column country_id uuid references public.countries(id) on delete set null;

create index foods_country_idx on public.foods(country_id);
