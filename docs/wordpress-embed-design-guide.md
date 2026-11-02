# SmiCut Cutting Data App - WordPress Embed Design Guide

This guide explains how to continue designing and extending the SmiCut Cutting Data app so it works reliably when embedded in WordPress.

The main goal is to prevent WordPress theme CSS from changing the app layout, colors, input sizes, text spacing, borders, and result cards.

## Core Principle

Treat the app as an isolated widget.

All HTML and CSS should live inside one root wrapper:

```html
<div id="smicut-cutting-data-app">
  ...
</div>
```

All CSS should be scoped under this app. Avoid broad selectors like:

```css
button { ... }
input { ... }
p { ... }
```

Use scoped selectors instead:

```css
#smicut-cutting-data-app button { ... }
#smicut-cutting-data-app input { ... }
.scd-result-row { ... }
```

## WordPress CSS Problems We Found

WordPress themes often apply styles to:

- `p`
- `button`
- `input`
- `select`
- `textarea`
- `a`
- `label`
- `:focus`
- `:last-child`

These can create problems such as:

- Text turning red or another theme color.
- Inputs becoming too tall or too wide.
- Textareas getting a red focus line.
- Result cards losing height.
- Last card in a group being clipped.
- Button/tab borders using the wrong color.
- Paragraph margins changing the app layout.

## Important Rule: Avoid `<p>` for Dynamic Result Rows

Do not use `<p>` elements for result rows that are filled by JavaScript.

WordPress themes often style paragraphs aggressively. This caused the Thread Tapping `Grade` card to display incorrectly.

Use this:

```html
<div id="scd-tap-result-grade"></div>
```

Avoid this:

```html
<p id="scd-tap-result-grade"></p>
```

The JavaScript can still fill the row in the same way:

```js
setResultRow(tapGradeResult, 'Grade', getTapGradeLabel(tapGrade));
```

## Recommended Result Row Structure

For all future categories, use this generated structure:

```html
<span class="scd-result-label">Cutting speed (Vc)</span>
<span class="scd-result-value">25 - 30 m/min</span>
```

The current helper already does this:

```js
function setResultRowHtml(element, label, value, highlight, hidden) {
    element.className = highlight ? 'scd-result-row scd-result-row-highlight' : 'scd-result-row';
    element.style.display = hidden ? 'none' : '';
    element.innerHTML = '<span class="scd-result-label">' + label + '</span><span class="scd-result-value">' + value + '</span>';
}
```

Keep using this pattern.

## CSS Isolation Rules

At the top of the app CSS, keep this reset:

```css
#smicut-cutting-data-app {
    color: #2f2f35 !important;
    max-width: 780px;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif;
    background-color: transparent;
    padding: 0;
    border-radius: 0;
    box-sizing: border-box;
}

#smicut-cutting-data-app *,
#smicut-cutting-data-app *::before,
#smicut-cutting-data-app *::after {
    box-sizing: border-box;
}

#smicut-cutting-data-app label,
#smicut-cutting-data-app button,
#smicut-cutting-data-app select,
#smicut-cutting-data-app input,
#smicut-cutting-data-app textarea {
    font-family: inherit !important;
}
```

This protects the widget from WordPress box sizing and font inheritance.

## Form Controls

Inputs and selects should always be explicitly sized.

Use this pattern:

```css
.scd-control {
    box-sizing: border-box;
    width: 100% !important;
    min-height: 42px !important;
    height: 42px !important;
    color: #2f2f35 !important;
    border: 1px solid #ccd8d1 !important;
    border-radius: 8px !important;
    background-color: #ffffff !important;
    padding: 9px 11px !important;
    margin: 0 !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    line-height: 1.2 !important;
}
```

This prevents WordPress from making inputs unusually large.

## Selected Inputs Cards

Use the same selected-input frame logic across all categories.

Recommended HTML:

```html
<div class="scd-result-section scd-input-summary">
    <div class="scd-section-title">Selected inputs</div>
    <div id="category-result-material"></div>
    <div id="category-result-option"></div>
    <div id="category-result-grade"></div>
</div>
```

Recommended CSS:

```css
.scd-input-summary .scd-result-row {
    display: block;
    margin: 0 !important;
    padding: 11px 12px !important;
    border: 1px solid #d8e7de;
    border-radius: 8px;
    background-color: #fbfcfb;
    box-shadow: 0 1px 3px rgba(36, 64, 49, 0.04);
    overflow: visible;
}

.scd-input-summary .scd-result-label {
    display: block;
    margin: 0 0 5px 0 !important;
    padding: 0 !important;
    font-size: 12px;
    line-height: 1.25 !important;
    font-weight: 800;
    text-transform: uppercase;
}

.scd-input-summary .scd-result-value {
    display: block;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 15px;
    line-height: 1.3 !important;
    font-weight: 800;
}
```

## Final Calculations Cards

Final calculations should use a stronger themed background than selected inputs.

Use:

```html
<div class="scd-result-section scd-final-calculations">
    <div class="scd-section-title">Final calculations</div>
    <div id="category-result-speed"></div>
</div>
```

Avoid using `<p>` here too.

## Category Theme Colors

Each category can have its own theme color, but keep the structure the same.

Current themes:

- Solid Carbide Drills: green
- Thread Tapping: warm brown

Future categories should follow this pattern:

