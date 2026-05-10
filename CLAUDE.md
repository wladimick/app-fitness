# DeFatFit — Contexto de proyecto para Claude

## Descripción

**DeFatFit** es una PWA (Progressive Web App) personal de fitness y seguimiento físico. El lema es "Tu guía de vida fitness". Está diseñada exclusivamente para móvil (portrait), desplegada en Netlify, con Supabase como backend.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla (sin frameworks) |
| Backend / Auth / DB | Supabase (JS SDK v2 vía CDN) |
| Deploy | Netlify |
| PWA | Service Worker (`sw.js`) + `manifest.json` |
| Fuentes | Bebas Neue (display), DM Sans (body), JetBrains Mono (mono) |

**Sin bundlers, sin npm, sin React, sin TypeScript.** Todo el código corre directamente en el navegador.

---

## Arquitectura

### SPA manual

`index.html` es el único punto de entrada. Contiene el HTML de todas las pantallas. El router (`js/router.js`) activa/desactiva clases `.active` en los `div.screen` según la navegación — no hay cambios de URL.

### Orden de carga de scripts (el orden importa)

```
js/supabase.js   → cliente global window.db
js/utils.js      → funciones de utilidad compartidas
js/data.js       → ejerciciosDB, rutinasBase, medidasCorporales, calendarioDias
js/tips.js       → tips de salud diarios
js/router.js     → goScreen(), openSidebar(), closeSidebar()
js/auth.js       → initAuth(), handleLogin(), handleRegistro(), logout()

screens/onboarding.js     → obSiguiente(), obAnterior(), obSeleccionarOpcion()
screens/inicio.js         → initDashboard()
screens/alimentacion.js   → initAlimentacion(), alimentacionGuardar()
screens/rutina.js         → initRutina(), completarRutina(), toggleEditMode()
screens/calendario.js     → initCalendario()
screens/perfil-fisico.js  → abrirNuevaMedicion()
screens/recomendar.js     → generarRec(), usarRutinaHoy()
screens/perfil-usuario.js → initUsuario(), guardarPerfil()
screens/admin.js          → initAdmin()
```

### Estado global (en `window`)

```js
window.db              // cliente Supabase
window.currentUser     // usuario autenticado (Supabase Auth)
window.currentProfile  // perfil del usuario desde la tabla profiles
window._rutinaHoy      // rutina cargada en memoria para el día actual
window._checkAdmin     // fn que muestra/oculta la sección admin en el sidebar
```

### Persistencia local

- `defatfit_perfil_v3` — perfil del usuario en localStorage (fallback si no hay internet)
- `defatfit_rutina_v3` — rutina del día en localStorage

### CSS en 3 capas

- `css/base.css` — variables CSS, reset, tipografía, animaciones globales
- `css/layout.css` — pantallas, topbar, sidebar, bottom nav, modales
- `css/components.css` — botones, tarjetas, ejercicios, badges, formularios, stats

---

## Pantallas

| ID de screen | Archivo | Descripción |
|---|---|---|
| `screen-login` | inline en index.html | Login y registro de cuenta |
| `screen-onboarding` | `screens/onboarding.js` | 5 pasos: nombre/peso, nivel, objetivo, frecuencia, confirmación |
| `screen-inicio` | `screens/inicio.js` | Dashboard: rutina del día, stats, alimentación, tip, acceso rápido |
| `screen-alimentacion` | `screens/alimentacion.js` | Tracker de porciones y agua (meta: 11 vasos) |
| `screen-calendario` | inline en index.html | Vista semanal y mensual del plan, con estados por día |
| `screen-rutina` | `screens/rutina.js` | Rutina del día: ejercicios, modo edición, timer de descanso |
| `screen-perfil` | inline en index.html (`initPerfil`) | Body Pro: métricas físicas, historial, gráficas de composición corporal |
| `screen-recomendar` | inline en index.html | Generador de rutinas por músculo y nivel |
| `screen-usuario` | `screens/perfil-usuario.js` | Perfil personal, marcas, distribución semanal |
| `screen-admin` | `screens/admin.js` | Panel admin (solo usuarios con `rol === 'admin'`) |

### Navegación

