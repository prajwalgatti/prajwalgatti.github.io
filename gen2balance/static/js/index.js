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
   Main comparison table — toggle between K100-LT and UCF-LT.
   Numbers from the camera-ready Table 2 (class-average accuracy).
   cols: Few, Tail, Head, Avg C/A.  ref = full-dataset upper bound.
   ============================================================ */
(function () {
  const DATA = {
    "K100-LT": [
      { m: "CE (full dataset)", gen: false, ref: true, v: [74.9, 81.7, 88.4, 80.4] },
      { m: "CE", gen: false, v: [23.4, 63.3, 94.7, 54.8] },
      { m: "Balanced Softmax", gen: false, url: "https://arxiv.org/abs/2007.10740", v: [48.7, 68.5, 86.7, 64.5] },
      { m: "Logit Adjustment", gen: false, url: "https://arxiv.org/abs/2007.07314", v: [55.5, 68.4, 78.5, 65.6] },
      { m: "Li et al.", gen: true, url: "https://scholar.google.com/scholar?q=The+role+of+video+generation+in+enhancing+data-limited+action+understanding", v: [23.8, 62.6, 93.4, 54.4] },
      { m: "Gen2Balance", gen: true, ours: true, v: [62.2, 75.0, 88.4, 72.6] },
    ],
    "UCF-LT": [
      { m: "CE (full dataset)", gen: false, ref: true, v: [92.7, 89.4, 94.0, 92.0] },
      { m: "CE", gen: false, v: [45.7, 79.6, 95.7, 64.0] },
      { m: "Balanced Softmax", gen: false, url: "https://arxiv.org/abs/2007.10740", v: [74.3, 83.0, 88.5, 79.3] },
      { m: "Logit Adjustment", gen: false, url: "https://arxiv.org/abs/2007.07314", v: [81.2, 83.4, 88.6, 83.1] },
      { m: "Li et al.", gen: true, url: "https://scholar.google.com/scholar?q=The+role+of+video+generation+in+enhancing+data-limited+action+understanding", v: [75.2, 88.1, 95.9, 82.5] },
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
