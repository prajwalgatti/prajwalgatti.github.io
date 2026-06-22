/* ============================================================
   Per-class explorer - interactive version of Fig. 4.
   Dependency-free: builds an inline-SVG bar chart of the
   accuracy improvement (Gen2Balance - baseline) per class.
   Hover to preview, click to pin a detail panel.
   ============================================================ */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const GROUP_COLORS = { head: "#2563eb", tail: "#db2777", fewshot: "#14855a", rareact: "#7c3aed" };
  const GROUP_LABEL = { head: "Head", tail: "Tail", fewshot: "Few-shot", rareact: "RareAct" };
  const GROUP_LABEL_LONG = { head: "Head classes", tail: "Tail classes", fewshot: "Few-shot classes", rareact: "RareAct classes" };
  const POS = "#14855a";
  const NEG = "#d24b46";        // negative text - clearly red but not harsh
  const NEG_BAR = "#e07b76";    // regression bars - soft red, present but not dominant

  const state = { all: [], benchmark: "K100-LT", baseline: "ce", sort: "size", pinned: null };

  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

  function gainOf(c) { return +(c.acc_ours - (state.baseline === "ce" ? c.acc_ce : c.acc_bsce)).toFixed(1); }

  function current() {
    let cs = state.all.filter(c => state.benchmark === "all" || c.benchmark === state.benchmark);
    if (state.sort === "size") cs = cs.slice().sort((a, b) => (b.n_real - a.n_real) || (b.n_generated - a.n_generated));
    else cs = cs.slice().sort((a, b) => gainOf(b) - gainOf(a));
    return cs;
  }

  /* ---------- summary chips ---------- */
  function renderSummary(cs) {
    const wrap = $("#exp-summary"); wrap.innerHTML = "";
    const groups = ["head", "tail", "fewshot"].concat(
      cs.some(c => c.group === "rareact") ? ["rareact"] : []);
    groups.forEach(g => {
      const gc = cs.filter(c => c.group === g);
      if (!gc.length) return;
      const avg = gc.reduce((s, c) => s + gainOf(c), 0) / gc.length;
      const chip = el("div", "exp-chip");
      chip.innerHTML = `<span class="dot" style="background:${GROUP_COLORS[g]}"></span>
        <span class="exp-chip-lab">${GROUP_LABEL_LONG[g]}</span>
        <span class="exp-chip-val" style="color:${avg >= 0 ? POS : NEG}">${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%</span>
        <span class="exp-chip-sub">avg gain · ${gc.length} cls</span>`;
      wrap.appendChild(chip);
    });
  }

  /* ---------- bar chart ---------- */
  function renderChart(cs) {
    const host = $("#exp-chart"); host.innerHTML = "";
    const W = host.clientWidth || 900, H = 300;
    const m = { t: 16, r: 8, b: 14, l: 42 };
    const cw = W - m.l - m.r, ch = H - m.t - m.b;
    const gains = cs.map(gainOf);
    // y-range fits BOTH baselines (vs CE and vs BSCE) so the axis stays constant when toggling
    const allDeltas = cs.flatMap(c => [c.acc_ours - c.acc_ce, c.acc_ours - c.acc_bsce]);
    const yMax = Math.max(10, Math.ceil(Math.max(0, ...allDeltas) / 10) * 10);
    const yMin = Math.min(0, Math.floor(Math.min(0, ...allDeltas) / 10) * 10);
    const range = yMax - yMin;
    const yScale = v => m.t + ch * (1 - (Math.max(yMin, Math.min(yMax, v)) - yMin) / range);
    const y0 = yScale(0);
    const bw = cw / cs.length;

    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", "100%"); svg.setAttribute("height", H);
    svg.classList.add("exp-svg");

    // group bands (only meaningful when sorted by size)
    if (state.sort === "size") {
      let i = 0;
      while (i < cs.length) {
        let j = i; while (j < cs.length && cs[j].group === cs[i].group) j++;
        const r = document.createElementNS(SVGNS, "rect");
        r.setAttribute("x", m.l + i * bw); r.setAttribute("y", m.t);
        r.setAttribute("width", (j - i) * bw); r.setAttribute("height", ch);
        r.setAttribute("fill", GROUP_COLORS[cs[i].group]); r.setAttribute("opacity", "0.06");
        svg.appendChild(r);
        const t = document.createElementNS(SVGNS, "text");
        t.setAttribute("x", m.l + (i + (j - i) / 2) * bw); t.setAttribute("y", m.t + 12);
        t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "exp-band-lab");
        t.setAttribute("fill", GROUP_COLORS[cs[i].group]);
        const segW = (j - i) * bw;
        if (segW > 80) t.textContent = GROUP_LABEL_LONG[cs[i].group];
        else if (segW > 34) t.textContent = GROUP_LABEL[cs[i].group];
        svg.appendChild(t);
        i = j;
      }
    }

    // axis: zero line + y ticks (nice step, always including 0)
    const step = range > 60 ? 20 : 10;
    const ticks = [];
    for (let t = Math.ceil(yMin / step) * step; t <= yMax + 0.01; t += step) ticks.push(t);
    if (!ticks.includes(0)) ticks.push(0);
    ticks.sort((a, b) => a - b);
    ticks.forEach(v => {
      const yy = yScale(v);
      const ln = document.createElementNS(SVGNS, "line");
      ln.setAttribute("x1", m.l); ln.setAttribute("x2", W - m.r);
      ln.setAttribute("y1", yy); ln.setAttribute("y2", yy);
      ln.setAttribute("stroke", v === 0 ? "#9aa6b2" : "#e4e8ee");
      ln.setAttribute("stroke-width", v === 0 ? "1.2" : "1");
      svg.appendChild(ln);
      const tx = document.createElementNS(SVGNS, "text");
      tx.setAttribute("x", m.l - 8); tx.setAttribute("y", yy + 3);
      tx.setAttribute("text-anchor", "end"); tx.setAttribute("class", "exp-axis");
      tx.textContent = (v > 0 ? "+" : "") + v;
      svg.appendChild(tx);
    });
    const yl = document.createElementNS(SVGNS, "text");
    yl.setAttribute("transform", `translate(12,${m.t + ch / 2}) rotate(-90)`);
    yl.setAttribute("text-anchor", "middle"); yl.setAttribute("class", "exp-axis");
    yl.textContent = "Δ accuracy (%)"; svg.appendChild(yl);

    // bars
    cs.forEach((c, k) => {
      const g = gainOf(c);
      const bx = m.l + k * bw;
      const bh = Math.max(1, Math.abs(yScale(g) - y0));
      const by = g >= 0 ? y0 - bh : y0;
      const r = document.createElementNS(SVGNS, "rect");
      r.setAttribute("x", bx + bw * 0.12); r.setAttribute("y", by);
      r.setAttribute("width", Math.max(0.6, bw * 0.76)); r.setAttribute("height", bh);
      r.setAttribute("fill", g >= 0 ? POS : NEG_BAR);
      r.setAttribute("class", "exp-bar");
      r.dataset.idx = k;
      r.addEventListener("mouseenter", e => showTip(e, c, g));
      r.addEventListener("mousemove", moveTip);
      r.addEventListener("mouseleave", hideTip);
      r.addEventListener("click", () => { state.pinned = c; renderDetail(c); highlight(svg, k); });
      svg.appendChild(r);
    });

    host.appendChild(svg);
    if (state.pinned) {
      const idx = cs.findIndex(c => c.benchmark === state.pinned.benchmark && c.id === state.pinned.id);
      if (idx >= 0) highlight(svg, idx);
    }
  }

  function highlight(svg, k) {
    svg.querySelectorAll(".exp-bar").forEach(b => b.classList.toggle("sel", +b.dataset.idx === k));
  }

  /* ---------- tooltip ---------- */
  let tip;
  function showTip(e, c, g) {
    if (!tip) { tip = el("div", "exp-tip"); document.body.appendChild(tip); }
    tip.innerHTML = `<b>${c.name}</b><br>${GROUP_LABEL[c.group]} · ${c.n_real} real + ${c.n_generated} gen
      <br>Δ vs ${state.baseline === "ce" ? "CE" : "BSCE"}:
      <span style="color:${g >= 0 ? POS : NEG};font-weight:700">${g >= 0 ? "+" : ""}${g}%</span>`;
    tip.style.display = "block"; moveTip(e);
  }
  function moveTip(e) {
    if (!tip) return;
    const pad = 14;
    let x = e.clientX + pad, y = e.clientY + pad;
    const r = tip.getBoundingClientRect();
    if (x + r.width > innerWidth) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight) y = e.clientY - r.height - pad;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hideTip() { if (tip) tip.style.display = "none"; }

  /* ---------- detail panel ---------- */
  function videoSlot(label, src, emptyMsg) {
    if (src) {
      return `<div class="exp-vid"><video autoplay muted loop playsinline preload="metadata"
        onloadeddata="try{this.currentTime=Math.min(0.6,(this.duration||2)/3)}catch(e){}">
        <source src="${src}" type="video/mp4"></video>
        <span class="exp-vid-lab">${label}</span></div>`;
    }
    return `<div class="exp-vid exp-vid--ph"><div class="exp-vid-ph">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6">
      <polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      <span>${label}</span><small>${emptyMsg || "no clip"}</small></div></div>`;
  }

  function accBar(name, val, color) {
    return `<div class="exp-acc-row"><span class="exp-acc-name">${name}</span>
      <span class="exp-acc-track"><span class="exp-acc-fill" style="width:${val}%;background:${color}"></span></span>
      <span class="exp-acc-val">${val.toFixed(1)}%</span></div>`;
  }

  function renderDetail(c) {
    const p = $("#exp-detail");
    const g = gainOf(c);
    const total = c.n_real + c.n_generated || 1;
    const realPct = (c.n_real / total) * 100;
    p.innerHTML = `
      <div class="exp-detail-head">
        <div>
          <h4>${c.name}</h4>
          <div class="exp-badges">
            <span class="exp-badge">${c.benchmark}</span>
            <span class="exp-badge" style="background:${GROUP_COLORS[c.group]}1a;color:${GROUP_COLORS[c.group]};border-color:${GROUP_COLORS[c.group]}55">${GROUP_LABEL[c.group]}</span>
            <span class="exp-badge">class #${c.id}</span>
          </div>
        </div>
        <div class="exp-deltabig" style="color:${g >= 0 ? POS : NEG}">${g >= 0 ? "+" : ""}${g}%<small>vs ${state.baseline === "ce" ? "CE" : "Balanced&nbsp;Softmax"}</small></div>
      </div>

      <div class="exp-detail-grid">
        <div>
          <div class="exp-sub">Training data for this class</div>
          <div class="exp-stack"><span style="width:${realPct}%;background:#2563eb"></span><span style="width:${100 - realPct}%;background:#14855a"></span></div>
          <div class="exp-stack-legend">
            <span><i style="background:#2563eb"></i>${c.n_real} real</span>
            <span><i style="background:#14855a"></i>${c.n_generated} generated</span>
          </div>
          <div class="exp-sub" style="margin-top:16px">Accuracy</div>
          ${accBar("CE", c.acc_ce, "#9aa6b2")}
          ${accBar("Bal. Softmax", c.acc_bsce, "#6b7785")}
          ${accBar("Gen2Balance", c.acc_ours, "#14855a")}
        </div>
        <div>
          <div class="exp-sub">Real vs. generated sample</div>
          <div class="exp-vids">
            ${videoSlot("Real", c.real_clip, "clip not available")}
            ${videoSlot("Generated", c.gen_clip, c.group === "head" ? "head class, none needed" : "clip not available")}
          </div>
        </div>
      </div>`;
    p.classList.add("show");
  }

  /* ---------- controls ---------- */
  function segbtn(group, value, label, active) {
    const b = el("button", "exp-seg" + (active ? " active" : ""));
    b.textContent = label; b.dataset.group = group; b.dataset.value = value;
    return b;
  }
  function buildControls() {
    // Kinetics (K100-LT) only - state.benchmark stays fixed; no benchmark toggle.
    const segBase = $("#exp-base");
    segBase.appendChild(segbtn("baseline", "ce", "vs CE", true));
    segBase.appendChild(segbtn("baseline", "bsce", "vs Bal. Softmax", false));
    const segSort = $("#exp-sort");
    segSort.appendChild(segbtn("sort", "size", "by training size", true));
    segSort.appendChild(segbtn("sort", "gain", "by gain", false));

    $("#exp-controls").addEventListener("click", e => {
      const b = e.target.closest(".exp-seg"); if (!b) return;
      state[b.dataset.group] = b.dataset.value;
      b.parentElement.querySelectorAll(".exp-seg").forEach(x => x.classList.toggle("active", x === b));
      // switching benchmark: re-pin to the highest-gain class of the new set
      if (b.dataset.group === "benchmark") {
        const cs = current();
        state.pinned = cs.slice().sort((a, z) => gainOf(z) - gainOf(a))[0] || null;
      }
      draw();
    });
  }

  function draw() {
    const cs = current();
    renderSummary(cs);
    renderChart(cs);
    if (state.pinned) renderDetail(state.pinned);  // keep panel in sync with baseline/sort
  }

  /* ---------- init ---------- */
  function init() {
    const mount = $("#explorer"); if (!mount) return;
    fetch("static/data/perclass.json", { cache: "no-cache" })
      .then(r => r.json())
      .then(d => {
        state.all = d.classes;
        // show the placeholder warning only if the displayed benchmark still has placeholders
        const shownPh = state.all.some(c => c.benchmark === state.benchmark && c.placeholder);
        if (shownPh) $("#exp-placeholder-note").style.display = "block";
        buildControls();
        // pin a high-impact default so the panel isn't empty
        const cs0 = current();
        state.pinned = cs0.slice().sort((a, b) => gainOf(b) - gainOf(a))[0];
        draw();
        renderDetail(state.pinned);
      })
      .catch(err => { $("#exp-chart").innerHTML = `<p class="placeholder-note">Could not load perclass.json (${err}).</p>`; });

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => renderChart(current()), 150); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
