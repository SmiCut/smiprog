import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { inspectKlartext } from './cnc-command-trace.mjs';
import { catalogueSamples } from './cnc-catalogue-samples.mjs';
const context = { window: {} };
vm.createContext(context);
for (const file of ['../data/smiprog-data.js', '../js/core.js']) {
  vm.runInContext(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), context);
}
const { SmiProgCore: core, SmiProgData: data } = context.window;
const manifest = JSON.parse(fs.readFileSync(new URL('./excel-parity-cases.json', import.meta.url)));
const oracle = JSON.parse(fs.readFileSync(new URL('./excel-parity-oracle.json', import.meta.url)));
const seed = manifest.cases.find(e => e.id === 'heidenhain-axial-length-100').input;

// Independent scalar execution of the generated Fanuc WHILE subset, not core formulas.
function fanucZ(lines) {
  let z = 0, steps = 0;
  const q = {}, loop = [];
  for (let pc = 0; pc < lines.length; pc++) {
    assert.ok(++steps < 100000, 'loop must terminate');
    const line = lines[pc];
    let m;
    if ((m = line.match(/^#(\d+)=(-?[\d.]+)$/))) q[m[1]] = +m[2];
    else if ((m = line.match(/^#(\d+)=#(\d+)\+1$/))) q[m[1]] = q[m[2]] + 1;
    else if ((m = line.match(/^WHILE\[#(\d+)LT#(\d+)\]DO(\d+)$/))) {
      assert.ok(q[m[1]] < q[m[2]]);
      loop.push({ pc, counter: m[1], limit: m[2], label: m[3] });
    } else if ((m = line.match(/^END(\d+)$/))) {
      const current = loop.at(-1);
      assert.equal(current.label, m[1]);
      if (q[current.counter] < q[current.limit]) pc = current.pc;
      else loop.pop();
    } else if (/^G0[013]/.test(line) && (m = line.match(/\bZ(-?[\d.]+)/))) z += +m[1];
  }
  assert.equal(loop.length, 0);
  return z;
}

test('native Excel example proves the original drift; corrected posts restore Z', () => {
  const oldH = oracle.cases.find(e => e.id === 'heidenhain-axial-length-100').cncProgram;
  assert.ok(Math.abs(inspectKlartext(oldH).end[2] + 5.616) < 1e-9);
  const oldF = oracle.cases.find(e => e.id === 'axial-length-100').cncProgram;
  assert.ok(Math.abs(fanucZ(oldF) + 5.616) < 1e-9);
  for (const controlSystemId of ['heidenhain', 'fanuc']) {
    for (const passes of [1, 2, 3]) for (const threadHand of controlSystemId === 'fanuc' ? ['right', 'left'] : ['right']) {
      const result = core.calculate({ ...seed, controlSystemId, threadHand,
        overrides: { ...seed.overrides, radialPasses: passes } }, data);
      assert.equal(result.canGenerateCncProgram, true);
      const endZ = controlSystemId === 'fanuc' ? fanucZ(result.cncProgram) : inspectKlartext(result.cncProgram).end[2];
      assert.ok(Math.abs(endZ) < 0.00001, `${controlSystemId}/${passes}/${threadHand}: ${endZ}`);
      if (controlSystemId === 'heidenhain') {
        const trace = inspectKlartext(result.cncProgram);
        assert.deepEqual(trace.issues, []);
        // Full-circle cuts of the same radial pass must advance 8 mm per axial cycle.
        const circles = trace.arcTrace.filter(a => a.angle === 360);
        assert.equal(circles.length, 10 * passes);
        for (let i = passes; i < circles.length; i++) {
          assert.ok(Math.abs(circles[i].z - circles[i - passes].z - 8) < 1e-9);
        }
      }
    }
  }
});

test('catalogue and boundaries: every accepted Klartext program passes independent command checks', () => {
  const samples = catalogueSamples(data, manifest);
  let passed = 0, rejected = 0;
  for (const { id, input } of samples) {
    const result = core.calculate(input, data);
    if (result.errors.length) {
      rejected++;
      assert.equal(result.canGenerateCncProgram, false, id);
      assert.equal(result.cncProgram.some(l => /CP IPA|G0[123]/.test(l)), false, id);
      continue;
    }
    assert.equal(result.canGenerateCncProgram, true, id);
    const trace = inspectKlartext(result.cncProgram);
    assert.deepEqual(trace.issues, [], id);
    assert.ok(Math.abs(trace.end[2]) <= 0.001001, `${id}: end Z ${trace.end[2]}`);
    passed++;
  }
  assert.equal(samples.length, 21926);
  assert.equal(passed, 21850);
  assert.equal(rejected, 76);
});

test('zero/negative radius and rounded-zero feed cannot produce a CNC program', () => {
  for (const [diameter, pitch, cutterDiameter, cuttingEdgeLength, flutes] of [
    [1.6, 0.4, 1.4, 5.6, 4], [1.05, 0.25, 0.92, 3.9, 3]
  ]) for (const controlSystemId of ['fanuc', 'heidenhain']) {
    const input = { ...seed, diameter, pitch, threadLength: cuttingEdgeLength, controlSystemId,
      overrides: { cutterDiameter, cuttingEdgeLength, flutes, radialPasses: 3 } };
    const invalid = core.calculate(input, data);
    assert.equal(invalid.canGenerateCncProgram, false);
    assert.match(invalid.errors.join(' '), /radial pass/);
    assert.equal(invalid.cncProgram.some(l => /CP IPA|G0[123]/.test(l)), false);
    assert.equal(core.calculate({ ...input, overrides: { ...input.overrides, radialPasses: 1 } }, data).canGenerateCncProgram, true);
    assert.equal(core.calculate({ ...input, programVariant: 'unknown-1-pass' }, data).canGenerateCncProgram, false);
    if (controlSystemId === 'heidenhain') assert.equal(core.calculate({ ...input, programVariant: 'lathe-normal-1-pass' }, data).canGenerateCncProgram, false);
    // Hidden template selection must not bypass validation.
    assert.equal(core.calculate({ ...input, programVariant: 'milling-micro-3-pass', overrides: { ...input.overrides, radialPasses: 1 } }, data).canGenerateCncProgram, false);
  }
  const slow = core.calculate({ ...seed, overrides: { ...seed.overrides, feedPerTooth: 0.0000001 } }, data);
  assert.equal(slow.canGenerateCncProgram, false);
  assert.ok(slow.errors.length);
});

test('command reader detects motion, feed and loop faults independently', () => {
  const lines = Array.from(core.calculate(seed, data).cncProgram);
  const changed = lines.map(l => l.includes('IZ+3.624') ? l.replace('IZ+3.624', 'IZ+3') : l);
  assert.ok(inspectKlartext(changed).issues.includes('end-Z-not-restored'));
  assert.ok(inspectKlartext(lines.map(l => l.replace(/ F\d+$/, ' F0'))).issues.includes('zero-feed'));
  assert.throws(() => inspectKlartext(lines.map(l => l.replace('Q2 + +1', 'Q2 + +0'))));
});

test('all reviewed reference corrections close Z, including forced templates and Fanuc left-hand milling', () => {
  const corrections = JSON.parse(fs.readFileSync(new URL('./cnc-reviewed-corrections.json', import.meta.url)));
  const ids = new Set(corrections.flatMap(e => e.cases));
  for (const id of ids) {
    const source = id.endsWith('.json')
      ? JSON.parse(fs.readFileSync(new URL('./golden/' + id, import.meta.url)))
      : oracle.cases.find(e => e.id === id);
    for (const threadHand of source.input.controlSystemId === 'fanuc' ? ['right', 'left'] : ['right']) {
      const result = core.calculate({ ...source.input, threadHand }, data);
      assert.equal(result.canGenerateCncProgram, true, id);
      if (source.input.controlSystemId === 'heidenhain') {
        const trace = inspectKlartext(result.cncProgram);
        assert.deepEqual(trace.issues, [], id);
        assert.ok(Math.abs(trace.end[2]) <= 0.001001, id);
      } else assert.ok(Math.abs(fanucZ(result.cncProgram)) <= 0.001001, `${id}/${threadHand}`);
    }
  }
});
