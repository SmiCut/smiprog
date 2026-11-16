import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

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