- **Bottom nav** (5 tabs): Inicio · Calendario · Rutina · Progreso · Perfil
- **Sidebar** (hamburger): Principal, Próximamente, Admin (condicional), footer con logout
- `screen-alimentacion` no tiene tab propio — se accede desde inicio y su tab activo queda en Inicio

### Modales (bottom sheets)

| ID | Trigger | Contenido |
|---|---|---|
| `modal-cal` | tap en día del calendario | Detalle del día: rutina, estado, ejercicios preview |
| `modal-edit-ej` | tap en ejercicio en modo edición | Editar nombre, grupo, series, reps, peso, descanso, nota |
| `modal-add-ej` | botón "Agregar ejercicio" | Buscar en DB o crear ejercicio nuevo |
| `modal-edit-perfil` | botón editar en pantalla usuario | Editar nombre, peso, frecuencia, nivel, objetivo |

### Pantallas en roadmap (aún no implementadas)

- **Explorador de cuerpo** — Sprint 2
- **Biblioteca de ejercicios** — Sprint 2
- **Logros y rachas** — Sprint 2
- **Comunidad del gym** — Sprint 3

---

## Usuario base: Wladimick Díaz

El usuario primario y dueño del proyecto. La app está construida a su medida.

| Atributo | Valor |
|---|---|
| Nombre | Wladimick Díaz |
| Nivel | Intermedio (1-3 años, base sólida) |
| Frecuencia | 4 días/semana |
| Objetivo principal | Fuerza estética + hipertrofia |
| Peso de referencia | ~78.4 kg (última medición Body Pro) |

### Distribución semanal de Wladimick

| Día | Rutina | Clave |
|---|---|---|
| Lunes | Torso A — Fuerza Estética | `torsoA` |
| Martes | Piernas — Sentadilla y Base Fuerte | `piernas` |
| Miércoles | Descanso | — |
| Jueves | Torso B — Tirón, Amplitud y Espalda | `torsoB` |
| Viernes / Sábado | Torso C — Remate, Hipertrofia y Brazos | `torsoC` |
| Domingo | Descanso | — |

### Rutinas base (`data.js → rutinasBase`)

**torsoA** (70 min, 7 ejercicios): Fondos lastrados · Dominadas supinas · Press banca · Remo mancuerna · Cruce poleas · Pullover · Abdominales  
**piernas** (65 min, 7 ejercicios): Sentadilla libre · Peso muerto rumano · Prensa · Extensión cuádriceps · Curl femoral · Gemelos · Core  
**torsoB** (65 min, 7 ejercicios): Dominadas neutras · Remo en T · Press inclinado · Remo polea · Elevaciones laterales · Curl bíceps · Face pull  
**torsoC** (60 min, 8 ejercicios): Fondos · Dominadas · Press máquina · Remo T prono · Aperturas máquina · Tríceps polea · Bíceps máquina · Abdominales

### Marcas personales de referencia

| Ejercicio | Referencia |
|---|---|
| Sentadilla libre | 100-130 kg |
| Press banca plano | 75-85 kg |
| Fondos lastrados | +15 a +25 kg |
| Peso muerto rumano | 80 kg |
| Extensión cuádriceps | 70-77 kg |
| Curl femoral | hasta 70 kg |
| Dominadas | peso corporal o con lastre |

### Sistema Plan B

Cada ejercicio en `ejerciciosDB` y `rutinasBase` incluye un campo `planB` con alternativa sin máquinas o con equipo reducido. Respetar siempre esta convención al agregar ejercicios nuevos.

---

## Design system

### Paleta de colores

```css
--bg:      #0a0a0c   /* fondo principal, casi negro */
--bg2:     #111116   /* fondo secundario */
--bg3:     #1a1a22   /* fondo terciario */
--card:    #16161e   /* tarjetas */
--border:  rgba(255,255,255,0.07)
--accent:  #c8f135   /* lima — color principal de acción */
--accent2: #00e5ff   /* cyan — color secundario */
--red:     #ff4757
--orange:  #ff8c42
--purple:  #a78bfa
--text:    #f0f0f5
--muted:   #6b6b80
--muted2:  #3a3a50
```

### Tipografía

```css
--font-d: 'Bebas Neue'     /* títulos grandes, nombres de pantalla */
--font-b: 'DM Sans'        /* texto de cuerpo, labels, botones */
--font-m: 'JetBrains Mono' /* valores numéricos, stats, badges */
```

