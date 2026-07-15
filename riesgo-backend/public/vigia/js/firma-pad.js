// Pad de firma electrónica — Vigía SST
const FirmaPad = (() => {
  let _resolve = null, _ctx = null, _canvas = null, _drawing = false, _hasStrokes = false;

  function _getPos(e) {
    const rect = _canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (_canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (_canvas.height / rect.height),
    };
  }

  function _limpiar()   { _ctx.clearRect(0, 0, _canvas.width, _canvas.height); _hasStrokes = false; }
  function _cancelar()  { document.getElementById('_fp-overlay')?.remove(); if (_resolve) { _resolve(null); _resolve = null; } }
  function _confirmar() {
    if (!_hasStrokes) { alert('Por favor firme en el recuadro antes de confirmar.'); return; }
    const b64 = _canvas.toDataURL('image/png');
    document.getElementById('_fp-overlay')?.remove();
    if (_resolve) { _resolve(b64); _resolve = null; }
  }

  function abrir({ titulo = 'Firma digital', subtitulo = '' } = {}) {
    return new Promise(resolve => {
      _resolve = resolve;
      const ov = document.createElement('div');
      ov.id = '_fp-overlay';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
      ov.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:26px 22px;width:500px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,.28)">
          <h3 style="font-size:15px;font-weight:800;color:#1A3A5C;margin:0 0 4px">✍️ ${titulo}</h3>
          <p style="font-size:12px;color:#64748B;margin:0 0 14px">${subtitulo || 'Firme en el recuadro con el dedo o el mouse.'}</p>
          <div style="border:2px dashed #CBD5E1;border-radius:10px;background:#FAFBFC;position:relative">
            <canvas id="_fp-canvas" style="display:block;width:100%;height:160px;border-radius:8px;touch-action:none;cursor:crosshair"></canvas>
            <span style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:10px;color:#94A3B8;pointer-events:none;white-space:nowrap">── Firme aquí ──</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px">
            <button id="_fp-limpiar"  style="font-size:12px;padding:7px 14px;border:1.5px solid #CBD5E1;border-radius:7px;background:none;cursor:pointer;color:#64748B;font-family:inherit">🗑 Limpiar</button>
            <div style="display:flex;gap:8px">
              <button id="_fp-cancelar" style="font-size:12px;padding:7px 16px;border:1.5px solid #CBD5E1;border-radius:7px;background:none;cursor:pointer;font-family:inherit;color:#374151">Cancelar</button>
              <button id="_fp-ok"       style="font-size:12px;padding:7px 20px;border-radius:7px;background:#1A3A5C;color:#fff;border:none;cursor:pointer;font-weight:700;font-family:inherit">✅ Confirmar firma</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(ov);

      _canvas = document.getElementById('_fp-canvas');
      _canvas.width = 456; _canvas.height = 160;
      _ctx = _canvas.getContext('2d');
      _ctx.strokeStyle = '#1E293B';
      _ctx.lineWidth   = 2;
      _ctx.lineCap     = 'round';
      _ctx.lineJoin    = 'round';
      _drawing    = false;
      _hasStrokes = false;

      const start = e => { e.preventDefault(); _drawing = true; const p = _getPos(e); _ctx.beginPath(); _ctx.moveTo(p.x, p.y); };
      const move  = e => { e.preventDefault(); if (!_drawing) return; const p = _getPos(e); _ctx.lineTo(p.x, p.y); _ctx.stroke(); _hasStrokes = true; };
      const stop  = () => { _drawing = false; };

      _canvas.addEventListener('mousedown',  start);
      _canvas.addEventListener('mousemove',  move);
      _canvas.addEventListener('mouseup',    stop);
      _canvas.addEventListener('mouseleave', stop);
      _canvas.addEventListener('touchstart', start, { passive: false });
      _canvas.addEventListener('touchmove',  move,  { passive: false });
      _canvas.addEventListener('touchend',   stop);

      document.getElementById('_fp-limpiar').onclick  = _limpiar;
      document.getElementById('_fp-cancelar').onclick = _cancelar;
      document.getElementById('_fp-ok').onclick       = _confirmar;
    });
  }

  return { abrir };
})();
