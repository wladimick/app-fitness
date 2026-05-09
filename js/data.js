// DeFatFit v3 — data.js
// Base de datos local: ejercicios, rutinas base, perfil default

const ejerciciosDB = {
  pecho: [
    { id:1,  nombre:'Press banca plano',         grupoMuscular:'Pecho',          series:4, repeticiones:'8-10',  pesoSugerido:'80kg',      descansoSegundos:90,  nota:'Escápulas retraídas, baja controlado',          planB:'Press con mancuernas en suelo o fondos' },
    { id:2,  nombre:'Press inclinado mancuernas', grupoMuscular:'Pecho superior', series:3, repeticiones:'10-12', pesoSugerido:'24kg c/u',  descansoSegundos:75,  nota:'Rango completo de movimiento',                  planB:'Push-up inclinado en banco' },
    { id:3,  nombre:'Aperturas en polea',         grupoMuscular:'Pecho interno',  series:3, repeticiones:'12-15', pesoSugerido:'15kg',      descansoSegundos:60,  nota:null,                                            planB:'Aperturas con mancuernas en banco plano' },
    { id:4,  nombre:'Fondos en paralelas',        grupoMuscular:'Pecho · Tríceps',series:3, repeticiones:'10-12', pesoSugerido:'Cuerpo',    descansoSegundos:75,  nota:'Ligera inclinación al frente para pecho',       planB:'Fondos en silla o push-up declinado' },
    { id:5,  nombre:'Press declinado barra',      grupoMuscular:'Pecho inferior', series:3, repeticiones:'8-10',  pesoSugerido:'70kg',      descansoSegundos:90,  nota:null,                                            planB:'Push-up declinado con pies en banco' },
  ],
  espalda: [
    { id:6,  nombre:'Dominadas supinas',          grupoMuscular:'Dorsal · Bíceps',     series:4, repeticiones:'6-8',   pesoSugerido:'Cuerpo',  descansoSegundos:90,  nota:'Activar dorsales al inicio del tirón',        planB:'Jalón al pecho en polea o remo con banda' },
    { id:7,  nombre:'Remo barra pronado',         grupoMuscular:'Dorsal · Trapecios',  series:4, repeticiones:'8-10',  pesoSugerido:'70kg',    descansoSegundos:90,  nota:'Espalda neutra, codos cerca del cuerpo',      planB:'Remo con mancuerna a una mano' },
    { id:8,  nombre:'Remo en T',                  grupoMuscular:'Dorsal · Romboides',  series:4, repeticiones:'8-12',  pesoSugerido:'60kg',    descansoSegundos:90,  nota:'Tirón fuerte, bajada controlada',              planB:'Remo horizontal con mancuernas en banco' },
    { id:9,  nombre:'Remo a una mano',            grupoMuscular:'Dorsal · Redondo',    series:3, repeticiones:'10-12', pesoSugerido:'28kg',    descansoSegundos:60,  nota:'No rotar la cadera',                           planB:'Remo con banda elástica a una mano' },
    { id:10, nombre:'Face pull en polea',         grupoMuscular:'Deltoides posterior', series:3, repeticiones:'15-20', pesoSugerido:'20kg',    descansoSegundos:60,  nota:'Excelente para postura',                       planB:'Pájaro inverso con mancuernas' },
  ],
  piernas: [
    { id:11, nombre:'Sentadilla libre',           grupoMuscular:'Cuádriceps · Glúteo', series:4, repeticiones:'8-10',  pesoSugerido:'90kg',    descansoSegundos:120, nota:'Profundidad paralela al suelo',                planB:'Sentadilla con mancuernas o goblet squat' },
    { id:12, nombre:'Prensa de piernas',          grupoMuscular:'Cuádriceps · Femoral',series:4, repeticiones:'10-12', pesoSugerido:'160kg',   descansoSegundos:90,  nota:'No bloquear rodillas al extender',             planB:'Zancadas con mancuernas o sentadilla búlgara' },
    { id:13, nombre:'Extensión de cuádriceps',    grupoMuscular:'Cuádriceps',          series:3, repeticiones:'12-15', pesoSugerido:'40kg',    descansoSegundos:60,  nota:null,                                           planB:'Sentadilla isométrica en pared' },
    { id:14, nombre:'Curl femoral acostado',      grupoMuscular:'Femoral',             series:3, repeticiones:'12-15', pesoSugerido:'35kg',    descansoSegundos:60,  nota:null,                                           planB:'Curl femoral de pie con banda elástica' },
    { id:15, nombre:'Peso muerto rumano',         grupoMuscular:'Femoral · Glúteo',    series:4, repeticiones:'10-12', pesoSugerido:'80kg',    descansoSegundos:90,  nota:'Espalda neutra, sentir estiramiento',          planB:'Peso muerto con mancuernas' },
    { id:16, nombre:'Zancadas con mancuernas',   grupoMuscular:'Cuádriceps · Glúteo', series:3, repeticiones:'12c/l', pesoSugerido:'18kg c/u',descansoSegundos:75,  nota:null,                                           planB:'Zancadas sin peso o split squat' },
  ],
  hombros: [
    { id:17, nombre:'Press militar barra',        grupoMuscular:'Deltoides anterior',  series:4, repeticiones:'8-10',  pesoSugerido:'50kg',    descansoSegundos:90,  nota:'Core activo durante todo el movimiento',       planB:'Press militar con mancuernas' },
    { id:18, nombre:'Elevaciones laterales',      grupoMuscular:'Deltoides lateral',   series:4, repeticiones:'12-15', pesoSugerido:'10kg',    descansoSegundos:60,  nota:'No balancear, control en la bajada',           planB:'Elevaciones con banda elástica' },
    { id:19, nombre:'Press Arnold',               grupoMuscular:'Deltoides completo',  series:3, repeticiones:'10-12', pesoSugerido:'18kg c/u',descansoSegundos:75,  nota:null,                                           planB:'Press mancuernas neutro sentado' },
    { id:20, nombre:'Pájaro con mancuernas',      grupoMuscular:'Deltoides posterior', series:3, repeticiones:'12-15', pesoSugerido:'8kg',     descansoSegundos:60,  nota:'Mantener espalda plana',                       planB:'Face pull con banda o reverse fly' },
  ],
  brazos: [
    { id:21, nombre:'Curl barra Scott',           grupoMuscular:'Bíceps',              series:4, repeticiones:'10-12', pesoSugerido:'35kg',    descansoSegundos:75,  nota:'Aislamiento puro de bíceps',                   planB:'Curl concentrado con mancuerna' },
    { id:22, nombre:'Curl martillo mancuernas',   grupoMuscular:'Bíceps · Braquial',   series:3, repeticiones:'10-12', pesoSugerido:'16kg',    descansoSegundos:60,  nota:null,                                           planB:'Curl martillo con banda elástica' },
    { id:23, nombre:'Press francés tumbado',      grupoMuscular:'Tríceps',             series:4, repeticiones:'10-12', pesoSugerido:'30kg',    descansoSegundos:75,  nota:'Codos fijos, no abrirlos',                     planB:'Extensión de tríceps con mancuerna sobre cabeza' },
    { id:24, nombre:'Extensión tríceps polea',    grupoMuscular:'Tríceps lateral',     series:3, repeticiones:'12-15', pesoSugerido:'22kg',    descansoSegundos:60,  nota:null,                                           planB:'Fondos en silla para tríceps' },
    { id:25, nombre:'Curl concentrado',           grupoMuscular:'Bíceps pico',         series:3, repeticiones:'12-15', pesoSugerido:'14kg',    descansoSegundos:60,  nota:null,                                           planB:'Curl predicador con mancuerna' },
  ],
  abdomen: [
    { id:26, nombre:'Plancha isométrica',         grupoMuscular:'Core completo',       series:3, repeticiones:'45seg', pesoSugerido:'Cuerpo',  descansoSegundos:60,  nota:'Cuerpo en línea recta',                        planB:'Plancha en rodillas si es muy difícil' },
    { id:27, nombre:'Crunch con polea',           grupoMuscular:'Recto abdominal',     series:3, repeticiones:'15-20', pesoSugerido:'20kg',    descansoSegundos:60,  nota:null,                                           planB:'Crunch clásico en suelo' },
    { id:28, nombre:'Rueda abdominal',            grupoMuscular:'Core · Recto',        series:3, repeticiones:'10-12', pesoSugerido:'Cuerpo',  descansoSegundos:75,  nota:'Avanzar solo lo que el core aguante',          planB:'Crunch en fitball o plancha' },
    { id:29, nombre:'Elevación de piernas colgado',grupoMuscular:'Abdominal inferior', series:3, repeticiones:'12-15', pesoSugerido:'Cuerpo',  descansoSegundos:60,  nota:null,                                           planB:'Elevación de piernas en suelo' },
    { id:30, nombre:'Oblicuos con mancuerna',     grupoMuscular:'Oblicuos',            series:3, repeticiones:'15c/l', pesoSugerido:'12kg',    descansoSegundos:60,  nota:null,                                           planB:'Plancha lateral' },
  ],
  full_body: [
    { id:31, nombre:'Sentadilla goblet',          grupoMuscular:'Cuádriceps · Core',   series:4, repeticiones:'12-15', pesoSugerido:'24kg',    descansoSegundos:75,  nota:'Mancuerna al pecho',                           planB:'Sentadilla con peso corporal' },
    { id:32, nombre:'Press militar mancuernas',   grupoMuscular:'Hombros · Tríceps',   series:3, repeticiones:'10-12', pesoSugerido:'18kg c/u',descansoSegundos:75,  nota:null,                                           planB:'Pike push-up o pino asistido' },
    { id:33, nombre:'Peso muerto rumano',         grupoMuscular:'Femoral · Glúteo',    series:4, repeticiones:'10-12', pesoSugerido:'70kg',    descansoSegundos:90,  nota:'Espalda neutra siempre',                       planB:'Buenos días con barra o mancuernas' },
    { id:34, nombre:'Remo en polea baja',         grupoMuscular:'Dorsal · Bíceps',     series:3, repeticiones:'10-12', pesoSugerido:'50kg',    descansoSegundos:75,  nota:null,                                           planB:'Remo invertido en barra' },
    { id:35, nombre:'Plancha con rotación',       grupoMuscular:'Core · Oblicuos',     series:3, repeticiones:'10c/l', pesoSugerido:'Cuerpo',  descansoSegundos:60,  nota:null,                                           planB:'Plancha estática' },
    { id:36, nombre:'Burpees',                    grupoMuscular:'Cuerpo completo',     series:3, repeticiones:'10-12', pesoSugerido:'Cuerpo',  descansoSegundos:75,  nota:'Ritmo controlado',                             planB:'Jumping jacks o mountain climbers' },
  ],
};

