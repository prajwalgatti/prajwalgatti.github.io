/* ============================================================
   Interactive scaling figure (K100-LT).
   Left : accuracy (Avg/Few/Tail/Head) + GPU-cost vs filling threshold K.
   Right: long-tailed class-size distribution, topped up with generated
          clips up to K (blue = real, green = generated).
   A shared slider (and hovering the left plot) scrubs K.
   Dependency-free inline SVG.
   ============================================================ */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";

  // --- data (from the scaling experiment) ---
  const K = [0, 50, 100, 200, 330, 500, 750, 990];
  const GPU = [0, 172, 494, 1279, 2458, 4114, 6674, 9248];      // GPU-hours
  const GEN = [0, 1572, 4518, 11697, 22473, 37617, 61025, 84561]; // # synthetic clips
  const ACC = {
    avg:  [64.54, 66.82, 67.47, 69.19, 70.93, 71.17, 71.17, 72.62],
    few:  [48.69, 51.53, 54.79, 58.78, 62.14, 60.86, 60.19, 62.22],
    tail: [68.47, 70.60, 70.08, 70.94, 72.25, 73.27, 73.79, 74.97],
    head: [86.72, 88.23, 88.05, 88.24, 87.85, 88.04, 87.11, 88.38],
  };
  // K100-LT per-class real counts, sorted descending (long tail)
  const NREAL = [990,879,845,738,724,696,622,536,526,463,408,401,355,349,309,304,265,240,236,232,214,204,188,182,179,174,158,149,144,140,134,132,124,110,105,102,98,87,83,80,78,69,67,62,61,60,56,53,50,49,45,43,41,39,37,36,35,33,30,29,28,27,25,25,23,23,23,22,21,20,19,19,17,16,16,15,14,14,13,13,12,11,11,11,10,10,10,10,9,8,8,8,7,7,7,6,6,6,6,5];
  const SERIES = [
    { key: "avg",  label: "Average", color: "#d62728", dash: false },
    { key: "few",  label: "Few",     color: "#2ed26a", dash: false },
    { key: "tail", label: "Tail",    color: "#ff9bc8", dash: true  },
    { key: "head", label: "Head",    color: "#9edaff", dash: true  },
  ];
  const BLUE = "#2563eb", GREEN = "#16a34a";
  const KMAX = 990, AMIN = 47, AMAX = 90;

  const $ = s => document.querySelector(s);
  function S(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function txt(x, y, s, cls, extra) { const t = S("text", Object.assign({ x, y, class: cls }, extra || {})); t.textContent = s; return t; }

  let ki = 4; // current index into K (default 330 — the sweet spot)

  /* ---------------- left: accuracy + cost ---------------- */
  function renderLeft() {
    const host = $("#sv-left"); if (!host) return;
    host.innerHTML = "";
    const W = host.clientWidth || 520, H = 300;
    const m = { t: 40, r: 16, b: 40, l: 46 };
    const x = k => m.l + (k / KMAX) * (W - m.l - m.r);
    const y = a => m.t + (1 - (a - AMIN) / (AMAX - AMIN)) * (H - m.t - m.b);
    const svg = S("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, class: "sv-svg" });

    // y gridlines + labels
    for (let a = 50; a <= AMAX; a += 10) {
      svg.appendChild(S("line", { x1: m.l, x2: W - m.r, y1: y(a), y2: y(a), stroke: "#e4e8ee" }));
      svg.appendChild(txt(m.l - 8, y(a) + 3, a, "sv-ax", { "text-anchor": "end" }));
    }
    svg.appendChild(txt(13, m.t + (H - m.t - m.b) / 2, "Class-wise accuracy (%)", "sv-ax", { transform: `rotate(-90 13 ${m.t + (H - m.t - m.b) / 2})`, "text-anchor": "middle" }));

    // bottom (K) + top (GPU) ticks
    const ticks = [0, 100, 200, 330, 500, 750, 990];
    const gpuAt = {}; K.forEach((k, i) => gpuAt[k] = GPU[i]);
    ticks.forEach(k => {
      svg.appendChild(txt(x(k), H - m.b + 16, k, "sv-ax", { "text-anchor": "middle" }));
      const g = gpuAt[k] != null ? gpuAt[k] : "";
      const gl = g === 0 ? "0" : (g ? (g / 1000).toFixed(1) + "K" : "");
      svg.appendChild(txt(x(k), m.t - 13, gl, "sv-ax", { "text-anchor": "middle" }));
    });
    svg.appendChild(txt((m.l + W - m.r) / 2, H - 4, "Filling threshold B", "sv-axl", { "text-anchor": "middle" }));
    svg.appendChild(txt((m.l + W - m.r) / 2, 11, "Generation cost (GPU-hours)", "sv-axl", { "text-anchor": "middle" }));

    // max class size marker
    svg.appendChild(S("line", { x1: x(KMAX), x2: x(KMAX), y1: m.t, y2: H - m.b, stroke: "#b8c0cc", "stroke-dasharray": "3 3" }));

    // current-K cursor
    svg.appendChild(S("line", { x1: x(K[ki]), x2: x(K[ki]), y1: m.t, y2: H - m.b, stroke: "#0f1722", "stroke-width": "1.4", opacity: "0.55" }));

    // lines + markers
    SERIES.forEach(s => {
      const pts = K.map((k, i) => `${x(k)},${y(ACC[s.key][i])}`).join(" ");
      svg.appendChild(S("polyline", { points: pts, fill: "none", stroke: s.color, "stroke-width": s.dash ? 2 : 2.8, "stroke-dasharray": s.dash ? "5 4" : "0", opacity: s.dash ? 0.8 : 1, "stroke-linejoin": "round" }));
      // dot at current K
      svg.appendChild(S("circle", { cx: x(K[ki]), cy: y(ACC[s.key][ki]), r: 4.5, fill: s.color, stroke: "#fff", "stroke-width": 1.5 }));
    });

    // legend (bottom-right, where the plot is empty)
    const segW = SERIES.map(s => 20 + s.label.length * 6.5 + 14);
    let lx = W - m.r - segW.reduce((a, b) => a + b, 0), ly = H - m.b - 8;
    SERIES.forEach((s, i) => {
      svg.appendChild(S("line", { x1: lx, x2: lx + 16, y1: ly, y2: ly, stroke: s.color, "stroke-width": s.dash ? 2 : 2.8, "stroke-dasharray": s.dash ? "5 4" : "0" }));
      svg.appendChild(txt(lx + 20, ly + 4, s.label, "sv-leg"));
      lx += segW[i];
    });

    // hover scrub: nearest K
    const hit = S("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent", style: "cursor:col-resize" });
    hit.addEventListener("mousemove", e => {
      const r = svg.getBoundingClientRect();
      const kx = ((e.clientX - r.left) / r.width * W - m.l) / (W - m.l - m.r) * KMAX;
      let best = 0, bd = 1e9;
      K.forEach((k, i) => { const d = Math.abs(k - kx); if (d < bd) { bd = d; best = i; } });
      if (best !== ki) setK(best);
    });
    svg.appendChild(hit);
    host.appendChild(svg);
  }

  /* ---------------- right: class-size distribution ---------------- */
  function renderRight() {
    const host = $("#sv-right"); if (!host) return;
    host.innerHTML = "";
    const W = host.clientWidth || 520, H = 290;
    const m = { t: 30, r: 14, b: 40, l: 46 };
    const n = NREAL.length;
    const bw = (W - m.l - m.r) / n;
    const y = v => m.t + (1 - v / KMAX) * (H - m.t - m.b);
    const Kc = K[ki];
    const svg = S("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, class: "sv-svg" });

    // y gridlines + labels
    [0, 250, 500, 750, 990].forEach(v => {
      svg.appendChild(S("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: "#eef1f5" }));
      svg.appendChild(txt(m.l - 8, y(v) + 3, v, "sv-ax", { "text-anchor": "end" }));
    });
    svg.appendChild(txt(13, m.t + (H - m.t - m.b) / 2, "# training samples", "sv-ax", { transform: `rotate(-90 13 ${m.t + (H - m.t - m.b) / 2})`, "text-anchor": "middle" }));
    svg.appendChild(txt((m.l + W - m.r) / 2, H - 4, "K100-LT classes (sorted by size)", "sv-axl", { "text-anchor": "middle" }));

    // bars: real (blue) + generated fill (green) up to K
    const base = H - m.b;
    NREAL.forEach((real, i) => {
      const bx = m.l + i * bw + bw * 0.12, w = Math.max(0.6, bw * 0.76);
      svg.appendChild(S("rect", { x: bx, y: y(real), width: w, height: base - y(real), fill: BLUE }));
      const gen = Math.max(0, Kc - real);
      if (gen > 0) svg.appendChild(S("rect", { x: bx, y: y(real + gen), width: w, height: y(real) - y(real + gen), fill: GREEN }));
    });

    // threshold line at K
    if (Kc > 0) {
      svg.appendChild(S("line", { x1: m.l, x2: W - m.r, y1: y(Kc), y2: y(Kc), stroke: "#0f1722", "stroke-width": 1.4, "stroke-dasharray": "5 4", opacity: 0.7 }));
      svg.appendChild(txt(W - m.r, y(Kc) - 5, "B = " + Kc, "sv-klab", { "text-anchor": "end" }));
    }

    // legend (top-right, above the short tail bars)
    const lx0 = W - m.r - 116;
    svg.appendChild(S("rect", { x: lx0, y: m.t + 2, width: 10, height: 10, fill: BLUE, rx: 2 }));
    svg.appendChild(txt(lx0 + 14, m.t + 11, "real", "sv-leg"));
    svg.appendChild(S("rect", { x: lx0 + 48, y: m.t + 2, width: 10, height: 10, fill: GREEN, rx: 2 }));
    svg.appendChild(txt(lx0 + 62, m.t + 11, "generated", "sv-leg"));
    host.appendChild(svg);
  }

  /* ---------------- control + readout ---------------- */
  function renderControl() {
    const host = $("#sv-control"); if (!host) return;
    if (!host.dataset.built) {
      host.innerHTML =
        `<input id="sv-slider" type="range" min="0" max="${K.length - 1}" step="1" value="${ki}" aria-label="Filling threshold B" />
         <div id="sv-readout"></div>`;
      host.dataset.built = "1";
      $("#sv-slider").addEventListener("input", e => setK(+e.target.value));
    }
    $("#sv-slider").value = ki;
    const dAvg = (ACC.avg[ki] - ACC.avg[0]).toFixed(1);
    const gpu = GPU[ki] === 0 ? "0" : (GPU[ki] / 1000).toFixed(1) + "K";
    $("#sv-readout").innerHTML =
      `<span class="sv-ro-k">B = ${K[ki]}</span>` +
      `<span class="sv-ro"><b>${GEN[ki].toLocaleString()}</b> generated clips</span>` +
      `<span class="sv-ro"><b>${gpu}</b> GPU-hours</span>` +
      `<span class="sv-ro">avg accuracy <b>${ACC.avg[ki].toFixed(1)}%</b> <span class="sv-delta">(+${dAvg})</span></span>`;
  }

  function setK(i) { ki = Math.max(0, Math.min(K.length - 1, i)); renderLeft(); renderRight(); renderControl(); }

  function init() {
    if (!$("#scaling-viz")) return;
    setK(ki);
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { renderLeft(); renderRight(); }, 150); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
