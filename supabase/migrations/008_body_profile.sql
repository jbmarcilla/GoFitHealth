-- Datos corporales para estimar el gasto energético (Mifflin-St Jeor).
alter table public.profiles
  add column height_cm      numeric(5,1),
  add column birth_year     integer check (birth_year between 1900 and 2100),
  add column sex            text check (sex in ('male', 'female')),
  add column activity_level text not null default 'light'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active'));
