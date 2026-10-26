-- ========================== NUTRIENTS (catálogo) ============================
-- Valores de referencia diarios para un adulto (FDA Daily Values).
-- is_limit = true → conviene no pasarse (sodio, azúcar, grasa saturada).

create table public.nutrients (
  key              text primary key,
  name             text not null,
  unit             text not null check (unit in ('g', 'mg', 'mcg')),
  category         text not null check (category in ('macro', 'vitamin', 'mineral', 'other')),
  daily_reference  numeric(8,2),
  is_limit         boolean not null default false,
  sort_order       integer not null default 100,
  added_by         uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

insert into public.nutrients (key, name, unit, category, daily_reference, is_limit, sort_order) values
  ('fiber',        'Fibra',             'g',   'macro',   28,   false, 10),
  ('sugar',        'Azúcar',            'g',   'macro',   50,   true,  11),
  ('saturated_fat','Grasa saturada',    'g',   'macro',   20,   true,  12),
  ('cholesterol',  'Colesterol',        'mg',  'other',   300,  true,  13),
  ('omega3',       'Omega 3',           'g',   'other',   1.6,  false, 14),
  ('sodium',       'Sodio',             'mg',  'mineral', 2300, true,  20),
  ('potassium',    'Potasio',           'mg',  'mineral', 4700, false, 21),
  ('calcium',      'Calcio',            'mg',  'mineral', 1300, false, 22),
  ('iron',         'Hierro',            'mg',  'mineral', 18,   false, 23),
  ('magnesium',    'Magnesio',          'mg',  'mineral', 420,  false, 24),
  ('zinc',         'Zinc',              'mg',  'mineral', 11,   false, 25),
  ('phosphorus',   'Fósforo',           'mg',  'mineral', 1250, false, 26),
  ('selenium',     'Selenio',           'mcg', 'mineral', 55,   false, 27),
  ('vitamin_a',    'Vitamina A',        'mcg', 'vitamin', 900,  false, 30),
  ('vitamin_c',    'Vitamina C',        'mg',  'vitamin', 90,   false, 31),
  ('vitamin_d',    'Vitamina D',        'mcg', 'vitamin', 20,   false, 32),
  ('vitamin_e',    'Vitamina E',        'mg',  'vitamin', 15,   false, 33),
  ('vitamin_k',    'Vitamina K',        'mcg', 'vitamin', 120,  false, 34),
  ('vitamin_b1',   'Vitamina B1',       'mg',  'vitamin', 1.2,  false, 35),
  ('vitamin_b2',   'Vitamina B2',       'mg',  'vitamin', 1.3,  false, 36),
  ('vitamin_b3',   'Vitamina B3',       'mg',  'vitamin', 16,   false, 37),
  ('vitamin_b6',   'Vitamina B6',       'mg',  'vitamin', 1.7,  false, 38),
  ('vitamin_b12',  'Vitamina B12',      'mcg', 'vitamin', 2.4,  false, 39),
  ('folate',       'Folato (B9)',       'mcg', 'vitamin', 400,  false, 40);

alter table public.nutrients enable row level security;
create policy "nutrients are public" on public.nutrients for select using (true);

-- ========================== FOOD NUTRIENTS (por 100 g) ======================

create table public.food_nutrients (
  food_id          uuid not null references public.foods(id) on delete cascade,
  nutrient_key     text not null references public.nutrients(key),
  amount_per_100g  numeric(10,3) not null,
  added_by         uuid references auth.users(id) on delete set null,
  updated_at       timestamptz not null default now(),
  primary key (food_id, nutrient_key)
);

alter table public.food_nutrients enable row level security;
create policy "food nutrients are public" on public.food_nutrients for select using (true);

-- ========================== MEAL LOGS: gramos, fibra y micronutrientes =====

alter table public.meal_logs
  add column estimated_grams numeric(7,1),
  add column estimated_fiber numeric(5,1);

create table public.meal_nutrients (
  meal_log_id   uuid not null references public.meal_logs(id) on delete cascade,
  nutrient_key  text not null references public.nutrients(key),
  amount        numeric(10,3) not null,
  primary key (meal_log_id, nutrient_key)
);

alter table public.meal_nutrients enable row level security;
create policy "users read own meal nutrients"
  on public.meal_nutrients for select
  using (exists (
    select 1 from public.meal_logs m
    where m.id = meal_log_id and m.user_id = auth.uid()
  ));

-- ========================== GOALS: meta de proteína ========================

alter table public.goals
  add column daily_protein_g integer;
