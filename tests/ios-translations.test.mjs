import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

test('iOS saving arguments retain their meaning when a translation reorders them', () => {
  const result = execFileSync('python3', ['-c', `
import importlib.util
s=importlib.util.spec_from_file_location('ios_import','tools/import-ios-translations.py')
m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
print(m.saving_format('%3$@%%: %1$@ saves %2$@'))
print(m.saving_format('%@ saves %@ (%@%%)'))
assert 'compare.priceError' in m.KEEP_WEB
assert 'info.step1.body' in m.KEEP_WEB
`], {encoding:'utf8'}).trim().split('\n');
  assert.deepEqual(result, ['{percent}%: {tool} saves {amount}', '{tool} saves {amount} ({percent}%)']);
});

test('reviewed terminology survives a stale workbook import without changing other cells', () => {
  const result = execFileSync('python3', ['-c', `
import importlib.util,json
s=importlib.util.spec_from_file_location('ios_import','tools/import-ios-translations.py')
m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
overrides=json.loads((m.ROOT/'apps/web/i18n/reviewed-overrides.json').read_text())
keys={key for translations in overrides.values() for key in translations}
rows=[dict(key=key,**{locale:'older text' for locale in m.LOCALES}) for key in keys]
rows.append(dict(key='unchanged',**{locale:'keep this' for locale in m.LOCALES}))
m.apply_reviewed_overrides(rows)
by_key={row['key']:row for row in rows}
assert 'V-profil' in by_key['tool.description.partial']['sv']
assert by_key['tool.description.partial']['de']=='older text'
assert by_key['unchanged']['sv']=='keep this'
for locale,translations in overrides.items():
    for key,text in translations.items():
        assert by_key[key][locale]==text
print('ok')
`], {encoding:'utf8'}).trim();
  assert.equal(result, 'ok');
  const overrides = JSON.parse(fs.readFileSync('apps/web/i18n/reviewed-overrides.json', 'utf8'));
  for (const [locale, translations] of Object.entries(overrides)) {
    const dictionary = JSON.parse(fs.readFileSync(`apps/web/i18n/${locale}.json`, 'utf8'));
    for (const [key, text] of Object.entries(translations)) assert.equal(dictionary[key], text, `${locale}/${key}`);
  }
});
