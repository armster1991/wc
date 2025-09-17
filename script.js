/* Estado global */
const state = {
  baseAngle: 70,
  windStrength: null,   // 1..26
  directionIndex: null, // 0..7 (N, NE, E, SE, S, SW, W, NW)
  distanceQuarter: null // 1..4 (RDP) — não afeta o cálculo, só UI
};

/* Direções (8 em sentido horário começando no Norte) */
const DIRECTIONS = [
  { key: "N",  label: "↑ N", side: "neutral" },
  { key: "NE", label: "↗ NE", side: "right" },
  { key: "E",  label: "→ L", side: "right" },
  { key: "SE", label: "↘ SE", side: "right" },
  { key: "S",  label: "↓ S", side: "neutral" },
  { key: "SW", label: "↙ SW", side: "left" },
  { key: "W",  label: "← O", side: "left" },
  { key: "NW", label: "↖ NW", side: "left" }
];

/* Regras do wind chart (fixas, conforme especificação) */
const RULES = {
  // Neutros: mantêm 70°
  "N":   { type: "neutral" },
  "S":   { type: "neutral" },

  // NE: /2, depois /2 do resultado e soma os dois; se vento > 11, -1 no ajuste; soma no ângulo
  "NE":  { type: "custom", exec: (wind) => {
            const a1 = wind / 2;
            const a2 = a1 / 2;
            let adj = a1 + a2;
            if (wind > 11) adj -= 1;
            return Math.max(0, adj);
          } },

  // E: /2 e soma; exceção: {9,10,11,19,20,21} => /10
  "E":   { type: "divList", rightDiv: 2, list: [9,10,11,19,20,21], listDiv: 10 },

  // SE: /4 e soma
  "SE":  { type: "simpleDiv", div: 4 },

  // SW: /2 e subtrai; exceção: {9,10,11,29,20,21} => /10 (mantido como você escreveu)
  "SW":  { type: "divList", rightDiv: 2, list: [9,10,11,29,20,21], listDiv: 10 },

  // W: /2 e subtrai; exceção: {9,10,11,19,20,21} => /10
  "W":   { type: "divList", rightDiv: 2, list: [9,10,11,19,20,21], listDiv: 10 },

  // NW: /3 e subtrai; se vento > 12, -1 no ajuste; se vento >= 25, -2 no ajuste
  "NW":  { type: "divWithThresholds", div: 3,
           thresholds: [
             { cond: (w) => w > 12,  delta: -1 },
             { cond: (w) => w >= 25, delta: -2 }
           ] }
};

/* Utils */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function fmt(n) {
  if (Number.isFinite(n)) return String(Math.round(n)); // exibir ângulo inteiro (ex.: 83)
  return "—";
}

/* Inicialização da UI */
document.addEventListener("DOMContentLoaded", () => {
  buildWCSvg8();
  buildWindSelectors();
  initRDP();
  updatePanel(state.baseAngle);
});

/* Construção da rosa dos ventos (8 setores) com offset corrigido */
function buildWCSvg8() {
  const svg = document.getElementById("wcSvg");
  const cx = 225, cy = 225, r = 215, inner = 70;
  const sectors = 8;
  const sweep = (2 * Math.PI) / sectors;

  // Definições de gradiente
  svg.appendChild(defs());

  // Disco externo
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bg.setAttribute("cx", cx); bg.setAttribute("cy", cy); bg.setAttribute("r", r);
  bg.setAttribute("fill", "url(#gradBg)");
  bg.setAttribute("stroke", "rgba(36,48,64,0.85)");
  svg.appendChild(bg);

  for (let i = 0; i < sectors; i++) {
    // Offset corrigido para alinhar Norte/Sul perfeitamente
    const start = -Math.PI / 2 + i * sweep - (sweep / 2);
    const end   = start + sweep;

    const outer1 = polar(cx, cy, r, start);
    const outer2 = polar(cx, cy, r, end);
    const inner1 = polar(cx, cy, inner, start);
    const inner2 = polar(cx, cy, inner, end);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = [
      "M", inner1.x, inner1.y,
      "L", outer1.x, outer1.y,
      "A", r, r, 0, 0, 1, outer2.x, outer2.y,
      "L", inner2.x, inner2.y,
      "A", inner, inner, 0, 0, 0, inner1.x, inner1.y,
      "Z"
    ].join(" ");
    path.setAttribute("d", d);
    path.setAttribute("fill", i % 2 === 0 ? "rgba(98,196,255,0.08)" : "rgba(98,196,255,0.04)");
    path.setAttribute("stroke", "rgba(36,48,64,0.85)");
    path.setAttribute("data-dir-index", i);
    path.style.cursor = "pointer";
    path.style.transition = "fill 0.15s ease, opacity 0.15s ease";

    const over = () => { selectDirection(i); };
    path.addEventListener("mouseover", over);
    path.addEventListener("click", over);
    path.addEventListener("touchstart", (e) => { e.preventDefault(); over(); }, {passive: false});

    svg.appendChild(path);

    // Rótulos (N, NE, E, SE, S, SW, W, NW)
    const mid = (start + end) / 2;
    const labelPos = polar(cx, cy, (r + inner) / 2, mid);
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", labelPos.x);
    lbl.setAttribute("y", labelPos.y + 4);
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("font-size", "14");
    lbl.setAttribute("fill", "rgba(231,236,243,0.82)");
    lbl.style.pointerEvents = "none";
    lbl.textContent = DIRECTIONS[i].key;
    svg.appendChild(lbl);
  }

  // Anel interno
  const innerRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  innerRing.setAttribute("cx", cx); innerRing.setAttribute("cy", cy); innerRing.setAttribute("r", inner);
  innerRing.setAttribute("fill", "rgba(10,14,20,0.9)");
  innerRing.setAttribute("stroke", "rgba(36,48,64,0.95)");
  svg.appendChild(innerRing);
}

