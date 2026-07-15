// ============================================================
// VIGÍA — Cliente API (reemplaza vigia-db.js localStorage)
// ============================================================

const VIGIA_API = 'https://riesgo-backend-production.up.railway.app/api/vigia';

const VigiaAPI = {

  // ── Sesión ────────────────────────────────────────────────

  token()             { return localStorage.getItem('vigia_token') || ''; },
  esAdmin()           { return localStorage.getItem('vigia_es_admin') === '1'; },
  empresaId()         { return localStorage.getItem('vigia_empresa_id') || ''; },
  vigenciaMeses()     { return parseInt(localStorage.getItem('vigia_vigencia_meses') || '12') || 12; },
  numTrabajadores()   { const v = localStorage.getItem('vigia_num_trabajadores'); return v ? parseInt(v) || null : null; },
  claseRiesgo()       { return localStorage.getItem('vigia_clase_riesgo') || null; },

  headers() {
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${this.token()}`,
    };
  },

  async requireAuth() {
    if (!this.token()) { location.href = 'login.html'; return false; }
    const resp = await fetch(`${VIGIA_API}/me`, { headers: this.headers() });
    if (!resp.ok) { this.logout(); return false; }
    return true;
  },

  logout() {
    fetch(`${VIGIA_API}/logout`, { method: 'POST', headers: this.headers() }).catch(() => {});
    localStorage.removeItem('vigia_token');
    localStorage.removeItem('vigia_es_admin');
    localStorage.removeItem('vigia_empresa_id');
    localStorage.removeItem('vigia_num_trabajadores');
    localStorage.removeItem('vigia_clase_riesgo');
    localStorage.removeItem('vigia_logo_url');
    localStorage.removeItem('vigia_prefijo_docs');
    localStorage.removeItem('vigia_resp_estado');
    localStorage.removeItem('vigia_vigencia_desde');
    localStorage.removeItem('vigia_nit');
    location.href = 'login.html';
  },

  // ── Helpers ───────────────────────────────────────────────

  async _get(path) {
    const r = await fetch(`${VIGIA_API}${path}`, { headers: this.headers() });
    if (r.status === 401) { this.logout(); return null; }
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
  },

  async _post(path, body) {
    const r = await fetch(`${VIGIA_API}${path}`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(body),
    });
    if (r.status === 401) { this.logout(); return null; }
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
  },

  async _delete(path) {
    const r = await fetch(`${VIGIA_API}${path}`, { method: 'DELETE', headers: this.headers() });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
  },

  async _put(path, body) {
    const r = await fetch(`${VIGIA_API}${path}`, {
      method: 'PUT', headers: this.headers(), body: JSON.stringify(body),
    });
    if (r.status === 401) { this.logout(); return null; }
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
  },

  // ── Empresas ──────────────────────────────────────────────

  getEmpresas()                             { return this._get('/empresas'); },
  crearEmpresa(nombre, nit, password, email) { return this._post('/empresas', { nombre, nit, password, email_encargado: email || null }); },
  resetPassword(empresaId, password)        { return this._put(`/empresas/${empresaId}/password`, { password }); },
  setVigencia(empresaId, meses)             { return this._put(`/empresas/${empresaId}/vigencia`, { vigencia_meses: meses }); },
  setActiva(empresaId, activa)              { return this._put(`/empresas/${empresaId}/activa`, { activa }); },
  setEmail(empresaId, email)               { return this._put(`/empresas/${empresaId}/email`, { email }); },
  subirLogo(empresaId, datos_base64, tipo_mime, nombre_archivo) {
    return this._put(`/empresas/${empresaId}/logo`, { datos_base64, tipo_mime, nombre_archivo });
  },
  quitarLogo(empresaId) { return this._delete(`/empresas/${empresaId}/logo`); },
  eliminarEmpresa(empresaId) { return this._delete(`/empresas/${empresaId}`); },
  setPrefijoDocs(empresaId, prefijo_docs) {
    return this._put(`/empresas/${empresaId}/prefijo-docs`, { prefijo_docs });
  },
  getAdminResumen()  { return this._get('/admin/resumen'); },
  logoUrl()          { return localStorage.getItem('vigia_logo_url') || ''; },
  prefijoDocs()      { return localStorage.getItem('vigia_prefijo_docs') || 'SG-SST'; },
  initDocHeader() {
    const logo    = this.logoUrl();
    const prefijo = this.prefijoDocs();
    const raw     = localStorage.getItem('vigia_vigencia_desde') || '';
    let fecha = '';
    if (raw) {
      const [y, m, d] = raw.split('-');
      fecha = `${d}/${m}/${y}`;
    }
    document.querySelectorAll('.doc-logo-img').forEach(img => { if (logo) img.src = logo; });
    document.querySelectorAll('.doc-fecha').forEach(el  => { el.textContent = fecha; });
    document.querySelectorAll('.doc-codigo[data-sufijo]').forEach(el => {
      el.textContent = `${prefijo} ${el.dataset.sufijo}`;
    });
  },

  // ── Stats ─────────────────────────────────────────────────

  getStats() { return this._get('/stats'); },
  getInformeCondiciones(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/informe-condiciones${q}`);
  },
  getCobertura(empresaId, inclInactivos = false) {
    const params = new URLSearchParams();
    if (empresaId) params.set('empresa_id', empresaId);
    if (inclInactivos) params.set('incluir_inactivos', 'true');
    return this._get(`/examenes/cobertura?${params}`);
  },

  // ── Empleados ─────────────────────────────────────────────

  getEmpleados(incluirInactivos = false) {
    const q = incluirInactivos ? '?incluir_inactivos=true' : '';
    return this._get(`/empleados${q}`);
  },
  getEmpleado(id)              { return this._get(`/empleados/${id}`); },
  crearEmpleado(datos)         { return this._post('/empleados', datos); },
  setEstadoEmpleado(id, activo){ return this._put(`/empleados/${id}/estado`, { activo }); },
  eliminarEmpleado(id)         { return this._delete(`/empleados/${id}`); },

  // ── Exámenes ──────────────────────────────────────────────

  agregarExamen(datos)              { return this._post('/examenes', datos); },
  agregarExamenesBulk(empresa_id, examenes) { return this._post('/examenes/bulk', { empresa_id, examenes }); },
  editarExamen(id, datos)           { return this._put(`/examenes/${id}`, datos); },
  eliminarExamen(id)                { return this._delete(`/examenes/${id}`); },

  // ── Configuración de empresa (Res. 0312/2019) ────────────
  actualizarConfiguracion(empresaId, datos) { return this._put(`/empresas/${empresaId}/configuracion`, datos); },

  // ── Evidencias SG-SST ────────────────────────────────────
  getEvidencias(evaluacionId)         { return this._get(`/evaluaciones/${evaluacionId}/evidencias`); },
  subirEvidencia(evaluacionId, datos) { return this._post(`/evaluaciones/${evaluacionId}/evidencias`, datos); },
  eliminarEvidencia(id)               { return this._delete(`/evidencias/${id}`); },

  // ── Evaluación inicial SG-SST (Res. 0312/2019) ───────────

  getEvaluaciones(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/evaluaciones${q}`);
  },
  getEvaluacion(id)            { return this._get(`/evaluaciones/${id}`); },
  crearEvaluacion(datos)       { return this._post('/evaluaciones', datos); },
  editarEvaluacion(id, datos)  { return this._put(`/evaluaciones/${id}`, datos); },
  eliminarEvaluacion(id)       { return this._delete(`/evaluaciones/${id}`); },

  // ── Investigaciones AT/Incidentes (Res. 1401/2007) ───────

  getInvestigaciones(empresaId, anio) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    const q = p.toString() ? '?' + p.toString() : '';
    return this._get(`/investigaciones${q}`);
  },
  getInvestigacion(id)              { return this._get(`/investigaciones/${id}`); },
  crearInvestigacion(datos)         { return this._post('/investigaciones', datos); },
  editarInvestigacion(id, datos)    { return this._put(`/investigaciones/${id}`, datos); },
  eliminarInvestigacion(id)         { return this._delete(`/investigaciones/${id}`); },

  crearAccionInv(invId, datos)      { return this._post(`/investigaciones/${invId}/acciones`, datos); },
  editarAccionInv(id, datos)        { return this._put(`/acciones-inv/${id}`, datos); },
  eliminarAccionInv(id)             { return this._delete(`/acciones-inv/${id}`); },

  // ── Capacitaciones SST ───────────────────────────────────

  getCapacitaciones(empresaId, anio) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    const q = p.toString() ? '?' + p.toString() : '';
    return this._get(`/capacitaciones${q}`);
  },
  getCapacitacion(id)              { return this._get(`/capacitaciones/${id}`); },
  crearCapacitacion(datos)         { return this._post('/capacitaciones', datos); },
  editarCapacitacion(id, datos)    { return this._put(`/capacitaciones/${id}`, datos); },
  eliminarCapacitacion(id)         { return this._delete(`/capacitaciones/${id}`); },

  agregarParticipante(capId, datos){ return this._post(`/capacitaciones/${capId}/participantes`, datos); },
  editarParticipante(id, datos)    { return this._put(`/participantes/${id}`, datos); },
  eliminarParticipante(id)         { return this._delete(`/participantes/${id}`); },

  // ── Plan de trabajo anual SST ─────────────────────────────

  getPlanestrabajo(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/plan-trabajo${q}`);
  },
  crearPlanTrabajo(datos)        { return this._post('/plan-trabajo', datos); },
  editarPlanTrabajo(id, datos)   { return this._put(`/plan-trabajo/${id}`, datos); },
  eliminarPlanTrabajo(id)        { return this._delete(`/plan-trabajo/${id}`); },

  getPlanActividades(planId)     { return this._get(`/plan-actividades?plan_id=${planId}`); },
  crearActividad(datos)          { return this._post('/plan-actividades', datos); },
  editarActividad(id, datos)     { return this._put(`/plan-actividades/${id}`, datos); },
  eliminarActividad(id)          { return this._delete(`/plan-actividades/${id}`); },

  // ── Responsable SST ──────────────────────────────────────

  respEstado()         { return localStorage.getItem('vigia_resp_estado') || 'PENDIENTE'; },

  getResponsable(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/responsable${q}`);
  },
  actualizarResponsable(datos) { return this._put('/responsable', datos); },
  subirCert50h(datos_base64, tipo_mime, nombre_archivo) {
    return this._put('/responsable/cert50h', { datos_base64, tipo_mime, nombre_archivo });
  },
  subirCert20h(datos_base64, tipo_mime, nombre_archivo) {
    return this._put('/responsable/cert20h', { datos_base64, tipo_mime, nombre_archivo });
  },

  // ── EPP — Elementos de Protección Personal ───────────────

  getEppCargos(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/epp/cargos${q}`);
  },
  crearEppCargo(datos)        { return this._post('/epp/cargos', datos); },
  editarEppCargo(id, datos)   { return this._put(`/epp/cargos/${id}`, datos); },
  eliminarEppCargo(id)        { return this._delete(`/epp/cargos/${id}`); },

  getEppEntregas(empresaId, empleadoId) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (empleadoId) p.set('empleado_id', empleadoId);
    const q = p.toString() ? '?' + p.toString() : '';
    return this._get(`/epp/entregas${q}`);
  },
  crearEppEntrega(datos)      { return this._post('/epp/entregas', datos); },
  editarEppEntrega(id, datos) { return this._put(`/epp/entregas/${id}`, datos); },
  eliminarEppEntrega(id)      { return this._delete(`/epp/entregas/${id}`); },

  // ── Peligros SG-SST (GTC-45) ──────────────────────────────

  getPeligros(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/peligros${q}`);
  },
  crearPeligro(datos)          { return this._post('/peligros', datos); },
  editarPeligro(id, datos)     { return this._put(`/peligros/${id}`, datos); },
  eliminarPeligro(id)          { return this._delete(`/peligros/${id}`); },

  // ── Plan de Emergencias + Brigada ───────────────────────────────────────
  getEmergencias(empresaId)              { const q = empresaId ? `?empresa_id=${empresaId}` : ''; return this._get(`/emergencias${q}`); },
  crearAmenaza(datos)                    { return this._post('/emergencias/amenazas', datos); },
  editarAmenaza(id, datos)               { return this._put(`/emergencias/amenazas/${id}`, datos); },
  eliminarAmenaza(id)                    { return this._delete(`/emergencias/amenazas/${id}`); },
  crearSimulacro(datos)                  { return this._post('/emergencias/simulacros', datos); },
  eliminarSimulacro(id)                  { return this._delete(`/emergencias/simulacros/${id}`); },
  crearBrigadista(datos)                 { return this._post('/emergencias/brigada', datos); },
  editarBrigadista(id, datos)            { return this._put(`/emergencias/brigada/${id}`, datos); },
  eliminarBrigadista(id)                 { return this._delete(`/emergencias/brigada/${id}`); },

  // ── COPASST + Comité de Convivencia ─────────────────────────────────────
  getCopasst(empresaId)                  { const q = empresaId ? `?empresa_id=${empresaId}` : ''; return this._get(`/copasst${q}`); },
  crearMiembroCopasst(datos)             { return this._post('/copasst/miembros', datos); },
  editarMiembroCopasst(id, datos)        { return this._put(`/copasst/miembros/${id}`, datos); },
  eliminarMiembroCopasst(id)             { return this._delete(`/copasst/miembros/${id}`); },
  crearActaCopasst(datos)                { return this._post('/copasst/actas', datos); },
  editarActaCopasst(id, datos)           { return this._put(`/copasst/actas/${id}`, datos); },
  eliminarActaCopasst(id)                { return this._delete(`/copasst/actas/${id}`); },

  // ── Mejoramiento ────────────────────────────────────────────────────────
  getMejoramiento(empresaId)             { const q = empresaId ? `?empresa_id=${empresaId}` : ''; return this._get(`/mejoramiento${q}`); },
  crearMejoramiento(datos)               { return this._post('/mejoramiento', datos); },
  editarMejoramiento(id, datos)          { return this._put(`/mejoramiento/${id}`, datos); },
  eliminarMejoramiento(id)               { return this._delete(`/mejoramiento/${id}`); },

  // ── Auditoría ────────────────────────────────────────────────────────────
  getAuditorias(empresaId)               { const q = empresaId ? `?empresa_id=${empresaId}` : ''; return this._get(`/auditorias${q}`); },
  crearAuditoria(datos)                  { return this._post('/auditorias', datos); },
  editarAuditoria(id, datos)             { return this._put(`/auditorias/${id}`, datos); },
  eliminarAuditoria(id)                  { return this._delete(`/auditorias/${id}`); },

  // ── Inspecciones ──────────────────────────────────────────────────────────
  getInspecciones(empresaId)             { const q = empresaId ? `?empresa_id=${empresaId}` : ''; return this._get(`/inspecciones${q}`); },
  crearInspeccion(datos)                 { return this._post('/inspecciones', datos); },
  editarInspeccion(id, datos)            { return this._put(`/inspecciones/${id}`, datos); },
  eliminarInspeccion(id)                 { return this._delete(`/inspecciones/${id}`); },

  // ── Mantenimiento ──────────────────────────────────────────────────────────
  getMantenimiento(empresaId)            { const q = empresaId ? `?empresa_id=${empresaId}` : ''; return this._get(`/mantenimiento${q}`); },
  crearMantenimiento(datos)              { return this._post('/mantenimiento', datos); },
  editarMantenimiento(id, datos)         { return this._put(`/mantenimiento/${id}`, datos); },
  eliminarMantenimiento(id)              { return this._delete(`/mantenimiento/${id}`); },

  // ── Perfil de salud / sociodemográfico ────────────────────────────────────
  getPerfilSalud(empresaId, anio)        {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    return this._get(`/perfil-salud${p.toString() ? '?' + p.toString() : ''}`);
  },
  guardarPerfilSalud(anio, datos)        { return this._put(`/perfil-salud/${anio}`, datos); },

  // ── Alertas centralizadas ────────────────────────────────────────────────
  getAlertas(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/alertas${q}`);
  },

  // ── Ausentismo laboral ───────────────────────────────────────────────────
  getAusentismo(empresaId, anio) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    return this._get(`/ausentismo${p.toString() ? '?' + p.toString() : ''}`);
  },
  getAusentismoIndicadores(empresaId, anio) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    return this._get(`/ausentismo/indicadores${p.toString() ? '?' + p.toString() : ''}`);
  },
  crearAusentismo(datos)      { return this._post('/ausentismo', datos); },
  editarAusentismo(id, datos) { return this._put(`/ausentismo/${id}`, datos); },
  eliminarAusentismo(id)      { return this._delete(`/ausentismo/${id}`); },

  // ── Indicadores SG-SST ───────────────────────────────────────────────────
  getIndicadoresSgSST(empresaId, anio) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    return this._get(`/indicadores-sgsst${p.toString() ? '?' + p.toString() : ''}`);
  },
  getSgSSTMensual(empresaId, anio) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    return this._get(`/sgsst-mensual${p.toString() ? '?' + p.toString() : ''}`);
  },
  upsertSgSSTMensual(datos)      { return this._post('/sgsst-mensual', datos); },
  editarSgSSTMensual(id, datos)  { return this._put(`/sgsst-mensual/${id}`, datos); },
  eliminarSgSSTMensual(id)       { return this._delete(`/sgsst-mensual/${id}`); },

  // ── Presupuesto SG-SST (F006) ────────────────────────────────────────────
  getPresupuesto(empresaId, anio) {
    const p = new URLSearchParams();
    if (empresaId) p.set('empresa_id', empresaId);
    if (anio)      p.set('anio', anio);
    return this._get(`/presupuesto${p.toString() ? '?' + p.toString() : ''}`);
  },
  crearPresupuestoItem(datos)      { return this._post('/presupuesto', datos); },
  editarPresupuestoItem(id, datos) { return this._put(`/presupuesto/${id}`, datos); },
  eliminarPresupuestoItem(id)      { return this._delete(`/presupuesto/${id}`); },
  guardarPresupuestoMeta(datos)    { return this._put('/presupuesto-meta', datos); },

  // ── Firmas digitales ─────────────────────────────────────────────────────
  guardarFirmaEpp(entregaId, firma_b64)        { return this._put(`/epp/entregas/${entregaId}/firma`, { firma_b64 }); },
  borrarFirmaEpp(entregaId)                    { return this._delete(`/epp/entregas/${entregaId}/firma`); },
  guardarFirmaParticipante(partId, firma_b64)  { return this._put(`/participantes/${partId}/firma`, { firma_b64 }); },
  borrarFirmaParticipante(partId)              { return this._delete(`/participantes/${partId}/firma`); },
  guardarFirmaResponsable(firma_b64)           { return this._put('/responsable/firma', { firma_b64: firma_b64 || null }); },
  guardarFirmaRepresentanteLegal(firma_b64, empresaId) {
    const body = { firma_b64: firma_b64 || null };
    if (empresaId) body.empresa_id = empresaId;
    return this._put('/responsable/firma-rl', body);
  },

  // ── Enlaces a documentos externos ────────────────────────────────────────
  getDocLinks(empresaId) {
    const q = empresaId ? `?empresa_id=${empresaId}` : '';
    return this._get(`/doc-links${q}`);
  },
  setDocLink(codigo, url, empresaId) {
    const body = { url };
    if (empresaId) body.empresa_id = empresaId;
    return this._put(`/doc-links/${encodeURIComponent(codigo)}`, body);
  },

  // ── Exportar CSV / Imprimir módulo ───────────────────────────────────────
  exportarCSV(datos, campos, nombre) {
    if (!datos || !datos.length) { alert('Sin datos para exportar.'); return; }
    const keys = campos.map(c => c[1]);
    const rows = datos.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv  = [campos.map(c => c[0]).join(','), ...rows].join('\r\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = nombre + '.csv';
    a.click();
  },

  imprimirModulo() {
    document.body.classList.add('printing-module');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-module'), 800);
  },
};

