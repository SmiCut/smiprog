# Getting started with SmiProg

## Use online

[Open SmiProg on smicut.com](https://smicut.com/en/smiprog-online/) to start immediately.
No installation or GitHub account is needed.

## Use the complete HTML download

1. [Download the English app](https://github.com/SmiCut/smiprog/releases/latest/download/smiprog-en.html).
2. Find `smiprog-en.html` in your Downloads folder.
3. Double-click it and choose a web browser if asked. You can also drag it into
   an open browser window.

All app code, tool data and images are in this file. You do not need to extract a
ZIP, download the repository, install a plugin or keep a folder of pictures.
Calculations, CNC output and Compare work without internet. Select a material
manually. The hosted AI Material Selector needs internet and an approved website;
it is not enabled by opening a local HTML file.

For phones and tablets, use the online version if your device previews HTML files
rather than opening them as a working app.

## Start calculating

Open **Internal Thread Milling**, choose the material and thread, enter the thread
length, then choose a suitable tool. Check the cutting data and select the intended
control system and thread direction. Use **Copy** to copy results or the CNC program.
Verify the program for your actual machine and setup before machining.

**Compare** opens with `XL`. It compares two tools and their estimated costs.
Its prices are reference values and may be changed; they are not a sales quotation.
The code is not protection for confidential prices: the program's data are public.

## If something looks wrong

- **You see code:** open the file in a browser rather than a text editor. Its
  filename must end in `.html`.
- **The download opens in the browser:** use your browser's save-link option to
  save the HTML file.
- **AI does not connect:** use manual material selection or the online app. For
  your own website, follow the [AI access guide](../MATERIAL_SELECTOR.md).
- **A CNC program is missing:** check the thread length, tool suitability, input
  messages and supported machine/control configuration.

## Use SmiProg on your website

Ask your website manager to upload the complete HTML file and link to it, or
embed that hosted file in a page. Test the actual website on a computer and phone.
For WordPress, your website manager can embed the hosted file; inserting the entire
HTML document into a normal text block is not an installation method.

You may [adapt the app for your company](../REBRANDING.md). To enable the optional
AI Material Selector, [request approval for the exact website address](../MATERIAL_SELECTOR.md).
The calculators work with manual material selection without AI approval.

## Updates and help

Downloads do not update automatically. Get the newest file from
[the download table](../README.md#download-smiprog). Back up your customized version:
your own edits are not automatically carried into a new download.

Email [info@smicut.se](mailto:info@smicut.se) with your browser, language and a short
problem description. See [the CNC verification notes](cnc-motion-and-validation.md)
for controller support and test scope.
