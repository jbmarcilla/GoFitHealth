-- ============================================================================
-- GoFit Health — Schema completo
-- 001_init.sql
-- ============================================================================

-- ========================== FUNCIONES AUXILIARES ============================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ========================== PROFILES ========================================

create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text,
  avatar_url           text,
  measurement_system   text not null default 'grams'
    check (measurement_system in ('grams', 'reference')),
  cooking_preference   text not null default 'simple'
    check (cooking_preference in ('simple', 'no_cooking', 'eating_out', 'full')),
  timezone             text not null default 'America/Lima',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========================== GOALS ===========================================

create table public.goals (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  goal_type            text not null
    check (goal_type in ('athletic', 'muscular', 'lean', 'maintain', 'lose_weight', 'gain_weight')),
  target_weight_kg     numeric(5,2),
  daily_calorie_target integer,
  daily_water_ml       integer not null default 2000,
  notes                text,
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);

create index goals_user_active_idx
  on public.goals(user_id, active) where active = true;

-- ========================== WEIGHT LOGS =====================================

create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null default current_date,
  weight_kg   numeric(5,2) not null,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

create index weight_logs_user_date_idx
  on public.weight_logs(user_id, date desc);

-- ========================== FOODS (DB compartida) ===========================

create table public.foods (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  brand             text,
  sku               text,
  calories_per_100g numeric(6,1) not null,
  protein_g         numeric(5,1) not null default 0,
  carbs_g           numeric(5,1) not null default 0,
  fat_g             numeric(5,1) not null default 0,
  fiber_g           numeric(5,1) not null default 0,
  caloric_density   text generated always as (
    case
      when calories_per_100g < 100  then 'green'
      when calories_per_100g <= 250 then 'yellow'
      else 'red'
    end
  ) stored,
  serving_reference text,
  food_category     text,
  added_by          uuid references auth.users(id) on delete set null,
  verified          boolean not null default false,
  created_at        timestamptz not null default now()
);

create unique index foods_name_brand_unique
  on public.foods(lower(name), lower(coalesce(brand, '')));

create index foods_search_idx
  on public.foods using gin (
    to_tsvector('spanish', name || ' ' || coalesce(brand, ''))
  );

-- ========================== PORTION REFERENCES ==============================

create table public.portion_references (
  id                 uuid primary key default gen_random_uuid(),
  food_id            uuid references public.foods(id) on delete cascade,
  food_category      text,
  portion_type       text not null
    check (portion_type in ('puno', 'palma', 'taza', 'mano', 'cucharada', 'porcion')),
  grams_equivalent   numeric(6,1) not null,
  calories_equivalent numeric(6,1),
  description        text,
  verified           boolean not null default false,
  added_by           uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now()
);

-- Referencia específica por alimento: un tipo de porción por alimento
create unique index portion_refs_food_unique
  on public.portion_references(food_id, portion_type)
  where food_id is not null;

-- Referencia genérica por categoría: un tipo de porción por categoría
create unique index portion_refs_category_unique
  on public.portion_references(food_category, portion_type)
  where food_id is null;

-- ========================== MEAL LOGS =======================================

create table public.meal_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               date not null default current_date,
  meal_type          text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id            uuid references public.foods(id),
  food_name          text not null,
  quantity           numeric(7,2) not null,
  unit               text not null default 'g'
    check (unit in ('g', 'ml', 'puno', 'taza', 'mano', 'cucharada', 'porcion', 'unit')),
  estimated_calories integer not null,
  estimated_protein  numeric(5,1),
  estimated_carbs    numeric(5,1),
  estimated_fat      numeric(5,1),
  notes              text,
  created_at         timestamptz not null default now()
);

create index meal_logs_user_date_idx
  on public.meal_logs(user_id, date desc, meal_type);

-- ========================== WATER LOGS ======================================

create table public.water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null default current_date,
  amount_ml   integer not null,
  created_at  timestamptz not null default now()
);

create index water_logs_user_date_idx
  on public.water_logs(user_id, date desc);

-- ========================== EXERCISES (DB compartida) =======================

create table public.exercises (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text
    check (category in ('cardio', 'strength', 'flexibility', 'sports', 'other')),
  calories_per_hour integer not null,
  met_value        numeric(4,1),
  added_by         uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

create unique index exercises_name_unique
  on public.exercises(lower(name));

-- ========================== EXERCISE LOGS ===================================

create table public.exercise_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             date not null default current_date,
  exercise_id      uuid references public.exercises(id),
  exercise_name    text not null,
  duration_minutes integer not null,
  calories_burned  integer not null,
  notes            text,
  created_at       timestamptz not null default now()
);

create index exercise_logs_user_date_idx
  on public.exercise_logs(user_id, date desc);

-- ========================== API KEYS ========================================

create table public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key_hash    text not null,
  key_prefix  text not null,
  label       text not null default 'default',
  last_used   timestamptz,
  created_at  timestamptz not null default now()
);

create index api_keys_hash_idx on public.api_keys(key_hash);

-- ========================== REPORT TOKENS ===================================

create table public.report_tokens (
  token       text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  scope       text not null default 'weekly'
    check (scope in ('weekly', 'monthly', 'all')),
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- ========================== ROW LEVEL SECURITY ==============================

alter table public.profiles        enable row level security;
alter table public.goals            enable row level security;
alter table public.weight_logs      enable row level security;
alter table public.foods            enable row level security;
alter table public.portion_references enable row level security;
alter table public.meal_logs        enable row level security;
alter table public.water_logs       enable row level security;
alter table public.exercises        enable row level security;
alter table public.exercise_logs    enable row level security;
alter table public.api_keys         enable row level security;
alter table public.report_tokens    enable row level security;

-- Datos propios del usuario
create policy "users own profiles"
  on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "users own goals"
  on public.goals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users own weight_logs"
  on public.weight_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users own meal_logs"
  on public.meal_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users own water_logs"
  on public.water_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users own exercise_logs"
  on public.exercise_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users own api_keys"
  on public.api_keys for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users own report_tokens"
  on public.report_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- DB compartidas: lectura pública, escritura autenticada
create policy "anyone reads foods"
  on public.foods for select using (true);
create policy "auth users add foods"
  on public.foods for insert with check (auth.uid() is not null);

create policy "anyone reads exercises"
  on public.exercises for select using (true);
create policy "auth users add exercises"
  on public.exercises for insert with check (auth.uid() is not null);

create policy "anyone reads portion_references"
  on public.portion_references for select using (true);
create policy "auth users add portion_references"
  on public.portion_references for insert with check (auth.uid() is not null);
