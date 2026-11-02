/* Clarify, layer 4: Rose's build. Rose Stafford's own version of Clarify, ported from her React prototype to
   plain JavaScript: Gemini reads the paper and writes a breakdown (takeaway, plain summary, section cards, jargon
   decoder, discussion questions), and a reading assistant answers questions about it. Her prompts are kept as she
   wrote them. Gemini runs three ways: a key kept in this browser, a proxy URL, or by hand (copy the prompt into
   any Gemini, paste the reply back), so the tab works with no key at all. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { esc, toast, store } = App;
  const API = "https://generativelanguage.googleapis.com/v1beta/models/";
  const conn = () => store.get("gemini", { key: "", model: "gemini-2.5-flash", proxy: "" });
  const connected = () => { const c = conn(); return !!(c.key || c.proxy); };

  /* ---------- Rose's samples (from her prototype) ---------- */
  const SAMPLE_NOTE = "Sample from Rose's prototype. This text is a summary written for the prototype, not the article's own words. Read the original before citing it.";
  const SAMPLES = [
    { id: "rose-crispr-coral", title: "CRISPR Cas9 Editing in Reef-Building Corals (Acropora millepora)",
      authors: "Cleves, P. A., Strader, M. E., Bay, L. K., Pringle, J. R., & Matz, M. V.", journal: "PNAS (Proceedings of the National Academy of Sciences), 2018",
      text: `Significance:
Coral reefs are worldwide in catastrophic decline due to climate change. Understanding the molecular underpinnings of coral physiology is crucial for projecting responses to warming waters, yet functional genetic tools have been lacking. Here we demonstrate CRISPR/Cas9-mediated gene editing in the reef-building coral Acropora millepora.

Abstract:
Reef-building corals are keystones of marine biodiversity, yet their biology remains poorly understood due to a lack of genetic model systems. We microinjected coral zygotes with Cas9 ribonucleoprotein complexes targeting three genes: all-red fluorescent protein, green fluorescent protein (GFP), and fibroblast growth factor 1a (FGF1a). We induced mutations in all three targeted genes with high efficiency (up to ~50% mutation rates in GFP).

Introduction & Problem:
Anthropogenic ocean warming and acidification threaten coral persistence. Because scleractinian corals only reproduce during synchronous mass-spawning events occurring one to a few nights per year, experimental windows are remarkably narrow. Genetic manipulation in corals has never previously been demonstrated.

Methods & Approach:
Wild colonies of Acropora millepora were collected from Orpheus Island (Great Barrier Reef). During annual synchronous spawning, gametes were collected, fertilized in vitro, and zygotes microinjected within 1.5–2 hours post-fertilization before first cell cleavage. Guide RNAs (sgRNAs) pre-complexed with recombinant Cas9 protein were delivered directly into embryos. Targeted deep sequencing of PCR amplicons was utilized to quantify mutation frequencies and insertion/deletion (indel) spectra.

Key Results:
Targeting GFP resulted in targeted frameshift deletions and premature stop codons in 50% of sequenced amplicons in larvae. Injected larvae exhibited a clear decrease in green fluorescence under confocal microscopy without observable developmental arrest. FGF1a disruption produced normal early development up to the swimming planula larval stage, offering the first opportunity to interrogate signaling pathways during larval metamorphosis.

Conclusions & Implications:
These results establish CRISPR/Cas9 as an effective reverse-genetic tool in corals. This methodology paves the way to identify genetic determinants of thermal tolerance, host-symbiont recognition with Symbiodiniaceae, and calcification mechanisms necessary for reef resilience.`,
      analysis: {
        headline: "Scientists successfully edited coral genes for the first time using CRISPR, opening doors to study and protect reefs from climate change.",
        mainQuestion: "How can researchers functionally test and manipulate genes in endangered reef-building corals that only spawn once a year?",
        plainSummary: "Reef corals are dying quickly from rising sea temperatures, but because they only reproduce on a few specific nights per year, scientists had never managed to alter their genetics to see which genes help them survive. In this breakthrough study, researchers took coral eggs right after spawning on Australia’s Great Barrier Reef, injected CRISPR-Cas9 gene-editing tools into single-celled embryos, and knocked out three target genes (including a fluorescent protein and a growth gene). The edited corals developed normally, showing that CRISPR works in coral and providing a new way to uncover how corals survive thermal stress.",
        breakdown: [
          { section: "The Hook & Big Picture", takeaway: "Corals are dying from warming seas, but biology had zero genetic tools to study why some survive and others bleach.", details: "Without genetic models like lab mice or fruit flies, marine scientists could only observe corals rather than test cause-and-effect." },
          { section: "The Big Challenge", takeaway: "Corals only spawn during a 1-to-2 hour window once a year, giving scientists an extraordinarily narrow window to inject microscopic eggs.", details: "Injections had to occur inside 90–120 minutes before the fertilized egg undergoes its very first cellular division." },
          { section: "The Experiment (Method)", takeaway: "Injected Cas9 enzyme paired with guide RNAs directly into Acropora millepora zygotes targeting fluorescent markers (GFP) and FGF1a.", details: "They used pre-assembled ribonucleoprotein (RNP) complexes for immediate action without waiting for embryo translation." },
          { section: "What They Proved (Findings)", takeaway: "Achieved up to 50% mutation frequency in larvae; green glow faded under microscope while embryos still swam normally.", details: "Demonstrates gene editing does not inherently kill the fragile coral larvae, confirming targeted knockouts are viable in marine ecology." },
          { section: "Why It Matters To You", takeaway: "Marine biologists can now pinpoint genes responsible for heat resistance and engineer more resilient coral restoration efforts.", details: "Offers a concrete path toward breeding corals that can withstand 1.5°C to 2°C ocean temperature spikes." }
        ],
        jargonGlossary: [
          { term: "CRISPR/Cas9", def: "A molecular molecular \"scissor\" tool adapted from bacteria that can cut DNA at a precise, targeted coordinate to disable or modify a gene." },
          { term: "Zygote", def: "A single fertilized egg before it divides into multiple cells." },
          { term: "Planula", def: "The free-swimming, torpedo-shaped larval stage of coral before it settles onto rocks and forms hard skeletons." },
          { term: "Ribonucleoprotein (RNP)", def: "Cas9 protein pre-bound to guide RNA in a test tube, ready to cut immediately upon injection." },
          { term: "Scleractinian", def: "Hard, stony, reef-building corals that secrete calcium carbonate skeletons." }
        ],
        critiqueQuestions: [
          "How many adult colonies survived after larval settlement in this study?",
          "Does knocking out FGF1a affect the coral's partnership with photosynthetic algae (Symbiodiniaceae)?",
          "Can this technique be safely deployed in wild reefs or is it strictly for laboratory discovery?"
        ]
      } },
    { id: "rose-t-cells-exhaustion", title: "Epigenetic Remodeling in CD8+ T Cell Exhaustion during Chronic Infection",
      authors: "Pauken, K. E., Sammons, M. A., Odorizzi, P. M., & Wherry, E. J.", journal: "Science, 2016",
      text: `Background:
During chronic viral infections and cancer, antigen persistence causes CD8+ T cells to enter an 'exhausted' state characterized by sustained expression of inhibitory checkpoints like PD-1, loss of effector cytokines (IFN-gamma, TNF-alpha), and altered metabolic profiles. Immune checkpoint blockade (anti-PD-L1) reinvigorates exhausted T cells, but whether epigenetic scars prevent complete recovery has remained unclear.

Investigation:
We mapped the chromatin accessibility landscape using ATAC-seq and transcriptional profiles via RNA-seq in antigen-specific CD8+ T cells during acute versus chronic lymphocytic choriomeningitis virus (LCMV) infection in mice, followed by PD-1 blockade therapy.

Findings:
Exhausted T cells possess a distinct chromatin landscape containing thousands of unique open chromatin regions (de novo regulatory elements) that do not revert to a naive or functional memory state even after effective anti-PD-L1 therapy. While treatment transiently boosts cytotoxic function, the underlying epigenetic architecture remains rigidly fixed in the exhaustion state.

Significance:
These data explain why patients with advanced tumors or chronic viral infections frequently relapse when checkpoint inhibitors are discontinued. Durable reinvigoration will likely require combinatorial strategies that pair checkpoint blockade with epigenetic editing or chromatin-remodeling inhibitors.` }
  ];

  function sampleDoc(s) {
    const sections = []; let i = 0;
    s.text.split(/\n\s*\n/).forEach((block, k) => {
      const m = block.match(/^([^\n:]{2,40}):\n([\s\S]+)$/);
      const heading = m ? m[1].trim() : "Text", body = (m ? m[2] : block).trim();
      sections.push({ id: k === 0 && /abstract|significance/i.test(heading) ? "abs" : "s" + k, heading, paras: body.split(/\n/).filter(Boolean).map(t => ({ id: "p" + (++i), text: t.trim() })) });
    });
    return { id: s.id, title: s.title, authors: s.authors, source: `${s.journal} · ${SAMPLE_NOTE}`, license: "", sections, journal: s.journal };
  }
  App.roseSample = id => { const s = SAMPLES.find(x => x.id === id); return s && sampleDoc(s); };

  /* ---------- Rose's prompts, as she wrote them ---------- */
  const articleText = () => App.paras.map(p => p.text).join("\n\n");
  function breakdownPrompt(title, text) {
    return `You are a supportive, expert scientific mentor helping an undergraduate student understand this scientific article.
Break it down into crystal-clear, jargon-free insights.

ARTICLE TITLE: ${title || "Scientific Paper"}
ARTICLE CONTENT:
${text.slice(0, 10000)}

Please return your response in VALID JSON with NO wrapping markdown code blocks (or enclosed in a clean json block), adhering to this exact schema:
{
  "headline": "One catchy, ultra-clear sentence summarizing the bottom-line discovery",
  "mainQuestion": "The central mystery or real-world problem the scientists set out to solve",
  "plainSummary": "A two-to-three paragraph breakdown in clear, inviting language that explains the context, the approach, and the main findings without intimidating jargon.",
  "breakdown": [
    { "section": "The Hook & Big Picture", "takeaway": "Short 1-2 sentence core takeaway", "details": "Helpful supporting detail" },
    { "section": "The Challenge or Gap", "takeaway": "Short takeaway of what was missing before this paper", "details": "Why it was hard to solve" },
    { "section": "What They Actually Did (Methods)", "takeaway": "The practical test in plain terms", "details": "What tools or models were used" },
    { "section": "The Findings (Results)", "takeaway": "What actually happened when they tested it", "details": "Key figures, mutation rates, or physical changes observed" },
    { "section": "Why It Matters (Implications)", "takeaway": "Why a student or society should care", "details": "Future treatments, environmental impacts, or next experiments" }
  ],
  "jargonGlossary": [
    { "term": "Technical term 1", "def": "Plain English definition in one sentence" },
    { "term": "Technical term 2", "def": "Plain English definition in one sentence" },
    { "term": "Technical term 3", "def": "Plain English definition in one sentence" },
    { "term": "Technical term 4", "def": "Plain English definition in one sentence" }
  ],
  "critiqueQuestions": [
    "Discussion question 1 for class",
    "Discussion question 2 for class",
    "Discussion question 3 for class"
  ]
}`;
  }
  const BREAKDOWN_SYSTEM = "You are Clarify: an academic reading assistant designed by biology students to demystify complex scientific literature for undergraduates. Always return clean, well-formatted JSON.";
  function chatSystem() {
    const a = App.st.breakdown && App.st.breakdown.data;
    return `You are the Clarify Reading Companion, an intelligent biology and scientific writing tutor built for students.
Your job is to answer the student's questions about the specific article they are studying.

CURRENT ARTICLE TITLE: "${App.doc.title}"
SUMMARY: "${(a && a.headline) || ""}"
CURRENT ARTICLE CONTENT (EXCERPT):
${articleText().slice(0, 7000) || "None provided"}

RULES FOR ANSWERS:
1. Speak in an encouraging, clear, conversational undergraduate tone. Avoid dense academic gatekeeping.
2. If asked about a figure, concept, or term from the article, explain it using intuitive analogies (e.g. comparing CRISPR to microscopic word processors, or cell signaling to a relay race).
3. If the paper does not mention something, honestly say so rather than making up results.
4. Keep answers concise (2 to 4 paragraphs max) unless the user requests a deep-dive.
5. Use markdown formatting with bold points and bullet lists.`;
  }
  const SAMPLE_QUESTIONS = ["Explain this like I'm a freshman", "What are the weaknesses of their method?", "Why did they choose this organism?", "What should I say if called on in class?"];

  /* ---------- Gemini transport ---------- */
  async function gemini(contents, system, json) {
    const c = conn();
    const body = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: json ? { responseMimeType: "application/json" } : {} };
    const url = c.proxy ? c.proxy : `${API}${encodeURIComponent(c.model || "gemini-2.5-flash")}:generateContent`;
    const headers = { "Content-Type": "application/json" };
    if (!c.proxy) headers["x-goog-api-key"] = c.key;
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(c.proxy ? { model: c.model, ...body } : body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((d.error && d.error.message) || "HTTP " + r.status);
    const text = (((d.candidates || [])[0] || {}).content || {}).parts;
    if (!text) throw new Error("Gemini returned no text" + (d.promptFeedback && d.promptFeedback.blockReason ? ` (blocked: ${d.promptFeedback.blockReason})` : ""));
    return text.map(p => p.text || "").join("");
  }

  // Rose's parser: strip a code fence, parse JSON, fall back to showing the raw reply as the summary.
  function parseReply(raw) {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    try { return JSON.parse(cleaned); }
    catch {
      return { headline: "Analysis complete (Summary format)", mainQuestion: "Scientific understanding of the provided paper", plainSummary: raw,
        breakdown: [{ section: "Summary", takeaway: "Key insights from the article", details: "See full AI response in the summary tab." }],
        jargonGlossary: [], critiqueQuestions: ["What assumptions does this article make?", "How could this experiment be expanded?"] };
    }
  }

  const mdHTML = t => window.marked && window.DOMPurify ? DOMPurify.sanitize(marked.parse(t || "")) : esc(t).replace(/\n/g, "<br>");

  /* ---------- breakdown ---------- */
  let sub = "takeaways", showOriginal = false, loading = false;
  async function runBreakdown() {
    const text = articleText();
    if (text.trim().length < 50) { toast("Load a paper with at least a few paragraphs first."); return; }
    if (!connected()) { toast("Connect Gemini first, or use the copy-and-paste route below."); $("#bdManual").open = true; return; }
    const prev = App.st.breakdown && App.st.breakdown.status === "ready" ? App.st.breakdown : null;
    loading = true; App.st.breakdown = { status: "loading" }; render();
    try {
      const raw = await gemini([{ role: "user", parts: [{ text: breakdownPrompt(App.doc.title, text) }] }], BREAKDOWN_SYSTEM, true);
      App.st.breakdown = { status: "ready", data: parseReply(raw), source: "Gemini (" + (conn().proxy ? "proxy" : conn().model) + ")", at: Date.now() };
    } catch (e) {
      // a failed rerun keeps the breakdown the reader already had
      if (prev) { App.st.breakdown = prev; toast("Gemini: " + e.message); }
      else App.st.breakdown = { status: "error", message: e.message };
    }
    loading = false; App.save(); render();
  }
  function applyManual() {
    const raw = $("#bdPaste").value.trim();
    if (!raw) { toast("Paste Gemini's reply first."); return; }
    App.st.breakdown = { status: "ready", data: parseReply(raw), source: "Gemini (pasted by the reader)", at: Date.now() };
    App.save(); $("#bdPaste").value = ""; render(); toast("Breakdown added from Gemini's reply.");
  }

  function render() {
    if (!App.doc || document.body.dataset.layer !== "breakdown") return;
    const d = App.doc, b = App.st.breakdown;
    $("#bdMeta").innerHTML = `<span class="bd-kicker">Scientific article</span><h2>${esc(d.title || "Untitled Research Paper")}</h2>
      ${d.authors || d.journal ? `<p>${esc(d.authors || "")}${d.authors && d.journal ? " · " : ""}${esc(d.journal || "")}</p>` : ""}`;
    $("#bdConn").textContent = connected() ? `Connected: ${conn().proxy ? "proxy" : conn().model}` : "Not connected. The copy-and-paste route works without a key.";
    $("#bdRun").textContent = b && b.status === "ready" ? "Explain it again" : "Clarify & Explain Paper →";
    $("#bdRun").disabled = loading;
    const out = $("#bdOut");
    if (!b) { out.innerHTML = `<div class="bd-empty"><h3>No breakdown yet</h3><p>Choose <b>Clarify & Explain Paper</b> to have Gemini break this paper down, or use the copy-and-paste route in the left panel.</p></div>`; return; }
    if (b.status === "loading") { out.innerHTML = `<div class="bd-empty"><div class="spin" aria-hidden="true"></div><h3>Deconstructing article...</h3><p>Clarify is extracting the central research question, translating technical jargon, and building step-by-step conceptual cards.</p></div>`; return; }
    if (b.status === "error") { out.innerHTML = `<div class="bd-error"><b>Could not generate analysis</b><p>${esc(b.message || "Please check your connection or text length and try again.")}</p><button class="btn small" data-bd="retry">Retry</button></div>`; return; }
    const a = b.data || {};
    const tab = (k, label, n) => `<button role="tab" aria-selected="${sub === k}" data-sub="${k}">${label} (${n || 0})</button>`;
    let body = "";
    if (sub === "takeaways") body = `${a.plainSummary ? `<section class="bd-card"><h3>Plain Language Overview</h3><div class="md">${mdHTML(a.plainSummary)}</div></section>` : ""}
      <h3 class="bd-label">Step-by-Step Anatomy of the Paper</h3>
      ${(a.breakdown || []).map((it, i) => `<section class="bd-card step"><h4><span>${i + 1}</span>${esc(it.section)}</h4><p class="take">${esc(it.takeaway)}</p>${it.details ? `<p class="det">${esc(it.details)}</p>` : ""}</section>`).join("")}`;
    else if (sub === "jargon") body = `<section class="bd-card"><h3>Jargon & Technical Vocabulary Decoder</h3><p class="hint">Words that usually confuse readers on their first pass, translated into simple undergraduate concepts.</p>
      ${(a.jargonGlossary || []).length ? `<div class="jargon">${a.jargonGlossary.map(e => `<div><b>${esc(e.term)}</b><p>${esc(e.def)}</p></div>`).join("")}</div>` : `<p class="hint">No specific jargon terms listed for this passage.</p>`}</section>`;
    else body = `<section class="bd-card"><h3>Seminar & Discussion Questions</h3><p class="hint">Take these to class or your study group to sound knowledgeable and critically evaluate the methodology:</p>
      ${(a.critiqueQuestions || []).length ? `<ol class="seminar">${a.critiqueQuestions.map(q => `<li>${esc(q)}</li>`).join("")}</ol>` : `<p class="hint">No discussion questions generated.</p>`}</section>`;
    out.innerHTML = `${a.headline ? `<div class="takeaway"><span>The 10-Second Takeaway</span><p>"${esc(a.headline)}"</p>${a.mainQuestion ? `<div class="cq"><b>Central Question:</b> ${esc(a.mainQuestion)}</div>` : ""}</div>` : ""}
      <p class="bd-prov">Written by ${esc(b.source || "Gemini")}${b.at ? ", " + new Date(b.at).toLocaleDateString() : ""}. AI-written: check it against the paper before you rely on it.</p>
      <div class="bd-tabs" role="tablist" aria-label="Breakdown views">${tab("takeaways", "Key Sections & Explanation", (a.breakdown || []).length)}${tab("jargon", "Jargon Decoder", (a.jargonGlossary || []).length)}${tab("questions", "Discussion & Seminar Questions", (a.critiqueQuestions || []).length)}
        <button class="linkish" data-bd="orig" aria-expanded="${showOriginal}">${showOriginal ? "Hide Original Source" : "View Original Source"}</button></div>
      ${showOriginal ? `<pre class="bd-orig" tabindex="0">${esc(articleText())}</pre>` : ""}${body}`;
  }

  /* ---------- reading assistant ---------- */
  let sending = false;
  function renderChat() {
    if (!App.doc) return;
    const msgs = App.st.chat || [];
    $("#chatClear").hidden = !msgs.length;
    $("#chatLog").innerHTML = msgs.length ? msgs.map(m => m.role === "user" ? `<div class="msg me"><p>${esc(m.text)}</p></div>`
      : `<div class="msg ai ${m.error ? "err" : ""}">${m.error ? `<p>${esc(m.text)}</p>` : `<div class="md">${mdHTML(m.text)}</div>`}</div>`).join("") +
      (sending ? `<div class="msg typing"><i></i><i></i><i></i> Consulting paper...</div>` : "")
      : `<div class="chat-empty"><p><b>Ask questions about this paper</b></p><p>Stuck on a tricky paragraph or need a layman analogy? Ask anything below:</p>
        ${SAMPLE_QUESTIONS.map(q => `<button class="sq" data-ask="${esc(q)}">"${esc(q)}"</button>`).join("")}</div>`;
    const log = $("#chatLog"); log.scrollTop = log.scrollHeight;
  }
  async function send(q) {
    q = (q || "").trim(); if (!q || sending) return;
    App.st.chat = App.st.chat || [];
    if (!connected()) {
      const pack = `${chatSystem()}\n\n---\n\nMy question: ${q}`;
      try { await navigator.clipboard.writeText(pack); toast("Not connected. Your question and the paper are copied: paste them into Gemini."); }
      catch { toast("Not connected. Connect Gemini in the left panel."); }
      return;
    }
    App.st.chat.push({ role: "user", text: q }); sending = true; renderChat();
    try {
      const contents = App.st.chat.filter(m => !m.error).map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] }));
      App.st.chat.push({ role: "model", text: await gemini(contents, chatSystem(), false) });
    } catch (e) { App.st.chat.push({ role: "model", text: e.message || "Failed to send message.", error: true }); }
    sending = false; App.save(); renderChat();
  }

  /* ---------- connection dialog ---------- */
  function openConn() {
    const c = conn();
    $("#gmKey").value = c.key; $("#gmModel").value = c.model || "gemini-2.5-flash"; $("#gmProxy").value = c.proxy; $("#gmMsg").textContent = "";
    $("#dlgGemini").showModal();
  }
  async function testConn() {
    saveConn(false); $("#gmMsg").textContent = "Testing…";
    try { const t = await gemini([{ role: "user", parts: [{ text: "Reply with the single word: ready" }] }], "Reply briefly.", false); $("#gmMsg").textContent = "Gemini answered: " + t.trim().slice(0, 40); }
    catch (e) { $("#gmMsg").textContent = "Didn't work: " + e.message; }
  }
  function saveConn(close = true) {
    store.set("gemini", { key: $("#gmKey").value.trim(), model: $("#gmModel").value.trim() || "gemini-2.5-flash", proxy: $("#gmProxy").value.trim() });
    if (close) { $("#dlgGemini").close(); render(); toast(connected() ? "Gemini connected in this browser." : "Gemini disconnected."); }
  }

  /* ---------- wiring ---------- */
  $("#bdRun").addEventListener("click", runBreakdown);
  $("#bdConnBtn").addEventListener("click", openConn);
  $("#bdCopyPrompt").addEventListener("click", async () => {
    const t = `${BREAKDOWN_SYSTEM}\n\n${breakdownPrompt(App.doc.title, articleText())}`;
    try { await navigator.clipboard.writeText(t); toast("Prompt copied. Paste it into Gemini, then paste the reply back here."); } catch { toast("Copy didn't work here."); }
  });
  $("#bdApply").addEventListener("click", applyManual);
  $("#bdChange").addEventListener("click", () => $("#btnPaper").click());
  $("#gmTest").addEventListener("click", testConn);
  $("#gmSave").addEventListener("click", () => saveConn(true));
  $("#gmForget").addEventListener("click", () => { $("#gmKey").value = ""; $("#gmProxy").value = ""; saveConn(true); });
  $("#chatForm").addEventListener("submit", e => { e.preventDefault(); const v = $("#chatIn").value; $("#chatIn").value = ""; send(v); });
  $("#chatClear").addEventListener("click", () => { App.st.chat = []; App.save(); renderChat(); });
  $("#roseSamples").innerHTML = SAMPLES.map(s => `<button class="pmc" data-rose="${s.id}"><b>${esc(s.title)}</b><span>${esc(s.journal)}</span></button>`).join("");
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-sub]"); if (t) { sub = t.dataset.sub; render(); return; }
    const b = e.target.closest("[data-bd]"); if (b) { if (b.dataset.bd === "orig") { showOriginal = !showOriginal; render(); } else runBreakdown(); return; }
    const q = e.target.closest("[data-ask]"); if (q) { send(q.dataset.ask); return; }
    const r = e.target.closest("[data-rose]"); if (r) {
      const s = SAMPLES.find(x => x.id === r.dataset.rose);
      $("#dlgPaper").close(); App.loadDoc(sampleDoc(s));
      if (s.analysis && !App.st.breakdown) { App.st.breakdown = { status: "ready", data: s.analysis, source: "Rose's prototype (prepared in advance by Gemini)" }; App.save(); }
      App.setLayer("breakdown");
    }
  });
  addEventListener("clarify:doc", () => { sub = "takeaways"; showOriginal = false; if (App.st.breakdown && App.st.breakdown.status === "loading") App.st.breakdown = null; render(); renderChat(); });
  addEventListener("clarify:layer", e => { if (e.detail === "breakdown") { render(); renderChat(); } });
})();
