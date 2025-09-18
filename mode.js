document.addEventListener('DOMContentLoaded', () => {
  // Cria o botão
  const btn = document.createElement('button');
  btn.id = 'modeToggleBtn';
  btn.textContent = 'Change Mode';
  document.body.appendChild(btn);

  // Estilo do botão (mesma fonte/efeito do resto)
  const style = document.createElement('style');
  style.textContent = `
    #modeToggleBtn {
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      font-family: "Orbitron", sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      background: linear-gradient(180deg, #0f1522, #0a0f1a);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      outline: 2px solid var(--metal);
      animation: breathe 3.4s ease-in-out infinite;
      z-index: 10000;
    }
    #modeToggleBtn:hover {
      border-color: var(--accent);
      background: linear-gradient(180deg, #142238, #0c1626);
    }
  `;
  document.head.appendChild(style);

  // Cria link para o gamemode.css (desativado por padrão)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'gamemode.css';
  link.disabled = true;
  document.head.appendChild(link);

  // Função para unificar SDFV no gamemode
  function unifySDFV() {
    const leftCol = document.querySelector('.wind-selectors.left .wind-col');
    const rightCol = document.querySelector('.wind-selectors.right .wind-col');
    if (leftCol && rightCol) {
      // Move todos os botões da direita para o final da coluna da esquerda
      [...rightCol.children].forEach(btn => leftCol.appendChild(btn));
    }
  }

  // Função para restaurar layout original
  function restoreSDFV() {
    const leftCol = document.querySelector('.wind-selectors.left .wind-col');
    const rightCol = document.querySelector('.wind-selectors.right .wind-col');
    if (leftCol && rightCol) {
      // Recria a separação 1–13 e 14–26
      [...leftCol.children].forEach(btn => {
        const val = parseInt(btn.dataset.value);
        if (val >= 14) rightCol.appendChild(btn);
      });
    }
  }

  // Alterna entre normal e gamemode
  let gameModeOn = false;
  btn.addEventListener('click', () => {
    gameModeOn = !gameModeOn;
    link.disabled = !gameModeOn;
    btn.textContent = gameModeOn ? 'Overlay Mode' : 'Display Mode';
    if (gameModeOn) {
      unifySDFV();
    } else {
      restoreSDFV();
    }
  });
});
