# 🌬️ Windchart Interativo — Gunbound Gravity Game Hub

Este projeto é uma **versão interativa** dos famosos *windcharts* que circulam pela internet para o jogo **Gunbound Gravity Game Hub**.  
Ele foi pensado principalmente para **treino com o Mobile Armor**, mas pode ser útil para outros mobiles também.

---

## 📌 Como funciona

Você interage com três elementos principais:

1. **Régua de Posição (RDP)** — localizada no rodapé da tela.  
   Aqui você indica **onde o alvo está** em relação a você (1/4, 2/4, 3/4 ou 4/4 da distância máxima).

2. **Seletores de Força do Vento (SDFV)** — botões numerados de 1 a 26 nas laterais da tela.  
   Eles representam a intensidade do vento.

3. **Rosa dos Ventos (WC)** — no centro da tela.  
   Aqui você escolhe a **direção do vento**.

Ao selecionar **posição**, **força** e **direção**, a página calcula e exibe:

- O **ângulo sugerido** (base 70° para a maioria das direções)
- A **força sugerida** para o tiro

---

## 🧭 Direções e comportamento

As direções são divididas em **a favor** e **contra**:

- **A favor**:  
  - Leste → `→`  
  - Nordeste ↗ `↗`  
  - Sudeste ↘ `↘`  
  Nessas direções, o vento ajuda o projétil, então o cálculo **soma** ao ângulo base.

- **Contra**:  
  - Oeste ← `←`  
  - Noroeste ↖ `↖`  
  - Sudoeste ↙ `↙`  
  Nessas direções, o vento atrapalha, então o cálculo **subtrai** do ângulo base.

- **Especiais**:  
  - Norte ↑ `↑`  
  - Sul ↓ `↓`  
  Nessas direções, **não há ajuste no ângulo** — o ajuste é feito na **força**:
    - **Norte**: para cada 5 de vento, **+0.1** de força  
    - **Sul**: para cada 8 de vento, **+0.1** de força

---

## 🔄 Importante sobre a posição do jogador

Sempre pense na direção do vento **em relação ao alvo**.  
Se você estiver **à direita do alvo**, deve **inverter mentalmente** as direções do vento para fazer o cálculo correto.

---

## ⚠️ Aviso importante

Este projeto está **em fase de testes** — repito: **EM FASE DE TESTES**.  
Ele pode conter erros, ajustes pendentes e comportamentos inesperados.  
Não me responsabilizo pelo uso nem por possíveis tiros errados que você possa dar ao utilizá-lo.

---

## 📖 Resumo do uso

1. **Selecione na RDP** onde o alvo está (1/4 até 4/4 da distância).  
2. **Escolha a intensidade do vento** nos botões laterais (1 a 26).  
3. **Selecione a direção do vento** na rosa dos ventos.  
4. A página mostrará o **ângulo sugerido** e a **força sugerida** para o tiro.

---

## 🛠️ Status do projeto

- **Fase de testes** (sim, de novo 😄)  
- Ainda precisa de ajustes finos nos cálculos e na interface  
- Foco inicial no **Mobile Armor** para treino

---

## 📚 Quer aprender mais?

Se quiser se aprofundar em como funcionam os *windcharts* no Gunbound, recomendo pesquisar no fórum do **GBGL do Creedo** — lá você encontra informações detalhadas, tabelas e discussões da comunidade.

---

## 🎯 Sobre

Este é um **windchart interativo** para o jogo **Gunbound Gravity Game Hub**, criado para facilitar o treino e estudo de cálculos de vento e ângulo de tiro.
