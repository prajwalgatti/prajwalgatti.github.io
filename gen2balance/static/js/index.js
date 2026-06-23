// Copy the BibTeX block to the clipboard.
function copyBibtex() {
  const el = document.getElementById('bibtex-block');
  if (!el) return;
  const text = el.innerText;
  const done = (btn) => {
    const b = btn || document.querySelector('.copy-btn');
    if (!b) return;
    const old = b.textContent;
    b.textContent = 'Copied!';
    setTimeout(() => (b.textContent = old), 1500);
  };
  const btn = document.querySelector('.copy-btn');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => done(btn)).catch(() => fallback(text, btn));
  } else {
    fallback(text, btn);
  }
}

/* ============================================================
   Main comparison table - toggle between K100-LT and UCF-LT.
   Numbers from the camera-ready Table 2 (class-average accuracy).
   cols: Few, Tail, Head, Avg C/A.  ref = full-dataset upper bound.
   ============================================================ */
(function () {
  // citation links: arXiv where unambiguous, else a Google Scholar title search
  const U = {
    bsce: "https://arxiv.org/abs/2007.10740",
    crt: "https://arxiv.org/abs/1910.09217",
    logit: "https://arxiv.org/abs/2007.07314",
    livt: "https://arxiv.org/abs/2212.02015",
    lmr: "https://arxiv.org/abs/2304.01143",
    ewb: "https://arxiv.org/abs/2305.16573",
    sari: "https://arxiv.org/abs/2212.08420",
    li: "https://arxiv.org/abs/2505.19495",
  };
  const DATA = {
    "K100-LT": [
      { m: "CE (full dataset)", gen: false, ref: true, v: [74.9, 81.7, 88.4, 80.4] },
      { m: "CE", gen: false, v: [23.4, 63.3, 94.7, 54.8] },
      { m: "Balanced Softmax", gen: false, url: U.bsce, v: [48.7, 68.5, 86.7, 64.5] },
      { m: "cRT", gen: false, url: U.crt, v: [49.6, 69.6, 88.1, 65.6] },
      { m: "Logit Adjustment", gen: false, url: U.logit, v: [55.5, 68.4, 78.5, 65.6] },
      { m: "LiVT", gen: false, url: U.livt, v: [47.1, 68.7, 91.0, 64.7] },
      { m: "LMR", gen: false, url: U.lmr, v: [51.5, 68.7, 83.1, 65.1] },
      { m: "EWB-FDR", gen: false, url: U.ewb, v: [47.3, 69.0, 89.0, 64.7] },
      { m: "Sariyildiz et al.", gen: true, url: U.sari, v: [26.2, 58.8, 93.2, 52.8] },
      { m: "Li et al.", gen: true, url: U.li, v: [23.8, 62.6, 93.4, 54.4] },
      { m: "Gen2Balance", gen: true, ours: true, v: [62.2, 75.0, 88.4, 72.6] },
    ],
    "UCF-LT": [
      { m: "CE (full dataset)", gen: false, ref: true, v: [92.7, 89.4, 94.0, 92.0] },
      { m: "CE", gen: false, v: [45.7, 79.6, 95.7, 64.0] },
      { m: "Balanced Softmax", gen: false, url: U.bsce, v: [74.3, 83.0, 88.5, 79.3] },
      { m: "cRT", gen: false, url: U.crt, v: [79.7, 86.2, 92.3, 83.8] },
      { m: "Logit Adjustment", gen: false, url: U.logit, v: [81.2, 83.4, 88.6, 83.1] },
      { m: "LiVT", gen: false, url: U.livt, v: [78.4, 85.4, 93.4, 82.3] },
      { m: "LMR", gen: false, url: U.lmr, v: [79.6, 84.6, 94.4, 83.6] },
      { m: "EWB-FDR", gen: false, url: U.ewb, v: [78.7, 86.9, 92.9, 83.5] },
      { m: "Sariyildiz et al.", gen: true, url: U.sari, v: [73.1, 86.4, 94.3, 80.6] },
      { m: "Li et al.", gen: true, url: U.li, v: [75.2, 88.1, 95.9, 82.5] },
      { m: "Gen2Balance", gen: true, ours: true, v: [86.7, 90.3, 93.4, 88.9] },
    ],
  };

  function render(bench) {
    const rows = DATA[bench];
    const tbody = document.querySelector("#rt-table tbody");
    if (!tbody) return;
    // best (max) per column among non-reference rows
    const best = [0, 1, 2, 3].map(c =>
      Math.max(...rows.filter(r => !r.ref).map(r => r.v[c])));
    tbody.innerHTML = rows.map(r => {
      const cls = r.ours ? ' class="highlight"' : (r.ref ? ' class="rt-ref"' : '');
      const cells = r.v.map((x, c) => {
        const b = !r.ref && x === best[c];
        return `<td${b ? ' class="rt-best"' : ''}>${x.toFixed(1)}</td>`;
      }).join("");
      const label = r.ours ? `<b>${r.m}</b>` : r.m;
      const name = r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${label}</a>` : label;
      const gen = r.gen ? '<span class="rt-gen">✓</span>' : '<span class="rt-no">–</span>';
      return `<tr${cls}><td>${name}</td><td>${gen}</td>${cells}</tr>`;
    }).join("");
  }

  function init() {
    const seg = document.getElementById("rt-bench");
    if (!seg) return;
    const benches = ["K100-LT", "UCF-LT"];
    benches.forEach((b, i) => {
      const btn = document.createElement("button");
      btn.className = "exp-seg" + (i === 0 ? " active" : "");
      btn.textContent = b;
      btn.addEventListener("click", () => {
        seg.querySelectorAll(".exp-seg").forEach(x => x.classList.toggle("active", x === btn));
        render(b);
      });
      seg.appendChild(btn);
    });
    render(benches[0]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* Scale the fixed-width generation pipeline to fit its container, so it shrinks
   proportionally (like an image) instead of reflowing to a column on phones. */
(function () {
  function fitPipeline() {
    document.querySelectorAll(".pipe-fit").forEach(function (f) {
      var p = f.querySelector(".pipeline");
      if (!p) return;
      p.style.transform = "none";
      p.style.marginLeft = "0";
      var nw = p.offsetWidth, avail = f.clientWidth;
      if (!nw || !avail) return;   // not laid out yet — leave unscaled; a later run will fix it
      var nh = p.offsetHeight;
      var s = Math.min(1, avail / nw);
      p.style.transformOrigin = "top left";
      p.style.transform = "scale(" + s + ")";
      p.style.marginLeft = ((avail - nw * s) / 2) + "px";
      f.style.height = (nh * s) + "px";
    });
  }
  function fitSoon() { requestAnimationFrame(fitPipeline); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fitSoon);
  else fitSoon();
  window.addEventListener("load", fitSoon);                 // re-fit after fonts/videos settle
  setTimeout(fitPipeline, 250); setTimeout(fitPipeline, 800);
  var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fitPipeline, 120); });
})();

function fallback(text, btn) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  if (btn) {
    const old = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = old), 1500);
  }
}
