/* ================================================================
   Vigía IA — Asistente flotante SST
   Se inyecta en todas las páginas de Vigía 360.
   Requiere VigiaAPI cargado previamente.
   ================================================================ */
(function () {
  'use strict';

  // ── Estilos ────────────────────────────────────────────────────
  const CSS = `
  @media print {
    #vigia-chat-btn, #vigia-chat-panel { display: none !important; }
  }
  #vigia-chat-btn {
    position:fixed;bottom:24px;right:24px;z-index:9000;
    width:58px;height:58px;border-radius:50%;
    background:linear-gradient(145deg,#1E3A5F,#2E86AB);
    border:none;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.35);
    display:flex;align-items:center;justify-content:center;
    transition:transform .2s,box-shadow .2s;
    color:white;font-family:inherit;padding:0;overflow:hidden
  }
  #vigia-chat-btn:hover { transform:scale(1.09);box-shadow:0 7px 24px rgba(0,0,0,.4) }
  #vigia-chat-btn svg { width:44px;height:44px;display:block }
  #vigia-chat-btn .badge {
    position:absolute;top:-3px;right:-3px;
    background:#4ADE80;color:#0F172A;font-size:9px;font-weight:800;
    border-radius:50%;width:17px;height:17px;
    display:flex;align-items:center;justify-content:center;
    border:2px solid white;display:none
  }

  #vigia-chat-panel {
    position:fixed;bottom:86px;right:24px;z-index:9000;
    width:340px;max-width:calc(100vw - 32px);
    background:#fff;border-radius:14px;
    box-shadow:0 8px 40px rgba(0,0,0,.22);
    display:none;flex-direction:column;overflow:hidden;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    border:1.5px solid #E2E8F0;
    animation:chatSlideIn .22s ease
  }
  @media(prefers-color-scheme:dark){
    #vigia-chat-panel { background:#1E293B;border-color:#334155 }
  }
  @keyframes chatSlideIn {
    from { opacity:0;transform:translateY(12px) }
    to   { opacity:1;transform:translateY(0) }
  }
  #vigia-chat-panel.open { display:flex }

  .vc-header {
    background:linear-gradient(135deg,#1E3A5F,#2E86AB);
    color:white;padding:12px 14px;
    display:flex;align-items:center;gap:10px;
    border-radius:13px 13px 0 0
  }
  .vc-avatar {
    width:38px;height:38px;border-radius:50%;
    background:rgba(255,255,255,.15);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden
  }
  .vc-avatar svg { width:34px;height:34px;display:block }
  .vc-header-info { flex:1;min-width:0 }
  .vc-title { font-size:13px;font-weight:800;line-height:1 }
  .vc-sub   { font-size:10px;opacity:.8;margin-top:2px }
  .vc-close {
    background:none;border:none;color:rgba(255,255,255,.7);
    font-size:18px;cursor:pointer;padding:0;line-height:1;flex-shrink:0
  }
  .vc-close:hover { color:white }

  .vc-messages {
    flex:1;overflow-y:auto;padding:14px 12px;
    display:flex;flex-direction:column;gap:10px;
    min-height:280px;max-height:380px;
    background:#F8FAFC
  }
  @media(prefers-color-scheme:dark){ .vc-messages { background:#0F172A } }

  .vc-msg {
    display:flex;flex-direction:column;max-width:88%
  }
  .vc-msg.user { align-self:flex-end;align-items:flex-end }
  .vc-msg.bot  { align-self:flex-start;align-items:flex-start }

  .vc-bubble {
    padding:8px 12px;border-radius:12px;font-size:12.5px;line-height:1.55;
    word-break:break-word;white-space:pre-wrap
  }
  .vc-msg.user .vc-bubble {
    background:linear-gradient(135deg,#1E3A5F,#2E86AB);color:white;
    border-radius:12px 12px 2px 12px
  }
  .vc-msg.bot .vc-bubble {
    background:white;color:#0F172A;
    border:1px solid #E2E8F0;border-radius:2px 12px 12px 12px;
    box-shadow:0 1px 4px rgba(0,0,0,.06)
  }
  @media(prefers-color-scheme:dark){
    .vc-msg.bot .vc-bubble { background:#1E293B;color:#E2E8F0;border-color:#334155 }
  }

  .vc-time {
    font-size:9px;color:#94A3B8;margin-top:3px;padding:0 2px
  }

  .vc-typing {
    display:flex;align-items:center;gap:4px;padding:8px 12px;
    background:white;border:1px solid #E2E8F0;border-radius:2px 12px 12px 12px;
    max-width:70px
  }
  @media(prefers-color-scheme:dark){ .vc-typing { background:#1E293B;border-color:#334155 } }
  .vc-dot {
    width:6px;height:6px;border-radius:50%;background:#94A3B8;
    animation:vcDot 1.2s infinite ease-in-out
  }
  .vc-dot:nth-child(2) { animation-delay:.2s }
  .vc-dot:nth-child(3) { animation-delay:.4s }
  @keyframes vcDot {
    0%,60%,100% { transform:translateY(0);opacity:.6 }
    30% { transform:translateY(-5px);opacity:1 }
  }

  .vc-footer {
    border-top:1.5px solid #E2E8F0;padding:10px 12px;
    background:white;border-radius:0 0 13px 13px;
    display:flex;gap:8px;align-items:flex-end
  }
  @media(prefers-color-scheme:dark){
    .vc-footer { background:#1E293B;border-color:#334155 }
  }
  .vc-input {
    flex:1;border:1.5px solid #E2E8F0;border-radius:8px;
    padding:8px 10px;font-size:12.5px;font-family:inherit;
    resize:none;outline:none;line-height:1.4;max-height:80px;
    background:#F8FAFC;color:#0F172A;transition:border-color .15s
  }
  .vc-input:focus { border-color:#2E86AB }
  @media(prefers-color-scheme:dark){
    .vc-input { background:#0F172A;color:#E2E8F0;border-color:#334155 }
    .vc-input:focus { border-color:#2E86AB }
  }
  .vc-send {
    background:linear-gradient(135deg,#1E3A5F,#2E86AB);
    color:white;border:none;border-radius:8px;
    width:36px;height:36px;cursor:pointer;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;transition:opacity .15s
  }
  .vc-send:hover { opacity:.88 }
  .vc-send:disabled { opacity:.45;cursor:not-allowed }

  .vc-suggestions {
    display:flex;gap:5px;flex-wrap:wrap;padding:0 12px 8px;
    background:white
  }
  @media(prefers-color-scheme:dark){ .vc-suggestions { background:#1E293B } }
  .vc-chip {
    font-size:10.5px;padding:3px 9px;border-radius:20px;
    border:1px solid #CBD5E1;color:#475569;background:#F8FAFC;
    cursor:pointer;transition:all .12s;font-family:inherit
  }
  .vc-chip:hover { background:#1E3A5F;color:white;border-color:#1E3A5F }
  @media(prefers-color-scheme:dark){
    .vc-chip { background:#0F172A;color:#94A3B8;border-color:#334155 }
    .vc-chip:hover { background:#1E3A5F;color:white }
  }
  `;

  const SUGERENCIAS = [
    '¿Qué pide la Res. 0312 según el tamaño de empresa?',
    '¿Cómo hacer elecciones del COPASST?',
    '¿Cómo investigar un accidente de trabajo?',
    '¿Cómo calcular el índice de frecuencia AT?',
    '¿Qué cubre la ARL en caso de accidente?',
    '¿Qué es el riesgo psicosocial y cómo evaluarlo?',
    '¿Cuándo se aplica la Res. 1409 de trabajo en alturas?',
    '¿Qué sanciones hay por incumplimiento SST?',
  ];

  const MSG_BIENVENIDA = `¡Hola! Soy **Vigía IA**, tu asistente especializado en SST colombiano. 🦺

Puedo ayudarte con:
• Normativa (Decreto 1072, Res. 0312, Ley 1562)
• COPASST, investigación AT/EL, matrices de riesgo
• Indicadores, presupuesto, capacitaciones

¿En qué te puedo ayudar hoy?`;

  // ── Avatar SVG — Profesional SST con casco y chaleco reflectivo ─
  const AVATAR_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <!-- Cuerpo + chaleco reflectivo naranja -->
    <path d="M8 64 L8 46 Q16 42 32 40 Q48 42 56 46 L56 64 Z" fill="#E8680A"/>
    <!-- Franja reflectiva superior (plata/amarillo) -->
    <rect x="8" y="50" width="48" height="4.5" rx="0.5" fill="#F5E642" opacity=".97"/>
    <!-- Franja reflectiva inferior -->
    <rect x="8" y="58" width="48" height="3.5" rx="0.5" fill="#F5E642" opacity=".9"/>
    <!-- Solapa chaleco (V-neck) -->
    <path d="M22 40 L32 50 L42 40" fill="#CC5A06" stroke="#B04F05" stroke-width=".5"/>
    <!-- Cuello -->
    <rect x="27" y="33" width="10" height="10" rx="3" fill="#F0A070"/>
    <!-- Cabeza/cara -->
    <circle cx="32" cy="27" r="14" fill="#F0A070"/>
    <!-- Orejas -->
    <ellipse cx="18.5" cy="27" rx="2.2" ry="3" fill="#E8956A"/>
    <ellipse cx="45.5" cy="27" rx="2.2" ry="3" fill="#E8956A"/>
    <!-- Ceja izquierda -->
    <path d="M23 22 Q26.5 20.5 28 22" stroke="#7A4A2A" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <!-- Ceja derecha -->
    <path d="M36 22 Q37.5 20.5 41 22" stroke="#7A4A2A" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <!-- Ojos -->
    <ellipse cx="27" cy="26" rx="2.5" ry="2.8" fill="#2C1800"/>
    <ellipse cx="37" cy="26" rx="2.5" ry="2.8" fill="#2C1800"/>
    <!-- Brillo ojos -->
    <circle cx="28.1" cy="24.9" r=".9" fill="white" opacity=".9"/>
    <circle cx="38.1" cy="24.9" r=".9" fill="white" opacity=".9"/>
    <!-- Nariz -->
    <path d="M31 29 Q32 31 33 29" stroke="#C07850" stroke-width="1" fill="none" stroke-linecap="round"/>
    <!-- Sonrisa -->
    <path d="M26.5 32 Q32 36.5 37.5 32" stroke="#B06040" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <!-- Casco de seguridad amarillo -->
    <!-- Domo del casco -->
    <path d="M18 27 Q18.5 10 32 8 Q45.5 10 46 27 Z" fill="#FFD600"/>
    <!-- Reflejos del casco -->
    <path d="M21 20 Q24 13 32 11" stroke="#FFE84D" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>
    <!-- Visera del casco -->
    <rect x="15" y="25" width="34" height="5" rx="2.5" fill="#FFC000"/>
    <!-- Borde inferior visera -->
    <rect x="15" y="28.5" width="34" height="1.5" rx=".5" fill="#E6A800" opacity=".7"/>
    <!-- Cresta/nervio superior del casco -->
    <path d="M29.5 9 Q32 7 34.5 9" stroke="#E6B800" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  </svg>`;

  // ── Estado ──────────────────────────────────────────────────────
  let isOpen      = false;
  let isLoading   = false;
  let messages    = [];      // [{role, content}]
  let panel, messagesDiv, input, sendBtn, typingEl;

  // ── Inyectar estilos ────────────────────────────────────────────
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── Construir DOM ───────────────────────────────────────────────
  function buildWidget() {
    // Botón flotante
    const btn = document.createElement('button');
    btn.id = 'vigia-chat-btn';
    btn.title = 'Vigía IA — Asesor SST';
    btn.innerHTML = AVATAR_SVG + '<span class="badge" id="vc-badge"></span>';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);

    // Panel
    panel = document.createElement('div');
    panel.id = 'vigia-chat-panel';
    panel.innerHTML = `
      <div class="vc-header">
        <div class="vc-avatar">${AVATAR_SVG}</div>
        <div class="vc-header-info">
          <div class="vc-title">Vigía IA · Asesor SST</div>
          <div class="vc-sub">Decreto 1072 · Res. 0312 · ARL</div>
        </div>
        <button class="vc-close" id="vc-close" title="Cerrar">✕</button>
      </div>
      <div class="vc-messages" id="vc-messages"></div>
      <div class="vc-suggestions" id="vc-chips"></div>
      <div class="vc-footer">
        <textarea class="vc-input" id="vc-input" rows="1"
          placeholder="Escribe tu pregunta SST…"></textarea>
        <button class="vc-send" id="vc-send" title="Enviar">➤</button>
      </div>`;
    document.body.appendChild(panel);

    messagesDiv = document.getElementById('vc-messages');
    input       = document.getElementById('vc-input');
    sendBtn     = document.getElementById('vc-send');

    document.getElementById('vc-close').addEventListener('click', closePanel);
    sendBtn.addEventListener('click', enviar);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    });

    // Chips de sugerencias
    const chipsDiv = document.getElementById('vc-chips');
    SUGERENCIAS.forEach(s => {
      const chip = document.createElement('button');
      chip.className = 'vc-chip';
      chip.textContent = s;
      chip.addEventListener('click', () => {
        input.value = s;
        chipsDiv.style.display = 'none';
        enviar();
      });
      chipsDiv.appendChild(chip);
    });

    // Mensaje de bienvenida (solo visual, no se envía al backend)
    appendMsg('bot', MSG_BIENVENIDA, false);
  }

  // ── Toggle / open / close ───────────────────────────────────────
  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    document.getElementById('vc-badge').style.display = 'none';
    setTimeout(() => input.focus(), 150);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
  }

  // ── Render mensaje ──────────────────────────────────────────────
  function appendMsg(role, content, addToHistory = true) {
    if (addToHistory) messages.push({ role, content });

    const wrap = document.createElement('div');
    wrap.className = `vc-msg ${role === 'user' ? 'user' : 'bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'vc-bubble';
    // Renderizado simple de markdown: **negrita**, listas con •
    bubble.innerHTML = mdToHtml(content);

    const time = document.createElement('div');
    time.className = 'vc-time';
    time.textContent = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });

    wrap.appendChild(bubble);
    wrap.appendChild(time);
    messagesDiv.appendChild(wrap);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    return wrap;
  }

  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'vc-msg bot';
    typingEl.innerHTML = '<div class="vc-typing"><div class="vc-dot"></div><div class="vc-dot"></div><div class="vc-dot"></div></div>';
    messagesDiv.appendChild(typingEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  // ── Enviar mensaje ──────────────────────────────────────────────
  async function enviar() {
    const texto = input.value.trim();
    if (!texto || isLoading) return;

    // Ocultar sugerencias tras primer mensaje
    const chips = document.getElementById('vc-chips');
    if (chips) chips.style.display = 'none';

    input.value = '';
    input.style.height = 'auto';
    appendMsg('user', texto);

    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const token = typeof VigiaAPI !== 'undefined' ? VigiaAPI.token() : '';
      const API   = typeof VIGIA_API !== 'undefined' ? VIGIA_API : 'https://riesgo-backend-production.up.railway.app/api/vigia';

      const resp = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages }),
      });

      hideTyping();

      if (resp.status === 401) {
        appendMsg('bot', 'Debes iniciar sesión para usar el asistente IA.', false);
      } else if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        appendMsg('bot', `Error: ${err.error || 'No se pudo contactar al asistente. Intenta de nuevo.'}`, false);
      } else {
        const data = await resp.json();
        appendMsg('bot', data.respuesta || 'Sin respuesta del asistente.');
      }
    } catch (e) {
      hideTyping();
      appendMsg('bot', 'Sin conexión. Verifica tu red e intenta de nuevo.', false);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Markdown básico ─────────────────────────────────────────────
  function mdToHtml(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/^•\s/gm, '• ')
      .replace(/^[-•]\s(.+)/gm, '• $1')
      .replace(/\n/g, '<br>');
  }

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
