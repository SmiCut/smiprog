# SmiProg calculation references

Reviewed **2026-11-05** against released **v1.0.0**, source commit `283519f`.
These documents describe the published English app, not unpublished local edits,
draft translations or future controller work.

| Reference | Scope |
|---|---|
| [Cutting data and tool inputs](cutting-data.md) | Material/tool data, effective diameter, feed and radial/axial pass calculation |
| [Machining time and Compare costs](time-and-cost.md) | Excel-derived timing, rounding, cost formulas, percentage comparisons and example |
| [CNC motion and validation](cnc-motion-and-validation.md) | Fanuc/Heidenhain scope, reviewed corrections, geometry rejection and verification limits |
| [Tool images](../tool-images.md) | PNG originals, WebP assets and 2× display sizing |

## Current behavior to preserve

- Catalogue tools can use a laser-marked diameter without changing tool identity.
- Main calculation and Compare use the shared core; effective overrides influence
  derived cutting data and costs. UI validation and CNC availability are separate.
- Normal, axial, micro and tapered templates have distinct geometry. Radial
  passes in SmiProg are not SmiCalc's FourCut thread-turning pass reduction.
- Both thread hands are implemented for Heidenhain vertical milling. Historical
  Excel differences are explicitly allowlisted; references are not regenerated
  from the current program to make tests pass.
- One complete HTML file includes code, data, images and notices and can be
  opened independently or embedded directly. AI service access is separate.
- Only English is released. Other language drafts and original workbooks remain
  internal; public test fixtures preserve the evidence needed for regression checks.

## Source and evidence map

`apps/web/js/core.js` contains the calculation and CNC implementation;
`apps/web/js/app.js` handles input, rendering and copying. Runtime tool/material
and reference-price data are in `apps/web/data/`. Numeric lookup tables remain
in the source, avoiding a second manually maintained copy of every matrix.

`apps/web/tests/golden/`, `excel-parity-oracle.json`, `compare-cost-oracle.json`
and `cnc-reviewed-corrections.json` preserve expected outputs and exact accepted
changes. Their source workbook names/hashes record provenance, not public
workbook downloads. Keep those fixtures public; keep raw internal workbooks and
customer evidence private under the [publication policy](../publication-policy.md).

Update the relevant reference and examples whenever behavior changes. Record the
reviewed version/date, preserve provenance, and run appropriate checks listed in
[development](../development.md). Software verification does not certify a CNC
program for a physical machine or prove commercial savings.
