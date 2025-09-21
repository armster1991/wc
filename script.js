/* Estado global */
const state = {
  rdpIndex: 0,           // 0..29
  baseAngle: 89,         // começa em 89°
  windStrength: null,    // 1..26
  directionIndex: null   // 0..7 (N, NE, E, SE, S, SW, W, NW)
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

/* Regras do wind chart (atualizadas) */
const RULES = {
  "N":   { type: "neutral" }, // ajuste de força no info.js
  "S":   { type: "neutral" }, // ajuste de força no info.js
  "NE":  { type: "custom", exec: (wind) => {
            const a1 = Math.floor(wind / 2);
            const a2 = Math.floor(a1 / 2);
            let adj = a1 + a2;
            if (wind >= 12) adj -= 1;
            return Math.max(0, adj);
          } },
  "E":   { type: "rangeAdd", div: 2, thresholds: [
            { cond: (w) => w > 18, delta: 2 },
            { cond: (w) => w > 7,  delta: 1 }
          ] },
  "SE":  { type: "simpleDiv", div: 4 },
  "SW":  { type: "swRule" }, // wind/2 + wind/10
  "W":   { type: "rangeAdd", div: 2, thresholds: [
            { cond: (w) => w > 18, delta: 2 },
            { cond: (w) => w > 7,  delta: 1 }
          ] },
  "NW":  { type: "divWithThresholds", div: 3,
           thresholds: [
             { cond: (w) => w >= 13, delta: -1 },
             { cond: (w) => w >= 25, delta: -2 }
           ] }
};

/* Utils */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function fmt(n) { return Number.isFinite(n) ? String(Math.round(n)) : "—"; }
function polar(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/* Inicialização */
document.addEventListener("DOMContentLoaded", () => {
  buildWCSvg8();
  buildWindSelectors();
  initRDP30();
  updatePanel(state.baseAngle);
  updateForceText(2.4);
});

/* Rosa dos ventos */
function buildWCSvg8() {
  const svg = document.getElementById("wcSvg");
  if (!svg) return;
  const cx = 225, cy = 225, r = 215, inner = 70;
  const sectors = 8;
  const sweep = (2 * Math.PI) / sectors;

  svg.innerHTML = "";
  svg.appendChild(defs());

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bg.setAttribute("cx", cx); bg.setAttribute("cy", cy); bg.setAttribute("r", r);
  bg.setAttribute("fill", "url(#gradBg)");
  bg.setAttribute("stroke", "rgba(36,48,64,0.85)");
  svg.appendChild(bg);

  for (let i = 0; i < sectors; i++) {
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
    path.style.cursor = "pointer";

    const over = () => { selectDirection(i); };
    path.addEventListener("mouseover", over);
    path.addEventListener("click", over);
    path.addEventListener("touchstart", (e) => { e.preventDefault(); over(); }, { passive: false });

    svg.appendChild(path);

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

/* Seletores de vento */
function buildWindSelectors() {
  const leftCol = document.getElementById("windLeftCol");
  const rightCol = document.getElementById("windRightCol");
  if (!leftCol || !rightCol) return;

  leftCol.innerHTML = "";
  rightCol.innerHTML = "";

  for (let n = 1; n <= 26; n++) {
    const el = document.createElement("div");
    el.className = "wind-btn";
    el.textContent = n;
    el.dataset.value = n;
    const set = () => { selectWindStrength(n); };
    el.addEventListener("mouseenter", set);
    el.addEventListener("click", set);
    el.addEventListener("touchstart", (e) => { e.preventDefault(); set(); }, { passive:false });

    if (n <= 13) leftCol.appendChild(el);
    else rightCol.appendChild(el);
  }
}

/* Nova RDP com 30 divisões (800px, sem legenda) */
function initRDP30() {
  const rdp = document.getElementById("rdp");
  if (!rdp) return;

  rdp.innerHTML = "";
  const totalSegments = 30;
  const segmentWidth = 800 / totalSegments;

  for (let i = 0; i < totalSegments; i++) {
    const seg = document.createElement("div");
    seg.className = "rdp-segment";
    seg.dataset.index = String(i);
    seg.style.width = `${segmentWidth}px`;

    const handler = () => selectRDP(i);
    seg.addEventListener("mouseover", handler);
    seg.addEventListener("click", handler);
    seg.addEventListener("touchstart", (e) => { e.preventDefault(); handler(); }, { passive: false });

    rdp.appendChild(seg);
  }

  // Seleciona a posição inicial (0 => 89°)
  selectRDP(0);
}

/* Seleção da posição na RDP */
function selectRDP(idx) {
  state.rdpIndex = clamp(idx, 0, 29);
  state.baseAngle = 89 - state.rdpIndex;

  const segs = document.querySelectorAll(".rdp-segment");
  segs.forEach((s) => {
    const i = Number(s.dataset.index);
    s.classList.toggle("active", i === state.rdpIndex);
    s.classList.toggle("active-left", i <= state.rdpIndex);
  });

  compute();
}

/* Seleção de direção */
function selectDirection(i) {
  state.directionIndex = i;
  const lbl = document.getElementById("dirLabel");
  if (lbl) lbl.textContent = DIRECTIONS[i].label;
  highlightSector(i);
  compute();
}

/* Seleção de força do vento */
function selectWindStrength(n) {
  state.windStrength = n;
  const ws = document.getElementById("windStrength");
  if (ws) ws.textContent = n;
  document.querySelectorAll(".wind-btn").forEach(b => b.classList.toggle("active", Number(b.dataset.value) === n));
  compute();
}

/* Destaque visual do setor selecionado */
function highlightSector(index) {
  const paths = document.querySelectorAll("#wcSvg path");
  paths.forEach((p, i) => {
    p.style.opacity = (i === index ? "1.0" : "0.85");
    p.setAttribute(
      "fill",
      i === index
        ? "rgba(127,216,255,0.24)"
        : (i % 2 === 0 ? "rgba(98,196,255,0.08)" : "rgba(98,196,255,0.04)")
    );
  });
}

/* Atualização de painel e centro da WC — com overcap visual */
function updatePanel(corrected) {
  const base = clamp(state.baseAngle ?? 89, 60, 89);
  const a = corrected != null ? clamp(corrected, 0, 999) : base;

  const baseAngleEl = document.getElementById("baseAngle");
  if (baseAngleEl) baseAngleEl.textContent = base;

  const correctedAngleEl = document.getElementById("correctedAngle");
  if (correctedAngleEl) correctedAngleEl.textContent = fmt(a);

  const centerEl = document.getElementById("wcCenterAngle");
  if (centerEl) {
    centerEl.textContent = `${fmt(a)}°`;
    if (a > 89) {
      centerEl.classList.add("overcap");
    } else {
      centerEl.classList.remove("overcap");
    }
  }
}

/* Texto flutuante de força fixa */
function updateForceText(forceVal) {
  const txt = `USE FORÇA: ${forceVal.toFixed(1)}`;
  const el1 = document.getElementById("force-info");
  const el2 = document.getElementById("forceInfo");
  if (el1) el1.textContent = txt;
  if (el2) el2.textContent = txt;
}

/* Cálculo do ângulo corrigido */
function compute() {
  const w = state.windStrength;
  const d = state.directionIndex;

  updateForceText(2.4);

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

  const key = dir.key;
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
    case "custom":
      adjustment = rule.exec(w);
      break;
    case "simpleDiv":
      adjustment = Math.floor(w / rule.div);
      break;
    case "rangeAdd":
      adjustment = Math.floor(w / rule.div);
      if (Array.isArray(rule.thresholds)) {
        for (const th of rule.thresholds) {
          if (th.cond && th.cond(w)) {
            adjustment += th.delta;
          }
        }
      }
      break;
    case "swRule":
      adjustment = Math.floor(w / 2) + Math.floor(w / 10);
      break;
    case "divWithThresholds":
      adjustment = Math.floor(w / rule.div);
      if (Array.isArray(rule.thresholds)) {
        for (const th of rule.thresholds) {
          if (th.cond && th.cond(w)) {
            adjustment += th.delta;
          }
        }
      }
      adjustment = Math.max(0, adjustment);
      break;
    default:
      adjustment = 0;
  }

  const base = state.baseAngle;
  const finalAngle = (dir.side === "left") ? (base - adjustment) : (base + adjustment);

  updatePanel(finalAngle);
}
