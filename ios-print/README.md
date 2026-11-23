# Utskrift och PDF i SmiProg för iOS

Paketet innehåller Swift-koden, de 23 kompletta språkversionerna av SmiProg och samma rapportmall, översättningar och bilder som webbutgåvan. Rapporten byggs lokalt. En export ger en PDF i A4-format som kan förhandsvisas, delas, sparas och skrivas ut.

## Lägg till paketet i Xcode

1. Lägg till `SmiProgPrintKit.swift` i appens target. Koden använder UIKit och WebKit och kräver iOS 16 eller senare.
2. Dra in hela mappen `SmiProgPrintResources` som en mappreferens med bibehållen struktur. Kontrollera att den ingår i **Copy Bundle Resources** och att `report-page.js` och `smiprog-sv.html` ligger i mappen även i den byggda appen.
3. Lägg en utskriftsknapp bredvid kopieringsknappen för skärdata, CNC och jämförelse. Sätt `report` till `.main`, `.cnc` respektive `.compare`. Låt användaren välja om CNC ska ingå på ställbladet. Förvalet är av från skärdata och på från CNC.
4. Läs av appens aktuella inställningar när användaren trycker på knappen. Skicka det aktiva appspråket. Metoden väljer rätt fil även för språk som `sv-SE` och `zh-Hant-TW`. Skapa PDF:en från en synlig vykontroller.

## Första provet

Följande kod körs på huvudtråden i en vykontroller. Den ger ett ställblad och CNC-program med standardgängan och gänglängden 12 mm.

```swift
guard let resources = Bundle.main.resourceURL?
    .appendingPathComponent("SmiProgPrintResources") else { return }
let kit = SmiProgPrintKit(resources: resources)
let data = try await kit.pdf(language: "sv", report: .cnc,
    fields: [.init("spg-thread-length", "12")], in: view)

let file = FileManager.default.temporaryDirectory
    .appendingPathComponent("SmiProg-\(UUID().uuidString).pdf")
try data.write(to: file, options: .atomic)
let share = UIActivityViewController(activityItems: [file], applicationActivities: nil)
share.popoverPresentationController?.sourceView = view
share.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
present(share, animated: true)
```

För förhandsvisning kan PDFKit visa `PDFDocument(data: data)` i en `PDFView`. För AirPrint används samma PDF-data.

```swift
let printer = UIPrintInteractionController.shared
printer.printingItem = data
printer.present(from: printButton.bounds, in: printButton, animated: true)
```

## Koppla till befintliga beräkningar

Varje export börjar i en ny lokal webbrapport. Skicka **alla aktuella val och egna värden** i beroendeordning. Ett utelämnat fält får webbversionens standardvärde. För select-fält används alternativets `value` i den medföljande HTML-versionen. Verktygsvalet använder katalogens verktygs-ID. Numeriska indata använder punkt som decimaltecken. Rapporten formaterar enheter och tal på valt språk.

| Inställning | Fält i webbversionen |
| --- | --- |
| Material, profil och gängdimension | spg-material, spg-thread-profile, spg-thread-size |
| Diameter och stigning vid manuell dimension samt gänglängd | spg-diameter, spg-pitch, spg-thread-length |
| Verktyg, märkt diameter | spg-tool, spg-marked-diameter |
| Egna verktygsmått | spg-override-cutter-diameter, spg-override-edge-length, spg-override-flutes |
| Egna skärdata | spg-override-cutting-speed, spg-override-feed, spg-override-radial-passes |
| CNC | spg-process, spg-control-system, spg-thread-hand, spg-program-template, spg-safety-distance |
| Jämförelsens gänga | spg-compare-material, spg-compare-thread-profile, spg-compare-thread-size, spg-compare-diameter, spg-compare-pitch, spg-compare-thread-length |
| Jämförelsens verktyg | spg-compare-tool-a, spg-compare-tool-b; respektive verktygs egna fält slutar på -diameter, -length, -flutes, -speed, -feed, -passes, -price eller -life |
| Maskinkostnad | spg-machine-cost |

Vid jämförelse kan appen skicka sitt aktuella val för katalogpriser som `cataloguePrices:` och aktuell rabatt som `discount:` (exempelvis `"15"` för 15 %).

När appen redan visar ett CNC-program, skicka dess text som `expectedCnc:` till `pdf`. Vid avvikande program får appen ett fel att presentera. Koppla samma verktygsdata, process och styrsystem i båda apparna. Om er iOS-version har egna beräkningsändringar behöver de stämmas av mot den version av rapportmotorn som följer med.

## Kontroll före leverans

Prova ställblad, ställblad med CNC och verktygsjämförelse på iPhone och iPad. Jämför samma material, gänga, verktyg, skärdata, priser och maskinkostnad mot språkutgåvan i resursmappen. Kontrollera även ett långt CNC-program, sidnummer, bildtext och färger. Olika skrivare, inbyggda typsnitt och pappersformat kan påverka utskriftens utseende. Behåll samma PDF-data vid delning och AirPrint.

## Återskapa paketet från källkoden

Kör `npm ci` och sedan `npm run build:ios-print` från SmiProg-repots rot. Zipfilen hamnar i `dist/downloads`. Källan till webbrapporten finns i `apps/web/js/app.js`, `apps/web/report.css` och `apps/web/i18n/translations.csv`. Om mallen ändras ska samtliga HTML-filer byggas om tillsammans.
