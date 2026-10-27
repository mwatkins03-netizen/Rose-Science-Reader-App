/* Clarify, layer 1: the pencil. Renders a paper, lets the reader mark it by mouse or keyboard, draws the marks
   as ink over the page, keeps margin notes, and saves everything to this browser. Layers 2 and 3 read from App. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LS = "clarify.v1";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(`${LS}.${k}`); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`${LS}.${k}`, JSON.stringify(v)); } catch {} }
  };

  const COLORS = { claim: "Claim", evidence: "Evidence", method: "Method", lost: "Lost" };
  const TOOL_NAME = { hl: "Highlight", ul: "Underline", circle: "Circled word", box: "Callout", q: "Question", bracket: "Bracket" };
  const KEY_TOOL = { "1": ["hl", "claim"], "2": ["hl", "evidence"], "3": ["hl", "method"], "4": ["hl", "lost"], u: ["ul"], o: ["circle"], b: ["box"], q: ["q"] };

  const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3200); };
  const uid = () => "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const snip = (s, n = 90) => s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;

  const App = window.App = {
    doc: null, st: null, paras: [], current: null,
    esc, snip, toast, store, COLORS, TOOL_NAME,
    para(pid) { return this.paras.find(p => p.pid === pid); },
    sectionOf(sid) { return this.doc.sections.find(s => s.id === sid); },
    sectionText(sid) { return this.sectionOf(sid).paras.map(p => p.text).join("\n\n"); },
    save() { clearTimeout(this._sv); this._sv = setTimeout(() => store.set(`doc.${this.doc.id}`, { doc: this.doc, ...this.st }), 250); },
    emit(name, detail) { window.dispatchEvent(new CustomEvent(`clarify:${name}`, { detail })); }
  };

  /* ---------- documents ---------- */
  function blankState() { return { marks: [], question: "", sowhat: "", survey: {}, saybacks: {}, jev: { paras: {}, saybacks: {}, questions: {} } }; }

  function loadDoc(doc, fresh) {
    const saved = store.get(`doc.${doc.id}`, null);
    App.doc = doc;
    App.st = Object.assign(blankState(), saved && !fresh ? saved : {});
    delete App.st.doc;
    App.st.jev = Object.assign({ paras: {}, saybacks: {}, questions: {} }, App.st.jev);
    store.set("current", doc.id);
    if (doc.id !== SPECIMEN.id) {
      const idx = store.get("index", []).filter(d => d.id !== doc.id);
      idx.unshift({ id: doc.id, title: doc.title });
      store.set("index", idx.slice(0, 12));
    }
    App.save();
    renderPaper();
    App.emit("doc");
  }

  /* ---------- paper ---------- */
  function renderPaper() {
    const d = App.doc, sheet = $("#sheet");
    App.paras = [];
    let n = 0;
    let html = `<div class="masthead"><span>${esc(d.source || "")}</span>${d.license ? `<span>${esc(d.license)}</span>` : ""}</div>
      <h1 class="title">${esc(d.title)}</h1><p class="byline">${esc(d.authors || "")}</p>`;
    d.sections.forEach(s => {
      html += `<section class="sec" data-sid="${s.id}"><h2>${esc(s.heading)}</h2>`;
      s.paras.forEach(p => {
        if (p.kind === "sub") { html += `<h3>${esc(p.text)}</h3>`; return; }
        n++;
        App.paras.push({ pid: p.id, n, sid: s.id, text: p.text, kind: p.kind || "p" });
        if (p.kind === "figure") html += figureSVG(d) ;
        html += `<p class="para ${p.kind === "figure" ? "caption" : ""} ${s.id === "abs" ? "abstract" : ""}" id="p-${p.id}" data-pid="${p.id}" data-n="${n}" tabindex="0">${esc(p.text)}</p>`;
      });
      if (!/^(abs|abstract|concl)/i.test(s.id) && s.paras.some(p => p.kind !== "sub")) {
        html += `<div class="indexcard sayback" data-sid="${s.id}"><label for="say-${s.id}">Say it back · ${esc(s.heading)}</label>
          <textarea id="say-${s.id}" rows="2" placeholder="In my words, this section…">${esc(App.st.saybacks[s.id] || "")}</textarea><div class="say-check" data-sid="${s.id}"></div></div>`;
      }
      html += `</section>`;
    });
    if (d.link) html += `<p class="origin">Original: <a href="${esc(d.link)}" target="_blank" rel="noopener">${esc(d.link)}</a>. Figures and tables are on the original page.</p>`;
    sheet.innerHTML = html;
    $("#question").value = App.st.question || "";
    $("#sowhat").value = App.st.sowhat || "";
    $$("[data-survey]").forEach(c => c.checked = !!App.st.survey[c.dataset.survey]);
    document.title = `Clarify · ${snip(d.title, 50)}`;
    requestAnimationFrame(redraw);
    document.fonts && document.fonts.ready.then(redraw);
  }

  function figureSVG(d) {
    if (!d.figure) return "";
    const W = 560, H = 300, L = 54, R = 16, T = 18, B = 46;
    const x = v => L + (v + 2) / 3.5 * (W - L - R), y = v => H - B - (v - 5) / 40 * (H - T - B);
    const col = { rural: "#4f7a4a", suburban: "#c08a2b", urban: "#3b4f86" };
    const fx = v => d.figure.intercept + d.figure.slope * v;
    const band = [-2, 1.5].map(v => [x(v), y(fx(v) + 4 + Math.abs(v) * 1.8), y(fx(v) - 4 - Math.abs(v) * 1.8)]);
    let s = `<figure class="fig" aria-label="Figure 1: song onset rises with night-time light"><svg viewBox="0 0 ${W} ${H}" role="img">`;
    for (let v = 5; v <= 45; v += 10) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 8}" y="${y(v) + 4}" class="tick" text-anchor="end">${v}</text>`;
    [-2, -1, 0, 1].forEach(v => s += `<text x="${x(v)}" y="${H - B + 18}" class="tick" text-anchor="middle">${[0.01, 0.1, 1, 10][v + 2]}</text>`);
    s += `<path d="M${band[0][0]},${band[0][1]} L${band[1][0]},${band[1][1]} L${band[1][0]},${band[1][2]} L${band[0][0]},${band[0][2]}Z" class="band"/>`;
    s += `<line x1="${x(-2)}" y1="${y(fx(-2))}" x2="${x(1.5)}" y2="${y(fx(1.5))}" class="fit"/>`;
    d.figure.points.forEach(([lx, m, c]) => s += `<circle cx="${x(lx).toFixed(1)}" cy="${y(m).toFixed(1)}" r="4.5" fill="${col[c]}"/>`);
    s += `<text x="${(L + W - R) / 2}" y="${H - 8}" class="axis" text-anchor="middle">Night-time light at ground level (lux, log scale)</text>`;
    s += `<text transform="translate(14 ${(T + H - B) / 2}) rotate(-90)" class="axis" text-anchor="middle">Song onset (min before twilight)</text>`;
    Object.entries(col).forEach(([k, c], i) => s += `<circle cx="${L + 14}" cy="${T + 8 + i * 16}" r="4" fill="${c}"/><text x="${L + 24}" y="${T + 12 + i * 16}" class="tick">${k}</text>`);
    return s + `</svg></figure>`;
  }

  /* ---------- geometry ---------- */
  function textNode(pid) { const p = $(`#p-${pid}`); return p && p.firstChild; }
  function rangeFor(pid, s, e) { const t = textNode(pid); if (!t) return null; const r = document.createRange(); r.setStart(t, Math.min(s, t.length)); r.setEnd(t, Math.min(e, t.length)); return r; }
  function stageLines(pid, s, e) {
    const r = rangeFor(pid, s, e); if (!r) return [];
    const o = $("#stage").getBoundingClientRect();
    return Ink.lines(r.getClientRects()).map(l => ({ left: l.left - o.left, right: l.right - o.left, top: l.top - o.top, bottom: l.bottom - o.top }));
  }
  function offsetIn(p, node, off) { const r = document.createRange(); r.setStart(p, 0); r.setEnd(node, off); return r.toString().length; }
  App.stageLines = stageLines;
  App.paraBox = pid => { const p = $(`#p-${pid}`), o = $("#stage").getBoundingClientRect(), b = p.getBoundingClientRect(); return { left: b.left - o.left, right: b.right - o.left, top: b.top - o.top, bottom: b.bottom - o.top }; };

  /* ---------- drawing ---------- */
  function redraw() {
    if (!App.doc) return;
    const stage = $("#stage"), svg = $("#ink");
    stage.classList.toggle("narrow", stage.clientWidth < 960);
    svg.innerHTML = "";
    svg.setAttribute("width", stage.scrollWidth); svg.setAttribute("height", stage.scrollHeight);
    Ink.defs(svg);
    const under = Ink.el("g", { class: "layer-hl", filter: "url(#inkgrain)" }, svg);
    const over = Ink.el("g", { class: "layer-pencil", filter: "url(#graphite)" }, svg);
    const anchors = {};
    App.st.marks.forEach(m => {
      const r = Ink.seed(m.id), ls = stageLines(m.pid, m.start, m.end);
      if (!ls.length) return;
      const g = Ink.el("g", { "data-mark": m.id }, m.tool === "hl" ? under : over);
      if (m.tool === "hl") Ink.highlighter(g, ls, `c-${m.color}`, r);
      else if (m.tool === "ul") Ink.underline(g, ls, r);
      else if (m.tool === "circle") Ink.circle(g, ls, r);
      else if (m.tool === "box") { const b = Ink.box(g, ls, r); anchors[m.id] = { x: b.right, y: (b.top + b.bottom) / 2, r }; }
      else if (m.tool === "q") { Ink.wavy(g, ls, r); const l = ls[ls.length - 1]; anchors[m.id] = { x: l.right + 2, y: l.bottom, r }; }
      else if (m.tool === "bracket") { const b = App.paraBox(m.pid); const x = b.right + 10; Ink.bracket(g, b.top + 2, b.bottom - 2, x, r); g.firstChild.setAttribute("transform", `translate(${2 * x} 0) scale(-1 1)`); anchors[m.id] = { x: x + 4, y: b.top + 14, r }; }
    });
    layoutMargin(anchors, over);
    tally();
    positionRuler();
    App.emit("redraw");
  }
  App.redraw = redraw;

  function cardHTML(m) {
    const p = App.para(m.pid), n = p ? p.n : "?";
    const kind = { box: ["callout", "Callout", "My note"], q: ["sticky", "Question", "My question"], bracket: ["tag", "Bracket", "What is this paragraph doing?"] }[m.tool];
    return `<div class="mcard ${kind[0]}" data-card="${m.id}" style="--tilt:${((Ink.seed(m.id)() - 0.5) * 2.4).toFixed(2)}deg">
      <div class="mc-head"><span>${kind[1]} · ¶${n}</span><button class="x" data-erase="${m.id}" aria-label="Erase this ${kind[1].toLowerCase()}">×</button></div>
      ${m.tool !== "bracket" ? `<q>${esc(snip(m.text, 80))}</q>` : ""}
      <label class="sr" for="n-${m.id}">${kind[2]}</label>
      <textarea id="n-${m.id}" data-note="${m.id}" rows="2" placeholder="${kind[2]}">${esc(m.note)}</textarea></div>`;
  }

  function layoutMargin(anchors, g) {
    const margin = $("#margin"), stage = $("#stage");
    const ms = App.st.marks.filter(m => anchors[m.id]).sort((a, b) => anchors[a.id].y - anchors[b.id].y);
    const focused = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.note;
    const caret = focused ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
    margin.innerHTML = ms.map(cardHTML).join("");
    if (focused) { const t = margin.querySelector(`[data-note="${focused}"]`); if (t) { t.focus(); t.setSelectionRange(...caret); } }
    if (stage.classList.contains("narrow")) { margin.style.height = ""; return; }
    let floor = 0;
    const mo = margin.offsetTop, ml = margin.offsetLeft;
    ms.forEach(m => {
      const c = margin.querySelector(`[data-card="${m.id}"]`), a = anchors[m.id];
      const top = Math.max(a.y - mo - 18, floor);
      c.style.top = top + "px";
      floor = top + c.offsetHeight + 12;
      Ink.leader(g, a.x, a.y, ml + 6, mo + top + 16, a.r);
    });
    margin.style.height = Math.max(floor, $("#sheet").offsetHeight) + "px";
  }

  function tally() {
    const c = { claim: 0, evidence: 0, method: 0, lost: 0 };
    App.st.marks.forEach(m => m.tool === "hl" && c[m.color]++);
    const other = App.st.marks.filter(m => m.tool !== "hl").length;
    $("#tally").textContent = `${c.claim} claims · ${c.evidence} evidence · ${c.method} method · ${c.lost} lost · ${other} other marks`;
    const secs = $$(".sayback").length, done = Object.values(App.st.saybacks).filter(v => v && v.trim()).length;
    $("#saybackTally").textContent = `${done} of ${secs} index cards written`;
    const words = App.st.marks.filter(m => m.tool === "circle");
    $("#wordList").innerHTML = words.length ? words.map(m => `<li><button class="term" data-goto="${m.pid}">${esc(snip(m.text, 40))}</button>
      <label class="sr" for="w-${m.id}">My guess for ${esc(m.text)}</label><input id="w-${m.id}" data-note="${m.id}" value="${esc(m.note)}" placeholder="My guess…"><button class="x" data-erase="${m.id}" aria-label="Erase ${esc(m.text)}">×</button></li>`).join("")
      : `<li class="empty">Circle a word with <kbd>O</kbd>. It lands here.</li>`;
  }

  /* ---------- marking ---------- */
  let pending = null; // {pid, start, end}
  function readSelection() {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    const p0 = (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement).closest("[data-pid]");
    const p1 = (r.endContainer.nodeType === 1 ? r.endContainer : r.endContainer.parentElement).closest("[data-pid]");
    if (!p0 || !$("#sheet").contains(p0)) return null;
    let s = offsetIn(p0, r.startContainer, r.startOffset), e = p1 === p0 ? offsetIn(p0, r.endContainer, r.endOffset) : p0.textContent.length;
    if (p1 !== p0) toast("Marks stay inside one paragraph, like one swipe of a highlighter.");
    const t = p0.textContent;
    while (s < e && /\s/.test(t[s])) s++;
    while (e > s && /\s/.test(t[e - 1])) e--;
    return e > s ? { pid: p0.dataset.pid, start: s, end: e } : null;
  }

  function showPalette(sel) {
    pending = sel;
    const pal = $("#palette");
    if (!sel) { pal.hidden = true; return; }
    const ls = stageLines(sel.pid, sel.start, sel.end), l = ls[ls.length - 1];
    pal.hidden = false;
    const w = pal.offsetWidth, stageW = $("#stage").clientWidth;
    pal.style.left = Math.max(4, Math.min(l.right - w / 2, stageW - w - 4)) + "px";
    pal.style.top = (l.bottom + 8) + "px";
  }

  function addMark(tool, color, sel = pending) {
    if (!sel) return;
    const text = App.para(sel.pid).text.slice(sel.start, sel.end);
    if (tool === "circle" && text.split(/\s+/).length > 4) { toast("Circle one word or a short term. Use a box for longer phrases."); return; }
    const m = { id: uid(), pid: sel.pid, start: sel.start, end: sel.end, tool, color: color || null, note: "", text, at: Date.now() };
    App.st.marks.push(m);
    getSelection().removeAllRanges();
    showPalette(null); ks = null;
    App.save(); redraw();
    const msg = tool === "hl" ? `${COLORS[color]} highlight` : TOOL_NAME[tool];
    toast(`${msg} on ¶${App.para(sel.pid).n}`);
    if (tool === "box" || tool === "q" || tool === "bracket") { const t = $(`[data-note="${m.id}"]`); t && t.focus({ preventScroll: true }); }
    else { const p = $(`#p-${sel.pid}`); p && p.focus({ preventScroll: true }); }
    App.emit("marks");
  }
  App.addMark = addMark;

  function erase(id) {
    App.st.marks = App.st.marks.filter(m => m.id !== id);
    delete App.st.jev.questions[id];
    hideMarkPop(); App.save(); redraw(); App.emit("marks");
  }

  function bracketPara(pid) {
    if (App.st.marks.some(m => m.pid === pid && m.tool === "bracket")) { toast("That paragraph is already bracketed."); return; }
    const len = App.para(pid).text.length;
    addMark("bracket", null, { pid, start: 0, end: len });
  }

  /* ---------- mark popover (click a mark) ---------- */
  function caretAt(x, y) {
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r && { node: r.startContainer, off: r.startOffset }; }
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p && { node: p.offsetNode, off: p.offset }; }
  }
  function showMarkPop(m, x, y) {
    const pop = $("#markpop"), o = $("#stage").getBoundingClientRect();
    pop.innerHTML = `<div class="mp-head"><b>${m.tool === "hl" ? COLORS[m.color] + " highlight" : TOOL_NAME[m.tool]}</b> · ¶${App.para(m.pid).n}</div>
      <q>${esc(snip(m.text, 70))}</q>
      ${m.tool === "hl" ? `<div class="mp-sw">${Object.entries(COLORS).map(([k, v]) => `<button data-recolor="${k}" class="${k === m.color ? "on" : ""}" aria-label="Make it ${v}"><i class="sw hl-${k}"></i>${v}</button>`).join("")}</div>` : ""}
      <div class="row"><button class="btn ghost small" data-erase="${m.id}">Erase</button><button class="btn ghost small" data-closepop>Done</button></div>`;
    pop.dataset.mark = m.id; pop.hidden = false;
    pop.style.left = Math.min(x - o.left, $("#stage").clientWidth - 260) + "px"; pop.style.top = (y - o.top + 14) + "px";
    pop.querySelector("button").focus({ preventScroll: true });
  }
  function hideMarkPop() { $("#markpop").hidden = true; }

  /* ---------- keyboard word selection ---------- */
  let ks = null; // {pid, words, a, f}
  function wordsOf(text) {
    const out = []; const re = /\S+/g; let m;
    while ((m = re.exec(text))) {
      let s = m.index, e = s + m[0].length;
      while (s < e && /[("“'‘\[]/.test(text[s])) s++;
      while (e > s && /[)"”'’\],.;:!?]/.test(text[e - 1])) e--;
      if (e > s) out.push([s, e]);
    }
    return out;
  }
  function ksApply() {
    const [lo, hi] = [Math.min(ks.a, ks.f), Math.max(ks.a, ks.f)];
    const s = ks.words[lo][0], e = ks.words[hi][1];
    const r = rangeFor(ks.pid, s, e), sel = getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    showPalette({ pid: ks.pid, start: s, end: e });
    const live = $("#toast"); live.classList.remove("show");
    live.textContent = `Selected: ${App.para(ks.pid).text.slice(s, e)}`;
  }

  /* ---------- reading ruler ---------- */
  function setCurrent(pid) {
    App.current = pid;
    $$(".para.current").forEach(p => p.classList.remove("current"));
    const p = pid && $(`#p-${pid}`); p && p.classList.add("current");
    positionRuler();
  }
  function positionRuler() {
    const on = document.body.classList.contains("ruler"), card = $("#rulerCard");
    card.hidden = !on || !App.current || document.body.dataset.layer === "gemini";
    if (card.hidden) return;
    const b = App.paraBox(App.current), sheet = $("#sheet");
    card.style.left = sheet.offsetLeft + 18 + "px"; card.style.width = sheet.offsetWidth - 36 + "px"; card.style.top = b.bottom + 6 + "px";
  }
  function toggleRuler(force) {
    const on = force ?? !document.body.classList.contains("ruler");
    document.body.classList.toggle("ruler", on); $("#rulerToggle").checked = on;
    if (on && !App.current) setCurrent(App.paras[0] && App.paras[0].pid);
    store.set("ruler", on); positionRuler();
  }

  /* ---------- breakdown sheet ---------- */
  function breakdown() {
    const st = App.st, d = App.doc;
    const by = (tool, color) => st.marks.filter(m => m.tool === tool && (!color || m.color === color)).sort((a, b) => App.para(a.pid).n - App.para(b.pid).n || a.start - b.start);
    const none = pass => `<p class="none">Not yet. Go back to pass ${pass}.</p>`;
    const list = (ms, note) => ms.length ? `<ul>${ms.map(m => `<li><span class="pn">¶${App.para(m.pid).n}</span> ${esc(m.text)}${note && m.note ? `<span class="mynote">${esc(m.note)}</span>` : ""}</li>`).join("")}</ul>` : null;
    const says = d.sections.filter(s => $(`.sayback[data-sid="${s.id}"]`));
    $("#breakdown").innerHTML = `
      <header><span class="eyebrow">My breakdown</span><h2>${esc(d.title)}</h2><p class="src">${esc(d.source || "")}</p></header>
      <section class="bd wide"><h3>The question it asks</h3>${st.question ? `<p class="mine">${esc(st.question)}</p>` : none(1)}</section>
      <section class="bd wide"><h3>What each section does</h3>${says.map(s => `<p><b>${esc(s.heading)}.</b> ${st.saybacks[s.id] ? esc(st.saybacks[s.id]) : `<span class="none">Not written yet.</span>`}</p>`).join("")}</section>
      <section class="bd"><h3><i class="sw hl-claim"></i>Claims</h3>${list(by("hl", "claim")) || none(2)}</section>
      <section class="bd"><h3><i class="sw hl-evidence"></i>Evidence</h3>${list(by("hl", "evidence")) || none(2)}</section>
      <section class="bd"><h3><i class="sw hl-method"></i>Methods</h3>${list(by("hl", "method")) || none(2)}</section>
      <section class="bd"><h3><i class="sw hl-lost"></i>Where I got lost</h3>${list(by("hl", "lost")) || `<p class="none">Nowhere marked.</p>`}</section>
      <section class="bd"><h3>My questions</h3>${list(by("q"), true) || `<p class="none">No sticky notes.</p>`}</section>
      <section class="bd"><h3>Callouts</h3>${list(by("box"), true) || `<p class="none">No callouts.</p>`}</section>
      <section class="bd"><h3>Words</h3>${by("circle").length ? `<dl>${by("circle").map(m => `<dt>${esc(m.text)}</dt><dd>${m.note ? esc(m.note) : `<span class="none">no guess yet</span>`}</dd>`).join("")}</dl>` : `<p class="none">No circled words.</p>`}</section>
      <section class="bd"><h3>Underlined to reread</h3>${list(by("ul")) || `<p class="none">Nothing underlined.</p>`}</section>
      <section class="bd wide"><h3>So what?</h3>${st.sowhat ? `<p class="mine">${esc(st.sowhat)}</p>` : none(3)}</section>
      <footer>Built from my own marks in Clarify. No sentence on this sheet was written by AI.</footer>`;
    $("#dlgSheet").showModal();
  }

  /* ---------- paper sources ---------- */
  function parsePaste(title, text, source) {
    const blocks = text.replace(/\r/g, "").split(/\n\s*\n/).map(b => b.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
    const HEAD = /^(abstract|summary|introduction|background|methods?|materials and methods|methodology|results?|discussion|conclusions?|limitations|significance|results and discussion)\b/i;
    const sections = []; let cur = null, i = 0;
    for (const b of blocks) {
      if (/^(references|bibliography|works cited|literature cited|acknowledg|supporting information|supplementary (material|information)|author contributions|funding|conflicts? of interest|competing interests)/i.test(b)) break;
      if (!/[a-z]{2}/i.test(b) || /^\(?(pdf|csv|tiff?|xlsx?|docx?|zip|png|jpe?g)\)?$/i.test(b)) continue;
      const isHead = b.length < 70 && !/[.?!]$/.test(b) && (HEAD.test(b) || b.split(" ").length <= 6);
      if (isHead) { cur = { id: "s" + sections.length, heading: b.replace(/^\d+\.?\s*/, ""), paras: [] }; sections.push(cur); continue; }
      if (!cur) { cur = { id: "s0", heading: "Text", paras: [] }; sections.push(cur); }
      cur.paras.push({ id: "p" + (++i), text: b.slice(0, 5800) });
    }
    sections.forEach(s => { if (/^abstract/i.test(s.heading)) s.id = "abs"; });
    return { id: "paste-" + hash(title + text.slice(0, 400)), title: title || "Pasted article", authors: "", source: source || "Pasted by the reader", license: "", sections: sections.filter(s => s.paras.length) };
  }

  const EPMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/";
  const decode = s => new DOMParser().parseFromString(s || "", "text/html").body.textContent;
  async function pmcSearch(q) {
    const ul = $("#pmcResults");
    if (/^PMC\d+$/i.test(q.trim())) return openPMC(q.trim().toUpperCase());
    ul.innerHTML = `<li class="empty">Searching…</li>`;
    try {
      const r = await fetch(`${EPMC}search?query=${encodeURIComponent(`(${q}) AND OPEN_ACCESS:y AND HAS_FT:y AND SRC:MED`)}&format=json&pageSize=8&resultType=lite`);
      const j = await r.json();
      if (!r.ok || !j.resultList) throw new Error(j.errMsg || "Search is down");
      const rs = j.resultList.result.filter(x => x.pmcid);
      ul.innerHTML = rs.length ? rs.map(x => `<li><button class="pmc" data-pmc="${x.pmcid}"><b>${esc(decode(x.title))}</b><span>${esc(snip(x.authorString || "", 60))} · ${esc(x.journalTitle || "")} ${esc(x.pubYear || "")}</span></button></li>`).join("") : `<li class="empty">No open-access full texts. Try other words.</li>`;
    } catch (e) {
      ul.innerHTML = `<li class="empty">Europe PMC search isn't answering right now (${esc(e.message)}). A PMCID still works, or paste the text.</li>`;
    }
  }

  async function openPMC(id) {
    const ul = $("#pmcResults");
    ul.innerHTML = `<li class="empty">Fetching ${esc(id)}…</li>`;
    try {
      const r = await fetch(`${EPMC}${id}/fullTextXML`);
      if (!r.ok) throw new Error(r.status === 404 ? "no open full text for that id" : "HTTP " + r.status);
      const x = new DOMParser().parseFromString(await r.text(), "application/xml");
      const t = el => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
      const authors = [...x.querySelectorAll("contrib[contrib-type='author'] name")].map(n => `${t(n.querySelector("given-names"))} ${t(n.querySelector("surname"))}`.trim());
      const lic = x.querySelector("license");
      const licRef = lic && (lic.getAttribute("xlink:href") || (lic.querySelector("*|license_ref") && t(lic.querySelector("*|license_ref"))));
      const sections = []; let i = 0;
      const abs = x.querySelector("article-meta abstract:not([abstract-type])") || x.querySelector("article-meta abstract");
      if (abs) sections.push({ id: "abs", heading: "Abstract", paras: [...abs.querySelectorAll("p")].map(p => ({ id: "p" + (++i), text: t(p).slice(0, 5800) })) });
      const body = x.querySelector("body");
      if (!body) throw new Error("this article has no full text body in Europe PMC");
      const walk = (node, sec) => {
        [...node.children].forEach(ch => {
          const tag = ch.tagName;
          if (tag === "p") { ch.querySelectorAll("fig, table-wrap, disp-formula").forEach(f => { walk({ children: [f] }, sec); f.remove(); }); const s = t(ch); if (s) sec.paras.push({ id: "p" + (++i), text: s.slice(0, 5800) }); }
          else if (tag === "sec") { const ti = ch.querySelector(":scope > title"); if (ti) sec.paras.push({ id: "h" + (++i), kind: "sub", text: t(ti) }); walk(ch, sec); }
          else if (tag === "fig") { const cap = t(ch.querySelector("caption")); if (cap) sec.paras.push({ id: "p" + (++i), kind: "figure-text", text: `${t(ch.querySelector("label"))} ${cap}`.trim().slice(0, 5800) }); }
          else if (tag === "list") { ch.querySelectorAll("list-item").forEach(li => sec.paras.push({ id: "p" + (++i), text: t(li).slice(0, 5800) })); }
        });
      };
      const tops = [...body.children].filter(c => c.tagName === "sec");
      if (!tops.length) { const s = { id: "s0", heading: "Text", paras: [] }; walk(body, s); sections.push(s); }
      tops.forEach((sec, k) => { const s = { id: "s" + (k + 1), heading: t(sec.querySelector(":scope > title")) || "Section", paras: [] }; walk(sec, s); sections.push(s); });
      let count = 0;
      sections.forEach(s => s.paras = s.paras.filter(p => p.kind === "sub" || ++count <= 150));
      const year = t(x.querySelector("pub-date year")), journal = t(x.querySelector("journal-title"));
      const doc = {
        id: "pmc-" + id, title: t(x.querySelector("article-meta title-group article-title")) || id,
        authors: authors.slice(0, 4).join(", ") + (authors.length > 4 ? ", et al." : ""),
        source: `${journal}${year ? ", " + year : ""} · ${id} · open access via Europe PMC`, license: licRef ? licRef.replace(/^https?:\/\//, "") : "Open access",
        link: `https://europepmc.org/article/PMC/${id}`, sections: sections.filter(s => s.paras.some(p => p.kind !== "sub"))
      };
      doc.sections.forEach(s => s.paras.forEach(p => { if (p.kind === "figure-text") delete p.kind; }));
      $("#dlgPaper").close(); loadDoc(doc); toast(`Opened ${id}. ${count > 150 ? "Only the first 150 paragraphs are shown." : ""}`);
    } catch (e) {
      ul.innerHTML = `<li class="empty">Couldn't open ${esc(id)}: ${esc(e.message)}.</li>`;
    }
  }

  /* ---------- layers ---------- */
  function setLayer(layer) {
    document.body.dataset.layer = layer;
    $$(".layers [role=tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.layer === layer));
    $$(".rail-pane").forEach(p => p.hidden = p.dataset.pane !== layer);
    $("#gemDesk").hidden = layer !== "gemini";
    $("#stage").hidden = layer === "gemini";
    store.set("layer", layer);
    showPalette(null); hideMarkPop();
    if (layer !== "gemini") requestAnimationFrame(redraw);
    App.emit("layer", layer);
  }
  App.setLayer = setLayer;

  /* ---------- events ---------- */
  function bind() {
    const sheet = $("#sheet");
    sheet.addEventListener("mouseup", e => {
      setTimeout(() => {
        const sel = readSelection();
        if (sel) { hideMarkPop(); showPalette(sel); return; }
        showPalette(null);
        const p = e.target.closest("[data-pid]"); if (!p) return;
        setCurrent(p.dataset.pid);
        const c = caretAt(e.clientX, e.clientY); if (!c) return;
        const off = offsetIn(p, c.node, c.off);
        const hits = App.st.marks.filter(m => m.pid === p.dataset.pid && m.tool !== "bracket" && off >= m.start && off <= m.end).sort((a, b) => (a.end - a.start) - (b.end - b.start));
        hits.length ? showMarkPop(hits[0], e.clientX, e.clientY) : hideMarkPop();
      }, 0);
    });
    sheet.addEventListener("focusin", e => { const p = e.target.closest("[data-pid]"); if (p) setCurrent(p.dataset.pid); });
    $("#palette").addEventListener("mousedown", e => e.preventDefault());
    $("#palette").addEventListener("click", e => { const b = e.target.closest("button"); if (b) addMark(b.dataset.tool, b.dataset.color); });

    document.addEventListener("click", e => {
      const er = e.target.closest("[data-erase]"); if (er) { erase(er.dataset.erase); return; }
      const rc = e.target.closest("[data-recolor]"); if (rc) { const m = App.st.marks.find(m => m.id === $("#markpop").dataset.mark); if (m) { m.color = rc.dataset.recolor; App.save(); redraw(); App.emit("marks"); } hideMarkPop(); return; }
      if (e.target.closest("[data-closepop]")) { hideMarkPop(); return; }
      const go = e.target.closest("[data-goto]"); if (go) { gotoPara(go.dataset.goto); return; }
      const cl = e.target.closest("[data-close]"); if (cl) { cl.closest("dialog").close(); return; }
      const pm = e.target.closest("[data-pmc]"); if (pm) { openPMC(pm.dataset.pmc); return; }
      const rd = e.target.closest("[data-recent]"); if (rd) { const s = store.get(`doc.${rd.dataset.recent}`); if (s) { $("#dlgPaper").close(); loadDoc(s.doc); } return; }
      if (!e.target.closest("#markpop, #sheet")) hideMarkPop();
    });

    document.addEventListener("input", e => {
      const t = e.target;
      if (t.dataset.note) { const m = App.st.marks.find(m => m.id === t.dataset.note); if (m) { m.note = t.value; App.save(); clearTimeout(bind.rl); bind.rl = setTimeout(() => App.emit("marks"), 400); } }
      else if (t.closest(".sayback")) { App.st.saybacks[t.closest(".sayback").dataset.sid] = t.value; App.save(); tally(); App.emit("marks"); }
      else if (t.id === "question") { App.st.question = t.value; App.save(); App.emit("marks"); }
      else if (t.id === "sowhat") { App.st.sowhat = t.value; App.save(); App.emit("marks"); }
      else if (t.dataset.survey) { App.st.survey[t.dataset.survey] = t.checked; App.save(); }
    });
    // margin cards grow as you type; relayout so they never overlap
    document.addEventListener("keyup", e => { if (e.target.closest && e.target.closest(".mcard")) { clearTimeout(bind.lay); bind.lay = setTimeout(redraw, 500); } });

    document.addEventListener("keydown", e => {
      const typing = e.target.matches && e.target.matches("input, textarea, select, [contenteditable]");
      if (e.key === "Escape") { if (ks || pending) { ks = null; getSelection().removeAllRanges(); showPalette(null); } hideMarkPop(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]") || document.body.dataset.layer === "gemini") return;
      const k = e.key.toLowerCase();
      const para = e.target.closest && e.target.closest("[data-pid]");
      if (para && e.key === "Enter" && !ks) {
        const words = wordsOf(para.textContent); if (!words.length) return;
        ks = { pid: para.dataset.pid, words, a: 0, f: 0 }; ksApply(); e.preventDefault();
        toast("Selecting words. Arrows move, Shift stretches, then press a tool key."); return;
      }
      if (ks && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        const dir = e.key === "ArrowRight" ? 1 : -1, last = ks.words.length - 1;
        ks.f = Math.max(0, Math.min(last, ks.f + dir)); if (!e.shiftKey) ks.a = ks.f;
        ksApply(); e.preventDefault(); return;
      }
      if (KEY_TOOL[k]) { const sel = pending || readSelection(); if (sel) { e.preventDefault(); addMark(KEY_TOOL[k][0], KEY_TOOL[k][1], sel); } return; }
      if (e.key === "[" && (para || App.current)) { e.preventDefault(); bracketPara(para ? para.dataset.pid : App.current); return; }
      if (k === "r") { toggleRuler(); return; }
      if (k === "x" && para) {
        const n = App.st.marks.filter(m => m.pid === para.dataset.pid).length;
        if (n && confirm(`Erase all ${n} marks in ¶${para.dataset.n}?`)) { App.st.marks = App.st.marks.filter(m => m.pid !== para.dataset.pid); App.save(); redraw(); App.emit("marks"); }
      }
    });

    $$(".layers [role=tab]").forEach(b => b.addEventListener("click", () => setLayer(b.dataset.layer)));
    $(".layers").addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tabs = $$(".layers [role=tab]"), i = tabs.indexOf(document.activeElement), n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); setLayer(n.dataset.layer);
    });
    $$(".pass-head").forEach(b => b.addEventListener("click", () => { const open = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", open); b.nextElementSibling.hidden = !open; requestAnimationFrame(redraw); }));
    $("#rulerToggle").addEventListener("change", e => toggleRuler(e.target.checked));
    $("#btnSheet").addEventListener("click", breakdown);
    $("#printSheet").addEventListener("click", () => window.print());
    $("#btnHelp").addEventListener("click", () => $("#dlgHelp").showModal());
    $("#btnPaper").addEventListener("click", () => { recent(); $("#dlgPaper").showModal(); });
    $("#loadSpecimen").addEventListener("click", () => { $("#dlgPaper").close(); loadDoc(SPECIMEN); });
    $("#loadPaste").addEventListener("click", () => {
      const text = $("#pasteText").value.trim(); if (text.length < 200) { toast("Paste the article's text first (at least a few paragraphs)."); return; }
      const doc = parsePaste($("#pasteTitle").value.trim(), text, App.uploadSource); if (!doc.sections.length) { toast("Couldn't find paragraphs. Leave a blank line between them."); return; }
      $("#dlgPaper").close(); loadDoc(doc); App.uploadSource = null;
    });
    $("#pmcForm").addEventListener("submit", e => { e.preventDefault(); const q = $("#pmcQ").value.trim(); if (q) pmcSearch(q); });
    const lm = $("#lessMotion");
    lm.checked = store.get("lessMotion", matchMedia("(prefers-reduced-motion: reduce)").matches);
    document.body.classList.toggle("less-motion", lm.checked);
    lm.addEventListener("change", () => { document.body.classList.toggle("less-motion", lm.checked); store.set("lessMotion", lm.checked); });
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(redraw, 120); });
  }

  function recent() {
    const idx = store.get("index", []);
    let box = $("#recentPapers");
    if (!box) { box = document.createElement("section"); box.id = "recentPapers"; $(".paper-opts").prepend(box); }
    box.hidden = !idx.length;
    box.innerHTML = `<h3>Your papers</h3><ul class="pmc-results">${idx.map(d => `<li><button class="pmc" data-recent="${esc(d.id)}"><b>${esc(snip(d.title, 90))}</b></button></li>`).join("")}</ul>`;
  }

  function gotoPara(pid) {
    if (document.body.dataset.layer === "gemini") setLayer("pencil");
    const p = $(`#p-${pid}`); if (!p) return;
    p.scrollIntoView({ behavior: document.body.classList.contains("less-motion") ? "auto" : "smooth", block: "center" });
    p.focus({ preventScroll: true }); p.classList.remove("flash"); void p.offsetWidth; p.classList.add("flash");
  }
  App.gotoPara = gotoPara;

  /* ---------- start ---------- */
  bind();
  const cur = store.get("current", SPECIMEN.id);
  const saved = cur !== SPECIMEN.id && store.get(`doc.${cur}`, null);
  loadDoc(saved ? saved.doc : SPECIMEN);
  if (store.get("ruler", false)) toggleRuler(true);
  // layer scripts load after this one; tell them about the paper and restore the layer once they are listening
  addEventListener("DOMContentLoaded", () => { App.emit("doc"); setLayer(store.get("layer", "pencil")); });
})();
