// === Força Info Plug-and-Play (com ajuste N/S e overcap - atualizado) ===
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
  infoEl.textContent = 'USE FORÇA: 2.4';
  document.body.appendChild(infoEl);

  function updateForceInfo() {
    const centerEl = document.getElementById('wcCenterAngle');
    const dirText = document.getElementById('dirLabel')?.textContent || '';
    const windStr = parseInt(document.getElementById('windStrength')?.textContent) || 0;

    // Se estiver em overcap, mostra aviso
    if (centerEl && centerEl.classList.contains('overcap')) {
      infoEl.textContent = 'AJUSTE A FORÇA';
      return;
    }

    // Base fixa
    let force = 2.4;

    // Ajuste para Norte (reduz)
    if (/↑\s*N/i.test(dirText)) {
      const steps = Math.floor(windStr / 7);
      force -= steps * 0.1;
    }

    // Ajuste para Sul (aumenta)
    else if (/↓\s*S/i.test(dirText)) {
      const steps = Math.floor(windStr / 7);
      force += steps * 0.1;
    }

    infoEl.textContent = `USE FORÇA: ${force.toFixed(1)}`;
  }

  // Atualiza a cada 200ms
  setInterval(updateForceInfo, 200);
});