function defs() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const lg = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
  lg.setAttribute("id", "gradBg");
  lg.setAttribute("cx", "50%");
  lg.setAttribute("cy", "50%");
  lg.setAttribute("r", "50%");
  const s1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  s1.setAttribute("offset", "0%");
  s1.setAttribute("stop-color", "rgba(98,196,255,0.08)");
  const s2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  s2.setAttribute("offset", "100%");
  s2.setAttribute("stop-color", "rgba(98,196,255,0.02)");
  lg.appendChild(s1); lg.appendChild(s2);
  defs.appendChild(lg);
  return defs;
}

function polar(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/* Seletores de vento (1..26) */
function buildWindSelectors() {
  const leftCol = document.getElementById("windLeftCol");
  const rightCol = document.getElementById("windRightCol");

  for (let n = 1; n <= 26; n++) {
    const el = document.createElement("div");
    el.className = "wind-btn";
    el.tabIndex = 0;
    el.textContent = n;
    el.dataset.value = n;

    const set = () => { selectWindStrength(n); };
    el.addEventListener("mouseenter", set);
    el.addEventListener("mousemove", set);
    el.addEventListener("click", set);
    el.addEventListener("touchstart", (e) => { e.preventDefault(); set(); }, {passive: false});

    if (n <= 13) leftCol.appendChild(el);
    else rightCol.appendChild(el);
  }
}

/* RDP (hover cumulativo estável, sem "piscar") */
function initRDP() {
  const rdp = document.getElementById("rdp");
  const segs = Array.from(rdp.querySelectorAll(".rdp-segment"));

  let lastIdx = -1;
  const setHover = (idx) => {
    if (idx === lastIdx) return; // evita redesenhos
    lastIdx = idx;
    rdp.style.setProperty("--hover-n", String(idx + 1));
    segs.forEach((s, i) => s.classList.toggle("hovered", i === idx));
    selectDistance(idx + 1);
  };

  segs.forEach((seg, idx) => {
    const handler = () => setHover(idx);
    seg.addEventListener("mouseover", handler);
    seg.addEventListener("click", handler);
    seg.addEventListener("touchstart", (e) => { e.preventDefault(); handler(); }, {passive: false});
  });
}

/* Handlers de seleção */
function selectDirection(i) {
  state.directionIndex = i;
  document.getElementById("dirLabel").textContent = DIRECTIONS[i].label;
  highlightSector(i);
  compute();
}

function selectWindStrength(n) {
  state.windStrength = n;
  document.getElementById("windStrength").textContent = n;
  document.querySelectorAll(".wind-btn").forEach(b => b.classList.toggle("active", Number(b.dataset.value) === n));
  compute();
}

function selectDistance(q) {
  state.distanceQuarter = q;
  document.getElementById("rdpLabel").textContent = `${q}/4`;
  const segs = document.querySelectorAll(".rdp-segment");
  segs.forEach((s, i) => {
    s.classList.toggle("active", i + 1 === q);
    s.classList.toggle("active-left", i + 1 <= q);
  });
  // A distância não influencia o cálculo neste projeto.
}

/* Destaque visual do setor selecionado */
function highlightSector(index) {
  const paths = document.querySelectorAll("#wcSvg path");
  paths.forEach((p, i) => {
    p.style.opacity = (i === index ? "1.0" : "0.85");
    p.setAttribute("fill", i === index ? "rgba(127,216,255,0.24)" : (i % 2 === 0 ? "rgba(98,196,255,0.08)" : "rgba(98,196,255,0.04)"));
  });
}

/* Atualização de painel e centro da WC */
function updatePanel(angle) {
  const a = angle != null ? clamp(angle, 0, 90) : state.baseAngle;
  const aText = fmt(a);
  document.getElementById("baseAngle").textContent = state.baseAngle;
  document.getElementById("correctedAngle").textContent = aText;
  const centerEl = document.getElementById("wcCenterAngle");
  if (centerEl) centerEl.textContent = `${aText}°`;
}

/* Cálculo do ângulo corrigido */
function compute() {
  const w = state.windStrength;
  const d = state.directionIndex;

  if (d == null) { updatePanel(state.baseAngle); return; }
  const dir = DIRECTIONS[d];

  if (!dir || dir.side === "neutral") {
    updatePanel(state.baseAngle);
    return;
  }
  if (w == null) {
    updatePanel(state.baseAngle);
    return;
  }

  const key = dir.key; // "NE", "E", etc.
  const rule = RULES[key];
  if (!rule) {
    updatePanel(state.baseAngle);
    return;
  }

  let adjustment = 0;
  switch (rule.type) {
    case "neutral":
      adjustment = 0;
      break;

    case "custom": // NE
      adjustment = rule.exec(w);
      break;

    case "simpleDiv": // SE
      adjustment = w / rule.div;
      break;

    case "divList": { // E, W, SW com exceções
      const useList = rule.list && rule.list.includes(w);
      const div = useList ? rule.listDiv : rule.rightDiv;
      adjustment = w / div;
      break;
    }

    case "divWithThresholds": { // NW
      adjustment = w / rule.div;
      if (Array.isArray(rule.thresholds)) {
        for (const th of rule.thresholds) {
          if (th.cond && th.cond(w)) {
            adjustment += th.delta; // delta negativo => reduz ajuste
          }
        }
      }
      adjustment = Math.max(0, adjustment);
      break;
    }

    default:
      adjustment = 0;
  }

  const base = state.baseAngle;
  const finalAngle = (dir.side === "left") ? (base - adjustment) : (base + adjustment);
  updatePanel(finalAngle);
}
