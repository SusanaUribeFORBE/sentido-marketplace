const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('admin-login-form');
const loginBtn = document.getElementById('admin-login-btn');
const loginMessage = document.getElementById('admin-login-message');

let empresas = [];

function adminKey() {
  return sessionStorage.getItem('riesgo_admin_key') || '';
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'x-admin-key': adminKey(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem('riesgo_admin_key');
    showLogin('Clave inválida o expirada.');
    throw new Error('No autorizado');
  }

  return res;
}

function showLogin(message) {
  loginView.hidden = false;
  adminView.hidden = true;
  if (message) {
    loginMessage.textContent = message;
    loginMessage.className = 'message error';
  }
}

function showAdmin() {
  loginView.hidden = true;
  adminView.hidden = false;
  cargarResumen();
  cargarEmpresas();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = 'Verificando...';
  loginMessage.className = 'message';

  const key = document.getElementById('admin_key').value.trim();
  sessionStorage.setItem('riesgo_admin_key', key);

  try {
    const res = await fetch('/api/admin/analytics', { headers: { 'x-admin-key': key } });
    if (!res.ok) {
      sessionStorage.removeItem('riesgo_admin_key');
      loginMessage.textContent = 'Clave inválida.';
      loginMessage.className = 'message error';
      return;
    }
    showAdmin();
  } catch (err) {
    loginMessage.textContent = 'Error de conexión.';
    loginMessage.className = 'message error';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Entrar';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('riesgo_admin_key');
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

async function cargarResumen() {
  const res = await adminFetch('/analytics');
  const data = await res.json();
  document.getElementById('stat-instalaciones').textContent = data.instalaciones;
  document.getElementById('stat-usuarios').textContent = data.usuarios_activos;
  document.getElementById('stat-certificados').textContent = data.certificados_emitidos;
}

async function cargarEmpresas() {
  const res = await adminFetch('/empresas');
  empresas = await res.json();

  const tbody = document.querySelector('#tabla-empresas tbody');
  tbody.innerHTML = empresas
    .map(
      (e) => `
        <tr>
          <td>${e.nombre_constructora}</td>
          <td>${e.nit}</td>
          <td>${e.arl_nombre || ''}</td>
          <td>${e.contacto_sst || ''}</td>
          <td>${e.email_sst || ''}</td>
          <td><code>${e.codigo_acceso || ''}</code></td>
          <td><button type="button" class="ghost-btn regenerar-codigo-btn" data-id="${e.id_empresa}">Regenerar</button></td>
        </tr>
      `
    )
    .join('');

  document.querySelectorAll('.regenerar-codigo-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Regenerar el código de acceso? El código anterior dejará de funcionar.')) return;
      await adminFetch(`/empresas/${btn.dataset.id}/regenerar-codigo`, { method: 'POST' });
      await cargarEmpresas();
    });
  });

  const select = document.getElementById('pin-empresa-select');
  select.innerHTML =
    '<option value="">Selecciona una empresa</option>' +
    empresas.map((e) => `<option value="${e.id_empresa}">${e.nombre_constructora}</option>`).join('');

  const certSelect = document.getElementById('cert-empresa-select');
  certSelect.innerHTML =
    '<option value="">Todas las empresas</option>' +
    empresas.map((e) => `<option value="${e.id_empresa}">${e.nombre_constructora}</option>`).join('');

  const analiticaSelect = document.getElementById('analitica-empresa-select');
  analiticaSelect.innerHTML =
    '<option value="">Todas las empresas</option>' +
    empresas.map((e) => `<option value="${e.id_empresa}">${e.nombre_constructora}</option>`).join('');
}

