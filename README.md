<h1><img src="docs/images/smiprog-icon.png" alt="SmiProg app icon" width="64" height="64" align="absmiddle"> SmiProg</h1>

**Free thread-milling software. Calculate cutting data, select a tool and generate a CNC program.**

[**Use online**](https://smicut.com/en/smiprog-online/) · [**Download SmiProg**](#download-smiprog) · [**Adapt for your company**](REBRANDING.md)

![SmiProg start screen with thread milling, tool comparison and material selection](docs/images/smiprog-preview.png)

Made by [SmiCut](https://smicut.com). Free to use and adapt, including commercial use.
SmiProg helps you choose thread mills, calculate cutting data and machining time,
generate CNC programs, and compare tooling costs.

Use the same complete HTML file on your own website: paste its contents into a
Raw HTML block. [Website installation guide](docs/website-embedding.md).

## Download SmiProg

**One HTML file contains the app, tool data and all images.** No installation,
ZIP extraction, image folders or GitHub account is needed.

| Language | Use online | Download complete app |
|---|---|---|
| English | [Open SmiProg](https://smicut.com/en/smiprog-online/) | [Download smiprog-en.html](https://github.com/SmiCut/smiprog/releases/latest/download/smiprog-en.html) |

English is the currently released language. Further language editions will be
added when their translations are ready and checked.

## Open your download in three steps

1. Click **Download smiprog-en.html** above.
2. Find the file in your Downloads folder.
3. Double-click it to open SmiProg in your web browser. If asked, choose a browser.

The calculators, CNC generation, tool comparison and images work offline.
Choose a material category manually when working offline. External product links
need internet. The **AI Material Selector needs internet and an approved website**;
opening the downloaded file on your computer does not enable the hosted AI service.
Use the online version for AI-assisted selection.

[Help opening the file and using it on your website](docs/getting-started.md) · [Latest release and changes](https://github.com/SmiCut/smiprog/releases/latest)

## What can I do?

- Select thread dimensions, workpiece material and a suggested SmiCut tool.
- Enter custom tool dimensions or the laser-marked diameter on a catalogue tool.
- Calculate cutting data and machining time.
- Generate CNC programs for supported Fanuc / ISO and Heidenhain configurations.
- Compare two tools, machining times and costs. Open **Compare** with `XL`.

Compare is intended for SmiCut and distributors. Its unlock code is a convenience,
not a security feature. Reference prices are editable and are not a current quotation.

**Verify the CNC program for your controller, machine and setup before machining.**
Heidenhain supports right- and left-hand vertical milling; Heidenhain lathe thread
milling is not supported. See [supported configurations and verification limits](docs/calculations/cnc-motion-and-validation.md).

## Make it your own

Use your own company name, logo, colours, product links and reference prices.
You may change the software, offer it commercially and keep your changes private.

There is no built-in branding editor. A web developer can help edit the app.
Keep the included copyright, MIT license and third-party icon notices; these are
already embedded in the HTML and do not require visible branding in your interface.

[**Read the customization guide**](REBRANDING.md) · [**Use SmiProg on your website**](docs/getting-started.md#use-smiprog-on-your-website)

## Help and further information

[Browse the documentation](docs/README.md)

- **Using SmiProg:** email [info@smicut.se](mailto:info@smicut.se).
- **AI access for your own website:** follow the [Material Selector guide](MATERIAL_SELECTOR.md).
- **Report a problem:** [open an issue](https://github.com/SmiCut/smiprog/issues).
- **For developers:** [source files, tests and builds](docs/development.md), [contributing](.github/CONTRIBUTING.md), and [MIT license](LICENSE).
- **Tapping, thread turning, grooving, milling and drilling:** see [SmiCalc](https://github.com/SmiCut/smicalc).

For contributors: [what belongs in this public project](docs/publication-policy.md).
