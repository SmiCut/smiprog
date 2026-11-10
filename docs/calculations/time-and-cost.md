# Machining time and Compare costs

Reviewed against SmiProg v1.0.0, source commit `283519f`, on 2026-11-05.
English is the only released locale. See the [reference map](README.md).

## What the time means

SmiProg preserves an Excel-derived estimate of time to mill one thread. It is
not calculated by simulating every emitted CNC block. It does not model a complete
machine cycle with setup, tool changes, positioning between holes or actual
acceleration/controller behavior. Changes to explicit CNC templates or controller
selection need not change this estimate. Compare uses the same core time result.

## Calculation order and rounding

Let D be thread diameter, P program pitch, Vr rounded feed at thread diameter
(mm/min), and H = 0.54 × P. Timing pass diameters are:

- One radial pass: D.
- Two: `round(D - 2 × 0.33 × H, 2)`, D.
- Three: `round(D - 2 × 0.5 × H, 2)`, `round(D - 2 × 0.2 × H, 2)`, D.

The core sums `287 × passDiameter / Vr` over these diameters. For multiple radial
passes it rounds the sum to two decimals; for one pass it retains the sum.
It then multiplies by the normal axial count from `getAxialPasses(..., 10)`.
The factor 287 is an inherited model constant, not a newly derived universal
motion formula.

For micro tools, the model divides that intermediate result by the normal axial
count when cutting-edge length was explicitly overridden, then multiplies by
`(microAxialPasses + 0.52) × 0.657`. These legacy factors preserve reference
behavior. The result is rounded to whole seconds when >= 10 seconds, otherwise
to one decimal. Costs use this already-rounded time, not a hidden unrounded time.

Changing radial passes can also change recommended feed per tooth, so time is
not simply proportional to pass count. Compare equal inputs and state the actual
speed/feed overrides when describing a tool advantage.

## Cost model

Let t be core machining time (seconds), price the effective tool price in the
selected currency, life tool life in minutes, and rate the machine cost per hour
in that same currency:

```
threadsPerTool = life × 60 / t
toolingCostPerThread = price / threadsPerTool
machineCostPerThread = rate × t / 3600
totalCostPerThread = toolingCostPerThread + machineCostPerThread
```

Core defaults are 120 minutes tool life and EUR 80/hour machine cost when omitted.
Life must be positive; price and rate must be nonnegative. Zero price is a valid
explicit override. In Compare, an empty price falls back to an available catalogue
reference only. Locked EUR prices, missing references and custom tools have no
fallback price: tooling and total costs stay unavailable, but time and machine
cost can still be compared. Never treat an unavailable price as zero.
These are scenario inputs, not measured tool life or a quotation. No extra setup,
scrap or tool-change cost term is added; a user's hourly rate may include their
own overhead allocation.

The Swedish UI uses SEK and defaults to 900 kr/hour; other languages use EUR and
80 EUR/hour. Swedish reference prices follow the supplied catalogue conversion:
round the EUR price to cents, then `floor((cents * 108 + 500) / 1000)` gives whole
SEK. This is a fixed catalogue rule, not a live exchange rate. Own prices and
machine rates are stored separately by currency. `XL` reveals EUR references;
Swedish references are visible directly. All of these values remain public data.

### Preserved reference example

The existing `compare-cost-0-normal` fixture uses:

| Input/result | Tool A | Tool B |
|---|---:|---:|
| Core time | 97 sec | 123 sec |
| Tool price | EUR 210.90 | EUR 232.10 |
| Tool life | 120 min | 120 min |
| Machine rate | EUR 80/hour | EUR 80/hour |
| Tooling cost/thread | EUR 2.8412917 | EUR 3.9650417 |
| Total cost/thread | EUR 4.9968472 | EUR 6.6983750 |
| Displayed total | EUR 5.00 | EUR 6.70 |

This verifies the calculation against the preserved Excel cost scenario; it is
not evidence of measured production savings. Compare renders costs to two decimals.
For a value B relative to A, the percentage is `round((B / A - 1) × 100)`;
the opposite column uses the opposite baseline. Percentages are therefore not
symmetric. A zero or nonfinite baseline suppresses the percentage.

## Public data and verification

Reference prices and `XL` are public. The unlock code is not authentication;
never put confidential customer terms or purchase costs into the HTML or CSV.
The [publication policy](../publication-policy.md) preserves SmiCut's explicit
approval of public editable reference prices while keeping confidential business
data private.

`npm run test:compare-cost` checks 18 preserved native Excel A/B cost scenarios,
shared timing provenance, zero/empty distinctions and invalid values. The golden
and Excel-parity suites check timing, while the browser Compare verifier checks
display, overrides and copying. Original Excel workbooks remain internal; do not
regenerate expected results from the app to conceal a regression.
