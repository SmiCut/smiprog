export function catalogueSamples(data, manifest) {
const samples = [];
for (const entry of manifest.cases.filter(e => e.input.processId === 'machining-center' && e.group !== 'invalid-inputs')) {
  samples.push({ id: 'reference-input-' + entry.id, input: { ...entry.input, controlSystemId: 'heidenhain' } });
}
const tools = data.tools.filter(t => t.typeCode && t.threadProfileCode && t.cutterDiameter && t.pitch && t.minThreadDiameter);
for (const tool of tools) {
  const profile = data.threadProfiles.find(p => p.excelId === tool.threadProfileCode);
  for (const material of data.materials) {
    samples.push({ id: `catalogue-${tool.id}-${material.id}`, input: {
      processId: 'machining-center', controlSystemId: 'heidenhain', threadProfileId: profile.id,
      materialId: material.id, diameter: tool.minThreadDiameter, pitch: tool.pitch,
      threadLength: tool.cuttingEdgeLength, safetyDistance: 2, selectedToolId: String(tool.id), overrides: {}
    } });
  }
  for (const passes of [1, 2, 3]) for (const factor of [0.999, 1, 1.001, 2]) {
    samples.push({ id: `boundary-${tool.id}-${passes}-${factor}`, input: {
      processId: 'machining-center', controlSystemId: 'heidenhain', threadProfileId: profile.id,
      materialId: 'material-14', diameter: tool.minThreadDiameter, pitch: tool.pitch,
      threadLength: tool.cuttingEdgeLength * factor, safetyDistance: 2, selectedToolId: String(tool.id),
      overrides: { cutterDiameter: tool.cutterDiameter, cuttingEdgeLength: tool.cuttingEdgeLength, flutes: tool.flutes, radialPasses: passes }
    } });
  }
}

return samples;
}
