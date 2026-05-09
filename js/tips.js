// DeFatFit v3 — tips.js
// Banco de tips de salud y educación fitness

const TIPS = [
  // Hidratación
  { icono: '💧', categoria: 'Hidratación', texto: 'Bebe al menos 500ml de agua antes de empezar a entrenar. La deshidratación reduce el rendimiento hasta un 20%.' },
  { icono: '💧', categoria: 'Hidratación', texto: 'Durante el entrenamiento, toma pequeños sorbos cada 15-20 minutos. No esperes a sentir sed.' },
  { icono: '💧', categoria: 'Hidratación', texto: 'Orina clara o amarillo pálido = bien hidratado. Orina oscura = necesitas más agua.' },

  // Calentamiento
  { icono: '🔥', categoria: 'Calentamiento', texto: 'Dedica 5-10 minutos a movilidad articular antes de entrenar. Tus articulaciones te lo agradecerán en 10 años.' },
  { icono: '🔥', categoria: 'Calentamiento', texto: 'Haz una serie de calentamiento con el 50% del peso en los ejercicios pesados. Previene lesiones y activa el sistema nervioso.' },
  { icono: '🔥', categoria: 'Calentamiento', texto: 'Movilidad de cadera y hombros antes de entrenar es clave para calistenia y press. 5 círculos lentos en cada dirección.' },

  // Técnica
  { icono: '🎯', categoria: 'Técnica', texto: 'Conecta mentalmente con el músculo que estás trabajando. La conexión mente-músculo puede aumentar la activación hasta un 30%.' },
  { icono: '🎯', categoria: 'Técnica', texto: 'En la fase excéntrica (bajada), ve 2-3 segundos más lento. Ahí ocurre gran parte del crecimiento muscular.' },
  { icono: '🎯', categoria: 'Técnica', texto: 'Rango completo de movimiento > más peso con rango parcial. Siempre.' },
  { icono: '🎯', categoria: 'Técnica', texto: 'En dominadas, activa los dorsales antes de tirar. Imagina que quieres meter los codos en los bolsillos.' },
  { icono: '🎯', categoria: 'Técnica', texto: 'En sentadilla, empuja el suelo hacia abajo, no te levantes. Ese cambio de perspectiva mejora la técnica instantáneamente.' },

  // Recuperación
  { icono: '😴', categoria: 'Recuperación', texto: 'El músculo crece mientras duermes, no mientras entrenas. 7-9 horas de sueño es tan importante como la rutina.' },
  { icono: '😴', categoria: 'Recuperación', texto: 'Los días de descanso son días de construcción. No es tiempo perdido, es cuando el cuerpo se adapta al estímulo.' },
  { icono: '😴', categoria: 'Recuperación', texto: 'Un baño de agua fría post-entreno reduce la inflamación y acelera la recuperación. 2-3 minutos son suficientes.' },
  { icono: '😴', categoria: 'Recuperación', texto: 'Estira los músculos trabajados al final de la sesión. Mantén cada posición al menos 30 segundos.' },

  // Nutrición básica
  { icono: '🥩', categoria: 'Nutrición', texto: 'Come proteína en las primeras 2 horas post-entrenamiento. 20-40g activan la síntesis proteica al máximo.' },
  { icono: '🥩', categoria: 'Nutrición', texto: 'Para ganar músculo necesitas entre 1.6 y 2.2g de proteína por kg de peso corporal al día.' },
  { icono: '🥩', categoria: 'Nutrición', texto: 'Los carbohidratos no son el enemigo. Son el combustible principal del músculo. Cómelos antes de entrenar.' },
  { icono: '🥩', categoria: 'Nutrición', texto: 'No entrenes en ayunas si tu objetivo es fuerza o masa muscular. Al menos una fruta o proteína antes.' },

  // Progresión
  { icono: '📈', categoria: 'Progresión', texto: 'Sobrecarga progresiva: aumenta el volumen o el peso cada 2-3 semanas. Sin progresión no hay adaptación.' },
  { icono: '📈', categoria: 'Progresión', texto: 'Registra tus pesos y repeticiones. Lo que no se mide no mejora. Usa la sección de marcas personales.' },
  { icono: '📈', categoria: 'Progresión', texto: 'Si llevas 4+ semanas sin progresar en un ejercicio, cambia el ángulo, el agarre o el rango de repeticiones.' },
  { icono: '📈', categoria: 'Progresión', texto: 'La RIR (repeticiones en reserva) es clave: termina los sets con 1-2 reps que podrías haber hecho. No al fallo siempre.' },

  // Calistenia
  { icono: '💪', categoria: 'Calistenia', texto: 'Para progresar en dominadas: haz negativas lentas (5-7 seg bajando). Construye fuerza excéntrica primero.' },
  { icono: '💪', categoria: 'Calistenia', texto: 'El muscle-up requiere dominadas explosivas y fondos fuertes. Trabaja los dos primero.' },
  { icono: '💪', categoria: 'Calistenia', texto: 'Los fondos con lastre son uno de los mejores ejercicios de pecho y tríceps. Si puedes hacer 15+ fácil, agrega peso.' },

  // Mentalidad
  { icono: '🧠', categoria: 'Mentalidad', texto: 'La consistencia vence a la intensidad. 3 entrenamientos a la semana durante un año > 7 semanas de entrenamiento duro y luego nada.' },
  { icono: '🧠', categoria: 'Mentalidad', texto: 'Un mal entreno es mejor que ningún entreno. Muévete aunque no tengas ganas.' },
  { icono: '🧠', categoria: 'Mentalidad', texto: 'Compárate con quien eras el mes pasado, no con otros. Tu progreso es único.' },
  { icono: '🧠', categoria: 'Mentalidad', texto: 'El gym es un lugar donde invertir en ti mismo. Cada sesión es un depósito en tu cuenta de salud.' },
];

const LS_TIP = 'defatfit_tip_hoy';

function getTipDelDia() {
  const hoy = new Date().toDateString();
  try {
    const saved = JSON.parse(localStorage.getItem(LS_TIP));
    if (saved && saved.fecha === hoy) return TIPS[saved.idx];
  } catch (e) {}

  // Nuevo tip del día
  const idx = Math.floor(Math.random() * TIPS.length);
  localStorage.setItem(LS_TIP, JSON.stringify({ fecha: hoy, idx }));
  return TIPS[idx];
}

function renderTipDelDia(containerId = 'tip-del-dia') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const tip = getTipDelDia();
  el.innerHTML = `
    <div class="tip-icon">${tip.icono}</div>
    <div>
      <div class="tip-label">${tip.categoria} del día</div>
      <div class="tip-text">${tip.texto}</div>
    </div>
  `;
}
