# What belongs in the public SmiProg project

Policy adopted 2026-11-05. SmiProg shares the finished customer application and
the documentation needed to use, understand, verify and adapt it. Internal
research and business records are maintained in a separate private repository.

## Why SmiCut publishes SmiProg

Open code and clear calculation references help customers assess recommendations,
help distributors use the app, and allow independent review and improvements.
The business aim is to support informed tool selection and use of SmiCut tools.
Adoption, useful distributor integrations and relevant enquiries matter more than
download counts alone. These benefits are aims, not measured sales guarantees.

The complete HTML download already contains the calculation code and runtime
tables. Hiding only the explanatory documents would not make that delivered
logic confidential. Public documentation should explain the released behavior
and its limits accurately.

## Publication boundary

| Material | Default destination |
|---|---|
| Released HTML, application source and distributable runtime data | Public |
| Released translations and the generation inputs needed to maintain them | Public, after checking for internal notes or hidden data |
| Formulas, assumptions, validation rules and examples for released functions | Public |
| Tests and fixtures for released behavior | Public, using synthetic or approved non-confidential data |
| Installation, customization and contribution guides | Public |
| Unreleased prototypes, experiments, internal reviews and product plans | Private until selected and approved for publication |
| Raw customer trials, customer records and confidential supplier information | Private |
| Confidential purchase costs, margins, discounts and commercial terms | Private |
| Credentials, backend secrets and operational access details | Private; never embed them in client HTML |
| Third-party source documents, images and datasets | Review redistribution rights before including them |

A reference to an external catalogue does not automatically permit copying its
contents into this repository. Include only material SmiCut has the right to
redistribute, with applicable notices. Internal file paths, personal review notes
and unpublished source attachments are not needed merely to explain a formula.

This policy concerns SmiProg. It does not change separately approved publication
decisions for other SmiCut products.

## Explain performance claims precisely

Separate catalogue values, derived calculations, engineering assumptions and
measured results. Compare examples must identify tool geometry, cutting data,
radial/axial passes, tool life, reference price and machine rate. Estimated time
or cost differences are not promises of savings on every machine. CNC software
checks are not physical machining trials or controller certification.

SmiProg's reference tool prices were explicitly approved for public distribution.
They remain public and editable; they are not confidential purchase prices,
distributor terms or current quotations. Compare's `XL` code is a UI convenience,
not access control. Do not add confidential prices to its client-side data.

## License and branding

The project remains under [MIT](../LICENSE). Commercial adaptation and private
modifications are allowed; sharing improvements back is optional. Copyright and
license notices must be preserved. Visible SmiCut branding is not required in a
customized app; see [customization](../REBRANDING.md). Open distribution therefore
does not guarantee brand exposure or contributions back to SmiCut.

Access to SmiCut's hosted AI service remains separate from the software license.
See [Material Selector access](../MATERIAL_SELECTOR.md).

## Before publishing a change

1. Check that each file serves the released application or has been deliberately
   approved for public release. Keep other development material in the private
   workspace; a branch or folder in this repository is still public.
2. Review the exact staged diff, attachments, spreadsheet sheets/comments and
   generated outputs for confidential information and redistribution rights.
3. Use approved or synthetic examples. Remove private provenance details while
   retaining useful public sources and calculation assumptions.
4. Update the relevant references and run checks appropriate to the change.
5. Review release assets as well as source files. Publish only the intended files;
   never upload an entire working folder or internal archive.

## Material that was already public

Moving or deleting a file changes the current file tree; it does not erase Git
history, old releases, forks or downloaded copies, and does not retract prior
license grants. Treat previously public material as potentially retained elsewhere.
The public reference collection covers released behavior. Historical workbooks,
internal audits, development plans and draft translations remain private. The
published regression fixtures and original tool images are retained because they
support reproducible verification and image builds. This policy does not rewrite
public history or claim previously distributed material is now confidential.

If a credential or genuinely sensitive record is discovered, report it through
[the security process](../.github/SECURITY.md). Assess revocation and coordinated
removal separately; an ordinary file move is not a security remedy.

References: [MIT license guidance](https://choosealicense.com/licenses/mit/),
[GitHub's history-removal guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository),
[WIPO on protecting trade secrets](https://www.wipo.int/en/web/trade-secrets/protection).