### Tokens de layout

```css
--nav-h:    68px   /* altura del bottom nav */
--r:        14px   /* border-radius estándar */
--r2:       20px   /* border-radius tarjetas grandes */
--sidebar-w: 280px /* ancho del sidebar */
```

### Componentes principales

- **`btn-primary`** — fondo `--accent` (lima), texto oscuro, pill shape
- **`btn-secondary`** — borde sutil, fondo transparente
- **`btn-ghost`** — sin fondo ni borde, solo texto
- **`card`** — fondo `--card`, border `--border`, border-radius `--r`
- **`card-accent`** — card con borde lima sutil, para resultados destacados
- **`badge`** — pill pequeño; variantes: `badge-green`, `badge-blue`, `badge-gray`, `badge-red`, `badge-orange`
- **`bottom-sheet`** — modal que sube desde abajo con `sheet-handle`
- **`prog-wrap` + `prog-bar`** — barra de progreso
- **`stat-mini`** — tarjeta de estadística pequeña (valor + label)
- **`metric-card`** — tarjeta Body Pro con valor, unidad y comparación

### Estados del calendario

| Estado | Badge | Color |
|---|---|---|
| `completado` | badge-green | rgba(200,241,53,.3) |
| `pendiente` | badge-blue | rgba(0,229,255,.2) |
| `descanso` | badge-gray | --bg3 |
| `perdido` | badge-red | rgba(255,71,87,.2) |

---

## Reglas de diseño mobile-first

1. **Solo portrait.** El manifest fuerza `"orientation": "portrait"`. No diseñar para landscape.
2. **Touch targets mínimo 44px de alto.** Todos los botones e ítems interactivos deben ser fáciles de tocar con el dedo.
3. **Bottom sheet en lugar de modal centrado.** Los overlays usan `slideUp` desde abajo, nunca popup centrado.
4. **Bottom nav fijo.** La navegación principal vive en la parte inferior, nunca en la parte superior.
5. **Scroll vertical natural.** No usar scroll horizontal dentro de pantallas. Excepción: carruseles explícitos.
6. **Sin hover states como única indicación.** El estado activo/seleccionado debe ser visible sin hover.
7. **Texto legible sin zoom.** Font size mínimo 12px para texto secundario, 14px para cuerpo. `maximum-scale=1` en viewport para prevenir zoom no deseado.
8. **Fondo oscuro siempre.** La app es dark-only, no hay modo claro. No agregar toggle de tema.
9. **Feedback inmediato.** Toda acción del usuario muestra respuesta visual: toast, cambio de estado, animación.
10. **Performance sobre estética.** No agregar librerías externas sin justificación fuerte. El bundle actual es 0 dependencias de npm.

---

## Convenciones de código

- **Funciones de inicialización de pantalla** se llaman `initNombrePantalla()` y se exponen en `window`. El router las llama con `window.initX?.()`.
- **Funciones de pantalla** van en el archivo `screens/nombre.js` correspondiente. No mezclar lógica de pantallas en `index.html` salvo que sea imprescindible (hay deuda técnica de Sprint 1 en este punto).
- **Variables de estado de sesión** van en `window.*`. No usar módulos ES ni `import/export`.
- **No usar `id` duplicados.** Los IDs de elementos HTML son únicos en todo `index.html`.
- **`showToast(msg)`** para feedback al usuario (definida en utils.js).
- **`formatFecha(fecha)`** para formatear fechas (definida en utils.js).
- **`getIniciales(nombre)`** para avatares (definida en utils.js).
- Al agregar ejercicios a `ejerciciosDB` o `rutinasBase`, incluir siempre el campo `planB`.

---

## Supabase

- **URL:** `https://ddjpeyewnoewylokagun.supabase.co`
- **Cliente global:** `window.db`
- **Auth:** Supabase Auth (email + password). Usuario autenticado en `window.currentUser`.
- **Tabla clave:** `profiles` — contiene nombre, nivel, objetivo, frecuencia, peso, rol, etc.
- **Rol admin:** `currentProfile.rol === 'admin'` activa la sección admin en sidebar y la pantalla `screen-admin`.

---

## Deploy

- **Netlify** con headers de seguridad definidos en `netlify.toml`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `sw.js` sin caché (`no-cache`) para actualizaciones inmediatas del Service Worker
