# Cutting data and tool inputs

Reviewed against SmiProg v1.0.0, source commit `283519f`, on 2026-11-05.
English is the only released locale. See the [reference map](README.md).

## Inputs and effective tool

The core takes process, controller, thread profile/hand, material, thread diameter,
pitch or TPI, thread length, safety distance and selected tool. Compare calculates
two tool scenarios with common operation inputs and separate tool/cutting overrides.
Catalogue candidates are selected by `filterTools`; custom dimensions are a
separate path. Keep the catalogue rules and canonical material IDs in the source.

For the metric profile (`excelId = 1`), program pitch P is the entered mm pitch.
Other profiles convert TPI to `round(25.4 / TPI, 3)` mm. Diameter and length must
be positive; safety distance must be nonnegative. The cutter must be smaller
than the thread diameter, and every actual CNC pass must also pass geometry checks.

A laser-marked diameter replaces the catalogue cutter diameter only: article,
cutting length, flutes and product link remain those of the selected tool. Empty,
invalid, nonpositive or above-catalogue diameter blocks CNC in the interface.
Tool changes/reset restore the catalogue value. Custom tools use their own
complete geometry instead of this catalogue-only upper bound.

## Speed and feeds

Let Dc be effective cutter diameter (mm), D thread diameter (mm), z flutes,
Vc effective cutting speed (m/min) and fz effective feed/tooth (mm/tooth).

```
n = round(Vc × 1000 / (pi × Dc))             # rpm
Vthread = round(fz × z × n)                 # mm/min
Vcenter = round(Vthread × (D - Dc) / D)      # mm/min
```

Rounding happens at each step, as in the current core; do not substitute an
unrounded spindle speed when reproducing reference results. Valid positive
speed/feed overrides replace recommendations. The effective marked diameter
therefore influences spindle speed, feeds, path geometry, timing and CNC.

Recommended fz uses the material feed factor, cutter-diameter floor lookup
`F3_TABLE`, the appropriate geometry matrix and radial-pass factor (1, 1.6 or 2
for one, two or three passes). Geometry considers thread height `0.54 × P`,
effective cutter diameter, available cutting length and the applicable edge-length
factor; the designated pipe profiles apply a 0.67 factor. Micro tools use their
separate geometry matrix. See `getGeometryFactor`, `getMicroGeometryFactor` and
`getFeedPerTooth` for exact lookup boundaries and constants.

## Passes

For non-micro tools, load = material feed factor × geometry factor:

| Load | Recommended radial passes |
|---|---:|
| >= 0.55 | 1 |
| >= 0.35 and < 0.55 | 2 |
| < 0.35 | 3 |

Micro tools default to one radial pass. Valid own radial passes select 1–3 and
change the recommended feed-per-tooth pass factor unless feed is also overridden.
These are thread-milling rules, not SmiCalc's FourCut thread-turning reduction.

Normal axial passes use usable edge length `edge + 0.001`, axial move
`max(1, floor(usable / P)) × P`, and increment the count when thread length reaches
each threshold, up to the implemented limit of ten. This is a model limit, not
a promise that arbitrary extra-long threads are suitable. Micro tools are type 2
or have rounded cutting length equal to rounded P; their axial revolution count
is `max(1, floor(length / P - 0.001) + 1)`.

## CNC availability and output

A final thread diameter larger than the cutter is not sufficient: intermediate
radial passes can still have an impossible lead radius or rounded zero feed.
The [CNC reference](cnc-motion-and-validation.md) describes rejection rules,
controller scope and the normal, axial, micro and tapered template families. Cutting data may be
available while CNC generation is blocked; do not interpret an available estimate
as approval of the machine program.

The interface shows recommendations alongside own values. Copying uses the
current calculated output. Calculator and Compare browser verifiers exercise
resetting, marked diameter, invalid input and copying. See [time/cost](time-and-cost.md)
for precision and assumptions used after the cutting-data calculation.
