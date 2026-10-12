# Golden fixtures

These preserved reference fixtures were exported from SmiCut's original Excel
calculations. Run `node run-golden-tests.mjs` from `apps/web`.

Cached fixtures preserve template output. Recalculated fixtures and the separate
native Excel oracle cover selected recalculated inputs. They do not establish
correctness for every possible input or controller. Do not replace oracle values
with application output merely to make a test pass.

The historical Excel workbooks and Mac-specific Excel automation are retained
internally. All fixtures needed to run the public test suite are included here.
