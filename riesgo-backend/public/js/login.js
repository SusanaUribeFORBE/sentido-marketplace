const form = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');
const message = document.getElementById('message');

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  message.className = 'message';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verificando...';

  const codigo_pin = document.getElementById('codigo_pin').value.trim();
  const cedula_usuario = document.getElementById('cedula_usuario').value.trim();
  const nombre_usuario = document.getElementById('nombre_usuario').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_pin, cedula_usuario, nombre_usuario }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || 'No se pudo iniciar sesión', 'error');
      return;
    }

    sessionStorage.setItem('riesgo_pin_id', data.pin_id);
    sessionStorage.setItem('riesgo_modulo', data.modulo_asignado);
    sessionStorage.setItem('riesgo_mundo', data.mundo_id);
    sessionStorage.setItem('riesgo_nombre', nombre_usuario);

    showMessage('¡Acceso concedido! Cargando módulo...', 'success');
    window.location.href = '/juego.html';
  } catch (err) {
    showMessage('Error de conexión. Intenta de nuevo.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Ingresar';
  }
});
