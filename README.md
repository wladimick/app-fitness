# DeFatFit v7 — Guía de implementación

Rama: `v7-supabase-modulos`

---

## ¿Qué trae esta versión?

La v7 convierte DeFatFit de un prototipo local a una app conectada a Supabase.

### Módulos nuevos o mejorados

| Módulo | Estado | Descripción |
|---|---|---|
| Perfil de usuario | ✅ Conectado | `profileService.js` reemplaza llamadas directas |
| Suscripciones / Trial | ✅ Conectado | `subscriptionService.js` + pantalla `suscripcion.js` |
| Pagos | 🔶 Preparado | `paymentService.js` listo; Edge Functions por configurar |
| Ejercicios y rutinas | ✅ Conectado | `exerciseService.js` reemplaza `data.js` local |
| Alimentación | ✅ Conectado | `nutritionService.js` reemplaza `localStorage` |
| Suplementos | ✅ Conectado | `supplementService.js` + pantalla `suplementos.js` |
| Body Pro / Métricas | ✅ Conectado | `bodyProService.js` + `perfil-fisico.js` actualizado |
| Calendario | ✅ Conectado | `calendario.js` usa `planificacion_dias` de Supabase |

---

## Paso 1: Aplicar el esquema SQL en Supabase

1. Abre tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor**
3. Pega el contenido de `defatfit_supabase_schema_v7.sql`
4. Ejecuta todo

> Este SQL es idempotente: usa `if not exists` y `on conflict` para no romper datos existentes.

### Hacer tu usuario admin

Después de ejecutar el SQL, en el mismo editor:

```sql
update public.perfiles
set rol = 'admin'
where lower(email) = lower('TU_CORREO@EMAIL.COM');
```

---

## Paso 2: Agregar los archivos de v7

### Estructura de archivos a agregar/reemplazar

```
js/
  services/
    profileService.js       ← NUEVO
    subscriptionService.js  ← NUEVO
    paymentService.js       ← NUEVO
    exerciseService.js      ← NUEVO
    nutritionService.js     ← NUEVO
    supplementService.js    ← NUEVO
    bodyProService.js       ← NUEVO

screens/
  suscripcion.js            ← NUEVO
  suplementos.js            ← NUEVO
  alimentacion.js           ← REEMPLAZA versión v6
  calendario.js             ← REEMPLAZA versión v6
  perfil-fisico.js          ← REEMPLAZA versión v6

css/
  v7-modules.css            ← NUEVO

supabase/
  edge-functions/
    crear-preferencia-mp/
      index.ts              ← NUEVO (deploy manual)

index-v7-changes.md         ← Lee esto para modificar index.html
```

---

## Paso 3: Modificar index.html

Lee `index-v7-changes.md` para ver exactamente qué agregar al `index.html` existente.

En resumen:
1. Agregar `<link href="css/v7-modules.css">` en el head
2. Agregar los 7 scripts de servicios antes de las screens
3. Agregar `<div id="screen-suscripcion">` y `<div id="screen-suplementos">` al body

---

## Paso 4: Migrar datos de ejercicios a Supabase

Los ejercicios actualmente están en `js/data.js`. Para migrarlos a la tabla `ejercicios`:

1. Ve a Supabase > Table Editor > `ejercicios`
2. Importa los ejercicios manualmente o usa el SQL de seed (ver más abajo)

### SQL de seed básico para ejercicios del perfil

