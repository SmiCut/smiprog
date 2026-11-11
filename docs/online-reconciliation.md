# SmiProg Online reconciliation, 2026-11-11

The English SmiProg Online embed now combines the previously approved main
calculator layout with the current Compare implementation. The website app
block was replaced without changing the surrounding text or catalogue table.

Preserved behavior:

- Main calculator: three accessible information buttons, compact tool metrics,
  tool step 7, marked diameter step 8, custom dimensions 8-10, full-width thread
  length where appropriate, and safety distance inside CNC Program.
- Compare: current prices, inline mirrored discount fields, currency/percent
  placeholders, automatic discount application, blue dashes for empty discounts,
  muted inactive prices, restore buttons for all editable result rows, Copy
  without Share, and container-aware layout.
- Metric fine naming in all 16 languages and the existing canonical material
  selector matching/fallback behavior.
- Existing calculation core and reviewed CNC corrections remain unchanged.

The same source builds all 16 HTML editions. Only the existing English website
page was updated; this does not create translated WordPress pages or publish a
new GitHub release.

English HTML SHA-256:

`5fbbbf1eb8e04837afb685962af204dbe296e48d8d29fe4b84ecaac1211f8f42`

Verification:

- Calculation, Excel-reference, cost, language and CNC-motion tests passed.
- All 16 language browser checks passed.
- Compare passed 19 viewport/container cases in every language.
- Inline discounts/restores passed eight desktop/mobile sizes.
- Main layout and info buttons passed nine viewport sizes in Chromium and WebKit.
- Material selector mock tests and marked-diameter tests passed.
- Published English page checked for info buttons, CNC placement/output,
  Metric fine and synchronized discount application/clearing.

Follow the complete-interface checklist in [development.md](development.md)
for subsequent updates. A Compare-only prototype must not replace a full app.
