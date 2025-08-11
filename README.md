# Agenda Citas Públicas – Documentación básica (MVP)

> **Objetivo:** Monitorear disponibilidad de citas en portales públicos (solo con consulta pública) y avisar por email/Telegram cuando aparezcan cupos. Stack centrado en **Next.js + Node.js** (deploy en **Vercel**) y **PostgreSQL** (en **Neon**), con despliegue rápido y costos cero/low.

---

## 1) Alcance del MVP

- 2–3 fuentes públicas (ej.: servicio A, servicio B) con disponibilidad visible sin login.
- Vigilancia por **servicio/ciudad** (watchlists) y alertas por **email/Telegram**.
- Dashboard con historial básico y gráfico simple de “aperturas por hora/día (últimos 7 días)”.
- Respeto de Términos/robots.txt y **rate limit** suave.

**Fuera de alcance MVP:** Captcha bypass, scraping autenticado, WhatsApp oficial, UI compleja de multi-roles.

---

## 2) Stack tecnológico (decisiones base)

### Frontend

- **Next.js 14 (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes)
- **Recharts** (gráficos sencillos)
- **NextAuth** (Email OTP / Magic link)

### Backend (dentro de Next)

- **Route Handlers** en `/app/api/*` (Runtime Node.js)
- **Node 20** en Vercel
- **Schema** y **ORM**: **Prisma**
- **Validación**: **zod**
- **Rate limiting**: **upstash/ratelimit** + **Upstash Redis**

### Scraping / Fuentes de datos

- **Prioridad**: endpoints JSON públicos o HTML simple.
- Librerías:
  - **node-fetch** / **undici** para requests
  - **cheerio** para HTML parsing
- **Evitar** browser headless en Vercel para MVP (si es imprescindible, se movería a un worker externo más adelante).

### Jobs / Scheduler

- **Vercel Cron Jobs** llamando endpoints internos (cada 5–10 min, con jitter)
- Deduplicación y locks con **Upstash Redis** (evita solapamientos)

### Cache / Cola ligera

- **Upstash Redis** (free tier):
  - Cache de últimas respuestas por fuente
  - Llave de deduplicación de alertas
  - Pequeña cola FIFO (opcional) para distribuir chequeos

### Base de datos

- **PostgreSQL (Neon)**
- **Prisma Migrate** para versionado de esquema

### Notificaciones

- **Email**: **Resend** (o SMTP)
- **Telegram Bot**: API oficial de Telegram

### Observabilidad

- **Logging**: consola + **Vercel Observability**
- **Alertas internas**: opcional a Telegram (canal de admin)

### Seguridad

- **.env** en Vercel y local
- **RLS** a nivel app (no Supabase; control con API + sesiones NextAuth)
- **Helmet-like** headers via Next middleware
- **CORS** cerrado (solo frontend propio)

---

## 3) Estructura de repos (monorepo opcional; aquí single repo Next)

```
agenda-cupos/
  app/
    (marketing)/
    dashboard/
    api/
      auth/
        route.ts          # NextAuth
      services/route.ts   # GET lista servicios
      watchlist/route.ts  # GET/POST watchlists
      slots/history/route.ts  # GET historial para gráficos
      cron/
        check/route.ts    # endpoint invocado por Vercel Cron
      telegram/
        webhook/route.ts  # recibe chat_id de usuario
  components/
  lib/
    db.ts                 # Prisma client
    redis.ts              # Upstash Redis client
    rate.ts               # rate limiter helpers
    alerts.ts             # telegram/email senders
    scraping/
      base.ts             # tipo base de scraper + contratos
      serviceA.ts         # scraper de ejemplo (HTML simple)
      serviceB.ts
    auth.ts               # NextAuth config
    utils.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  public/
  styles/
  .env.example
  package.json
  vercel.json
  README.md
```

---

## 4) Variables de entorno (.env)

```
# DB
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Redis / Upstash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Auth (NextAuth)
NEXTAUTH_URL="https://tu-dominio.vercel.app"
NEXTAUTH_SECRET="..."

# Email (Resend)
RESEND_API_KEY="..."
EMAIL_FROM="notificaciones@tudominio.com"

# Telegram
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_BOT_WEBHOOK_SECRET="random-secret"

# App
APP_BASE_URL="https://tu-dominio.vercel.app"
```

---

## 5) Esquema de datos (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SlotStatus {
  available
  full
}

enum Channel {
  email
  telegram
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  telegramChat  String?
  createdAt     DateTime @default(now())
  watchlists    Watchlist[]
  alerts        Alert[]
}

model Service {
  id         String   @id @default(cuid())
  name       String
  slug       String   @unique
  country    String
  city       String?
  sourceUrl  String
  isActive   Boolean  @default(true)
  locations  Location[]
  snapshots  SlotSnapshot[]
}

model Location {
  id         String   @id @default(cuid())
  serviceId  String
  name       String
  service    Service  @relation(fields: [serviceId], references: [id])
  snapshots  SlotSnapshot[]
  watchlists Watchlist[]
}

model Watchlist {
  id          String    @id @default(cuid())
  userId      String
  serviceId   String
  locationId  String?
  queryParams Json?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
  service     Service   @relation(fields: [serviceId], references: [id])
  location    Location? @relation(fields: [locationId], references: [id])
  alerts      Alert[]
}

model SlotSnapshot {
  id         String     @id @default(cuid())
  serviceId  String
  locationId String?
  date       DateTime
  time       String?
  capacity   Int?
  status     SlotStatus
  fetchedAt  DateTime   @default(now())
  service    Service    @relation(fields: [serviceId], references: [id])
  location   Location?  @relation(fields: [locationId], references: [id])
}

