/* CREA Auth — helper compartido. Cargar DESPUÉS de @supabase/supabase-js */
(function () {
  const SUPABASE_URL = 'https://uerrimfgljuszxugnzxg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_g-QWziUfBuvcamoDFwdbng__cFVNj4G';

  const crea = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.__creaSupabase = crea;

  /* ── Parche de fetch: añade Authorization en todas las llamadas a /api/contenido ── */
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (url, options) {
    options = options || {};
    if (typeof url === 'string' && url.startsWith('/api/contenido')) {
      try {
        const { data: { session } } = await crea.auth.getSession();
        if (session?.access_token) {
          options.headers = Object.assign({}, options.headers, {
            'Authorization': 'Bearer ' + session.access_token
          });
        }
      } catch (_) {}
    }
    const r = await _fetch(url, options);
    if (r.status === 401) { window.location.replace('/contenido/login.html'); }
    if (r.status === 402) { window.location.replace('/contenido/planes.html?motivo=trial_expirado'); }
    return r;
  };

  /* ── Verifica sesión y trial; redirige si no hay sesión o el trial venció ── */
  window.creaCheckAuth = async function () {
    const { data: { session } } = await crea.auth.getSession();
    if (!session) {
      window.location.replace('/contenido/login.html');
      return null;
    }
    const meta  = session.user?.user_metadata || {};
    const plan  = meta.crea_plan || 'trial';
    const hasta = meta.crea_trial_hasta;
    if (plan === 'trial' && hasta && new Date(hasta) < new Date()) {
      window.location.replace('/contenido/planes.html?motivo=trial_expirado');
      return null;
    }
    return session.user;
  };

  /* ── Logout ── */
  window.creaLogout = async function () {
    await crea.auth.signOut();
    window.location.replace('/contenido/login.html');
  };

  /* ── Inyecta botón de logout y nombre de usuario en el header ── */
  window.creaInjectUser = function (user) {
    if (!user) return;
    const header = document.querySelector('.header-right, .nav-right, #header-right');
    if (!header) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;';
    div.innerHTML = `
      <span style="font-size:12px;color:rgba(255,255,255,.6);">${user.email}</span>
      <button onclick="creaLogout()" style="background:rgba(255,255,255,.12);border:none;border-radius:8px;padding:5px 11px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Salir</button>
    `;
    header.appendChild(div);
  };

  /* ── Inicialización automática ── */
  document.addEventListener('DOMContentLoaded', async function () {
    const user = await window.creaCheckAuth();
    if (user) window.creaInjectUser(user);
  });
})();
