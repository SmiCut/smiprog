# Development and verification

## Sources

- `apps/web/index.html`, CSS and `js/app.js`: browser interface
- `apps/web/js/core.js`: calculation and CNC program logic
- `apps/web/data/smiprog-data.js`: tool, material, thread, post and price data
- `apps/web/data/tool-prices.csv`: editable reference prices
- `apps/web/i18n/translations.csv`: text source for all 16 review languages
- `apps/web/tools/build-translations.mjs`: generates language JSON and bundled dictionaries
- `tools/build-app-files.mjs`: shared static source preparation
- `tools/build-single-html.mjs`: complete HTML distribution

Use `npm test` for the preserved golden fixtures, native Excel parity cases,
comparison-policy tests, native Excel cost scenarios and language packaging.
Use `npm run test:browser` for the UI, material selector mocks, Excel parity in the
browser and comparison cost UI. No live AI calls are needed for these checks.

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

`npm run build:html` creates `dist/downloads/smiprog-en.html` and checksums.
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

The current release baseline is v1.0.0 (English only). It uses complete HTML
for both downloads and direct embedding; the standalone and embedded checks run
at desktop/mobile widths. Historical version labels in technical documents record
when a change was introduced, not an unreleased controller status.
