# Clarify

A Grove Lab student build. **Idea by Rose Stafford (Biology, Senior, WRIT 3810 H01):** a tool that helps students who were "thrown into" scientific articles learn to read them, break them down, and ask questions about them. Prototype layers by Marc Watkins, coded with Anthropic's Claude.

Rose's version one was "highlight the key points and write detailed summaries," with an AI assistant saved for later. This prototype keeps that order and builds it as three layers on the same paper:

| Layer | What it does | Who writes the words |
|---|---|---|
| **1 · Pencil** | Three reading passes (survey, mark it up, say it back). Four highlighter colors with fixed meanings (claim, evidence, method, lost), pencil underline, red circle for unknown words, callout boxes with margin notes, question stickies, paragraph brackets, a reading ruler, and a printable **My breakdown** sheet built only from the student's marks. | The student. Nothing on the breakdown is AI-written. |
| **2 · Jev** | Jev (TypeSafe AI) reads each paragraph and returns probabilities: the paragraph's job (background, gap, method, result, interpretation, limitation, implication), how hedged it is, whether it states a main finding, and how dense it is. These go on a clear "acetate" sheet over the page that can be lifted off. Rules compare Jev's numbers with the student's marks and write **second looks**. Jev also checks say-it-back cards (accuracy, overstating, adding claims, copying) and sorts question stickies by where in the paper to look. | Rules a person wrote. Jev only supplies numbers, and every number is shown. |
| **3 · Gemini** | A skill file, `clarify-reading-coach`, that makes Gemini a reading coach rather than a summarizer, plus a **packet** built from the student's marks to paste into it. | Gemini, under the skill's rules: ask first, cite ¶ numbers, keep the authors' hedges, never write the student's cards, end with an AI-use note. |

The design follows Rose's "Look and feel" answer (closer to Focused Reading Lab: quiet and clean) and her accessibility answers (keyboard only, less motion, plain language).

## Files

- `index.html`: the app shell. No build step.
- `css/clarify.css`: desk, paper, ink, margin cards, acetate, Gemini desk, print styles.
- `js/specimen.js`: the practice paper (an invented cardinal dawn-song study with real IMRaD structure and a drawn figure).
- `js/ink.js`: draws marks as SVG from text rectangles. Each stroke is seeded by its mark id, so it's stable across redraws but no two are alike: chisel-tip highlighter swipes per line, graphite underlines, an ellipse that doesn't close, boxes drawn as four crossing strokes, brackets, leader lines.
- `js/app.js`: layer 1, paper loading (practice paper, Europe PMC open-access search or PMCID, paste your own), marking by mouse or keyboard, margin layout, breakdown sheet, localStorage.
- `js/jev.js`: layer 2. The exact questions Jev is asked are at the top of the file and shown in the app under "What Jev was asked."
- `js/gemini.js`: layer 3, the packet builder.
- `js/upload.js`: opens PDF, Word (.docx), and text or Markdown files in the browser. PDFs go through pdf.js 3.11.174 and Word files through mammoth 1.6.0, both from cdnjs and loaded only when a file is chosen. The extracted text lands in the paste box for the student to check before using it.
- `how-to-use/index.html`: the student guide to the three layers (linked as "How to use" in the app header). Its example paragraph is drawn with the app's own `ink.js`. Printable.
- `gemini/clarify-reading-coach/SKILL.md`: the skill (Agent Skills format with YAML front matter).
- `gemini/gem-instructions.md`: a shorter version for the Instructions box of a Gemini Gem.

## Using the Gemini skill

1. **As a Gem:** Gemini → Gems → New Gem. Paste `gem-instructions.md` into Instructions, upload `SKILL.md` as knowledge, save as "Clarify Reading Coach." Students paste their packet into the Gem.
2. **No Gem:** the "Copy skill + packet" button copies both into one paste for a regular chat.
3. **Gemini CLI or another tool that reads Agent Skills:** copy `gemini/clarify-reading-coach/` into the skills folder (`~/.gemini/skills/` for Gemini CLI).

The skill has not yet been run inside the university's Gemini. Test it with a packet before showing students, and check that Gems are enabled for student accounts.

## Running it

Static files. Serve the folder (`python3 -m http.server`) or publish it on GitHub Pages. Opened as a `file://` page, everything works except the skill preview in layer 3 (browsers block `fetch` there); the download buttons then point to the files.

### Deploy to GitHub Pages

1. Create an empty public repository on github.com (no README, license, or .gitignore).
2. Upload everything in this folder to the repository root, including the hidden `.nojekyll` file (on a Mac, press Cmd+Shift+. in Finder to see it). Keep the folders as they are: `css/`, `js/`, `gemini/`, `how-to-use/`.
3. Settings → Pages → Deploy from a branch → `main` / `/ (root)` → Save.
4. The site appears at `https://<user>.github.io/<repo>/` within a minute or two. The student guide is at `…/how-to-use/`.

Nothing needs a key. Jev runs through the existing Jev Sandbox Worker, which accepts any origin (`ALLOWED_ORIGINS = "*"`); if that Worker is ever locked to specific sites, add the new Pages origin to it.

## Outside services

- **Jev** through the existing Jev Sandbox Worker (`https://jev-sandbox-proxy.watkins-um.workers.dev`). Same limits: 60 requests a minute, 6,000 characters of state, 8 questions per request. One request per paragraph (4 questions), so the practice paper costs 17 requests. Paragraphs over 5,950 characters are trimmed.
- **Uploaded files** never leave the browser. PDF paragraphs are rebuilt from text positions: lines are grouped by height, repeated running heads and page numbers are dropped, a paragraph breaks on a larger gap, an indent, or a short last line ending in punctuation, larger type becomes a heading, and a lowercase continuation joins across a column or page. Tested on a two-column Frontiers review, a PLOS ONE article, and a Word file. Journal front matter (affiliations, citation boxes) and table fragments still come through, which is why the text is shown for checking first. Scanned PDFs with no text layer are refused with a message. Up to 60 pages and 30 MB.
- **Europe PMC** REST API (keyless, CORS open) for open-access full text. The search endpoint returned 503 for part of the build session and then recovered; a PMCID still opens a paper directly. Papers are capped at 150 paragraphs. Figures and tables aren't shown; captions are kept and the original is linked.

## Privacy

Marks, notes, and cards stay in the browser's localStorage (`clarify.v1.*`), one record per paper. Layer 2 sends one paragraph, card, or question at a time to Jev through a proxy that stores nothing. Layer 3 sends nothing; the student decides what to paste into Gemini, and the packet options let them leave parts out.

## Verified in the browser (October 27, 2026)

Marks by mouse and by keyboard only, margin cards and leader lines, brackets, circled words, the reading ruler, the breakdown sheet, a live Jev read of the practice paper (17 paragraphs) with second looks, a say-it-back check (Jev flagged "proves that streetlights cause" as overstated at 97%), question sorting, a Europe PMC paper (PMC6061754) and a Europe PMC search, the skill preview, and the packet.

## For Rose

Rose said the part she wanted to do herself was **test it with real people**. Good first tests: give two classmates the practice paper, one with only layer 1 and one with all three, then ask each to explain the paper in three sentences. Watch where they mark "lost" and whether Jev's second looks send them back to the right place.
