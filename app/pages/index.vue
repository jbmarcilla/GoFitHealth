<script setup lang="ts">
const user = useSupabaseUser()

watch(user, (u) => {
  if (u) navigateTo('/dashboard')
}, { immediate: true })

useSeoMeta({
  title: 'GoFit Health — Contador de calorías con IA gratis',
  description: 'Registra comidas, peso, agua y ejercicio hablando con tu IA. Déficit calórico automático, densidad calórica educativa y macronutrientes. Sin dietas extremas.',
  ogTitle: 'GoFit Health — Tu IA ya puede ser tu entrenador',
  ogDescription: 'Cuéntale lo que comes y cuánto pesas. GoFit calcula tu déficit calórico, te enseña densidad calórica y te acompaña a sentirte mejor. Gratis.',
  ogImage: 'https://gofit.health/og-image.png',
  ogType: 'website',
  ogLocale: 'es_PE',
  ogSiteName: 'GoFit Health',
  twitterCard: 'summary_large_image',
  twitterTitle: 'GoFit Health — Contador de calorías con IA',
  twitterDescription: 'Registra comidas hablando con tu IA. Déficit calórico automático y densidad calórica educativa. Gratis.',
  twitterImage: 'https://gofit.health/og-image.png',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://gofit.health/' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            'name': 'GoFit Health',
            'url': 'https://gofit.health',
            'description': 'Contador de calorías con inteligencia artificial. Registra comidas, peso, agua y ejercicio hablando con tu entrenador IA.',
            'inLanguage': 'es',
          },
          {
            '@type': 'SoftwareApplication',
            'name': 'GoFit Health',
            'applicationCategory': 'HealthApplication',
            'operatingSystem': 'Web',
            'url': 'https://gofit.health',
            'description': 'App gratuita de seguimiento de calorías, peso y ejercicio con inteligencia artificial. Funciona con Claude y ChatGPT.',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD',
            },
            'featureList': [
              'Contador de calorías por voz y texto',
              'Déficit calórico automático (Mifflin-St Jeor)',
              'Densidad calórica educativa (semáforo)',
              'Registro de peso diario con gráficos',
              'Seguimiento de agua y ejercicio',
              'Macronutrientes y micronutrientes',
              'Entrenador IA personalizable',
            ],
          },
          {
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': '¿Qué es un déficit calórico y cómo me ayuda a bajar de peso?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'Un déficit calórico significa consumir menos calorías de las que tu cuerpo gasta. GoFit calcula tu déficit automáticamente con la fórmula Mifflin-St Jeor, usando tu peso, estatura, edad, sexo y nivel de actividad. El déficit es gradual: empieza en 500 kcal y baja a 150 kcal conforme te acercas a tu meta, para que sea sostenible.' },
              },
              {
                '@type': 'Question',
                'name': '¿Cuántas calorías debo comer al día para perder peso?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'Depende de tu cuerpo. GoFit calcula tu máximo diario automáticamente con cada pesada. Por ejemplo, un hombre de 85 kg, 180 cm y 30 años con actividad ligera tiene un TDEE de ~2,300 kcal. Con un déficit de 500 kcal, su meta sería ~1,800 kcal/día. Tu IA te lo explica con tus números reales.' },
              },
              {
                '@type': 'Question',
                'name': '¿Cómo registro mis comidas sin pesar cada alimento?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'Le dices a tu IA lo que comiste como hablas: "un puño de arroz con pollo y ensalada". GoFit usa porciones de referencia (puño, palma, taza) para estimar gramos y calorías. No necesitas balanza ni escanear códigos de barras.' },
              },
              {
                '@type': 'Question',
                'name': '¿Qué es la densidad calórica y por qué importa?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'La densidad calórica es cuántas calorías tiene un alimento por gramo. GoFit usa un semáforo: verde (<1 kcal/g, como frutas y verduras — come libre), amarillo (1–2.5 kcal/g, como arroz y pollo — cuida la porción) y rojo (>2.5 kcal/g, como frutos secos y aceite — porción pequeña). Ningún color es "malo": te enseña a elegir la porción correcta.' },
              },
              {
                '@type': 'Question',
                'name': '¿Es malo comer alimentos de alta densidad calórica?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'No. En GoFit ningún alimento es "malo". Los alimentos rojos (alta densidad) como frutos secos, aceite de oliva o chocolate aportan nutrientes valiosos. El semáforo te enseña que esos alimentos llenan menos por la misma cantidad de calorías, así que la porción es más pequeña. Es información, no juicio.' },
              },
              {
                '@type': 'Question',
                'name': '¿Cuánta agua debo tomar al día?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'La recomendación general es 8 vasos (2 litros) al día, pero varía según tu peso y actividad. GoFit registra tu consumo de agua y tu entrenador IA te recuerda cuánto te falta durante el día.' },
              },
              {
                '@type': 'Question',
                'name': '¿Cada cuánto debo pesarme para ver resultados reales?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'Idealmente a diario, en ayunas y con la menor ropa posible. El peso varía día a día (agua, digestión), pero GoFit te muestra la tendencia semanal para que veas el progreso real sin frustrarte por fluctuaciones normales.' },
              },
              {
                '@type': 'Question',
                'name': '¿Cómo sé si estoy comiendo suficiente proteína?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'GoFit calcula tu meta de proteína según tu peso y objetivo: 1.6 g/kg si buscas masa muscular o estás en déficit, 1.2 g/kg para mantenimiento. Tu dashboard muestra cuánta proteína llevas hoy y tu IA te sugiere alimentos ricos en proteína accesibles en tu zona.' },
              },
              {
                '@type': 'Question',
                'name': '¿El ejercicio cuenta para mi déficit calórico?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'Sí. GoFit resta las calorías quemadas por ejercicio de tu consumo del día. Si tu meta es 1,800 kcal y quemaste 300 en ejercicio, puedes comer hasta 2,100 kcal y seguir en déficit. Tu IA registra el ejercicio con duración y tipo.' },
              },
              {
                '@type': 'Question',
                'name': '¿GoFit funciona con Claude y ChatGPT?',
                'acceptedAnswer': { '@type': 'Answer', 'text': 'Sí. GoFit se conecta como herramienta MCP a Claude (Anthropic) y como App a ChatGPT (OpenAI). Usas el chat que ya tienes — no necesitas descargar otra app. Tu entrenador IA registra todo y te muestra tu progreso en gofit.health.' },
              },
            ],
          },
        ],
      }),
    },
  ],
})

