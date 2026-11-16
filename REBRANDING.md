# Create a SmiProg version for your company

**Use your own name, logo, colours and product links.** SmiProg may be used,
modified and distributed commercially under MIT. Your changes may remain private.
A visible SmiCut name or link is not required in your interface.

## Choose the simplest route

- **Use the app on your website:** [download your language](README.md#download-the-published-release)
  and follow the [installation guide](docs/website-embedding.md).
- **Create a branded web app:** give this guide, your logo, colours, website address
  and product links to your web developer. Follow the example below.
- **Publish an iPhone or Android app:** a developer must additionally create and
  test the mobile package and manage store publication. This repository supplies
  a browser app, without a ready-to-submit native mobile project.

There is no built-in branding editor. For maintained customizations, edit the
readable sources and rebuild rather than editing the compressed HTML download.

## Worked example: North Tools

North Tools is a fictional reseller. This example adds its identity and changes
one product link while preserving the calculator. Replace the example name,
initials, colours and example.com addresses before publishing.

### 1. Create your development copy

Download the source for a [published release](https://github.com/SmiCut/smiprog/releases)
or make your own Git copy. Keep the release version and an unchanged backup.
Install Node.js 20 or later, then run in the project directory:

```sh
npm ci --ignore-scripts
```

### 2. Add your name, logo and contact link

In [apps/web/index.html](apps/web/index.html), insert this immediately after
`<main id="smiprog-app" class="spg-app">` and before the `spg-shell` section:

```html
<header class="reseller-header">
  <a class="reseller-brand" href="https://example.com/">
    <svg class="reseller-logo" viewBox="0 0 64 64" role="img"
         aria-label="North Tools logo" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="10" fill="#123d60"/>
      <text x="32" y="40" text-anchor="middle" fill="white"
            font-family="Arial, sans-serif" font-size="26">NT</text>
    </svg>
    <span>North Tools — Thread Milling</span>
  </a>
  <a href="https://example.com/contact/">Contact North Tools</a>
</header>
```

The inline SVG is a self-contained example logo. Replace it with your approved
inline SVG or a data-URL image to preserve offline use. A remotely hosted logo
needs internet. Local image files need to be included in your build; an arbitrary
file path does not automatically embed an image in the complete HTML download.

### 3. Apply your colours

Append the following to [apps/web/styles.css](apps/web/styles.css). The selectors
are limited to the app so they do not restyle the surrounding website.

```css
#smiprog-app .reseller-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
#smiprog-app .reseller-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
}
#smiprog-app .reseller-logo {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
#smiprog-app a {
  color: #123d60 !important;
}
#smiprog-app .spg-tab-active {
  background: #123d60 !important;
  color: #ffffff !important;
}
```

These rules change the header, links and selected tab. Other app colours remain
in the existing stylesheets; review them if you want a complete redesign.
Keep `smiprog-app`, `spg-*`, `data-i18n*` and other functional identifiers intact.

### 4. Change app names, product links and prices

| Change | Editable source | Example |
|---|---|---|
| App name and help text | [translations.csv](apps/web/i18n/translations.csv) | In your language column, change `app.title`, `aria.calculator`, `aria.sections` and `start.information.description`. Search for other visible SmiProg/SmiCut mentions. Keep keys and `{placeholders}` unchanged. |
| Page description | [index.html](apps/web/index.html) | Update the description meta tag. For an embedded app, also set the title and search description in your website editor. |
| Product links | [tool-web-links.js](apps/web/data/tool-web-links.js) | Set the article's `url` to your product page, as below. |
| Article/help links | [translations.csv](apps/web/i18n/translations.csv) | Review `info.threadBurr.url` and `info.flankInfeed.url` and their link labels. |
| Public reference prices | [tool-prices.csv](apps/web/data/tool-prices.csv) | Follow the [price import instructions](docs/development.md#developer-setup-and-editable-prices). |

For example, change the existing `EB1010E21_1.0ISO_AC` entry in
`tool-web-links.js` to:

```js
"EB1010E21_1.0ISO_AC": {
  "ean": "07340227517176",
  "image": "NB08075D21_1.5ISO_AC.webp",
  "url": "https://example.com/products/EB1010E21-1-0ISO-AC/"
}
```

Remove that entry's `shopProductID` when substituting your own URL: the Swedish
edition otherwise gives the SmiCut Swedish shop link priority. Keep the article
key and image mapping. Repeat for the products you sell and check the links in
every language you publish. Branding changes do not require changing tool
geometry or material category identifiers.

Prices in HTML and JavaScript are public. Use prices intended for customers;
do not put confidential distributor prices or margins in the app.

### 5. Build, test and publish

```sh
npm run build:languages
npm test
npx playwright install chromium webkit
npm run verify:main-layout
npm run verify:html
```

Your complete files are in `dist/downloads/smiprog-<language>.html`.
Check the logo, name, all tabs, product links, prices, copying and phone layout.
Translate the example header too if you publish multiple languages. Verify CNC
output for the intended machine and setup. Then [install the file on your website](docs/website-embedding.md).

Optional AI access requires [approval for your website](MATERIAL_SELECTOR.md).
No API key is inserted after approval. Manual material selection and the
calculators work without that approval.

## Keep your version maintainable

Record the original SmiProg release, your edits and the published files. Keep
customization commits separate from calculation changes so your developer can
carry them forward when SmiCut releases an update. Downloads do not update
automatically; a stock download replaces your customizations. Rebuild and test
after merging an update.

The workbook importer reapplies reviewed translations from
`apps/web/i18n/reviewed-overrides.json`. If your own wording differs, maintain the
corresponding override in your copy before importing a workbook.

## License notices and support

Retain SmiCut AB's copyright notice, the full [MIT license](LICENSE) and the
included third-party icon notices. The builder embeds these in the complete HTML;
they do not require visible SmiCut branding. For multi-file distributions include
`LICENSE` and `THIRD_PARTY_NOTICES`.

Describe your modifications as your own version and do not imply SmiCut
endorsement. Your developer maintains and tests your custom version. For SmiProg
questions contact [info@smicut.se](mailto:info@smicut.se); for hosted AI access
follow the [Material Selector guide](MATERIAL_SELECTOR.md).

[Back to SmiProg and downloads](README.md)
