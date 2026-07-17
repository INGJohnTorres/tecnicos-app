# App de Visitas y Comisiones FTTH — completa (Fases 0 a 5)

App para que 3 técnicos FTTH carguen sus visitas diarias desde el
celular, y vean en tiempo real su productividad estimada según la
tabla oficial de comisión de la empresa.

## Qué incluye

- **Login** con 4 cuentas fijas (admin + 3 técnicos), sin auto-registro.
  Cambio de clave obligatorio en el primer ingreso.
- **Carga de visitas** (técnico): un formulario diario, no retroactivo.
- **"Mi ciclo"**: puntos acumulados, productividad estimada, cuánto
  falta para el siguiente tramo de comisión.
- **Panel admin**: ver los 3 técnicos del ciclo actual, y cargar una
  visita a nombre de alguien (con fecha libre, para cubrir olvidos —
  queda registrado que lo cargó el admin). También puede **ver, editar
  y eliminar registros puntuales** de cualquier técnico dentro del
  ciclo actual.
- **Gestión de usuarios** (`/admin/usuarios`): crear técnicos nuevos,
  y **desactivar** (no "eliminar de verdad" — ver nota abajo) a los
  que ya no correspondan.
- **Notificación push diaria a las 8pm** (hora Colombia) a los
  técnicos que todavía no cargaron el día — gratis, sin WhatsApp,
  vía Web Push (funciona en Android).
- Ciclo de facturación 19→18 y todas las fechas calculadas en **hora
  de Bogotá** (no UTC — ver nota abajo, es importante).

## Requisitos

