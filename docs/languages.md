# Language review and maintenance

Version 1.1.0 includes English, Swedish, Danish, German, Spanish, French,
Hungarian, Indonesian, Italian, Japanese, Korean, Dutch, Polish, Russian,
simplified Chinese and traditional Chinese (Taiwan).
Each language has a complete HTML download in the GitHub release.

The translations follow SmiCut's supplied iOS/Compare language handover, adapted
to the existing web controls. Technical English terms in its Indonesian material
and cutting-data text are intentional. The translations still benefit from
native-speaker review; automated tests cannot establish linguistic quality.

## Build and review

`apps/web/i18n/translations.csv` is the maintained source, with 360 keys per
language. Keep the same key and named placeholders in every column. Do not edit
generated dictionaries or HTML files by hand. Raw internal handover notes and
historical spreadsheets are not needed in this public repository.

1. Run `npm run build:languages` after changing translations.
2. Open `apps/web/languages/index.html` for local review with shared resources.
3. Use `dist/downloads/smiprog-<locale>.html` for the complete standalone file,
   including images and license notices. These files also support website embedding.
4. Run `npm test`, `npm run test:browser` and `npm run verify:languages`.

Builds are local only. Uploading a release or changing a website is a separate
decision. Neither building nor publishing these static files deploys WordPress,
Railway or the shared AI service.

## Rules for future translations

- Localize visible labels, input hints, errors, copied/shared results and links.
  Keep CNC commands and numeric machine-code output unchanged.
- Use the active language's number format. Preserve the ungrouped spindle-speed
  format so a whole RPM value cannot be mistaken for a decimal value.
- Swedish uses SEK, its own stored prices and Swedish shop product IDs. Other
  languages use EUR, separate stored values and the existing EAN product links.
  `XL` controls visibility only; no confidential prices belong in the browser.
- Interpolate named `{tool}`, `{amount}`, `{percent}` and `{currency}` values.
  Keep the percent sign in the localized sentence exactly once.
- Resolve regional locales to their base dictionary. Map Chinese variants to
  `zh` or `zh-tw`; preserve other regional API codes such as `en-za` and `fr-be`.
- Use canonical frontend material labels for stable `materialCategoryKey`
  matches. Format details as `(HB < 200, Rm < 700 N/mm²)` and retain appropriate
  language capitalization. Ordinary help text mentioning example materials must
  not create a recommended material card. Preserve unmatched backend text.
- Article links follow the supplied language mapping, including intentional
  English flank-infeed article fallbacks for Indonesian, Japanese, Korean,
  Russian and simplified Chinese.
- Keep desktop/tablet Compare's Note and Use current setup on one row. Only
  portrait phones up to 560 px place the full-width button above the note.

The test suite checks complete dictionaries, named placeholders, script parsing,
desktop/mobile layouts, local images, copy/share, price access, input validation,
regional codes and mocked material answers. All 16 languages must produce the
same CNC program for the same valid input. Existing marked-diameter, CNC-motion,
Safari metric layout and embedded-image behavior remain part of the baseline.
