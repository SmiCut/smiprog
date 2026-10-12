# SmiProg

Thread-milling cutting data and CNC program generation by [SmiCut](https://smicut.com).
This initial development source release is MIT-licensed. The static web app can run locally, be installed as a WordPress
widget, or be adapted by distributors under their own brand.

## Features

- Thread, material and tool selection, including custom tool values
- Cutting data, machining-time estimates and CNC program output
- Tool-cost comparison with editable SmiCut reference prices in EUR
- English interface (additional translations are being prepared)
- Optional shared AI-assisted Material Selector
- A WordPress shortcode package

The current Fanuc / ISO IJK post supports milling and selected lathe live-tool
variants. Heidenhain Klartext vertical milling remains experimental (`internal`
release metadata), although visible in the current interface. It supports right- and left-hand vertical milling; lathe requests remain
blocked. Left-hand milling follows the Fanuc strategy: downward helix, counterclockwise
arcs and left radius compensation. Software checks cover Excel reference comparisons
and 43,852 catalogue/boundary cases across both thread hands. Axial/tapered Z corrections intentionally differ from the
original Excel output; [test scope and formulas](docs/cnc-motion-and-validation.md)
explain the corrections and limits of these checks.
Verify generated CNC for your actual controller, machine and setup before use.
Publishing the source is not certification of every machining scenario.

## Quick start

The first source release provides English downloads. Further language packages
will be added when their translations are ready:

| Language | Standalone web app | WordPress plugin |
|---|---|---|
| English | [smiprog-en.zip](https://github.com/SmiCut/smiprog/releases/latest/download/smiprog-en.zip) | [smiprog-widget-en.zip](https://github.com/SmiCut/smiprog/releases/latest/download/smiprog-widget-en.zip) |

Unzip the standalone package and open its `index.html`, or install the WordPress
plugin and use `[smiprog]`. The current packages start in English and contain the needed scripts and images. Download one
WordPress variant per site. All variants are generated from this shared source.

Open `apps/web/index.html` directly, or serve it locally:

```bash
cd apps/web
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`. Calculations and Compare run in the browser.
Material Selector requires internet access to a separately hosted service.
The Compare interface currently opens with `XL` (case-insensitive). This is a
UI convenience, not a security mechanism; all prices and calculations are public.

## Your brand and your prices

MIT permits commercial reuse, private modifications and your own name/logo with
no visible SmiCut attribution. Retain the copyright and MIT license with distributed
copies; see [REBRANDING.md](REBRANDING.md). Do not imply endorsement of your changes.

Reference prices are editable in `apps/web/data/tool-prices.csv`. They are supplied
for comparison, not as a current quotation or a promise of distributor pricing.
You may replace or remove them. Import edited values with:

```bash
cd apps/web
node tools/update-tool-prices.mjs --import
```

## Development and WordPress

Use Node.js 20 or later:

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm test
npm run test:browser
npm run build:wordpress
npm run verify:wordpress
npm run build:languages
npm run verify:languages
```

Install `dist/wordpress/smiprog-widget.zip`, activate it and add `[smiprog]` to a
WordPress page. The current release uses English. Test the actual
theme and shortcode: the automated package verifier uses a simulated WordPress
page. Distribution packages include LICENSE.

See [docs/development.md](docs/development.md) for architecture and test scope.
## Material Selector on your website

Email [oliver@smicut.se](mailto:oliver@smicut.se?subject=Material%20Selector%20website%20access)
with your company name, website address(es), program and language to request access
to SmiCut's optional AI material service. Once SmiCut confirms the approved website,
the app connects automatically. **No API key is needed.** The existing limit of
30 requests per minute per IP address remains.

Follow the [three-step Material Selector guide](MATERIAL_SELECTOR.md).
The calculators also work without AI access by selecting materials manually.
Hosted service access is separate from the MIT software license.
SmiCalc is maintained at [SmiCut/smicalc](https://github.com/SmiCut/smicalc).
