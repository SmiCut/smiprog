# Embed SmiProg on your website

Use the same complete HTML file offered in the [download table](../README.md#download-smiprog).
No iframe, PHP adapter, app-specific plugin or separate image folder is needed.

## Install or update

1. Download `smiprog-en.html` and keep a backup of your current page.
2. Open the file in a plain-text editor and copy all its contents.
3. Paste into a Raw HTML / Custom HTML block that preserves inline styles and scripts.
4. Replace the old app block when updating; keep only one SmiProg instance per page.
5. Publish, clear the affected page's cache, and test desktop and mobile.

If migrating from an older shortcode installation, replace the shortcode block
with the raw HTML block. Remove the old app's script/style includes so it is not
initialized twice. Disable the old app plugin only after checking that no other
page uses it. Do not change unrelated website plugins.

The HTML file also works when opened directly or hosted at its own URL. A site
editor that removes scripts cannot embed it directly without an administrator's
supported raw-code integration. Never paste the code into a visual rich-text block.

## Preserve page styling

Keep all app CSS under `#smiprog-app`. Do not add global body, button, input or
heading rules. The app root carries its own language. Keep script order and the
embedded image map intact. Do not apply lazy-loading or script-delay transformations
unless tested with all calculator tabs.

## Verify the published page

Check one app instance, all tabs, tool images, both supported controllers,
thread-length validation, marked-diameter overrides, CNC copying, Compare and
mobile horizontal overflow. Confirm surrounding navigation and page content still
work. The calculator and images must load without external app asset requests.

The optional AI Material Selector still needs internet and an approved website;
see [service access](../MATERIAL_SELECTOR.md). No private key belongs in the HTML.