document.getElementById('empresa-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('empresa-message');
  message.className = 'message';

  const body = {
    nombre_constructora: document.getElementById('emp_nombre').value.trim(),
    nit: document.getElementById('emp_nit').value.trim(),
    arl_nombre: document.getElementById('emp_arl').value.trim(),
    contacto_sst: document.getElementById('emp_contacto').value.trim(),
    email_sst: document.getElementById('emp_email').value.trim(),
  };

  try {
    const res = await adminFetch('/empresas', { method: 'POST', body: JSON.stringify(body) });
    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || 'No se pudo crear la empresa';
      message.className = 'message error';
      return;
    }

    message.textContent = `Empresa creada correctamente. Código de acceso cliente: ${data.codigo_acceso}`;
    message.className = 'message success';
    e.target.reset();
    await cargarEmpresas();
  } catch (err) {
    message.textContent = 'Error de conexión.';
    message.className = 'message error';
  }
});

document.getElementById('pin-empresa-select').addEventListener('change', cargarPins);

async function cargarPins() {
  const idEmpresa = document.getElementById('pin-empresa-select').value;
  const resumenEl = document.getElementById('pin-resumen');
  const tbody = document.querySelector('#tabla-pins tbody');

  if (!idEmpresa) {
    resumenEl.hidden = true;
    tbody.innerHTML = '';
    return;
  }

  const res = await adminFetch(`/pins?id_empresa=${idEmpresa}`);
  const data = await res.json();

  resumenEl.hidden = false;
  document.getElementById('pin-total').textContent = data.resumen.total;
  document.getElementById('pin-disponible').textContent = data.resumen.disponible;
  document.getElementById('pin-en-juego').textContent = data.resumen.en_juego;
  document.getElementById('pin-certificado').textContent = data.resumen.certificado;
  document.getElementById('pin-quemado').textContent = data.resumen.quemado;

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

document.getElementById('cert-empresa-select').addEventListener('change', cargarCertificados);

async function cargarCertificados() {
  const idEmpresa = document.getElementById('cert-empresa-select').value;
  const tbody = document.querySelector('#tabla-certificados tbody');

  const query = idEmpresa ? `?id_empresa=${idEmpresa}` : '';
  const res = await adminFetch(`/certificados${query}`);
  const data = await res.json();

  tbody.innerHTML = data
    .map(
      (c) => `
        <tr>
          <td>${c.nombre_usuario}</td>
          <td>${c.cedula_usuario}</td>
          <td>${c.empresas?.nombre_constructora || ''}</td>
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

  const idEmpresa = document.getElementById('pin-empresa-select').value;
  if (!idEmpresa) {
    message.textContent = 'Selecciona una empresa primero.';
    message.className = 'message error';
    return;
  }

  const modulo = document.getElementById('asistencia_modulo').value;

  try {
    const res = await adminFetch(`/listado-asistencia?id_empresa=${idEmpresa}&modulo=${encodeURIComponent(modulo)}`);

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

document.getElementById('pin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('pin-message');
  message.className = 'message';

  const idEmpresa = document.getElementById('pin-empresa-select').value;
  if (!idEmpresa) {
    message.textContent = 'Selecciona una empresa primero.';
    message.className = 'message error';
    return;
  }

  const body = {
    id_empresa: idEmpresa,
    cantidad: Number(document.getElementById('pin_cantidad').value),
    modulo_asignado: document.getElementById('pin_modulo').value.trim(),
    mundo_id: Number(document.getElementById('pin_mundo').value),
  };

  try {
    const res = await adminFetch('/pins', { method: 'POST', body: JSON.stringify(body) });
    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || 'No se pudieron generar los PINs';
      message.className = 'message error';
      return;
    }

    message.textContent = `${data.cantidad} PIN(s) generado(s).`;
    message.className = 'message success';

    const generadosEl = document.getElementById('pin-generados');
    generadosEl.hidden = false;
    document.getElementById('pin-generados-texto').value = data.pins.join('\n');

    await cargarPins();
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
  const idEmpresa = document.getElementById('analitica-empresa-select').value;

  const generalBody = document.querySelector('#tabla-analitica-general tbody');
  const cargoBody = document.querySelector('#tabla-analitica-cargo tbody');

  try {
    const query = `?modulo=${encodeURIComponent(modulo)}${idEmpresa ? `&id_empresa=${idEmpresa}` : ''}`;
    const res = await adminFetch(`/analitica-preguntas${query}`);
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

if (adminKey()) {
  showAdmin();
} else {
  showLogin();
}