model Alert {
  id          String     @id @default(cuid())
  userId      String
  watchlistId String
  snapshotId  String
  channel     Channel
  sentAt      DateTime   @default(now())
  user        User       @relation(fields: [userId], references: [id])
  watchlist   Watchlist  @relation(fields: [watchlistId], references: [id])
  snapshot    SlotSnapshot @relation(fields: [snapshotId], references: [id])
}
```

---

## 6) Contrato de scraper (TypeScript)

```ts
// lib/scraping/base.ts
export type Slot = {
  date: string;      // ISO date (YYYY-MM-DD)
  time?: string;     // HH:mm
  capacity?: number;
  status: 'available' | 'full';
  meta?: Record<string, unknown>;
};

export interface Scraper {
  name: string;
  baseUrl: string;
  ratePerMin?: number; // default 2
  fetch: (args: { locationId?: string; params?: Record<string, string> }) => Promise<Slot[]>;
}
```

**Ejemplo HTML simple con fetch + cheerio:**

```ts
import * as cheerio from 'cheerio';
import { Scraper, Slot } from './base';

export const ServiceAScraper: Scraper = {
  name: 'service_a',
  baseUrl: 'https://ejemplo.gov/agenda',
  ratePerMin: 2,
  async fetch({ locationId }) {
    const url = `${this.baseUrl}?sede=${encodeURIComponent(locationId ?? '')}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AgendaCuposBot/1.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const slots: Slot[] = [];
    $('table#cal tbody tr').each((_, tr) => {
      const day = $(tr).find('td.day').text().trim();
      const status = $(tr).find('td.status').text().includes('Disponible') ? 'available' : 'full';
      if (day) slots.push({ date: day, status });
    });
    return slots;
  }
};
```

---

## 7) Endpoints API (Route Handlers)

- `GET /api/services` → lista de servicios/ciudades.
- `POST /api/watchlist` → crear vigilancia (valida con zod).
- `GET /api/watchlist` → mis vigilancias.
- `GET /api/slots/history?service=…&location=…&days=7` → historial para gráficos.
- `POST /api/telegram/webhook` → vincula `chat_id` a usuario.
- `POST /api/cron/check` → recorrido de Watchlists + scraping + persistencia + notificaciones (llamado por Vercel Cron).

**Notas:**

- Proteger `/api/cron/check` con un **token de cron** (header).
- Idempotencia: deduplicación de alertas por `snapshotId:userId:channel` en Redis.

---

## 8) Flujo de chequeo (cron)

1. Cron (cada 5–10 min) → `POST /api/cron/check`.
2. Carga Watchlists activas y agrupa por servicio/ubicación.
3. Para cada grupo: aplica rate limit y llama `scraper.fetch`.
4. Convierte `Slot[]` a `SlotSnapshot` y compara con último estado persistido.
5. Si hay **nuevo disponible** → crea `Alert` + envía por canales configurados.
6. Cachea respuesta cruda por 5–10 min (Redis) y loguea métricas.

---

## 9) Scripts útiles (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 10) Despliegue rápido (Vercel + Neon + Upstash)

1. **Crear Neon DB** → copia la `DATABASE_URL`.
2. **Crear proyecto Vercel** → importar repo Git.
3. Añadir **Environment Variables**: `DATABASE_URL`, `NEXTAUTH_*`, `RESEND_*`, `UPSTASH_*`, `TELEGRAM_*`, `APP_BASE_URL`.
4. `vercel.json` (Node runtime y rutas protegidas si aplica):

```json
{
  "functions": {
    "app/api/**/route.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

5. Ejecutar **Prisma Migrate** desde un deploy o con Railway CLI local apuntando a Neon:
   - Local: `npx prisma migrate deploy`
6. Configurar **Vercel Cron** (Project → Settings → Cron Jobs) para `POST /api/cron/check` cada 10 min.
7. Crear **Resend domain** (o SMTP), **Upstash Redis** y **Telegram Bot**.

---

## 11) UI mínima (páginas)

- `/` Landing (pitch + CTA “Probar gratis”).
- `/dashboard` Mis vigilancias + botón “Nueva vigilancia”.
- `/dashboard/[service]` Gráfico (últimos 7 días), tabla de detecciones, switch activar/pausar.
- `/onboarding/telegram` Conectar bot.

---

## 12) Roadmap inmediato (post-MVP)

- Exportar a **Google Calendar** (ics + deep link).
- Filtros por hora/día y tipo de trámite.
- Email resumen diario con métricas.
- Página pública por servicio con gráfico embebible.
- Mover scraping “pesado” a **worker** (Railway/Fly) si aparece una fuente con JS complejo.

---

## 13) Buenas prácticas legales y técnicas

- Respetar `robots.txt` y términos de uso.
- Evitar consultas agresivas y agregar **exponencial backoff**.
- No almacenar PII innecesaria; sólo email y `telegramChat`.
- Incluir **User-Agent** identificable y página de contacto.

---

## 14) Licencia y apertura

- Licencia recomendada: **MIT** o **AGPL** (si quieres que mejoras permanezcan abiertas).
- Añadir `CONTRIBUTING.md` y etiquetas `good first issue` en GitHub para ganar tracción.

---

## 15) Próximo paso

- Elegir **dos servicios públicos** específicos para la primera integración (idealmente con HTML/simple JSON).
- Crear repo, añadir este README y comenzar por `prisma/schema.prisma` + `/api/services` + `/api/watchlist`.

