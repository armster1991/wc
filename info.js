// === Força Info Plug-and-Play (versão segura) ===
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    #forcaInfo {
      position: fixed;
      bottom: 70px;
      left: 50%;
      transform: translateX(-50%);
      font-family: "Orbitron", sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #eaf6ff;
      text-shadow: 0 2px 0 rgba(0,0,0,0.5), 0 0 12px rgba(98,196,255,0.35);
      outline: 2px solid #7ecbff;
      border-radius: 8px;
      padding: 6px 14px;
      background: rgba(0,0,0,0.25);
      animation: breathe 3.4s ease-in-out infinite;
      pointer-events: none;
      z-index: 9999;
    }
    @keyframes breathe {
      0%, 100% { box-shadow: 0 0 0 2px rgba(126,203,255,0.6), 0 0 18px 2px rgba(98,196,255,0.15); }
      50% { box-shadow: 0 0 0 2px rgba(126,203,255,0.9), 0 0 26px 4px rgba(98,196,255,0.25); }
    }
  `;
  document.head.appendChild(style);

  const infoEl = document.createElement('div');
  infoEl.id = 'forcaInfo';
  infoEl.textContent = 'USE FORÇA: —';
  document.body.appendChild(infoEl);

  const baseForce = { 1: 1.4, 2: 2.1, 3: 2.5, 4: 2.9 };

  function updateForceInfo() {
    const posText = document.getElementById('rdpLabel')?.textContent || '';
    const dirText = document.getElementById('dirLabel')?.textContent || '';
    const windStr = parseInt(document.getElementById('windStrength')?.textContent) || 0;

    const match = posText.match(/(\d)\/4/);
    if (!match) {
      infoEl.textContent = 'USE FORÇA: —';
      return;
    }
    const pos = parseInt(match[1]);
    let force = baseForce[pos] ?? null;
    if (force == null) {
      infoEl.textContent = 'USE FORÇA: —';
      return;
    }

    // Ajustes para N e S
    if (/↑ N/i.test(dirText)) {
      force += (windStr / 5) * 0.1;
    } else if (/↓ S/i.test(dirText)) {
      force += (windStr / 8) * 0.1;
    }

    infoEl.textContent = `USE FORÇA: ${force.toFixed(1)}`;
  }

  // Atualiza a cada 200ms (leve e sem observer recursivo)
  setInterval(updateForceInfo, 200);
});