/* ── Rutinas base de Wladimick ── */
const rutinasBase = {
  torsoA: {
    nombre: 'Torso A — Fuerza Estética',
    grupoPrincipal: 'Pecho · Espalda · Empuje · Tracción',
    duracionMinutos: 70, nivel: 'Intermedio',
    ejercicios: [
      { id:101, nombre:'Fondos lastrados',                    grupoMuscular:'Pecho · Tríceps',          series:4, repeticiones:'6-10', pesoSugerido:'+15 a +25 kg', descansoSegundos:120, nota:'Ejercicio principal. Inclinación leve al frente.',        planB:'Fondos sin lastre o push-up',     completado:false },
      { id:102, nombre:'Dominadas supinas o neutras',         grupoMuscular:'Dorsal · Bíceps',          series:4, repeticiones:'6-8',  pesoSugerido:'Cuerpo o lastre', descansoSegundos:120, nota:'Activar dorsales desde el inicio del tirón.',          planB:'Jalón al pecho o remo con banda', completado:false },
      { id:103, nombre:'Press banca plano',                   grupoMuscular:'Pecho',                    series:4, repeticiones:'6-8',  pesoSugerido:'75-85 kg',     descansoSegundos:120, nota:'Escápulas retraídas. 1-2 reps en reserva.',             planB:'Press con mancuernas en banco',   completado:false },
      { id:104, nombre:'Remo con mancuerna',                  grupoMuscular:'Dorsal · Redondo',         series:4, repeticiones:'8-10c/l', pesoSugerido:'30 kg',     descansoSegundos:90,  nota:'No rotar la cadera. Codo cerca del cuerpo.',           planB:'Remo invertido en barra',         completado:false },
      { id:105, nombre:'Cruce de poleas o aperturas',         grupoMuscular:'Pecho interno',            series:3, repeticiones:'12-15',pesoSugerido:'15 kg',        descansoSegundos:60,  nota:null,                                                    planB:'Aperturas con mancuernas',        completado:false },
      { id:106, nombre:'Pullover con mancuerna o polea',      grupoMuscular:'Dorsal · Serrato',         series:3, repeticiones:'10-12',pesoSugerido:'20 kg',        descansoSegundos:60,  nota:'Excelente para amplitud de espalda.',                   planB:'Pull-over con banda elástica',    completado:false },
      { id:107, nombre:'Abdominales colgado o elevación',     grupoMuscular:'Core · Abdominal inferior',series:3, repeticiones:'10-15',pesoSugerido:'Cuerpo',       descansoSegundos:60,  nota:null,                                                    planB:'Crunch en suelo',                 completado:false },
    ]
  },
  piernas: {
    nombre: 'Piernas — Sentadilla y Base Fuerte',
    grupoPrincipal: 'Cuádriceps · Femoral · Glúteo',
    duracionMinutos: 65, nivel: 'Intermedio',
    ejercicios: [
      { id:201, nombre:'Sentadilla libre',          grupoMuscular:'Cuádriceps · Glúteo', series:4, repeticiones:'5-8',   pesoSugerido:'100-130 kg', descansoSegundos:150, nota:'Según estado del día. Profundidad paralela.',          planB:'Sentadilla con mancuernas',  completado:false },
      { id:202, nombre:'Peso muerto rumano',        grupoMuscular:'Femoral · Glúteo',    series:4, repeticiones:'8-12',  pesoSugerido:'80 kg',      descansoSegundos:120, nota:'Espalda neutra. Sentir estiramiento en femoral.',     planB:'Buenos días con barra',      completado:false },
      { id:203, nombre:'Prensa o péndulo',          grupoMuscular:'Cuádriceps · Femoral',series:3, repeticiones:'10-15', pesoSugerido:'160 kg',     descansoSegundos:90,  nota:'No bloquear rodillas al extender.',                   planB:'Zancadas o goblet squat',    completado:false },
      { id:204, nombre:'Extensión de cuádriceps',   grupoMuscular:'Cuádriceps',          series:3, repeticiones:'12-20', pesoSugerido:'70-77 kg',   descansoSegundos:75,  nota:'Marca de referencia: 70-77 kg.',                      planB:'Sentadilla isométrica pared', completado:false },
      { id:205, nombre:'Curl femoral',              grupoMuscular:'Femoral',             series:3, repeticiones:'12-15', pesoSugerido:'70 kg',      descansoSegundos:75,  nota:'Marca de referencia: hasta 70 kg.',                   planB:'Curl femoral con banda',     completado:false },
      { id:206, nombre:'Gemelos',                   grupoMuscular:'Gastrocnemio · Sóleo',series:3, repeticiones:'12-20', pesoSugerido:'Cuerpo',     descansoSegundos:60,  nota:null,                                                  planB:'Calf raises sin máquina',    completado:false },
      { id:207, nombre:'Core simple',               grupoMuscular:'Core',                series:3, repeticiones:'45seg', pesoSugerido:'Cuerpo',     descansoSegundos:60,  nota:'Plancha isométrica.',                                 planB:'Crunch clásico',             completado:false },
    ]
  },
  torsoB: {
    nombre: 'Torso B — Tirón, Amplitud y Espalda',
    grupoPrincipal: 'Espalda · Dorsales · Bíceps',
    duracionMinutos: 65, nivel: 'Intermedio',
    ejercicios: [
      { id:301, nombre:'Dominadas neutras',                   grupoMuscular:'Dorsal · Bíceps',          series:4, repeticiones:'6-10', pesoSugerido:'Cuerpo',    descansoSegundos:120, nota:'Priorizar técnica limpia. Progresión muscle-up.',      planB:'Jalón al pecho agarre neutro', completado:false },
      { id:302, nombre:'Remo en T',                           grupoMuscular:'Dorsal · Trapecios',       series:4, repeticiones:'8-12', pesoSugerido:'60-80 kg',  descansoSegundos:90,  nota:'Ejercicio favorito. Tirón fuerte y bajada controlada.',planB:'Remo con mancuernas en banco', completado:false },
      { id:303, nombre:'Press inclinado con mancuernas',      grupoMuscular:'Pecho superior',           series:4, repeticiones:'8-10', pesoSugerido:'24 kg c/u', descansoSegundos:90,  nota:'3-4 series según energía.',                           planB:'Push-up inclinado con banda', completado:false },
      { id:304, nombre:'Remo en polea o remo sentado',        grupoMuscular:'Dorsal · Romboides',       series:3, repeticiones:'10-12',pesoSugerido:'50 kg',     descansoSegundos:75,  nota:'Agarre neutro o prono.',                              planB:'Remo invertido en barra',     completado:false },
      { id:305, nombre:'Elevaciones laterales',               grupoMuscular:'Deltoides lateral',        series:3, repeticiones:'12-20',pesoSugerido:'10 kg',     descansoSegundos:60,  nota:'No balancear. Control en la bajada.',                 planB:'Elevaciones con banda',       completado:false },
      { id:306, nombre:'Curl bíceps en polea o mancuerna',    grupoMuscular:'Bíceps',                   series:3, repeticiones:'10-15',pesoSugerido:'14-16 kg',  descansoSegundos:60,  nota:null,                                                  planB:'Curl con banda elástica',     completado:false },
      { id:307, nombre:'Face pull o posterior de hombro',     grupoMuscular:'Deltoides posterior',      series:3, repeticiones:'12-20',pesoSugerido:'20 kg',     descansoSegundos:60,  nota:'Excelente para postura y salud del hombro.',          planB:'Pájaro inverso con mancuernas',completado:false },
    ]
  },
  torsoC: {
    nombre: 'Torso C — Remate, Hipertrofia y Brazos',
    grupoPrincipal: 'Torso completo · Brazos · Bombeo',
    duracionMinutos: 60, nivel: 'Intermedio',
    ejercicios: [
      { id:401, nombre:'Fondos sin lastre o controlados',     grupoMuscular:'Pecho · Tríceps',   series:4, repeticiones:'8-15', pesoSugerido:'Cuerpo',    descansoSegundos:90,  nota:'3-4 series. Versión de remate.',             planB:'Push-up declinado',           completado:false },
      { id:402, nombre:'Dominadas neutras sin peso',          grupoMuscular:'Dorsal · Bíceps',   series:4, repeticiones:'6-12', pesoSugerido:'Cuerpo',    descansoSegundos:105, nota:'Agarre cerrado si está disponible.',         planB:'Jalón al pecho en polea',     completado:false },
      { id:403, nombre:'Press en máquina o convergente',      grupoMuscular:'Pecho',             series:3, repeticiones:'8-12', pesoSugerido:'Máquina',   descansoSegundos:90,  nota:null,                                         planB:'Press con mancuernas',        completado:false },
      { id:404, nombre:'Remo en T con agarre prono',          grupoMuscular:'Dorsal · Trapecios',series:3, repeticiones:'8-12', pesoSugerido:'50-60 kg',  descansoSegundos:90,  nota:null,                                         planB:'Remo con mancuerna una mano', completado:false },
      { id:405, nombre:'Aperturas en máquina',                grupoMuscular:'Pecho interno',     series:3, repeticiones:'12-15',pesoSugerido:'Máquina',   descansoSegundos:60,  nota:null,                                         planB:'Aperturas con mancuernas',    completado:false },
      { id:406, nombre:'Tríceps en polea',                    grupoMuscular:'Tríceps lateral',   series:3, repeticiones:'10-15',pesoSugerido:'22 kg',     descansoSegundos:60,  nota:null,                                         planB:'Fondos en silla tríceps',     completado:false },
      { id:407, nombre:'Bíceps en máquina o mancuerna',       grupoMuscular:'Bíceps',            series:3, repeticiones:'10-15',pesoSugerido:'14 kg',     descansoSegundos:60,  nota:null,                                         planB:'Curl con banda elástica',     completado:false },
      { id:408, nombre:'Abdominales',                         grupoMuscular:'Core · Recto abdominal',series:3,repeticiones:'10-20',pesoSugerido:'Cuerpo', descansoSegundos:60,  nota:null,                                         planB:'Plancha isométrica',          completado:false },
    ]
  }
};

