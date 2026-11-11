# Development and verification

## Sources

- `apps/web/index.html`, CSS and `js/app.js`: browser interface
- `apps/web/js/core.js`: calculation and CNC program logic
- `apps/web/data/smiprog-data.js`: tool, material, thread, post and price data
- `apps/web/data/tool-prices.csv`: editable reference prices
- `apps/web/i18n/translations.csv`: text source for all 16 languages
- `apps/web/tools/build-translations.mjs`: generates language JSON and bundled dictionaries
- `tools/build-app-files.mjs`: shared static source preparation
- `tools/build-single-html.mjs`: complete HTML distribution

Use `npm test` for the preserved golden fixtures, native Excel parity cases,
comparison-policy tests, native Excel cost scenarios and language packaging.
Use `npm run test:browser` for the UI, material selector mocks, Excel parity in the
browser and comparison cost UI. No live AI calls are needed for these checks.
`npm run verify:compare-layout` checks all 16 languages at desktop, tablet and
phone sizes, including narrow WordPress columns inside wider browser windows.
Compare's workspace responds to its available container width; its setup button
stays beside the note except on portrait phones up to 560 px.

Compare's shared discount is available with price access (unlocked EUR prices or
the existing public SEK prices). Two mirrored percent fields in the net-price
row edit one shared discount, including when users enter their own tool prices.
There is no separate discount toolbar or switch. Keep the net-price row visible
whenever prices are unlocked. Empty fields show blue dashes; a positive valid
discount applies immediately and greys out the original prices. Zero uses the
original prices. Use matching fixed currency/percent suffixes inside the inputs,
not placeholders that disappear while typing. Keep them visible after editing,
clearing, resetting and reloading, with space reserved beside the numeric value.
Preserve matching input sizes and the Swedish `kr` currency suffix.
All editable result values have compact restore buttons when overridden.
Apply the same behavior to desktop rows and mobile result cards.
Round discounted tool prices to two currency decimals before calculating costs.
Validate 0-100%, including fractional values; an invalid active discount must not
produce usable cost results. Clearing either field restores undiscounted prices
and clears both fields. Persist the shared discount like the existing own prices.
All locales must use the neutral prices wording, without catalogue qualifiers,
and omit the redundant tool-life/machine-cost footer.

## Preserve the complete interface when publishing

Build every locale from this shared source, never by reusing an old standalone
HTML or a separate Compare prototype. Before replacing a website's entire app
block, verify both Internal Thread Milling and Compare.

- Keep the three info buttons for cutter diameter, safety distance and CNC
  verification; help must work with pointer, keyboard and touch.
- Safety distance belongs inside CNC Program. Tool selection is step 7, marked
  diameter is step 8, and custom dimensions are steps 8-10.
- Preserve compact tool metrics, full-width thread length where appropriate,
  localized help, Metric fine naming, and the latest inline Compare discounts.
- Run `npm test`, `npm run verify:compare-discount`,
  `npm run verify:main-layout` and `npm run verify:compare-layout`.
  Main-layout tests use Chromium and WebKit; install both Playwright engines.
- Back up the website content, replace only the app block, and verify the live
  result. Keep unrelated catalogue tables and page text intact.
- Commit source, translations and regression tests together. Record the exact
  published HTML checksum and do not leave production-only layout edits in a
  separate working copy.

The fixture set contains 57 golden cases, a 153-case native Excel matrix and 18
native Excel A/B cost scenarios. Those reference results are preserved, not
regenerated from the browser implementation. Historical workbooks and internal
audit working files are not part of this public source release.

## Browser setup

Install dependencies and Chromium with the commands in README. Browser verifiers
use local Playwright and its bundled Chromium. Set `CHROME_PATH` to an installed
Chrome executable if needed; no developer-specific absolute paths are required.
Screenshots and temporary reports stay in ignored `tmp/` directories.

## Website embedding and Material Selector

All calculations, price data and CNC generation run client-side. The package
includes its selected locale and an MIT license copy. There is no SmiProg
server or API key required for the calculators.

The optional Material Selector calls SmiCut's separately hosted service at
`https://smicut-material-selector-production.up.railway.app/api/chat`.
`SmiProgConfig.materialSelectorApiUrl` can point to a compatible backend; configure
it before scripts load. Keep the shared request contract, language codes and
canonical material keys stable. Service access is separate from MIT licensing.

