-- ============================================================================
-- GoFit Health — Seed data
-- Alimentos comunes (enfoque peruano/latino), ejercicios y porciones
-- ============================================================================

-- ========================== FOODS ===========================================

insert into public.foods (name, brand, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g, serving_reference, food_category, verified) values
  ('Arroz blanco cocido',     null, 130.0, 2.7, 28.2, 0.3, 0.4, '1 taza = 200g', 'grains', true),
  ('Pollo pechuga a la plancha', null, 165.0, 31.0, 0.0, 3.6, 0.0, '1 palma = 100g', 'protein', true),
  ('Leche entera',            null, 61.0, 3.2, 4.8, 3.3, 0.0, '1 taza = 240ml', 'dairy', true),
  ('Pan francés',             null, 289.0, 9.0, 56.0, 2.5, 2.7, '1 unidad = 35g', 'grains', true),
  ('Plátano (banana)',        null, 89.0, 1.1, 22.8, 0.3, 2.6, '1 unidad = 120g', 'fruits', true),
  ('Papa cocida',             null, 87.0, 1.9, 20.1, 0.1, 1.8, '1 puño = 150g', 'vegetables', true),
  ('Lentejas cocidas',        null, 116.0, 9.0, 20.1, 0.4, 7.9, '1 taza = 200g', 'grains', true),
  ('Huevo cocido',            null, 155.0, 12.6, 1.1, 10.6, 0.0, '1 unidad = 50g', 'protein', true),
  ('Atún en lata (en agua)',  null, 116.0, 25.5, 0.0, 0.8, 0.0, '1 lata = 170g', 'protein', true),
  ('Palta (aguacate)',        null, 160.0, 2.0, 8.5, 14.7, 6.7, '1/2 unidad = 70g', 'fruits', true),
  ('Quinua cocida',           null, 120.0, 4.4, 21.3, 1.9, 2.8, '1 taza = 185g', 'grains', true),
  ('Camote cocido',           null, 90.0, 2.0, 20.7, 0.1, 3.0, '1 puño = 130g', 'vegetables', true),
  ('Tomate',                  null, 18.0, 0.9, 3.9, 0.2, 1.2, '1 unidad = 125g', 'vegetables', true),
  ('Cebolla',                 null, 40.0, 1.1, 9.3, 0.1, 1.7, '1 unidad = 110g', 'vegetables', true),
  ('Ajo',                     null, 149.0, 6.4, 33.1, 0.5, 2.1, '1 diente = 3g', 'vegetables', true),
  ('Aceite de oliva',         null, 884.0, 0.0, 0.0, 100.0, 0.0, '1 cucharada = 15ml', 'fats', true),
  ('Azúcar blanca',           null, 387.0, 0.0, 100.0, 0.0, 0.0, '1 cucharada = 12g', 'other', true),
  ('Mantequilla',             null, 717.0, 0.9, 0.1, 81.1, 0.0, '1 cucharada = 14g', 'fats', true),
  ('Chocolate con leche',     null, 535.0, 7.6, 59.4, 29.7, 3.4, '1 barra = 40g', 'snacks', true),
  ('Almendras',               null, 579.0, 21.2, 21.6, 49.9, 12.5, '1 mano = 30g', 'nuts', true)
on conflict do nothing;

-- ========================== EXERCISES =======================================

insert into public.exercises (name, category, calories_per_hour, met_value) values
  ('Correr (8 km/h)',        'cardio',      600, 8.0),
  ('Caminar (5 km/h)',       'cardio',      280, 3.5),
  ('Nadar (moderado)',       'cardio',      500, 6.0),
  ('Ciclismo (moderado)',    'cardio',      480, 6.0),
  ('Pesas (moderado)',       'strength',    360, 4.5),
  ('Yoga',                   'flexibility', 200, 2.5),
  ('Fútbol',                 'sports',      500, 7.0),
  ('Básquet',                'sports',      480, 6.5),
  ('Saltar cuerda',          'cardio',      700, 10.0),
  ('Flexiones',              'strength',    350, 4.0),
  ('Sentadillas',            'strength',    400, 5.0),
  ('Plancha (isométrico)',   'strength',    250, 3.0),
  ('Baile (moderado)',       'cardio',      400, 5.0),
  ('Boxeo (saco)',           'cardio',      550, 7.0),
  ('HIIT',                   'cardio',      700, 9.0)
on conflict do nothing;

-- ========================== PORTION REFERENCES ==============================

insert into public.portion_references (food_category, portion_type, grams_equivalent, description, verified) values
  ('grains',     'puno',      90.0,  'Un puño cerrado de granos cocidos (arroz, pasta)',  true),
  ('grains',     'taza',      200.0, 'Una taza de granos cocidos',                        true),
  ('vegetables', 'puno',      80.0,  'Un puño de verduras (brócoli, zanahoria)',           true),
  ('vegetables', 'taza',      150.0, 'Una taza de verduras picadas',                       true),
  ('fruits',     'puno',      120.0, 'Un puño de fruta (manzana, naranja)',                true),
  ('protein',    'palma',     100.0, 'Una palma de proteína (pollo, carne, pescado)',      true),
  ('cheese',     'palma',     30.0,  'Una palma de queso en lonchas',                      true),
  ('liquids',    'taza',      240.0, 'Una taza de líquido (leche, jugo, agua)',            true),
  ('nuts',       'mano',      30.0,  'Un puñado de frutos secos (almendras, maní)',        true),
  ('snacks',     'mano',      30.0,  'Un puñado de snacks (galletas, chips)',              true),
  ('fats',       'cucharada', 15.0,  'Una cucharada de grasa (aceite, mantequilla)',       true),
  ('sauces',     'cucharada', 15.0,  'Una cucharada de salsa (mayonesa, ketchup)',         true),
  ('protein',    'puno',      100.0, 'Un puño de proteína desmenuzada',                    true),
  ('dairy',      'taza',      240.0, 'Una taza de lácteo (leche, yogurt)',                 true)
on conflict do nothing;