```css
.scd-category-result .scd-result-title {
    background-color: CATEGORY_COLOR;
}

.scd-category-result .scd-section-title {
    color: CATEGORY_DARK_COLOR !important;
}

.scd-category-result .scd-final-calculations {
    border-color: CATEGORY_LIGHT_BORDER;
    background: CATEGORY_LIGHT_BACKGROUND;
}

.scd-category-result .scd-result-row-highlight {
    border-left-color: CATEGORY_COLOR !important;
}
```

Do not change the base layout for every category. Only override colors and small category-specific details.

## Tabs

Tabs should be neutral by default.

Clickable tabs can change to their category color on hover.

Disabled tabs should not look clickable.

Important:

When a category is active, hover styles for other categories must not inherit the active category color. For example, when Thread Tapping is active, the Solid Carbide Drills hover border should still be neutral or green, not brown.

Use category-specific hover selectors:

```css
.scd-tab[data-scd-section="drills"]:hover {
    color: #2f6247 !important;
    border-color: #d5dbd8;
}

.scd-tab[data-scd-section="tapping"]:hover {
    color: #7a4f3d !important;
    border-color: #d5dbd8;
}
```

Avoid broad active-mode rules like this:

```css
.scd-mode-tapping .scd-tab[data-scd-section]:hover {
    border-color: brown;
}
```

That can accidentally make the drill tab brown when tapping is active.

## Note Frame

The `NOTE:` frame should always be visible and have a fixed visual height.

Use it for validation messages, missing input guidance, and warnings like no recommendation.

Recommended structure:

```html
<div class="scd-note">
    <div class="scd-note-title">NOTE:</div>
    <p id="category-note-message" class="scd-note-text"></p>
</div>
```

The `p` here is acceptable because it is not a card and is protected by the note CSS. If it ever causes WordPress problems, change it to a `div`.

Recommended CSS:

```css
.scd-note {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 38px;
    margin: 4px 0 14px 0;
    padding: 8px 11px;
    border: 1px solid #e2e7e4;
    border-left: 4px solid CATEGORY_COLOR;
    border-radius: 8px;
    background: #f9faf9;
}

.scd-note-title {
    flex: 0 0 auto;
    color: inherit !important;
    font-size: 12px;
    font-weight: 800;
}

.scd-note-text {
    display: block;
    min-height: 17px;
    color: inherit !important;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    margin: 0 !important;
}
```

## Copy Textarea

WordPress may style focused textareas with red or other theme colors.

Always scope textarea focus:

```css
.scd-copy-text {
    border: 1px solid CATEGORY_COLOR !important;
    box-shadow: none !important;
}

.scd-copy-text:focus {
    border-color: CATEGORY_COLOR !important;
    outline: 2px solid CATEGORY_OUTLINE !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
}
```

For each category, override copy colors:

```css
.scd-category-result .scd-copy-message {
    color: CATEGORY_DARK_COLOR !important;
}

.scd-category-result .scd-copy-text {
    border-color: CATEGORY_COLOR !important;
    background-color: CATEGORY_LIGHT_BACKGROUND !important;
}
```

## Links

Links inside the app should be scoped.

Do not rely on the WordPress theme link color.

Use:

```css
.scd-info-link-row a {
    color: CATEGORY_DARK_COLOR !important;
    text-decoration: underline;
    text-underline-offset: 2px;
}
```

## JavaScript Structure for New Categories

For each new category, add:

1. A clickable tab:

```html
<button type="button" class="scd-tab" data-scd-section="thread-turning">
    <span>Thread<br>Turning</span>
</button>
```

2. A category panel:

```html
<div id="scd-thread-turning-section" class="scd-panel scd-thread-turning-panel scd-panel-hidden">
    ...
</div>
```

3. A category result window:

```html
<div id="scd-thread-turning-result" class="scd-result scd-thread-turning-result">
    ...
</div>
```

4. A calculation function:

```js
function calculateThreadTurningData() {
    ...
}
```

5. A copy text builder:

```js
function buildThreadTurningCopyText() {
    return [
        'Recommended cutting data for Thread Turning',
        '',
        'Selected inputs',
        getCopyLine(...),
        '',
        'Final calculations',
        getCopyLine(...)
    ].join('\n');
}
```

## Testing Checklist Before Updating WordPress

Test in the local file first:

- Switch between all clickable tabs.
- Check default state before any input.
- Check valid calculation state.
- Check warning/no-recommendation state.
- Press Copy and confirm the copy textarea appears correctly.
- Click inside textarea and check border/focus color.
- Test long material names.
- Test narrow/mobile width.

Then test in WordPress:

- Confirm no text turns red or theme-colored.
- Confirm inputs/selects are not oversized.
- Confirm selected input cards have correct height.
- Confirm the last selected input card is not clipped.
- Confirm final calculation rows align vertically.
- Confirm tab hover colors are correct.
- Confirm note frame does not jump in height.
- Confirm copy fallback textarea has correct border/focus color.

## Most Important Rule

When something looks wrong in WordPress but not locally, suspect WordPress styling first.

The safest fixes are usually:

- Replace `<p>` with `<div>` for dynamic UI rows.
- Add scoped `margin: 0 !important`.
- Add scoped `padding`.
- Add scoped `line-height`.
- Add scoped `color`.
- Add scoped `border`.
- Avoid broad selectors.
- Keep all category UI based on the same shared card logic.
