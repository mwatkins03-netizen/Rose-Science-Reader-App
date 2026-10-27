/* Clarify, layer 2: Jev on acetate. Jev (TypeSafe AI) returns typed answers with probabilities, never prose.
   Every sentence the reader sees here is written by the rules below from Jev's numbers and the reader's own marks. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { esc, snip, toast } = App;
  const ENDPOINT = App.store.get("endpoint", "https://jev-sandbox-proxy.watkins-um.workers.dev");
  const pct = v => Math.round(v * 100) + "%";

  /* ---------- the questions Jev is asked ---------- */
  const ROLES = {
    background: "explains what is already known or defines the topic",
    gap: "states what is unknown, the research question, the aim, or the hypothesis",
    method: "describes how the study was done: sites, subjects, measurements, procedures, or analysis",
    result: "reports what was observed or measured, usually with numbers or statistics",
    interpretation: "explains what the results mean or offers explanations for them",
    limitation: "names weaknesses, uncertainties, or what the study cannot show",
    implication: "says why the findings matter, how they could be used, or what should come next"
  };
  const Q_PARA = {
    role: { type: "choice", instructions: "What job does this paragraph mainly do in a scientific research article?", criteria: ROLES },
    finding: { type: "noul", instructions: "Does this paragraph state one of this study's own main findings, rather than earlier research by others?" },
    hedge: { type: "score", instructions: "How certain is the language this paragraph uses about its claims?", criteria: ["speculative: might, could, it is possible that", "hedged: suggests, may, is associated with", "confident: shows, indicates, with the uncertainty stated", "definitive: proves, causes, always"] },
    dense: { type: "score", instructions: "How hard would this paragraph be for a first-year college student with no background in the field?", criteria: ["plain: everyday words and short sentences", "some terms: one or two technical words, explained by context", "dense: several technical terms or statistics with little explanation", "very dense: jargon, abbreviations, and statistics throughout"] }
  };
  const Q_SAY = {
    accuracy: { type: "score", instructions: "How accurately does the student's restatement capture what this section of the article says?", criteria: ["misstates or contradicts what the section says", "names the topic but misses the section's main point", "captures the main point but blurs or leaves out a key part", "captures the main point accurately and specifically"] },
    overstates: { type: "noul", instructions: "Does the student's restatement make the findings sound more certain, more general, or more causal than the section does, for example by dropping 'may', 'associated with', or 'in this species'?" },
    outside: { type: "noul", instructions: "Does the student's restatement add a claim that the section itself does not make?" },
    copied: { type: "noul", instructions: "Is the student's restatement mostly copied phrases from the section rather than the student's own wording?" }
  };
  const Q_ASK = {
    kind: { type: "choice", instructions: "What kind of question is the student asking about this passage?", criteria: {
      word: "asks what a word, term, or abbreviation means",
      method: "asks how the study was done or measured",
      result: "asks what was found, or what a number, statistic, or figure shows",
      meaning: "asks what the findings mean, why they matter, or whether they are true",
      beyond: "asks about something outside this study, such as other research, real-world use, or personal experience" } },
    here: { type: "noul", instructions: "Is the student's question answered by the paragraph shown?" }
  };

  /* ---------- transport: one request at a time per slot, under the proxy's 60 a minute ---------- */
  const starts = [];
  async function jev(state, questions) {
    while (true) {
      const now = Date.now(); while (starts.length && now - starts[0] > 60000) starts.shift();
      if (starts.length < 50) break;
      await new Promise(r => setTimeout(r, 60000 - (now - starts[0]) + 50));
    }
    starts.push(Date.now());
    const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: state.slice(0, 5950), model: "jev-latest", questions }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "HTTP " + r.status);
    return d.answers;
  }
  async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } })); }
  const top = a => { const ks = Object.keys(a.probabilities); return ks.reduce((b, k) => a.probabilities[k] > a.probabilities[b] ? k : b, ks[0]); };

  async function checkConn() {
    const el = $("#jevConn");
    try { const r = await fetch(ENDPOINT); if (!r.ok) throw 0; el.textContent = "Connected to the Jev proxy."; return true; }
    catch { el.textContent = "Can't reach the Jev proxy right now. Your pencil work is unaffected."; return false; }
  }

  /* ---------- 1. read every paragraph ---------- */
  let busy = false;
  async function readParas() {
    if (busy) return;
    const cache = App.st.jev.paras, todo = App.paras.filter(p => !cache[p.pid]);
    const list = todo.length ? todo : (confirm("Jev has already read this paper. Read it again?") ? App.paras : []);
    if (!list.length) { showAcetate(); return; }
    busy = true; $("#jevRead").disabled = true;
    const prog = $("#jevProg"); prog.hidden = false;
    let done = 0, failed = 0;
    const tick = () => { prog.querySelector("i").style.width = pct(done / list.length); prog.querySelector("span").textContent = `Jev has read ${done} of ${list.length} paragraphs${failed ? ` · ${failed} failed` : ""}`; };
    tick(); showAcetate();
    await pool(list, 3, async p => {
      try { cache[p.pid] = await jev(p.text, Q_PARA); App.save(); showAcetate(); }
      catch (e) { failed++; if (failed === 1) toast("Jev: " + e.message); }
      done++; tick();
    });
    busy = false; $("#jevRead").disabled = false; $("#jevRead").textContent = "Read again";
    secondLooks();
  }

  /* ---------- acetate drawing ---------- */
  function showAcetate() { const a = $("#acetate"); a.hidden = document.body.dataset.layer !== "jev" || !Object.keys(App.st.jev.paras).length; a.classList.toggle("lifted", !$("#jevShow").checked); drawTags(); }
  function drawTags() {
    const ac = $("#acetate"), sheet = $("#sheet"), box = $("#acetateTags");
    if (ac.hidden) return;
    const narrow = sheet.offsetLeft < 100;
    ac.style.left = (narrow ? sheet.offsetLeft : 0) + "px"; ac.style.top = sheet.offsetTop - 6 + "px";
    ac.style.width = sheet.offsetLeft + sheet.offsetWidth + 8 - (narrow ? sheet.offsetLeft : 0) + "px"; ac.style.height = sheet.offsetHeight + 12 + "px";
    const ox = parseFloat(ac.style.left), oy = parseFloat(ac.style.top);
    let html = "";
    App.paras.forEach(p => {
      const a = App.st.jev.paras[p.pid]; if (!a) return;
      const b = App.paraBox(p.pid), role = a.role.choice, rp = a.role.probabilities[role];
      const hl = Math.round(a.hedge.score), dl = top(a.dense);
      const x = narrow ? 2 : sheet.offsetLeft - 56 - 118 - ox;
      html += `<span class="jline" style="left:${sheet.offsetLeft - ox + 58}px;top:${b.top - oy + 4}px;height:${b.bottom - b.top - 8}px;opacity:${(0.2 + rp * 0.7).toFixed(2)}"></span>
        <button class="jtag" data-jp="${p.pid}" style="left:${x}px;top:${b.top - oy + (narrow ? 22 : 2)}px;opacity:${(0.4 + rp * 0.6).toFixed(2)}" aria-label="Jev on paragraph ${p.n}: ${role} ${pct(rp)}">
          <span class="role">${narrow ? role.slice(0, 4) : role} <span class="txt">${pct(rp)}</span></span>
          <span class="bar" style="width:${pct(rp)}"></span>
          <span class="txt">hedge </span><span class="hedge" title="Certainty of language: ${esc(a.hedge.legend[hl])}">${[0, 1, 2, 3].map(i => `<i class="${i <= hl ? "on" : ""}"></i>`).join("")}</span>
          ${a.finding.noul >= 0.7 ? `<span class="star"> ★<span class="txt"> finding</span></span>` : ""}
          <span class="txt"><br>density ${dl}/3</span></button>`;
    });
    box.innerHTML = html;
  }

  function popFor(pid, btn) {
    closePop();
    const a = App.st.jev.paras[pid], p = App.para(pid);
    const rows = (ans, q) => {
      if (ans.type === "noul") return `<div class="pr win"><span>yes</span><span><i style="width:${pct(ans.noul)}"></i></span><span>${pct(ans.noul)}</span></div>`;
      const keys = Object.keys(ans.probabilities), t = top(ans);
      return keys.map(k => `<div class="pr ${k === t ? "win" : ""}"><span>${esc(ans.type === "score" ? k + " " + ans.legend[k].split(":")[0] : k)}</span><span><i style="width:${pct(ans.probabilities[k])}"></i></span><span>${pct(ans.probabilities[k])}</span></div>`).join("");
    };
    const pop = document.createElement("div"); pop.className = "jpop"; pop.id = "jpop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", `Jev on paragraph ${p.n}`);
    pop.innerHTML = `<h4>Jev on ¶${p.n}</h4>${Object.entries(Q_PARA).map(([k, q]) => `<div class="q">${esc(q.instructions)}</div>${rows(a[k], q)}`).join("")}
      <div class="q">Jev wrote none of this. It returned the numbers; the labels are ours.</div><button class="btn ghost small" data-closejp>Close</button>`;
    $("#stage").appendChild(pop);
    const r = btn.getBoundingClientRect(), o = $("#stage").getBoundingClientRect();
    pop.style.left = Math.max(0, r.left - o.left) + "px"; pop.style.top = r.bottom - o.top + 6 + "px";
    pop.querySelector("button").focus({ preventScroll: true });
  }
  function closePop() { const p = $("#jpop"); p && p.remove(); }

  /* ---------- 2. second looks: rules over Jev's numbers and the reader's marks ---------- */
  function secondLooks() {
    const out = [];
    const marksIn = pid => App.st.marks.filter(m => m.pid === pid);
    App.paras.forEach(p => {
      const a = App.st.jev.paras[p.pid]; if (!a) return;
      const ms = marksIn(p.pid), colors = new Set(ms.filter(m => m.tool === "hl").map(m => m.color));
      const role = a.role.choice, rp = a.role.probabilities[role], P = a.role.probabilities;
      const hl = top(a.hedge), dl = +top(a.dense), n = p.n;
      const num = `${role} ${pct(rp)} · hedge ${a.hedge.legend[hl].split(":")[0]} · density ${dl}/3`;
      const add = (text, why) => out.push({ n, pid: p.pid, text, num: why || num });
      if (colors.has("method") && (P.method || 0) < 0.25) add(`You marked part of this as method. Jev leaned ${role} (${pct(rp)}), with method at ${pct(P.method || 0)}. Method sentences say what the researchers did. Check the verbs.`);
      if (colors.has("evidence") && (P.result || 0) < 0.25) add(`Evidence usually means numbers or observations. Jev reads this paragraph as mostly ${role} (${pct(rp)}). Is your green on a measurement, or on someone's reading of it?`);
      if (colors.has("claim") && +hl <= 1) add(`The authors hedge here (Jev: "${a.hedge.legend[hl].split(":")[0]}", ${pct(a.hedge.probabilities[hl])}). When you say it back, keep their "may" or "suggests." Don't make it sound surer than they do.`);
      if (!ms.length && a.finding.noul >= 0.7) add(`Jev thinks this paragraph states a main finding (${pct(a.finding.noul)}), and you haven't marked it. Worth a second look.`);
      if (colors.has("lost") && dl >= 2) add(`You got lost here. Jev rates it "${a.dense.legend[dl].split(":")[0]}" (${pct(a.dense.probabilities[dl])}). It isn't just you. Circle the terms and guess at them before rereading.`);
      if (colors.has("lost") && dl <= 1) add(`Jev rates this paragraph fairly plain (${pct(a.dense.probabilities[dl])}). The trouble may be one word or one number. Find it and circle it.`);
      if (role === "limitation" && rp >= 0.5 && !ms.length) add(`Jev reads this as a limitations paragraph (${pct(rp)}). Limitations tell you how far to trust the claims, and many readers skip them.`);
      if (ms.length && rp < 0.45) { const [x, y] = Object.entries(P).sort((u, v) => v[1] - u[1]); add(`Jev was split: ${x[0]} ${pct(x[1])}, ${y[0]} ${pct(y[1])}. Paragraphs often do two jobs. Which one matters more for your question?`); }
    });
    const ul = $("#secondLooks");
    const read = Object.keys(App.st.jev.paras).length;
    ul.innerHTML = out.length ? out.map(o => `<li><button class="pn" data-goto="${o.pid}">¶${o.n}</button>${esc(o.text)}<span class="num">${esc(o.num)}</span></li>`).join("")
      : `<li class="empty">${read ? "No disagreements yet. Mark more of the paper, or look at the paragraphs Jev starred." : "Lay the acetate to see where you and Jev differ."}</li>`;
  }

  /* ---------- 3. say-it-back checks ---------- */
  function sayNote(a) {
    const lvl = +top(a.accuracy), conf = a.accuracy.probabilities[lvl], lines = [];
    lines.push(["Jev reads your card as off from the section. Reread it and try again without looking.",
      "You named the topic but not what the section says about it. Try: \"In this section the authors ___ and find ___.\"",
      "You have the main point. Something is blurred or left out. Reread the section's last paragraph.",
      "Accurate and specific."][lvl]);
    if (conf < 0.5) lines.push(`Jev wasn't sure about this (${pct(conf)}). Decide for yourself.`);
    if (a.overstates.noul >= 0.6) lines.push("Your card may sound more certain than the authors. Look for their \"may\" or \"associated with.\"");
    if (a.outside.noul >= 0.6) lines.push("Your card may add something the section doesn't say. That's fine if it's your idea; label it as yours.");
    if (a.copied.noul >= 0.6) lines.push("This reads close to the paper's wording. Say it out loud to a friend, then write that.");
    return { text: lines.join(" "), num: `accuracy: likeliest level ${lvl} of 3 (${pct(conf)}), weighted ${a.accuracy.score.toFixed(1)} ·overstates ${pct(a.overstates.noul)} · adds ${pct(a.outside.noul)} · copied ${pct(a.copied.noul)}` };
  }
  async function checkSaybacks() {
    const secs = App.doc.sections.filter(s => (App.st.saybacks[s.id] || "").trim().length >= 15);
    if (!secs.length) { toast("Write at least one say-it-back card first (pass 3)."); return; }
    const btn = $("#jevSayback"); btn.disabled = true; btn.textContent = "Checking…";
    await pool(secs, 2, async s => {
      const say = App.st.saybacks[s.id].trim();
      const state = `SECTION (${s.heading}) OF A SCIENTIFIC ARTICLE:\n${App.sectionText(s.id).slice(0, 4600)}\n\nSTUDENT'S RESTATEMENT IN THEIR OWN WORDS:\n${say.slice(0, 1000)}`;
      try { App.st.jev.saybacks[s.id] = { answers: await jev(state, Q_SAY), text: say }; App.save(); renderSaybacks(); }
      catch (e) { toast("Jev: " + e.message); }
    });
    btn.disabled = false; btn.textContent = "Check again";
  }
  function renderSaybacks() {
    const items = App.doc.sections.filter(s => App.st.jev.saybacks[s.id]);
    $("#saybackChecks").innerHTML = items.map(s => {
      const c = App.st.jev.saybacks[s.id], stale = c.text !== (App.st.saybacks[s.id] || "").trim(), n = sayNote(c.answers);
      const el = $(`.say-check[data-sid="${s.id}"]`); if (el) el.textContent = stale ? "You've changed this card since Jev checked it." : "Jev: " + n.text;
      return `<li><b>${esc(s.heading)}.</b> ${stale ? "<em>Changed since the check.</em> " : ""}${esc(n.text)}<span class="num">${esc(n.num)}</span></li>`;
    }).join("");
    if (document.body.dataset.layer !== "jev") $$(".say-check").forEach(e => e.textContent = "");
  }

  /* ---------- 4. question sorting ---------- */
  const WHERE = {
    word: "Look it up, then add it to your circled words. A glossary or textbook index is faster than the paper.",
    method: "The Methods section should answer this.",
    result: "Look at the Results and any figure.",
    meaning: "The Discussion is where the authors say what it means. Read it, then decide whether you agree.",
    beyond: "The paper probably can't answer this. Bring it to class, your instructor, or Gemini in layer 3."
  };
  function firstPara(re) { const s = App.doc.sections.find(s => re.test(s.heading)); const p = s && s.paras.find(p => p.kind !== "sub"); return p && App.para(p.id); }
  async function sortQuestions() {
    const qs = App.st.marks.filter(m => m.tool === "q" && m.note.trim().length > 3);
    if (!qs.length) { toast("Add a question sticky note (Q) and write your question first."); return; }
    const btn = $("#jevQuestions"); btn.disabled = true; btn.textContent = "Sorting…";
    await pool(qs, 2, async m => {
      const state = `PARAGRAPH FROM A SCIENTIFIC ARTICLE:\n${App.para(m.pid).text.slice(0, 4500)}\n\nPASSAGE THE STUDENT MARKED:\n${m.text.slice(0, 400)}\n\nSTUDENT'S QUESTION:\n${m.note.slice(0, 600)}`;
      try { App.st.jev.questions[m.id] = { answers: await jev(state, Q_ASK), note: m.note }; App.save(); renderQuestions(); }
      catch (e) { toast("Jev: " + e.message); }
    });
    btn.disabled = false; btn.textContent = "Sort again";
  }
  function renderQuestions() {
    const qs = App.st.marks.filter(m => m.tool === "q" && App.st.jev.questions[m.id]);
    $("#questionSorts").innerHTML = qs.map(m => {
      const a = App.st.jev.questions[m.id].answers, k = a.kind.choice, kp = a.kind.probabilities[k];
      const go = k === "method" ? firstPara(/method/i) : k === "result" ? firstPara(/result/i) : k === "meaning" ? firstPara(/discussion|conclu/i) : null;
      return `<li><button class="pn" data-goto="${m.pid}">¶${App.para(m.pid).n}</button>"${esc(snip(m.note, 80))}" ${esc(WHERE[k])}
        ${go ? `<button class="pn" data-goto="${go.pid}">go to ¶${go.n}</button>` : ""}${a.here.noul >= 0.6 ? ` Jev thinks the answer may be in the same paragraph (${pct(a.here.noul)}). Reread it slowly first.` : ""}
        <span class="num">${k} ${pct(kp)} · answered here ${pct(a.here.noul)}</span></li>`;
    }).join("");
  }

  /* ---------- wiring ---------- */
  $("#jevAsked").innerHTML = `<p class="hint">These are the exact questions. Change the wording and the numbers change, which is the point.</p>
    <p><b>Every paragraph</b></p><pre>${esc(JSON.stringify(Q_PARA, null, 1))}</pre><p><b>Say-it-back cards</b></p><pre>${esc(JSON.stringify(Q_SAY, null, 1))}</pre><p><b>Question notes</b></p><pre>${esc(JSON.stringify(Q_ASK, null, 1))}</pre>`;
  $("#jevRead").addEventListener("click", readParas);
  $("#jevShow").addEventListener("change", showAcetate);
  $("#jevSayback").addEventListener("click", checkSaybacks);
  $("#jevQuestions").addEventListener("click", sortQuestions);
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-jp]"); if (t) { popFor(t.dataset.jp, t); return; }
    if (e.target.closest("[data-closejp]") || !e.target.closest("#jpop")) closePop();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePop(); });
  addEventListener("clarify:redraw", () => { showAcetate(); });
  addEventListener("clarify:marks", () => { if (document.body.dataset.layer === "jev") { secondLooks(); renderSaybacks(); } });
  addEventListener("clarify:doc", () => { $("#jevRead").textContent = Object.keys(App.st.jev.paras).length ? "Show the acetate" : "Lay the acetate"; secondLooks(); renderSaybacks(); renderQuestions(); });
  addEventListener("clarify:layer", e => {
    closePop(); showAcetate();
    if (e.detail === "jev") { checkConn(); secondLooks(); renderSaybacks(); renderQuestions(); }
    else $$(".say-check").forEach(el => el.textContent = "");
  });

  App.jevSummary = pid => {
    const a = App.st.jev.paras[pid]; if (!a) return "";
    return `role ${a.role.choice} ${pct(a.role.probabilities[a.role.choice])} · hedging ${a.hedge.legend[top(a.hedge)].split(":")[0]} · main finding ${pct(a.finding.noul)} · density ${top(a.dense)}/3`;
  };
})();