/* ── Perfil default (localStorage fallback) ── */
const perfilDefault = {
  nombre: '',
  peso: 0,
  nivel: 'principiante',
  enfoque: '',
  objetivo: '',
  frecuencia: 4,
  tipo: 'Fuerza',
  prioridad: 'Torso',
  racha: 0,
  preferencias: [],
  marcas: []
};

const LS_PERFIL = 'defatfit_perfil_v3';
const LS_RUTINA = 'defatfit_rutina_v3';

function cargarPerfilLocal() {
  try { const p = localStorage.getItem(LS_PERFIL); if (p) return JSON.parse(p); } catch(e) {}
  return { ...perfilDefault };
}

function savePerfilLocal(p) {
  try { localStorage.setItem(LS_PERFIL, JSON.stringify(p)); } catch(e) {}
}

function defaultRutina() {
  const r = rutinasBase.torsoA;
  return { ...r, ejercicios: r.ejercicios.map(e => ({ ...e, completado: false })) };
}

function cargarRutinaLocal() {
  try { const r = localStorage.getItem(LS_RUTINA); if (r) return JSON.parse(r); } catch(e) {}
  return defaultRutina();
}

function saveRutinaLocal(r) {
  try { localStorage.setItem(LS_RUTINA, JSON.stringify(r)); } catch(e) {}
}

