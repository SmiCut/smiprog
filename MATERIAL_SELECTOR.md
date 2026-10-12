# Material Selector: access for your website

Material Selector is the optional AI assistant in SmiCalc and SmiProg. It helps
identify a material and recommends a category for the calculators.

**To use SmiCut's Material Selector on your website, email
[oliver@smicut.se](mailto:oliver@smicut.se?subject=Material%20Selector%20website%20access).**
SmiCut approves the website address. You do not need an API key or an AI account.

## 1. Send your request

Include:

- Your company name.
- The full HTTPS website address where the app will run.
- Any additional addresses you use, including `www` or a separate testing website.
- Whether you use SmiCalc, SmiProg, or both, and the language version.

You can copy this message into an email:

> Subject: Material Selector website access
>
> Hello Oliver,
>
> We would like to use Material Selector with SmiCalc / SmiProg.
>
> Company:
>
> Website address(es):
>
> Program and language:
>
> Please approve these website addresses and confirm when access is ready.

This is a manual approval process. Access is for material selection within the
approved SmiCalc or SmiProg installation, including versions adapted to your brand.
Use in other applications requires separate agreement with SmiCut.

## 2. Publish the app and wait for confirmation

Install the downloaded app on the website addresses you requested. Follow this
project's README for standalone hosting or WordPress installation.

SmiCut will confirm by email when the addresses are enabled. The published apps
already connect to SmiCut's material service, so no API key needs to be inserted
and no connection code needs to be changed.

Approval applies to the exact website address (protocol, hostname and port).
`https://example.com` and `https://www.example.com` are separate addresses; request
both if the app is served from both. Pages on the same address share the approval.
If you move to a new domain, email Oliver before switching.

## 3. Try Material Selector

Open the installed app on your approved website, open Material Selector, and enter
a material such as `316L`. Select the recommended category to use it in the app.

Internet access is required for Material Selector. Opening an HTML file directly
from your computer does not enable access to SmiCut's AI service. The calculators
still work without it: select the material category manually.

## If it does not work

- **Website not approved / connection error:** check the exact address and ask
  Oliver to confirm it is enabled. A browser may show only a connection error
  when the website has not been approved.
- **Too many requests:** the service retains a limit of 30 requests per minute
  per IP address. Wait about one minute and try again. Visitors sharing a public
  IP address share this limit. There is no daily or monthly application quota.
- **Service temporarily unavailable:** use manual material selection and try
  again later. Email Oliver if the problem persists.

When asking for help, include the website address, program, language and error
message. Do not send passwords or AI-provider API keys.

## Software license and AI service

The software is available under MIT. You can use and adapt it without requesting
AI access, and you can remove visible SmiCut branding while retaining the required
license notices. Approval for the hosted Material Selector is separate from MIT.

The app sends the material question, interface language and recent chat history
to SmiCut's server, which uses an AI provider to prepare the answer. Do not include
confidential information in material questions.

If you prefer your own compatible material service, see
[the developer instructions](docs/development.md). SmiCut's AI-provider key stays
on SmiCut's server and is never shared with resellers or included in the app.