const chat = [
  { from: 'user', text: 'Hoy peso 78.2' },
  { from: 'coach', text: 'Bien ahí 🙌 Bajaste 0.4 kg esta semana. Vas a tu ritmo, sin prisa.' },
  { from: 'user', text: 'Almorcé un puño de arroz con pollo y ensalada' },
  { from: 'coach', text: 'Registrado: 540 kcal. Buen plato, con proteína y verdura. Te faltan 3 vasos de agua 💧' },
]

const before = [
  'Descargar otra app y llenar formularios',
  'Pesar cada gramo de comida',
  'Buscar en listas infinitas de alimentos',
  'Sentir culpa cuando te sales del plan',
  'Dejarlo a las dos semanas',
]

const after = [
  'Usas el chat que ya tienes: Claude o ChatGPT',
  '"Un puño de arroz" es suficiente',
  'Lo cuentas como hablas, y listo',
  'Tu entrenador te anima, no te juzga',
  'Cada noche, un resumen que te mantiene',
]

const steps = [
  { title: 'Entra con Google', text: 'Pon tu peso de hoy y el peso al que quieres llegar.' },
  { title: 'Conecta tu IA', text: 'Pega una URL en Claude o ChatGPT. Toma un minuto.' },
  { title: 'Conversa', text: 'Cuéntale tu día. Él registra, calcula y te acompaña.' },
]

const trainers = [
  { emoji: '🙌', name: 'Motivador', line: '¡Eso! Ya son 4 días seguidos registrando.' },
  { emoji: '🧐', name: 'Estricto', line: 'Ayer no registraste la cena. Hoy sin excusas.' },
  { emoji: '😎', name: 'Relajado', line: 'Tranqui, un mal día no borra la semana.' },
  { emoji: '🪖', name: 'Militar', line: '¡A la balanza! ¡Constancia, soldado!' },
]

