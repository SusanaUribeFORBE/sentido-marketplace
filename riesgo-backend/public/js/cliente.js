const loginView = document.getElementById('login-view');
const clienteView = document.getElementById('cliente-view');
const loginForm = document.getElementById('cliente-login-form');
const loginBtn = document.getElementById('cliente-login-btn');
const loginMessage = document.getElementById('cliente-login-message');

function clientKey() {
  return sessionStorage.getItem('riesgo_client_key') || '';
}

async function clienteFetch(path, options = {}) {
  const res = await fetch(`/api/cliente${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'x-client-key': clientKey(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem('riesgo_client_key');
    showLogin('Código de acceso inválido o expirado.');
    throw new Error('No autorizado');
  }

  return res;
}

function showLogin(message) {
  loginView.hidden = false;
  clienteView.hidden = true;
  if (message) {
    loginMessage.textContent = message;
    loginMessage.className = 'message error';
  }
}

async function showCliente() {
  loginView.hidden = true;
  clienteView.hidden = false;

  const res = await clienteFetch('/me');
  const empresa = await res.json();
  document.getElementById('cliente-empresa-nombre').textContent = empresa.nombre_constructora;

  await cargarPins();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = 'Verificando...';
  loginMessage.className = 'message';

  const key = document.getElementById('client_key').value.trim();
  sessionStorage.setItem('riesgo_client_key', key);

  try {
    const res = await fetch('/api/cliente/me', { headers: { 'x-client-key': key } });
    if (!res.ok) {
      sessionStorage.removeItem('riesgo_client_key');
      loginMessage.textContent = 'Código de acceso inválido.';
      loginMessage.className = 'message error';
      return;
    }
    await showCliente();
  } catch (err) {
    loginMessage.textContent = 'Error de conexión.';
    loginMessage.className = 'message error';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Entrar';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('riesgo_client_key');
  showLogin();
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => (p.hidden = true));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).hidden = false;

    if (btn.dataset.tab === 'certificados') {
      cargarCertificados();
    }
  });
});

async function cargarPins() {
  const res = await clienteFetch('/pins');
  const data = await res.json();

  document.getElementById('pin-total').textContent = data.resumen.total;
  document.getElementById('pin-disponible').textContent = data.resumen.disponible;
  document.getElementById('pin-en-juego').textContent = data.resumen.en_juego;
  document.getElementById('pin-certificado').textContent = data.resumen.certificado;
  document.getElementById('pin-quemado').textContent = data.resumen.quemado;

  const tbody = document.querySelector('#tabla-pins tbody');
  tbody.innerHTML = data.pins
    .map(
      (p) => `
        <tr>
          <td>${p.codigo_pin}</td>
          <td>${p.estado}</td>
          <td>${p.modulo_asignado}</td>
          <td>${p.nombre_usuario || ''}</td>
          <td>${p.fecha_uso ? new Date(p.fecha_uso).toLocaleString('es-CO') : ''}</td>
        </tr>
      `
    )
    .join('');
}

async function cargarCertificados() {
  const res = await clienteFetch('/certificados');
  const data = await res.json();

  const tbody = document.querySelector('#tabla-certificados tbody');
  tbody.innerHTML = data
    .map(
      (c) => `
        <tr>
          <td>${c.nombre_usuario}</td>
          <td>${c.cedula_usuario}</td>
          <td>${c.modulo}</td>
          <td>${c.emitido_at ? new Date(c.emitido_at).toLocaleString('es-CO') : ''}</td>
          <td><a href="${c.url_pdf}" target="_blank" rel="noopener">${c.codigo_qr}</a></td>
        </tr>
      `
    )
    .join('');
}

document.getElementById('asistencia-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('asistencia-message');
  message.className = 'message';

  const modulo = document.getElementById('asistencia_modulo').value;

  try {
    const res = await clienteFetch(`/listado-asistencia?modulo=${encodeURIComponent(modulo)}`);

    if (!res.ok) {
      const data = await res.json();
      message.textContent = data.error || 'No se pudo generar el listado';
      message.className = 'message error';
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listado-asistencia-${modulo.replace(/\s+/g, '-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    message.textContent = 'Listado descargado correctamente.';
    message.className = 'message success';
  } catch (err) {
    message.textContent = 'Error de conexión.';
    message.className = 'message error';
  }
});

document.getElementById('analitica-cargar-btn').addEventListener('click', cargarAnalitica);

async function cargarAnalitica() {
  const message = document.getElementById('analitica-message');
  message.className = 'message';

  const modulo = document.getElementById('analitica-modulo-select').value;

  const generalBody = document.querySelector('#tabla-analitica-general tbody');
  const cargoBody = document.querySelector('#tabla-analitica-cargo tbody');

  try {
    const res = await clienteFetch(`/analitica-preguntas?modulo=${encodeURIComponent(modulo)}`);
    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || 'No se pudo cargar la analítica';
      message.className = 'message error';
      generalBody.innerHTML = '';
      cargoBody.innerHTML = '';
      return;
    }

    if (!data.general.length) {
      message.textContent = 'Aún no hay resultados registrados para este módulo.';
      message.className = 'message';
      generalBody.innerHTML = '';
      cargoBody.innerHTML = '';
      return;
    }

    message.textContent = '';

    generalBody.innerHTML = data.general
      .map(
        (g) => `
          <tr class="${g.porcentaje_fallo > 50 ? 'row-danger' : ''}">
            <td>${g.nivel}</td>
            <td>${g.pregunta_texto}</td>
            <td>${g.intentos}</td>
            <td>${g.porcentaje_fallo}%</td>
          </tr>
        `
      )
      .join('');

    cargoBody.innerHTML = data.por_cargo
      .map(
        (g) => `
          <tr class="${g.porcentaje_fallo > 50 ? 'row-danger' : ''}">
            <td>${g.cargo}</td>
            <td>${g.pregunta_texto}</td>
            <td>${g.intentos}</td>
            <td>${g.porcentaje_fallo}%</td>
          </tr>
        `
      )
      .join('');
  } catch (err) {
    message.textContent = 'Error de conexión.';
    message.className = 'message error';
  }
}

if (clientKey()) {
  showCliente();
} else {
  showLogin();
}
