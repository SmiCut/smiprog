# Golden fixtures

These preserved reference fixtures were exported from SmiCut's original Excel
calculations. Run `node run-golden-tests.mjs` from `apps/web`.

Cached fixtures preserve template output. Recalculated fixtures and the separate
native Excel oracle cover selected recalculated inputs. They do not establish
correctness for every possible input or controller. Do not replace oracle values
with application output merely to make a test pass.

The historical Excel workbooks and Mac-specific Excel automation are retained
internally. All fixtures needed to run the public test suite are included here.

The published v1.0.0 reference set has 57 golden cases, complemented by 153 native
Excel parity cases and 18 A/B cost scenarios outside this folder. Historical
filenames such as `cached` and `recalc` identify evidence types, not release status.
See [the reference map](../../../../docs/calculations/README.md) and
[CNC deviations and verification](../../../../docs/calculations/cnc-motion-and-validation.md).
Selected fixtures remain public under the [publication policy](../../../../docs/publication-policy.md);
original workbooks and internal customer evidence do not become public merely
because a regression example is needed.
