const pinId = sessionStorage.getItem('riesgo_pin_id');
const moduloAsignado = sessionStorage.getItem('riesgo_modulo') || '';
const nombreUsuario = sessionStorage.getItem('riesgo_nombre') || '';

if (!pinId) {
  window.location.href = '/';
}

const primerNombre = nombreUsuario.trim().split(/\s+/)[0] || '';

document.getElementById('welcome-nombre').textContent = primerNombre;
document.getElementById('welcome-modulo').textContent = `🚧 Reto SST – ${moduloAsignado}`;

document.getElementById('empezar-btn').addEventListener('click', () => {
  window.location.href = '/juego.html';
});