const features = [
  { icon: '🔥', title: 'Déficit calórico automático', text: 'Se calcula con tu peso, estatura, edad y actividad. Se ajusta con cada pesada.' },
  { icon: '🚦', title: 'Densidad calórica educativa', text: 'Semáforo verde/amarillo/rojo en cada comida. Aprende a elegir la porción correcta.' },
  { icon: '📊', title: 'Macros y micronutrientes', text: 'Proteína, carbohidratos, grasa, fibra, vitaminas y minerales — todo automático.' },
  { icon: '💧', title: 'Agua y ejercicio', text: 'Registra cuánto tomas y cuánto te mueves. Tu IA te recuerda lo que falta.' },
  { icon: '📈', title: 'Gráficos de progreso', text: 'Peso semanal, calorías diarias, objetivos cumplidos con checks visuales.' },
  { icon: '🤖', title: 'Funciona con tu IA', text: 'Claude o ChatGPT. Sin app nueva, sin formularios, sin códigos de barras.' },
]

const faqs = [
  {
    q: '¿Qué es un déficit calórico y cómo me ayuda a bajar de peso?',
    a: 'Un déficit calórico significa consumir menos calorías de las que tu cuerpo gasta. GoFit calcula tu déficit automáticamente con la fórmula Mifflin-St Jeor, usando tu peso, estatura, edad, sexo y nivel de actividad. El déficit es gradual: empieza en 500 kcal y baja a 150 kcal conforme te acercas a tu meta.',
  },
  {
    q: '¿Cuántas calorías debo comer al día para perder peso?',
    a: 'Depende de tu cuerpo. GoFit calcula tu máximo diario automáticamente con cada pesada. Por ejemplo, un hombre de 85 kg, 180 cm y 30 años con actividad ligera tendría una meta de ~1,800 kcal/día. Tu IA te lo explica con tus números reales.',
  },
  {
    q: '¿Cómo registro mis comidas sin pesar cada alimento?',
    a: 'Le dices a tu IA lo que comiste como hablas: "un puño de arroz con pollo y ensalada". GoFit usa porciones de referencia (puño, palma, taza) para estimar gramos y calorías. No necesitas balanza.',
  },
  {
    q: '¿Qué es la densidad calórica y por qué importa?',
    a: 'Es cuántas calorías tiene un alimento por gramo. Verde (<1 kcal/g): frutas y verduras, come libre. Amarillo (1–2.5 kcal/g): arroz y pollo, cuida la porción. Rojo (>2.5 kcal/g): frutos secos y aceite, porción pequeña. Ningún color es "malo".',
  },
  {
    q: '¿Es malo comer alimentos de alta densidad calórica?',
    a: 'No. En GoFit ningún alimento es "malo". Los alimentos rojos como frutos secos o aceite de oliva aportan nutrientes valiosos. El semáforo te enseña que la porción es más pequeña. Es información, no juicio.',
  },
  {
    q: '¿Cuánta agua debo tomar al día?',
    a: 'La recomendación general es 8 vasos (2 litros), pero varía según tu peso y actividad. GoFit registra tu consumo y tu entrenador IA te recuerda cuánto te falta.',
  },
  {
    q: '¿Cada cuánto debo pesarme?',
    a: 'Idealmente a diario, en ayunas. El peso varía día a día, pero GoFit te muestra la tendencia semanal para que veas el progreso real sin frustrarte por fluctuaciones normales.',
  },
  {
    q: '¿Cómo sé si estoy comiendo suficiente proteína?',
    a: 'GoFit calcula tu meta: 1.6 g/kg si buscas masa muscular o estás en déficit, 1.2 g/kg para mantenimiento. Tu dashboard muestra cuánta llevas hoy.',
  },
  {
    q: '¿El ejercicio cuenta para mi déficit calórico?',
    a: 'Sí. GoFit resta las calorías quemadas. Si tu meta es 1,800 kcal y quemaste 300, puedes comer hasta 2,100 kcal y seguir en déficit.',
  },
  {
    q: '¿GoFit funciona con Claude y ChatGPT?',
    a: 'Sí. Se conecta como herramienta MCP a Claude y como App a ChatGPT. Usas el chat que ya tienes — no necesitas descargar nada.',
  },
]

const openFaq = ref<number | null>(null)
function toggleFaq(i: number) {
  openFaq.value = openFaq.value === i ? null : i
}
</script>

