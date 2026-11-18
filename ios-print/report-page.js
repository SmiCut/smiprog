// Called in a fresh, local SmiProg HTML edition by SmiProgPrintKit.swift.
async function prepareSmiProgPages(mode, fields, expectedCnc, cataloguePrices = false, discount = null) {
  const compare = mode === 'compare';
  document.querySelector('[data-spg-tab="'+(compare ? 'compare' : 'main')+'"]').click();
  const app = document.getElementById('smiprog-app');
  if (compare && cataloguePrices) {
    const unlock = document.getElementById('spg-unlock-compare');
    if (unlock.offsetWidth) {
      document.getElementById('spg-compare-password').value = 'XL';
      unlock.click();
    }
  }
  for (const {id, value} of fields) {
    const control = document.getElementById(id);
    if (!app.contains(control) || !(control instanceof HTMLSelectElement ||
        control instanceof HTMLInputElement) || control.disabled) {
      throw new Error('Unavailable SmiProg field: '+id);
    }
    control.value = value;
    if (control.value !== value) throw new Error('Unsupported value for '+id+': '+value);
    control.dispatchEvent(new Event('input', {bubbles:true}));
    control.dispatchEvent(new Event('change', {bubbles:true}));
  }
  if (compare && discount !== null) {
    const input = app.querySelector('.spg-compare-discount-input');
    if (!input || input.disabled) throw new Error('Catalogue discount is unavailable.');
    input.value = discount;
    input.dispatchEvent(new Event('input', {bubbles:true}));
  }
  if (mode === 'cnc' && expectedCnc !== null &&
      document.getElementById('spg-cnc-program').value !== expectedCnc) {
    throw new Error('The native CNC program and the report program differ.');
  }
  document.getElementById('print-'+mode).click();
  const preview = document.getElementById('spg-report-preview');
  if (!preview.open || (mode === 'cnc' && !preview.querySelector('.report-code'))) {
    throw new Error(document.querySelector('.spg-report-error')?.textContent || 'No printable result.');
  }
  const paper = document.getElementById('spg-print-paper');
  const sheets = [...preview.querySelectorAll('.report-sheet')].map(sheet => sheet.cloneNode(true));
  preview.close();
  // Use a dedicated document surface for WKPDFConfiguration's screen rendering.
  const pages = document.createElement('article');
  pages.className = paper.className.replace('spg-margin-boxes','');
  pages.id = 'spg-native-pages';
  pages.lang = preview.lang;
  pages.append(...sheets);
  document.body.replaceChildren(pages);
  const style = document.createElement('style');
  style.textContent = `
    html,body { margin:0!important; padding:0!important; width:210mm; background:white; }
    #spg-native-pages .report-sheet { display:flex; flex-direction:column; margin:0;
      width:210mm; height:297mm; padding:13mm 14mm 13mm; }
    #spg-native-pages .report-footer { margin-top:auto; }
    #spg-native-pages .report-code pre { font-size:9.5pt; line-height:1.26; }
  `;
  document.head.append(style);
  await document.fonts.ready;
  await Promise.all([...pages.querySelectorAll('img')].map(image => image.decode()));
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
  return sheets.map(sheet => {
    if (sheet.scrollHeight > sheet.clientHeight + 1) throw new Error('Report exceeds its page.');
    const {x,y,width,height} = sheet.getBoundingClientRect();
    return {x:x+scrollX,y:y+scrollY,width,height};
  });
}
