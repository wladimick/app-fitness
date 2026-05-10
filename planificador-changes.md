# Cambios en index.html para el Planificador

## 1. CSS — agregar en el <head>

```html
<link href="css/planificador.css" rel="stylesheet">
```

## 2. Script — agregar después de los otros screens

```html
<script src="screens/planificador.js" defer></script>
```

## 3. Div de pantalla — agregar al body

```html
<!-- ═══════════════════════════════════
     PLANIFICADOR SEMANAL
═══════════════════════════════════ -->
<div id="screen-planificador" class="screen"></div>
```

## 4. Botón en la barra de navegación inferior

Busca el nav inferior y agrega el botón del planificador.
Se recomienda reemplazar o complementar el botón de Calendario:

```html
<button class="nav-item" data-screen="planificador" onclick="navegarA('planificador')">
  <div class="nav-icon">📅</div>
  <span>Planificar</span>
</button>
```

## 5. En el router (js/router.js) — registrar la pantalla

Busca donde se definen las rutas y agrega:

```javascript
'planificador': {
  screenId: 'screen-planificador',
  render: () => renderPlanificador()
}
```

## 6. En el inicio (screens/inicio.js) — acceso rápido al planificador

Agrega un botón en el dashboard para ir directo a planificar
la próxima semana:

```javascript
// En la sección de accesos rápidos del inicio:
`<button class="acceso-rapido" onclick="navegarA('planificador')">
  <span>📅</span>
  <span>Planificar semana</span>
</button>`
```