// Mediciones simuladas
const medidasCorporales = [
  { id:1, fecha:'15 May', peso:78.4, grasaCorporal:18.2, masaMuscular:38.5, aguaCorporal:58.3, grasaVisceral:9,  imc:24.1, metabolismoBasal:1840, edadCorporal:32 },
  { id:2, fecha:'01 May', peso:79.6, grasaCorporal:19.1, masaMuscular:37.8, aguaCorporal:57.1, grasaVisceral:10, imc:24.5, metabolismoBasal:1820, edadCorporal:33 },
  { id:3, fecha:'15 Abr', peso:81.2, grasaCorporal:20.4, masaMuscular:37.0, aguaCorporal:56.2, grasaVisceral:11, imc:25.0, metabolismoBasal:1800, edadCorporal:34 },
  { id:4, fecha:'01 Abr', peso:82.0, grasaCorporal:21.0, masaMuscular:36.5, aguaCorporal:55.8, grasaVisceral:11, imc:25.2, metabolismoBasal:1790, edadCorporal:35 },
];

// Calendario simulado
const calendarioDias = [
  { fecha:'2026-05-01', estado:'completado', resumen:'Torso A' },
  { fecha:'2026-05-02', estado:'completado', resumen:'Piernas' },
  { fecha:'2026-05-03', estado:'descanso',   resumen:'Descanso' },
  { fecha:'2026-05-04', estado:'perdido',    resumen:'Torso B (no realizado)' },
  { fecha:'2026-05-05', estado:'completado', resumen:'Torso C' },
  { fecha:'2026-05-06', estado:'completado', resumen:'Torso A' },
  { fecha:'2026-05-07', estado:'descanso',   resumen:'Descanso' },
  { fecha:'2026-05-08', estado:'completado', resumen:'Piernas' },
  { fecha:'2026-05-09', estado:'pendiente',  resumen:'Torso B' },
  { fecha:'2026-05-10', estado:'descanso',   resumen:'Descanso' },
  { fecha:'2026-05-12', estado:'pendiente',  resumen:'Torso C' },
  { fecha:'2026-05-13', estado:'pendiente',  resumen:'Torso A' },
  { fecha:'2026-05-15', estado:'pendiente',  resumen:'Piernas' },
];
