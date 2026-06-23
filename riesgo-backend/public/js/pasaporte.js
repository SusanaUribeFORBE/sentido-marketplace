const NIVELES = [
  { nombre: 'Iniciando', minimo: 0, maximo: 499 },
  { nombre: 'En Ruta', minimo: 500, maximo: 1499 },
  { nombre: 'Avanzado', minimo: 1500, maximo: 2499 },
  { nombre: 'Experto', minimo: 2500, maximo: 3499 },
  { nombre: 'Embajador', minimo: 3500, maximo: Infinity },
];

const INSIGNIAS = [
  { clave: 'equipamiento', emoji: '🪖', label: 'Equipamiento que te protege' },
  { clave: 'normas', emoji: '🛣️', label: 'Normas que salvan' },
  { clave: 'atencion', emoji: '👁️', label: 'Atención que te adelanta' },
  { clave: 'tumoto', emoji: '🏍️', label: 'Tu moto en buen estado' },
  { clave: 'condiciones', emoji: '🌧️', label: 'Condiciones que importan' },
  { clave: 'respeto', emoji: '❤️', label: 'Respeto que nos une' },
];

const form = document.getElementById('lookup-form');
const lookupCard = document.getElementById('lookup-card');
const pasaporteCard = document.getElementById('pasaporte-card');
const message = document.getElementById('lookup-message');
const volverBtn = document.getElementById('volver-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cedula = document.getElementById('cedula').value.trim();
  if (!cedula) return;

  message.textContent = '';
  message.className = 'message';
  const btn = document.getElementById('lookup-btn');
  btn.disabled = true;
  btn.textContent = 'Consultando...';

  try {
    const res = await fetch(`/api/pasaporte/${encodeURIComponent(cedula)}`);
    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || 'No se pudo consultar el pasaporte.';
      message.className = 'message error';
      return;
    }

    mostrarPasaporte(data);
  } catch (err) {
    message.textContent = 'Error de conexión. Intenta de nuevo.';
    message.className = 'message error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ver mi pasaporte';
  }
});

volverBtn.addEventListener('click', () => {
  pasaporteCard.hidden = true;
  lookupCard.hidden = false;
  document.getElementById('cedula').value = '';
});

function nivelActual(puntos) {
  return NIVELES.find((n) => puntos >= n.minimo && puntos <= n.maximo) || NIVELES[0];
}

function mostrarPasaporte(data) {
  lookupCard.hidden = true;
  pasaporteCard.hidden = false;

  document.getElementById('pp-nombre').textContent = data.nombre;
  document.getElementById('pp-nivel').textContent = data.nivel;

  const actual = nivelActual(data.puntos_total);
  const siguiente = NIVELES[NIVELES.indexOf(actual) + 1];

  document.getElementById('pp-puntos').textContent = `${data.puntos_total} puntos`;
  document.getElementById('pp-siguiente').textContent = siguiente
    ? `Faltan ${siguiente.minimo - data.puntos_total} para ${siguiente.nombre}`
    : '¡Nivel máximo alcanzado!';

  const rango = actual.maximo === Infinity ? actual.minimo + 1000 : actual.maximo - actual.minimo + 1;
  const avance = Math.min(100, Math.round(((data.puntos_total - actual.minimo) / rango) * 100));
  document.getElementById('pp-progreso-fill').style.width = `${avance}%`;

  const insignias = data.insignias || {};
  document.getElementById('pp-insignias').innerHTML = INSIGNIAS.map((ins) => {
    const desbloqueada = !!insignias[ins.clave];
    return `
      <div class="insignia ${desbloqueada ? 'unlocked' : ''}">
        <span class="insignia-emoji">${ins.emoji}</span>
        <span class="insignia-label">${ins.label}</span>
      </div>`;
  }).join('');

  document.getElementById('pp-niveles').innerHTML = NIVELES.map((n) => {
    const esActual = n.nombre === actual.nombre;
    const rangoTexto = n.maximo === Infinity ? `${n.minimo}+ puntos` : `${n.minimo} - ${n.maximo} puntos`;
    return `<div class="nivel-row ${esActual ? 'activo' : ''}"><span>${n.nombre}</span><span>${rangoTexto}</span></div>`;
  }).join('');
}
