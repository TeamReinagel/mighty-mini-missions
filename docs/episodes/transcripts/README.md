# Lark & Nib transcript reading copies

Created November 3, 2026. The set covers the 104 planned episodes across all eight seasons: 99 new prose drafts and reading copies of the five existing manuscripts. Every transcript begins with its episode title and `Lark & Nib's Treasure Quest · Season N, Episode N`.

The PDFs are in `../../../output/pdf/lark-nib-transcripts/`, with a complete collection, eight season collections, and an archive of the individual episode PDFs. `episode-index.json` lists titles, files, page counts, word counts, and which manuscripts already existed.

## Sources and boundaries

- Story continuity and teaching follow `../series-roadmap.md`, `../cumulative-reading-ledger.md`, the eight season arcs and episode briefs, and the November 3 reading-first revision in `../PRODUCTION.md`.
- Existing manuscript prose is retained for S1E1–3 and S2E1–2. The reading copy of The Moon Path omits its old spoken introduction and square-bracket delivery tags so the requested heading comes first. Approved production manuscripts, audio, alignments, and playable episodes are unchanged.
- New drafts include explicit teaching or a reading strategy, a selected earlier-word review, word practice, writing, and a passage with comprehension. Prop changes are narrated. Season 1's individually authored scripts retain no more than one additional story manipulation each.
- In generated reading copies, boxed text is child-reading material. Supply only the needed capital's form and familiar sound before the reading. A modeled example, supplied topic word, trace, or supported response must not be treated as independent evidence.
- Season 8 episode 1 offers a genuine choice. Episodes 2–8 each contain three separately labeled, complete alternative scripts: sun/meadow, pine/lookout, and reed/book stop. Use only the selected branch, keeping it consistent across chapters. Untaken routes are not described as visited. The actual chosen purpose, explanation, message, and observations remain the child's contributions; the script does not supply fabricated responses.
- The new prose is an authored draft collection. No new recordings, timed read-throughs, child observations, generated art, or playable builds are claimed. Runtime targets remain conditional; recording and implementation need their own production checks.

## Regeneration

`build_transcripts.py` reads the authored JSON for Seasons 2–8, the seven standalone Season 1 manuscripts, and the existing five source manuscripts. It writes clean text reading copies and PDFs. Run with a Python environment containing ReportLab and pypdf. Fonts use the bundled Codex runtime's Liberation family.

The PDF export checks every episode's exact heading, title, page count, and text extraction. The final collection is also rendered for layout review. The ZIP contains all 104 individual PDFs and the episode index.
