# CNC motion calculations and verification

## Scope

The 2026-10-12 corrections cover axial and tapered **machining-center milling**
in the Heidenhain Klartext and Fanuc / ISO IJK posts. Radial geometry/feed
validation applies to both posts, including explicitly selected templates.
Heidenhain supports right- and left-hand vertical milling; lathe requests are blocked. Its release metadata is `released` for this scope.
Fanuc lathe motion formulas are outside this correction's scope.

## Axial loops and flank infeed

Let `P` be the program pitch, `L` thread length, `S` safety distance, `N` the
number of axial cycles, and `A` the existing axial step. Values below use the
actual rounded CNC increments, in mm.

- Lead-in/out rise: `h = round(P / 8, 3)`.
- Rise per radial cutting pass: `T = 2h + P`.
- Flank shift between radii: `c[i] = radialStockChange[i] × tan(halfAngle)`,
  rounded to 0.001 mm, with the final shift taking the remainder so the shifts
  sum to the rounded total `C`.
- Initial depth: `D = round(L + S - C, 3)` for right-hand milling;
  Both posts use left-hand depth `D = round(L + S - C - T, 3)`.
- Between radial passes: `-T - c[i]` for right-hand, `+T - c[i]` for left-hand.
- At the end of each axial cycle: `A + C - T` for right-hand,
  `A + C + T` for left-hand.
- After all cycles: `D - N × A`.

Each cycle now advances by exactly `A`. The complete Z sum is
`-D + N × A + (D - N × A) = 0`, within block rounding.
The flank shift is restored at the bore center before the next cycle; the
change does not add an arbitrary final move to conceal drift between cycles.
Explicit axial templates use their actual radial pass count for the initial
flank shift, rather than an unrelated calculated pass count.

The native Excel `heidenhain-axial-length-100` example (diameter 16, pitch 4,
length 100, cutter 11, cutting edge 8, three radial and ten axial passes) used:

`-101.376 + 10 × 7.376 + 22 = -5.616 mm`.

The corrected cycle closes with `+3.624` instead of `+3`, and the final rapid
is `+21.376` instead of `+22`:

`-101.376 + 10 × 8 + 21.376 = 0 mm`.

The preserved Fanuc Excel reference has the same original drift. Both milling
posts are corrected, and Fanuc left-hand loop closure is tested separately.

## Tapered milling

Four quarter-circle rises are emitted, so actual pass travel is
`2 × round(P / 8, 3) + 4 × round(P / 4, 3)`.
Retraction now uses that rounded travel and each individual inter-pass flank
shift. Reusing the first shift for both transitions in a three-pass program
caused additional Z drift. Initial depth also uses the template's actual pass
count. XY geometry is unchanged by this correction.

## Rejected pass combinations

For every actual radial pass diameter `d` and cutter diameter `Dc`, require:

- Rounded lead radius `round((d - Dc) / 4, 3) > 0`.
- Rounded center feed `round(feedAtThreadDiameter × (d - Dc) / d) > 0`.
- Rounded lead feed `round(centerFeed / 2) > 0`.
- Positive rounded spindle speed.

Invalid combinations return an actionable error and no CNC motion, even when
the final thread diameter is larger than the cutter. Changing to fewer radial
passes or a smaller cutter may resolve a geometry failure. Feed values are not
clamped to hide impossible geometry. Existing calculated data may still be
returned, but the CNC availability flag is false and no cutting code is emitted.

## Independent checks and Excel comparison

Run `npm run test:cnc-motion`. A small independent command reader executes the
emitted Klartext subset, including Q loops, incremental coordinates and circles.
It checks loop termination, block numbering, circle direction, positive feeds
and radii, compensation state, bore-center rapids and return to the initial Z.
It is **not** a controller emulator, physical tool-radius compensation model,
collision check or machine certification.

The catalogue matrix runs 21,926 inputs for each thread hand: 43,852 cases,
43,700 accepted programs and 152 rejected boundary combinations. It spans 519 catalogue tools, custom tools,
30 materials and eight thread profiles. All accepted programs close nominal Z
within 0.001 mm; these are software checks, not newly calculated Excel results.
An independent Fanuc loop reader checks the affected axial scenarios for both
thread hands, and the Klartext checks verify the 8 mm cycle spacing of the
original failing example. Deliberately corrupted code must fail these readers.

The 57 golden fixtures and 153 native Excel cases remain unchanged. Intentional
Z corrections are listed in `apps/web/tests/cnc-reviewed-corrections.json`,
keyed by full reference-program SHA-256 and exact before/after blocks. The
comparison allows only those listed changes plus the existing display fixes;
there is no general tolerance for changed CNC motion. `npm test` runs both
reference comparisons and independent motion regression tests.


## Heidenhain left-hand milling (v0.1.2)

Left-hand output follows the established Fanuc milling strategy: M3 spindle,
counterclockwise arcs (`IPA+`, `DR+`), `RL` radius compensation and negative
incremental Z during each helical cut. This is the downward/climb-milling
strategy for a right-hand cutter, not the alternative upward/clockwise strategy.
The internal-thread helix table in the [HEIDENHAIN iTNC 530 manual, section 6.5](https://content.heidenhain.de/doku/tnc_guide/pdf_files/iTNC530/340490-01/en/533_190-20.pdf)
identifies the combination Z− / DR+ / RL as left-hand.

Normal, axial and tapered programs use the same start depth, inter-pass offsets
and final retract formulas as Fanuc. In micro programs, let `T = 2h + N × P`
and `B = round(L + S - C, 3)`. Left-hand initial depth is `B - T`, inter-pass
retraction is `+T`, and the final retract is `+B`; all helix increments are
negative. Tapered output retains the existing Fanuc quarter-arc center offsets
and feed strategy; this change does not redesign or independently certify the
underlying tapered machining strategy.

Tests compare all twelve left-hand templates (normal, axial, micro, tapered;
one, two and three radial passes) against Fanuc's programmed Z increments,
relative arc-center offsets, feeds, compensation and loop controls. The
independent Klartext reader executes both hands and checks signed helicity,
loop termination, positive radii/feeds, center returns and Z closure. Browser
tests cover selecting left-hand, rendered CNC, copying and switching back to
right-hand on desktop and mobile.

Existing right-hand Excel references are unchanged. There is no newly captured
native Excel oracle for Heidenhain left-hand output. Software test coverage is
not controller or physical tool-compensation verification; the `released` status describes product availability within the supported
vertical-milling scope, not physical machine certification.