<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-20">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Funciona con Claude y ChatGPT
        </p>
        <h1 class="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-gray-900 md:text-[3.25rem]">
          Contador de calorías<br>
          <span class="text-emerald-600">con inteligencia artificial</span> 💪
        </h1>
        <p class="mt-5 max-w-md text-lg leading-relaxed text-gray-500">
          Cuéntale lo que comes, cuánto pesas y cómo te mueves. GoFit calcula tu <strong>déficit calórico</strong>, te enseña <strong>densidad calórica</strong> y te acompaña a bajar de peso — sin dietas extremas y sin culpa.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Empezar gratis <span aria-hidden="true">→</span>
          </NuxtLink>
          <a
            href="#como-funciona"
            class="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cómo funciona
          </a>
        </div>
      </div>

      <div class="relative mx-auto w-full max-w-sm md:max-w-none">
        <img
          src="/hero.jpg"
          alt="Mujer estirando con los brazos arriba en un parque, representando un estilo de vida saludable con seguimiento fitness"
          width="1100"
          height="1375"
          class="aspect-[4/5] w-full rounded-3xl object-cover object-[center_40%]"
          loading="eager"
        />

        <div class="absolute left-3 top-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur md:left-4 md:top-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Agua</p>
          <p class="mt-0.5 text-base font-semibold text-gray-900 tabular-nums">💧 5<span class="font-normal text-gray-400">/8 vasos</span></p>
        </div>

        <div class="absolute right-3 top-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur md:right-4 md:top-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Hoy</p>
          <p class="mt-0.5 text-base font-semibold text-gray-900 tabular-nums">🍽️ 1,240<span class="font-normal text-gray-400"> / 2,000 kcal</span></p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div class="h-full w-[62%] rounded-full bg-emerald-500" />
          </div>
        </div>

        <div class="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur md:bottom-4 md:left-4 md:right-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Densidad calórica</p>
          <div class="mt-2 grid grid-cols-3 gap-1.5 text-xs font-medium">
            <div class="flex items-center gap-1.5 rounded-lg bg-green-50 px-2 py-1.5 text-green-800"><span class="h-2 w-2 shrink-0 rounded-full bg-green-500" />Ensalada</div>
            <div class="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-2 py-1.5 text-yellow-800"><span class="h-2 w-2 shrink-0 rounded-full bg-yellow-400" />Arroz</div>
            <div class="flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1.5 text-red-800"><span class="h-2 w-2 shrink-0 rounded-full bg-red-500" />Palta</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Manifiesto -->
    <section class="border-y border-gray-100 bg-emerald-50/40">
      <div class="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 class="text-2xl font-medium leading-snug tracking-tight text-gray-900 md:text-3xl">
          Tu cuerpo no es un problema que arreglar.<br class="hidden md:block"> <span class="text-gray-500">Es el lugar donde vives. Cuídalo con cariño.</span>
        </h2>
        <p class="mt-6 text-sm text-gray-500">
          En GoFit ningún alimento es "malo" y ningún día está perdido. Solo un poco mejor que ayer.
        </p>
      </div>
    </section>

    <!-- Qué incluye -->
    <section class="mx-auto max-w-5xl px-4 py-24">
      <h2 class="text-center text-3xl font-semibold tracking-tight text-gray-900">Todo lo que necesitas para cuidar tu salud</h2>
      <p class="mx-auto mt-3 max-w-2xl text-center text-gray-500">Registro de comidas, peso, agua, ejercicio, macronutrientes y más — todo desde tu chat con IA.</p>
      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="f in features" :key="f.title" class="rounded-2xl border border-gray-200 p-6">
          <span class="text-2xl">{{ f.icon }}</span>
          <h3 class="mt-3 text-lg font-semibold text-gray-900">{{ f.title }}</h3>
          <p class="mt-1 text-sm leading-relaxed text-gray-500">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <!-- Antes / Con GoFit -->
    <section class="bg-gray-50/70">
      <div class="mx-auto max-w-5xl px-4 py-24">
        <h2 class="text-center text-3xl font-semibold tracking-tight text-gray-900">Cuidarte no debería ser otro trabajo</h2>
        <div class="mt-12 grid gap-4 md:grid-cols-2">
          <div class="rounded-2xl border border-gray-200 bg-white p-7">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Antes</p>
            <ul class="mt-5 space-y-3.5">
              <li v-for="b in before" :key="b" class="flex gap-3 text-gray-500">
                <span class="mt-0.5 text-gray-300">✕</span>
                <span class="line-through decoration-gray-300">{{ b }}</span>
              </li>
            </ul>
          </div>
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-7">
            <p class="text-xs font-medium uppercase tracking-wider text-emerald-700">Con GoFit</p>
            <ul class="mt-5 space-y-3.5">
              <li v-for="a in after" :key="a" class="flex gap-3 text-gray-800">
                <span class="mt-0.5 text-emerald-600">✓</span>
                <span>{{ a }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Elige tu entrenador -->
    <section class="mx-auto max-w-5xl px-4 py-24">
      <div class="max-w-xl">
        <h2 class="text-3xl font-semibold tracking-tight text-gray-900">Tú eliges cómo te habla</h2>
        <p class="mt-3 text-gray-500">Tu entrenador tiene la personalidad que necesitas. Puedes escribirla a tu manera.</p>
      </div>
      <div class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="t in trainers" :key="t.name" class="rounded-2xl border border-gray-200 bg-white p-5">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ t.emoji }}</span>
            <span class="font-medium text-gray-900">{{ t.name }}</span>
          </div>
          <p class="mt-3 text-sm leading-relaxed text-gray-500">"{{ t.line }}"</p>
        </div>
      </div>
    </section>

    <!-- Cómo funciona -->
    <section id="como-funciona" class="bg-gray-50/70">
      <div class="mx-auto max-w-5xl px-4 py-24">
        <h2 class="text-3xl font-semibold tracking-tight text-gray-900">Empiezas en 3 minutos</h2>
        <ol class="mt-10 grid gap-8 md:grid-cols-3">
          <li v-for="(s, i) in steps" :key="s.title" class="border-t border-gray-300 pt-5">
            <span class="text-sm font-semibold text-emerald-600 tabular-nums">0{{ i + 1 }}</span>
            <h3 class="mt-2 text-lg font-semibold text-gray-900">{{ s.title }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-gray-500">{{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Ejemplo de conversación -->
    <section class="mx-auto max-w-5xl px-4 py-24">
      <h2 class="text-3xl font-semibold tracking-tight text-gray-900">Así se ve en la práctica</h2>
      <p class="mt-3 text-gray-500">Registrar tu día es tan fácil como mandar un mensaje.</p>
      <div class="mt-10 mx-auto max-w-lg space-y-3">
        <div v-for="m in chat" :key="m.text" :class="[
          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
          m.from === 'user'
            ? 'ml-auto max-w-[80%] bg-gray-900 text-white'
            : 'mr-auto max-w-[80%] border border-gray-200 text-gray-700'
        ]">
          {{ m.text }}
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="bg-gray-50/70">
      <div class="mx-auto max-w-3xl px-4 py-24">
        <h2 class="text-center text-3xl font-semibold tracking-tight text-gray-900">Preguntas frecuentes</h2>
        <p class="mx-auto mt-3 max-w-lg text-center text-gray-500">Todo lo que necesitas saber sobre el registro de calorías, déficit calórico y densidad calórica.</p>
        <div class="mt-12 divide-y divide-gray-200">
          <div v-for="(faq, i) in faqs" :key="i" class="py-5">
            <button
              class="flex w-full items-start justify-between gap-4 text-left"
              @click="toggleFaq(i)"
            >
              <h3 class="text-base font-medium text-gray-900">{{ faq.q }}</h3>
              <span class="mt-0.5 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-45': openFaq === i }">+</span>
            </button>
            <p v-show="openFaq === i" class="mt-3 text-sm leading-relaxed text-gray-500">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-4 py-24">
      <div class="mx-auto max-w-5xl rounded-3xl bg-gray-900 px-8 py-14 text-center md:px-16">
        <h2 class="text-3xl font-semibold tracking-tight text-white">Empieza hoy, como estés hoy.</h2>
        <p class="mx-auto mt-3 max-w-md text-gray-400">Gratis. Sin app nueva. Tu entrenador IA te espera en el chat.</p>
        <NuxtLink
          to="/login"
          class="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-400"
        >
          Crear cuenta gratis <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
