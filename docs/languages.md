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

`apps/web/i18n/translations.csv` is the maintained source, with 377 keys per
language. Keep the same key and named placeholders in every column. Do not edit
generated dictionaries or HTML files by hand. Raw internal handover notes and
historical spreadsheets are not needed in this public repository.

Version 1.4.0 adds Norwegian Bokmål, Czech, Estonian, Basque, European
Portuguese, Romanian and Finnish. The original SmiProg Excel workbook supplies
machining terminology. App controls, comparison and print text use the same
keys as the other editions. The earlier 16-language iOS handover has no
columns for these seven languages. The importer preserves their web text when
refreshing that handover. Article links open the labelled English fallback.
The Portuguese offline file uses `pt-pt` and its WordPress page uses `/pt/`.

1. Run `npm run build:languages` after changing translations.
2. Open `apps/web/languages/index.html` for local review with shared resources.
3. Use `dist/downloads/smiprog-<locale>.html` for the complete standalone file,
   including images and license notices. These files also support website embedding.
4. Run `npm test`, `npm run test:browser` and `npm run verify:languages`.

Builds are local only. Uploading a release or changing a website is a separate
decision. Neither building nor publishing these static files deploys WordPress,
Railway or the shared AI service.

## Rules for future translations

Reviewed terminology and web-specific corrections are retained in
`apps/web/i18n/reviewed-overrides.json`. The workbook importer applies these after
the supplied translations, preventing older handovers from undoing corrections.
When revising a listed key, update both the CSV and its reviewed override, then
rebuild. Version 1.2.3 uses **V-profil**, **axiella pass**, **verktyg med midja** and
**vändskärsgängfräsar** in Swedish. Its information-tab review restores the
laser-marked cutter-diameter instructions using the original SmiProg Info text
as a terminology reference, adapted to current web controls without Excel cell
numbers. Indonesian has no equivalent in that original reference and follows
the same technical meaning in its existing terminology.

Version 1.2.4 extends that review to every information-tab heading, paragraph,
diagram label and article label in all 16 languages, changing 185 text cells.
The original INFO reference covers 15 of these languages; Indonesian is aligned
with the reviewed technical meaning. This is a terminology and content review,
not native-speaker certification. Existing article titles and destinations are
retained, including the intentional English fallbacks.

| Original information topic | Web adaptation |
| --- | --- |
| How to use the program | Three steps using current selectors; safety distance is under CNC Program, without numbered Excel fields. |
| Tool compensation | Small corrections, radius compensation during short movements, and a near-zero diameter compensation value. |
| Correct thread diameter | Optically measured pitch diameter and laser-marked theoretical cutter diameter. |
| Unlisted/special tooling | Custom dimensions: cutter diameter, cutting edge length and number of flutes. |
| One or two axial teeth | Automatic spiral for NM tools; pitch entered as cutting edge length for another suitable tool. The web engine supports this cycle. |
| Reduced neck | Multiple axial passes, subject to tool suitability. |
| Indexable inserts | Cutter-body cutting diameter, insert cutting edge length and number of inserts; axial passes where needed. |
| Tapered threads | Diameter at the last full tooth nearest the shank and the corresponding workpiece position. |
| Warning | Recommended starting values, machining-dependent adjustments and responsibility for CNC/cutting-data use. |

Web-only preparation guidance, ThreadBurr, flank infeed and diagram text were
also reviewed for consistency. Reviewed information prose and labels are pinned
in the overrides; article titles and URLs can still follow a new link handover.
The original workbook remains outside the public repository.

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
regional codes and mocked material answers. All 23 languages must produce the
same CNC program for the same valid input. Existing marked-diameter, CNC-motion,
Safari metric layout and embedded-image behavior remain part of the baseline.

## iOS translation refresh (1.2.2)

The November 2026 iOS handover contains 256 keys in 16 languages and 48
published article/privacy links. Import it with Python 3 (standard library only):

```bash
python3 tools/import-ios-translations.py /path/to/SmiProg-iOS-translations-16-languages.xlsx
npm run build:languages
```

The importer matches shared keys and reviewed functional aliases, converts Swift
saving placeholders to named web arguments, and uses article titles with their
matching URLs. It leaves web-only text, the compact custom-tool label, web pitch
guidance and optional-price comparison validation intact. Existing translated
material groups/descriptors and numeric material data remain unchanged.
Only translated customer text is imported; the workbook, source-path columns,
internal notes and iOS-only controls are not included in the public release.

This refresh reuses existing translations for most of the web interface; it
updates 61 text cells. In particular, start-page and output guidance now cover
CNC programs without describing the application as Fanuc-only. Material-service
errors explain retry/manual selection in the supplied languages.

The 23 app editions also serve the four regional website variants: English
South Africa, global Spanish, Belgian French and Belgian Dutch. The surrounding
WordPress pages and their language associations are published separately.
