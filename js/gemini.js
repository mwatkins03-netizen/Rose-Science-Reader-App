/* Clarify, layer 3: hand-off to Gemini. Shows the Clarify Reading Coach skill and builds a packet from the
   reader's own marks for them to paste into a Gem. Nothing is sent from this page. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { toast } = App;
  const FILES = { skill: "gemini/clarify-reading-coach/SKILL.md", gem: "gemini/gem-instructions.md" };
  const text = { skill: null, gem: null, setup: `HOW TO SET UP THE CLARIFY READING COACH

Option A · As a Gem (the Gemini app)
  1. Go to gemini.google.com and sign in with your university account.
  2. Open Gems, then New Gem.
  3. Name it: Clarify Reading Coach
  4. Instructions: paste the "Gem instructions" file.
  5. Knowledge: upload SKILL.md.
  6. Save. Open the Gem and paste your packet.
  Make it once. Use it for every paper.

Option B · No Gem
  Use "Copy skill + packet" and paste both into a new Gemini chat.
  It works, but you have to paste the skill each time.

Option C · Gemini CLI or another agent that reads Agent Skills
  Copy the folder gemini/clarify-reading-coach/ into your skills
  folder (for Gemini CLI: ~/.gemini/skills/). The tool loads the
  skill when you paste a CLARIFY PACKET.

Which of these your campus account allows depends on how the
university has set up Gemini. Ask your instructor if Gems are
missing.

What Gemini sees: only what you paste. Clarify sends nothing.

Instructors: the skill is plain Markdown. Edit the ground rules
or the moves to fit your course, then share your copy.` };
  let tab = "skill";

  async function load() {
    for (const k of ["skill", "gem"]) {
      if (text[k]) continue;
      try { const r = await fetch(FILES[k]); if (!r.ok) throw 0; text[k] = await r.text(); }
      catch { text[k] = null; }
    }
    show();
  }
  function show() {
    const t = text[tab];
    $("#skillBody").textContent = t || `Couldn't load ${FILES[tab]} from here.\n\nThis happens when Clarify is opened as a file instead of from a web address. The file is in the Clarify folder at:\n  ${FILES[tab]}\n\nOpen it there, or run Clarify from GitHub Pages or a local server.`;
    $$(".ms-tabs [role=tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.file === tab));
  }

  const LABEL = { claim: "CLAIM", evidence: "EVIDENCE", method: "METHOD", lost: "LOST" };
  function packet() {
    const d = App.doc, st = App.st, P = App.paras;
    const secName = sid => (App.sectionOf(sid) || {}).heading || "";
    const byN = (a, b) => App.para(a.pid).n - App.para(b.pid).n || a.start - b.start;
    const L = [];
    L.push("# CLARIFY PACKET v1", `Paper: ${d.title}`, `Source: ${d.source || "unknown"}${d.link ? " · " + d.link : ""}`, `My question (pass 1): ${st.question.trim() || "not written yet"}`, "");
    if ($("#pkText").checked) {
      L.push("## Paper text");
      P.forEach(p => L.push(`¶${p.n} [${secName(p.sid)}${p.kind === "figure" ? ", figure caption" : ""}] ${p.text}`));
      L.push("");
    }
    if ($("#pkMarks").checked) {
      const ms = st.marks.filter(m => m.tool !== "circle").sort(byN);
      L.push("## My marks");
      if (!ms.length) L.push("- none yet");
      ms.forEach(m => {
        const n = App.para(m.pid).n, q = `"${m.text}"`;
        if (m.tool === "hl") L.push(`- ¶${n} · ${LABEL[m.color]}: ${q}`);
        else if (m.tool === "ul") L.push(`- ¶${n} · UNDERLINE: ${q}`);
        else if (m.tool === "box") L.push(`- ¶${n} · CALLOUT: ${q}${m.note.trim() ? " · my note: " + m.note.trim() : ""}`);
        else if (m.tool === "q") L.push(`- ¶${n} · QUESTION: ${q}${m.note.trim() ? " · my question: " + m.note.trim() : ""}`);
        else if (m.tool === "bracket") L.push(`- ¶${n} · BRACKET (whole paragraph)${m.note.trim() ? " · my label: " + m.note.trim() : ""}`);
      });
      L.push("");
    }
    if ($("#pkSay").checked) {
      const ws = st.marks.filter(m => m.tool === "circle").sort(byN);
      L.push("## Words I circled");
      if (!ws.length) L.push("- none");
      ws.forEach(m => L.push(`- ${m.text} (¶${App.para(m.pid).n}) · my guess: ${m.note.trim() || "none yet"}`));
      L.push("", "## Say it back (my words)");
      d.sections.filter(s => $(`.sayback[data-sid="${s.id}"]`)).forEach(s => L.push(`- ${s.heading}: ${(st.saybacks[s.id] || "").trim() || "not written yet"}`));
      L.push("", "## So what? (my words)", st.sowhat.trim() || "not written yet", "");
    }
    if ($("#pkJev").checked) {
      const rows = P.map(p => App.jevSummary && App.jevSummary(p.pid) ? `- ¶${p.n}: ${App.jevSummary(p.pid)}` : null).filter(Boolean);
      L.push("## Jev's numbers (a model's labels with probabilities, not facts)", ...(rows.length ? rows : ["- Jev hasn't read this paper yet"]), "");
    }
    const lost = st.marks.some(m => m.tool === "hl" && m.color === "lost");
    L.push("## Start", lost ? "Please follow the Clarify Reading Coach skill. Start with the check-in, then help me with the places I marked LOST." : "Please follow the Clarify Reading Coach skill. Start with the check-in.");
    return L.join("\n");
  }

  function readiness() {
    const st = App.st;
    const items = [
      [st.question.trim(), "Wrote the paper's question (pass 1)"],
      [st.marks.filter(m => m.tool === "hl").length >= 3, "At least three highlights (pass 2)"],
      [st.marks.some(m => m.tool === "circle" && m.note.trim()), "Guessed at a circled word"],
      [Object.values(st.saybacks).some(v => v && v.trim()), "Wrote a say-it-back card (pass 3)"],
      [Object.keys(st.jev.paras).length, "Optional: Jev read the paper"]
    ];
    $("#readiness").innerHTML = items.map(([ok, t]) => `<li class="${ok ? "ok" : ""}">${t}</li>`).join("");
  }

  function refresh() {
    if (document.body.dataset.layer !== "gemini") return;
    $("#packetBody").textContent = packet();
    $("#packetTitle").textContent = App.snip(App.doc.title, 60);
    readiness();
  }

  async function copy(t, msg) {
    try { await navigator.clipboard.writeText(t); toast(msg); }
    catch { toast("Copy didn't work here. Select the text and copy it by hand."); }
  }
  function download(name, t) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/markdown" })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const slug = () => App.doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40).replace(/-$/, "");

  $$(".ms-tabs [role=tab]").forEach(b => b.addEventListener("click", () => { tab = b.dataset.file; show(); }));
  $("#copyPacket").addEventListener("click", () => copy(packet(), "Packet copied. Paste it into your Clarify Gem."));
  $("#copyBoth").addEventListener("click", () => text.skill ? copy(`${text.skill}\n\n---\n\n${packet()}`, "Skill and packet copied. Paste both into a new Gemini chat.") : toast("The skill file didn't load here. Download it from the Clarify folder."));
  $("#dlPacket").addEventListener("click", () => download(`clarify-packet-${slug()}.md`, packet()));
  $("#dlSkill").addEventListener("click", () => text.skill ? download("SKILL.md", text.skill) : toast("The skill file didn't load here."));
  $("#dlGem").addEventListener("click", () => text.gem ? download("gem-instructions.md", text.gem) : toast("The Gem instructions didn't load here."));
  $$("#pkText, #pkMarks, #pkSay, #pkJev").forEach(c => c.addEventListener("change", refresh));
  addEventListener("clarify:layer", e => { if (e.detail === "gemini") { load(); refresh(); } });
  addEventListener("clarify:marks", refresh);
  addEventListener("clarify:doc", refresh);
})();