For SmiCut-hosted access, follow [the website approval guide](../MATERIAL_SELECTOR.md).
Website approval requires no browser API key and no changes to the default service
URL. The existing short-term limit is 30 requests per minute per IP address.

Keep widget CSS scoped under `#smiprog-app`; see [the embedding guide](website-embedding.md).
Changes to calculations require updated technical documentation, relevant tests
and a review of the controller/post scope. Heidenhain has `released` status for right- and left-hand vertical milling.
Its machine scope excludes lathe live-tool output, which remains blocked.
`released` denotes product availability; it does not assert a named person
reviewed it or that it was tested on a physical machine.

## Independent language distributions

`npm run build:html` generates one complete HTML file for each of the 16 configured
locales. `npm run build:languages` first generates dictionaries from the CSV and
also generates developer multi-file static packages and local review pages.
These commands do not publish a release. There is no PHP adapter or app-specific plugin. Each locale
includes its selected dictionary and English fallback from the shared source.

Use `npm run test:languages` for package integrity and `npm run verify:languages`
for desktop/mobile loading, selected locale, Material Selector language, image
loading and CNC output. Add translated dictionaries before adding new locale
codes to `tools/build-language-packages.mjs`.

See [language maintenance and review](languages.md) for the complete workflow,
regional codes, material-category rules and Compare currency behavior.

## CNC motion regression checks

See [CNC motion calculations and verification](calculations/cnc-motion-and-validation.md) for
the axial/tapered milling corrections, pass rejection rules, independent command
checks and exact reviewed deviations from the immutable Excel references.
`npm run test:cnc-motion` is included in `npm test`.

## Tool images

Runtime tool images use optimized WebP files; original PNGs are kept outside the
app package. See [image settings, Retina sizing and rebuild instructions](tool-images.md).

## Complete HTML downloads

`npm run build:html` creates `dist/downloads/smiprog-<locale>.html` for all 16 languages and checksums.
The builder uses the released locales and shared minified sources. Scripts and
styles are inline; each WebP/SVG is stored once in an embedded asset dictionary.
Static and dynamically selected tool images use that dictionary. The external
Material Selector contract and endpoint remain unchanged. Full MIT and icon
notices are embedded. Original source files remain the place for development.

`npm run verify:html` opens a copy in an isolated temporary folder with networking
disabled. It verifies all embedded images, desktop/mobile layouts, CNC parity with
the source for both controllers and thread hands, diameter overrides, copying,
input validation and Compare. It also mocks the external Material Selector request.

Publish the complete HTML and `SMIPROG-SHA256SUMS` as release assets. The public
README links to the latest HTML. Paste the exact file contents into a raw HTML
block for direct embedding, or open it as a standalone file. The artifact contains
scoped styles, widget markup, inline scripts, images and license notices.

The legacy `build:wordpress` and `verify:wordpress` script names are compatibility
aliases for the existing CI workflow only: they build/test the complete HTML and
never create a plugin. Historical release assets remain historical downloads.

## Developer setup and editable prices

Use Node.js 20 or later:

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm test
npm run test:browser
npm run verify:html
```

Reference prices are editable in `apps/web/data/tool-prices.csv`. After editing:

```bash
cd apps/web
node tools/update-tool-prices.mjs --import
```

Rebuild and test the app after price changes. Prices are public reference values,
not confidential distributor information or current quotations.

## Documentation map

See [the documentation index](README.md) for user guides and technical references.
Contribution and private security-reporting instructions are in `.github/`.
The [Website embedding guide](website-embedding.md) is in `docs/`.

## Reference maintenance and publication

Use the [calculation reference map](calculations/README.md) when changing formulas,
CNC templates, overrides, timing or Compare. Update affected examples and the
reviewed release/date together with code. Preserve immutable reference fixtures
and list intentional CNC deviations explicitly.

Follow the [publication policy](publication-policy.md) for source, workbooks,
fixtures and release assets. Public branches are not a confidential review area.
The original Excel workbooks and audit working files remain private; the selected
public fixtures and image originals support reproducible tests and builds.

The current release baseline is v1.2.0 (all 16 languages). It uses complete HTML
for both downloads and direct embedding; the standalone and embedded checks run
at desktop/mobile widths. Historical version labels in technical documents record
when a change was introduced, not an unreleased controller status.
