# Development and verification

## Sources

- `apps/web/index.html`, CSS and `js/app.js`: browser interface
- `apps/web/js/core.js`: calculation and CNC program logic
- `apps/web/data/smiprog-data.js`: tool, material, thread, post and price data
- `apps/web/data/tool-prices.csv`: editable reference prices
- `apps/web/i18n/translations.csv`: English text source (other language drafts remain private)
- `apps/web/tools/build-translations.mjs`: generates language JSON and bundled dictionaries
- `wordpress/smiprog-widget.php`: shortcode adapter
- `tools/build-wordpress-plugin.mjs`: static WordPress package generation

Use `npm test` for the preserved golden fixtures, native Excel parity cases,
comparison-policy tests, native Excel cost scenarios and WordPress packaging.
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

## WordPress and Material Selector

All calculations, price data and CNC generation run client-side. The package
includes the English locale and an MIT license copy. There is no SmiProg
server or API key required for the calculators.

The optional Material Selector calls SmiCut's separately hosted service at
`https://smicut-material-selector-production.up.railway.app/api/chat`.
`SmiProgConfig.materialSelectorApiUrl` can point to a compatible backend; configure
it before scripts load. Keep the shared request contract, language codes and
canonical material keys stable. Service access is separate from MIT licensing.

For SmiCut-hosted access, follow [the website approval guide](../MATERIAL_SELECTOR.md).
Website approval requires no browser API key and no changes to the default service
URL. The existing short-term limit is 30 requests per minute per IP address.

Keep widget CSS scoped under `#smiprog-app`; see the embedding guide at the root.
Changes to calculations require updated technical documentation, relevant tests
and a review of the controller/post scope. Heidenhain has `released` status for right- and left-hand vertical milling.
Its machine scope excludes lathe live-tool output, which remains blocked.
`released` denotes product availability; it does not assert a named person
reviewed it or that it was tested on a physical machine.

## Independent language distributions

`npm run build:languages` generates standalone and WordPress ZIP files for each
of the released locales under `dist/languages` (currently only `en`). Each includes its chosen
dictionary plus an English fallback. Shared calculations, prices and assets come
from the same source as the multilingual app. The standalone HTML language and
the WordPress shortcode's default locale are set during generation.

Use `npm run test:languages` for package integrity and `npm run verify:languages`
for desktop/mobile loading, selected locale, Material Selector language, image
loading and CNC output. Add translated dictionaries before adding new locale
codes to `tools/build-language-packages.mjs`.

## CNC motion regression checks

See [CNC motion calculations and verification](cnc-motion-and-validation.md) for
the axial/tapered milling corrections, pass rejection rules, independent command
checks and exact reviewed deviations from the immutable Excel references.
`npm run test:cnc-motion` is included in `npm test`.
