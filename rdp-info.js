// === RDP Info Plug-and-Play (posição estimada) ===
document.addEventListener('DOMContentLoaded', () => {
  const labelEl = document.querySelector('#rdpLabel');
  if (!labelEl) return;

  function updateRDPLabel() {
    const active = document.querySelector('.rdp-segment.active');
    if (!active) {
      labelEl.textContent = '—';
      return;
    }

    const index = parseInt(active.dataset.index);
    let posText = '—';

    if (index >= 0 && index <= 7) {
      posText = '1/4 Tela';
    } else if (index >= 8 && index <= 15) {
      posText = 'Meia Tela';
    } else if (index >= 16 && index <= 23) {
      posText = '3/4 Tela';
    } else if (index >= 24 && index <= 29) {
      posText = 'Uma Tela';
    }

    labelEl.textContent = posText;
  }

  // Atualiza a cada 200ms
  setInterval(updateRDPLabel, 200);
});
