// A deliberately small independent reader for only the emitted Klartext subset.
// This traces commanded coordinates, not controller compensation or machine physics.
export function inspectKlartext(lines, threadHand = "right") {
  const commands = lines.map((line, i) => {
    const m = line.match(/^(\d+) (.*)$/);
    if (!m || Number(m[1]) !== i + 1) throw Error('Incorrect block number: ' + line);
    return m[2];
  });
  const labels = new Map();
  commands.forEach((line, i) => {
    const m = line.match(/^LBL (\d+)$/);
    if (m) {
      if (labels.has(m[1])) throw Error('Duplicate label');
      labels.set(m[1], i);
    }
  });
  const point = [0, 0, 0], q = {}, arcs = [], issues = new Set();
  let center, compensation = 'R0', steps = 0, lowestZ = 0;
  for (let pc = 0; pc < commands.length; pc++) {
    if (++steps > 100000) throw Error('Loop did not terminate');
    const line = commands[pc];
    if (/NaN|Infinity|\+\-/.test(line)) throw Error('Invalid numeric token');
    const feed = line.match(/\bF(-?\d+(?:\.\d+)?)\b/);
    if (feed && Number(feed[1]) <= 0) issues.add(Number(feed[1]) < 0 ? 'negative-feed' : 'zero-feed');
    if (/^TOOL CALL 1 Z S\d+$/.test(line)) {
      if (Number(line.match(/S(\d+)$/)[1]) <= 0) issues.add('zero-spindle');
    } else if (line === 'L M3') {
      // Spindle direction only.
    } else if (/^L (?:I[XYZ][+-]\d+(?:\.\d+)?\s*)+(?:(?:RL|RR|R0)\s*)?(?:F(?:MAX|-?\d+))?$/.test(line)) {
      const comp = line.match(/\b(RL|RR|R0)\b/);
      if (comp) compensation = comp[1];
      for (const m of line.matchAll(/I([XYZ])([+-]\d+(?:\.\d+)?)/g)) point['XYZ'.indexOf(m[1])] += Number(m[2]);
      if (line.includes('FMAX') && (Math.hypot(point[0], point[1]) > 0.002 || compensation !== 'R0')) issues.add('rapid-away-from-center');
    } else if (/^CC IX[+-]\d+(?:\.\d+)? IY[+-]\d+(?:\.\d+)?$/.test(line)) {
      const m = line.match(/^CC IX([+-][\d.]+) IY([+-][\d.]+)$/);
      center = [point[0] + Number(m[1]), point[1] + Number(m[2])];
    } else if (/^CP IPA[+-]\d+(?:\.\d+)? IZ[+-]\d+(?:\.\d+)? DR[+-](?: F-?\d+)?$/.test(line)) {
      const m = line.match(/^CP IPA([+-][\d.]+) IZ([+-][\d.]+) DR([+-])/);
      if (!center) throw Error('Arc without center');
      const angle = Number(m[1]), dz = Number(m[2]);
      if ((angle > 0 ? '+' : '-') !== m[3]) issues.add('angle-direction-mismatch');
      if (angle <= 0 || (threadHand === 'left' ? dz >= 0 : dz <= 0)) issues.add('incorrect-thread-hand');
      if (compensation !== 'RL') issues.add('incorrect-radius-compensation');
      const dx = point[0] - center[0], dy = point[1] - center[1];
      const radius = Math.hypot(dx, dy);
      if (radius <= 0) issues.add('zero-radius');
      const radians = angle * Math.PI / 180;
      point[0] = center[0] + dx * Math.cos(radians) - dy * Math.sin(radians);
      point[1] = center[1] + dx * Math.sin(radians) + dy * Math.cos(radians);
      point[2] += dz;
      arcs.push({ angle, dz, radius, x: point[0], y: point[1], z: point[2] });
    } else if (/^FN 0: Q\d+ =[+-]\d+$/.test(line)) {
      const m = line.match(/^FN 0: Q(\d+) =([+-]\d+)$/);
      q[m[1]] = Number(m[2]);
    } else if (/^FN 1: Q\d+ =[+]Q\d+ [+] [+]1$/.test(line)) {
      const m = line.match(/^FN 1: Q(\d+) =[+]Q(\d+) [+] [+]1$/);
      if (!Number.isFinite(q[m[2]])) throw Error('Counter uninitialized');
      q[m[1]] = q[m[2]] + 1;
    } else if (/^FN 12: IF [+]Q\d+ LT [+]Q\d+ GOTO LBL \d+$/.test(line)) {
      const m = line.match(/^FN 12: IF [+]Q(\d+) LT [+]Q(\d+) GOTO LBL (\d+)$/);
      if (!Number.isFinite(q[m[1]]) || !Number.isFinite(q[m[2]]) || !labels.has(m[3])) throw Error('Invalid loop reference');
      if (q[m[1]] < q[m[2]]) pc = labels.get(m[3]);
    } else if (!/^LBL \d+$/.test(line)) throw Error('Unknown syntax: ' + line);
    lowestZ = Math.min(lowestZ, point[2]);
  }
  if (compensation !== 'R0') issues.add('compensation-not-cancelled');
  if (Math.hypot(point[0], point[1]) > 0.002) issues.add('end-not-at-center');
  // Tolerances include accumulated 0.001 mm block rounding, not arbitrary motion differences.
  const zTolerance = 0.002 + arcs.length * 0.0005;
  if (Math.abs(point[2]) > zTolerance) issues.add('end-Z-not-restored');
  return { issues: [...issues], end: point, lowestZ, arcs: arcs.length, arcTrace: arcs, steps };
}