```sql
-- Insertar ejercicios base del perfil de Wladimick
insert into public.ejercicios (nombre, grupo_muscular, categoria, nivel, es_publico, created_by)
values
  ('Fondos lastrados', 'Pecho / Tríceps', 'pecho', 'avanzado', true, null),
  ('Dominadas supinas', 'Espalda / Bíceps', 'espalda', 'avanzado', true, null),
  ('Press banca plano', 'Pecho', 'pecho', 'intermedio', true, null),
  ('Remo con mancuerna', 'Espalda', 'espalda', 'intermedio', true, null),
  ('Cruce de poleas', 'Pecho', 'pecho', 'principiante', true, null),
  ('Pullover con mancuerna', 'Espalda / Pecho', 'espalda', 'intermedio', true, null),
  ('Sentadilla libre', 'Cuádriceps', 'piernas', 'avanzado', true, null),
  ('Peso muerto rumano', 'Femoral / Glúteo', 'piernas', 'intermedio', true, null),
  ('Prensa', 'Cuádriceps', 'piernas', 'principiante', true, null),
  ('Extensión de cuádriceps', 'Cuádriceps', 'piernas', 'principiante', true, null),
  ('Curl femoral', 'Femoral', 'piernas', 'principiante', true, null),
  ('Dominadas neutras', 'Espalda / Bíceps', 'espalda', 'avanzado', true, null),
  ('Remo en T', 'Espalda', 'espalda', 'intermedio', true, null),
  ('Press inclinado mancuernas', 'Pecho', 'pecho', 'intermedio', true, null),
  ('Elevaciones laterales', 'Hombros', 'hombros', 'principiante', true, null),
  ('Curl bíceps', 'Bíceps', 'brazos', 'principiante', true, null),
  ('Face pull', 'Hombro posterior', 'hombros', 'principiante', true, null),
  ('Tríceps en polea', 'Tríceps', 'brazos', 'principiante', true, null),
  ('Abdominales colgado', 'Abdomen', 'abdomen', 'intermedio', true, null),
  ('Plancha', 'Core', 'abdomen', 'principiante', true, null);
```

### SQL de seed para rutinas base

```sql
-- Insertar rutinas template
insert into public.rutinas (nombre, grupo_principal, duracion_minutos, nivel, es_template, activo, created_by)
values
  ('Torso A — Fuerza estética', 'pecho/espalda', 70, 'avanzado', true, true, null),
  ('Pierna — Sentadilla y base fuerte', 'piernas', 65, 'avanzado', true, true, null),
  ('Torso B — Tirón y espalda', 'espalda', 65, 'avanzado', true, true, null),
  ('Torso C — Hipertrofia y brazos', 'pecho/espalda/brazos', 60, 'avanzado', true, true, null);
```

---

## Paso 5: Configurar pagos reales (opcional para MVP)

Para el MVP, el botón "Simular pago" ya funciona sin configuración adicional.

Para conectar Mercado Pago real:

1. Instala Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Deploy la Edge Function:
   ```bash
   supabase functions deploy crear-preferencia-mp --project-ref TU_PROJECT_REF
   ```
4. Agrega los secrets en Supabase > Settings > Edge Functions:
   ```
   MP_ACCESS_TOKEN = tu_access_token_de_produccion
   MP_NOTIFICATION_URL = https://TU_REF.supabase.co/functions/v1/mp-webhook
   ```

---

## Flujo de acceso con suscripción

```
Usuario inicia sesión
    ↓
auth.js verifica sesión
    ↓
profileService.obtenerPerfil()
    ↓
subscriptionService.obtenerSuscripcionActual()
    ↓
¿Tiene acceso? → SÍ → Dashboard normal
              → NO  → Pantalla de suscripción
```

---

## Seguridad: qué nunca debe ir en el frontend

| ❌ Nunca en frontend | ✅ Va en Edge Functions / backend |
|---|---|
| `MP_ACCESS_TOKEN` de Mercado Pago | `Deno.env.get("MP_ACCESS_TOKEN")` |
| `PAYPAL_CLIENT_SECRET` | Variables de entorno de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo en Edge Functions o servidor |

El frontend solo usa `SUPABASE_URL` y `SUPABASE_ANON_KEY`, que son seguros de exponer.

---

## RLS: cómo funciona

Cada tabla tiene Row Level Security configurado:
- El usuario solo ve **sus propios datos**.
- El admin ve **todos los datos**.
- Los catálogos (`ejercicios`, `planes_suscripcion`, `suplementos`) son visibles para todos los autenticados.

---

## Notas de desarrollo

- Los servicios JS usan el patrón IIFE (módulo auto-ejecutado) sin dependencias externas.
- El `window.supabase` debe estar disponible antes que los servicios. El orden de carga en `index.html` lo garantiza.
- El `window.currentUser` debe setearse en `auth.js` al hacer login.
- Los servicios son defensivos: retornan `null` o `[]` en vez de lanzar errores, para no romper la UI.