// ── Navegación PHVA — dropdown toggle + página activa ────────────────────────

function toggleDD(event, id) {
  event.stopPropagation();
  const dd = document.getElementById(id);
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  if (!isOpen) dd.classList.add('open');
}

// Cierra los dropdowns al hacer clic fuera
document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
});

// Marca la página actual como activa
(function markActivePage() {
  const currentPage = location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-dd-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage) {
      a.classList.add('active-page');
      const trigger = a.closest('.nav-dropdown')?.querySelector('.nav-dd-trigger');
      if (trigger) trigger.classList.add('active-section');
    }
  });
  document.querySelectorAll('.nav-link-fixed').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage) a.classList.add('active');
  });
})();

// ── Campana de alertas — se inyecta automáticamente en el nav tras autenticación ─
(function injectAlertBell() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-bell{position:relative;color:#CBD8E6;font-size:18px;padding:4px 8px;
      border-radius:6px;text-decoration:none;display:flex;align-items:center;
      cursor:pointer;transition:color .15s;border:none;background:none}
    .nav-bell:hover{color:white}
    .nav-bell-badge{position:absolute;top:-4px;right:-4px;background:#EF4444;color:white;
      font-size:10px;font-weight:800;border-radius:10px;min-width:16px;height:16px;
      display:flex;align-items:center;justify-content:center;padding:0 3px;line-height:1}
  `;
  document.head.appendChild(style);

  async function _loadBell() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const bell = document.createElement('a');
    bell.href    = 'alertas.html';
    bell.className = 'nav-bell';
    bell.title   = 'Alertas de vencimiento';
    bell.textContent = '🔔';

    const logoutBtn = navLinks.querySelector('button[onclick*="logout"]');
    if (logoutBtn) navLinks.insertBefore(bell, logoutBtn);
    else navLinks.appendChild(bell);

    try {
      const data = await VigiaAPI.getAlertas();
      const criticos = (data || []).filter(a => a.nivel === 'VENCIDO' || a.nivel === 'CRITICO').length;
      if (criticos > 0) {
        const badge = document.createElement('span');
        badge.className = 'nav-bell-badge';
        badge.textContent = criticos > 99 ? '99+' : String(criticos);
        bell.appendChild(badge);
        bell.title = `${criticos} alerta(s) crítica(s)`;
      }
    } catch { /* sin alertas o sin conexión */ }
  }

  // Esperar a que requireAuth complete exitosamente
  const _origReqAuth = VigiaAPI.requireAuth.bind(VigiaAPI);
  VigiaAPI.requireAuth = async function(...args) {
    const ok = await _origReqAuth(...args);
    if (ok) _loadBell();
    return ok;
  };
})();
