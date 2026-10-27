/* Ink: draws pencil and highlighter marks as SVG from text rectangles. Every mark is seeded by its id, so a
   stroke looks the same on every redraw but no two strokes are alike. Nothing here touches the text itself. */
(function () {
  const NS = "http://www.w3.org/2000/svg";

  function seed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const j = (r, amt) => (r() - 0.5) * 2 * amt;
  const f = n => n.toFixed(1);

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Merge the client rects of a range into one rect per visual line.
  function lines(rects) {
    const out = [];
    [...rects].filter(r => r.width > 0.5).sort((a, b) => a.top - b.top || a.left - b.left).forEach(r => {
      const l = out.find(o => Math.abs(o.top - r.top) < 4);
      if (l) { l.left = Math.min(l.left, r.left); l.right = Math.max(l.right, r.right); l.bottom = Math.max(l.bottom, r.bottom); }
      else out.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    });
    return out;
  }

  // A chisel-tip highlighter: one swipe per line, slanted ends, edges that wander, a darker pass where it overlaps.
  function highlighter(g, ls, cls, r) {
    ls.forEach((l, i) => {
      const h = (l.bottom - l.top) * (0.74 + r() * 0.1);
      const mid = (l.top + l.bottom) / 2 + 1 + j(r, 1.2);
      const top = mid - h / 2, bot = mid + h / 2;
      const x0 = l.left - 2 - r() * 3, x1 = l.right + 1 + r() * 4;
      const slant = 3 + r() * 3;
      const n = Math.max(3, Math.round((x1 - x0) / 60));
      let d = `M${f(x0 + slant)},${f(top + j(r, 0.8))}`;
      for (let k = 1; k <= n; k++) { const x = x0 + slant + (x1 - x0) * k / n; d += ` L${f(x)},${f(top + j(r, 1.1) + k * j(r, 0.15))}`; }
      d += ` L${f(x1 - slant * 0.3)},${f(bot + j(r, 0.8))}`;
      for (let k = n - 1; k >= 0; k--) { const x = x0 + (x1 - x0 - slant) * k / n; d += ` L${f(x)},${f(bot + j(r, 1.1))}`; }
      d += "Z";
      el("path", { d, class: `hl ${cls}`, style: `opacity:${(0.5 + r() * 0.12).toFixed(2)}` }, g);
      // a second, thinner pass where the tip was pressed harder
      if (r() > 0.35) {
        const y = top + h * (0.2 + r() * 0.5);
        el("path", { d: `M${f(x0 + slant + 4)},${f(y)} L${f(x0 + (x1 - x0) * (0.3 + r() * 0.6))},${f(y + j(r, 1))}`, class: `hl-pass ${cls}`, "stroke-width": f(2 + r() * 3) }, g);
      }
      if (i === 0 && r() > 0.5) el("circle", { cx: f(x0 + slant + 1), cy: f(mid + j(r, 2)), r: f(h * 0.32), class: `hl ${cls}`, style: "opacity:.28" }, g);
    });
  }

  // A graphite line that sags and lifts, sometimes doubling back at the end.
  function pencilLine(g, x0, x1, y, r, cls) {
    const n = Math.max(2, Math.round((x1 - x0) / 45));
    let d = `M${f(x0)},${f(y + j(r, 0.8))}`;
    for (let k = 1; k <= n; k++) d += ` L${f(x0 + (x1 - x0) * k / n + j(r, 1.5))},${f(y + j(r, 1.1) + Math.sin(k * 1.7 + r() * 3) * 0.6)}`;
    el("path", { d, class: cls, "stroke-width": f(1 + r() * 0.5) }, g);
    if (r() > 0.6) el("path", { d: `M${f(x1)},${f(y + j(r, 0.6))} q-6,${f(1.5 + r())} -${f(14 + r() * 10)},${f(0.5 + r())}`, class: cls, "stroke-width": "0.9", style: "opacity:.6" }, g);
  }

  function underline(g, ls, r) { ls.forEach(l => pencilLine(g, l.left - 1 + j(r, 1.5), l.right + j(r, 2), l.bottom - 1 + r(), r, "pencil")); }

  function wavy(g, ls, r) {
    ls.forEach(l => {
      let d = `M${f(l.left)},${f(l.bottom)}`; const w = 7 + r() * 2;
      for (let x = l.left; x < l.right; x += w) d += ` q${f(w / 4)},${f(2.4 + j(r, 0.6))} ${f(w / 2)},0 t${f(w / 2)},0`;
      el("path", { d, class: "pencil q-wave" }, g);
    });
  }

  // An ellipse that never quite closes: the hand overshoots and the second lap drifts.
  function circle(g, ls, r) {
    const b = bounds(ls);
    const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2 + 1;
    const rx = (b.right - b.left) / 2 + 6 + r() * 3, ry = (b.bottom - b.top) / 2 + 3 + r() * 2;
    const start = r() * Math.PI * 2, turn = Math.PI * 2 * (1.08 + r() * 0.12), tilt = j(r, 0.06);
    let d = "";
    for (let k = 0; k <= 40; k++) {
      const t = start + turn * k / 40, grow = 1 + k / 40 * (0.06 + r() * 0.03);
      const x = cx + Math.cos(t) * rx * grow, y = cy + Math.sin(t) * ry * grow + Math.cos(t) * rx * tilt;
      d += (k ? " L" : "M") + f(x) + "," + f(y);
    }
    el("path", { d, class: "redpencil", "stroke-width": f(1.2 + r() * 0.4) }, g);
  }

  // Four separate strokes that cross at the corners, the way a box is drawn by hand.
  function box(g, ls, r) {
    const b = bounds(ls), p = 4;
    const L = b.left - p, R = b.right + p, T = b.top - p + 1, B = b.bottom + p - 1;
    const o = () => 2 + r() * 5;
    [[L - o(), T + j(r, 1), R + o(), T + j(r, 1.5)], [R + j(r, 1.2), T - o(), R + j(r, 1.5), B + o()],
     [R + o(), B + j(r, 1), L - o(), B + j(r, 1.5)], [L + j(r, 1.2), B + o(), L + j(r, 1.5), T - o()]]
      .forEach(([x0, y0, x1, y1]) => {
        const mx = (x0 + x1) / 2 + j(r, 2), my = (y0 + y1) / 2 + j(r, 2);
        el("path", { d: `M${f(x0)},${f(y0)} Q${f(mx)},${f(my)} ${f(x1)},${f(y1)}`, class: "bluepencil", "stroke-width": f(1.1 + r() * 0.5) }, g);
      });
    return { left: L, right: R, top: T, bottom: B };
  }

  // A margin bracket beside a paragraph, drawn in one push with serifs that don't match.
  function bracket(g, top, bottom, x, r) {
    const s1 = 6 + r() * 4, s2 = 5 + r() * 5, bow = 2 + r() * 2;
    const d = `M${f(x + s1)},${f(top + j(r, 2))} L${f(x + j(r, 1))},${f(top + 2)} Q${f(x - bow)},${f((top + bottom) / 2)} ${f(x + j(r, 1))},${f(bottom - 2)} L${f(x + s2)},${f(bottom + j(r, 2))}`;
    el("path", { d, class: "pencil bracket", "stroke-width": f(1.5 + r() * 0.4) }, g);
  }

  // Leader line from a mark to its margin card: a loose curve with a dot where the pencil landed.
  function leader(g, x0, y0, x1, y1, r) {
    const dx = x1 - x0;
    const d = `M${f(x0)},${f(y0)} C${f(x0 + dx * 0.35 + j(r, 6))},${f(y0 + j(r, 6))} ${f(x1 - dx * 0.3 + j(r, 6))},${f(y1 + j(r, 4))} ${f(x1)},${f(y1)}`;
    el("path", { d, class: "pencil leader" }, g);
    el("circle", { cx: f(x0), cy: f(y0), r: "1.6", class: "dot" }, g);
  }

  function bounds(ls) {
    return ls.reduce((b, l) => ({ left: Math.min(b.left, l.left), right: Math.max(b.right, l.right), top: Math.min(b.top, l.top), bottom: Math.max(b.bottom, l.bottom) }),
      { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
  }

  // Shared defs: a little grain in the highlighter ink so it isn't flat plastic color.
  function defs(svg) {
    const d = el("defs", {}, svg);
    const fl = el("filter", { id: "inkgrain", x: "-5%", y: "-20%", width: "110%", height: "140%" }, d);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.9 0.05", numOctaves: "2", seed: "7", result: "n" }, fl);
    el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "2.2", xChannelSelector: "R", yChannelSelector: "G" }, fl);
    const pf = el("filter", { id: "graphite", x: "-5%", y: "-50%", width: "110%", height: "200%" }, d);
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "1.6", numOctaves: "1", seed: "3", result: "n" }, pf);
    el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "1.4", xChannelSelector: "R", yChannelSelector: "G" }, pf);
  }

  window.Ink = { seed, el, lines, bounds, highlighter, underline, wavy, circle, box, bracket, leader, defs, pencilLine };
})();