- Node.js 18+
- Una base de datos Postgres (gratis en [Neon](https://neon.tech) o
  [Supabase](https://supabase.com))
- Para las notificaciones (Fase 5): una cuenta en
  [Vercel](https://vercel.com) (el plan gratuito alcanza para el cron
  diario y para alojar la app)

## Instalación paso a paso

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
```

Editá `.env` y completá:

- `DATABASE_URL`: la cadena de conexión de Neon/Supabase.
- `JWT_SECRET`: cualquier texto largo y random (o `openssl rand -base64 32`).
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`: generalas con:
  ```bash
  npx web-push generate-vapid-keys
  ```
  Te da dos claves — la "Public Key" va en `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  la "Private Key" en `VAPID_PRIVATE_KEY`.
- `CRON_SECRET`: otro texto random (protege el endpoint del recordatorio
  diario para que nadie más pueda dispararlo).

```bash
# 3. Crear las tablas
npx prisma migrate dev --name init

# 4. Cargar la tabla de comisión + las 4 cuentas iniciales
npm run db:seed

# 5. Levantar el proyecto
npm run dev
```

## Cómo probar cada fase

1. Abrí `http://localhost:3000` — te redirige a `/login`.
2. Entrá con `admin` / `CAMBIAR_ESTA_CLAVE_ADMIN` (o `tecnico1` /
   `CAMBIAR_CLAVE_1`, etc. — ver `prisma/seed.ts` para los 4 usuarios).
3. Te va a pedir cambiar la clave — es esperado, es el primer ingreso.
4. Como técnico: entrá a "Cargar visitas de hoy", cargá un número de
   cada tipo, guardá, y andá a "Mi ciclo" — tiene que mostrarte los
   puntos y la productividad estimada.
5. Como admin: vas a ver los 3 técnicos y sus puntos del ciclo actual,
   y podés cargar una visita a nombre de cualquiera con fecha libre.
6. Notificaciones: en "Mi ciclo" (como técnico), tocá "Activar
   recordatorio diario" desde el celular (Android, Chrome). El
   navegador te va a pedir permiso — aceptalo. Esto **no se puede
   probar bien desde una laptop**, hacelo desde el celular real.

## Antes de usarlo con los técnicos reales

1. En `prisma/seed.ts`, cambiá `tecnico1`, `tecnico2`, `tecnico3` por
   algo que cada uno recuerde (su nombre en minúsculas, por ejemplo), y
   las claves por unas reales. Volvé a correr `npm run db:seed`.
2. Asegurate de que cada técnico **instale la app en su celular**
   (Chrome → menú → "Agregar a la pantalla de inicio") y acepte el
   permiso de notificaciones la primera vez que se lo pida — si no, el
   recordatorio de las 8pm no le va a llegar.

## Nota importante sobre zonas horarias

Colombia está en UTC-5 todo el año. Los servidores donde vas a desplegar
esto (Vercel, etc.) corren en UTC. Si el código comparara fechas
"crudas" del servidor, entre las 7pm y la medianoche hora Colombia el
sistema pensaría que ya es "mañana" — justo la ventana más importante,
porque ahí es cuando cierra el ciclo. Por eso **todo el cálculo de
"qué día es hoy" pasa por `src/lib/ciclo.ts` (`ahoraEnBogota`,
`hoyBogota`, `hoyBogotaISO`)**, que ajusta explícitamente a hora
Colombia sin importar en qué zona horaria esté el servidor. Si en algún
momento agregás código nuevo que necesite "la fecha de hoy", usá esas
funciones — no `new Date()` directo.

## Desplegar en producción

1. Subí el proyecto a un repositorio de GitHub.
2. Conectalo en [Vercel](https://vercel.com) (detecta Next.js solo).
3. En la configuración del proyecto en Vercel, cargá las mismas
   variables de entorno del `.env` (incluyendo `CRON_SECRET` — Vercel
   se encarga de mandarlo automático al cron).
4. El archivo `vercel.json` ya tiene configurado el cron diario a las
   8pm hora Colombia (`0 1 * * *` en UTC) — no hay que tocar nada.
5. Base de datos: la misma de Neon/Supabase que usaste en desarrollo,
   o creá una nueva para producción y corré `npx prisma migrate deploy`
   + `npm run db:seed` contra ella antes de usarla con los técnicos.

## Estructura del proyecto

```
prisma/
  schema.prisma              # Usuario, Registro, TablaComisionFTTH, PushSubscription
  seed.ts                     # Carga tabla de comisión + 4 cuentas iniciales
  data/tabla_comision_ftth.csv

src/
  lib/
    config.ts        # 76/66 puntos, día 19 de corte del ciclo
    ciclo.ts          # TODO el manejo de fechas en hora Bogotá
    comision.ts       # Lookup de comisión (validado con datos reales)
    registros.ts      # Reglas de negocio: un registro por día, no retroactivo
    auth.ts           # Sesión (Node runtime)
    auth-edge.ts       # Verificación de sesión para el middleware (Edge runtime)
    webpush.ts         # Envío de notificaciones push
    prisma.ts

  middleware.ts        # Protege rutas: sin sesión → /login; /admin solo ADMIN

  app/
    login/page.tsx
    cambiar-clave/page.tsx
    registrar/page.tsx           # Carga de visitas (técnico)
    mi-ciclo/page.tsx             # Puntos, productividad estimada, historial
    admin/page.tsx                # Panel: los 3 técnicos del ciclo actual
    admin/cargar/                 # Cargar visita a nombre de un técnico
    api/auth/{login,logout,cambiar-clave}/route.ts
    api/registros/route.ts
    api/comision/route.ts         # Endpoint de prueba del cálculo
    api/push/subscribe/route.ts
    api/cron/recordatorio/route.ts  # Corre a las 8pm vía Vercel Cron

public/
  manifest.json, sw.js, icon-192.png, icon-512.png   # PWA + push
```

## Qué queda fuera a propósito

Calidad, ausentismo y bonos siguen siendo manejados por la empresa
aparte (como ya se acordó) — esta app solo calcula la productividad
**estimada** a partir de las visitas cargadas. El disclaimer de "esto
es un estimado" aparece en la pantalla "Mi ciclo" a propósito, para
que nadie confunda este número con el de nómina.

## Por qué "desactivar" en vez de "eliminar" usuarios

Cada visita queda atada al técnico que la hizo (para poder calcular su
historial de puntos). Borrar la fila del usuario de verdad, con una
base de datos relacional, hace una de dos cosas: la rechaza (porque
hay visitas que dependen de ese usuario), o si se fuerza, borra
también todo su historial de comisiones — grave en un sistema que
existe justamente para llevar ese historial. Por eso `/admin/usuarios`
solo permite desactivar (el técnico no puede entrar más, desaparece de
las listas activas) y reactivar — nunca un borrado real.
