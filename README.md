# Benefit Atlas — PSHCP Explorer

A lightweight, accessible, privacy-first web app that helps people explore **Public Service Health Care Plan (PSHCP)** benefits without digging through a long PDF.

> Independent informational tool. Not affiliated with the Government of Canada, the PSHCP, Canada Life or MSH International. The booklet is a summary; the PSHCP Directive controls if there is a discrepancy. **No live coverage verification or account balances.**

## Features

- Search by procedure, provider, equipment, or everyday term.
- Filter by benefit category and **Supplementary** vs. **Comprehensive** Coverage.
- See eligible expense limits, benefit periods, reimbursement rates, and special conditions.
- Open a specific **printed source page** in the official Member Booklet PDF from each benefit.
- Optional, clearly qualified reimbursement **illustration** for simple numeric eligible expense caps.
- Know which claims generally go to **Canada Life** vs **MSH**.
- Fully static: no login, database, API keys, analytics, cookies, or data transmission.
- Keyboard-friendly layout with semantic controls, focus indicators and reduced-motion support.

## Quick start

No dependency installation is required.

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. You can also open `index.html` directly in a modern browser. Run data and calculation tests with:

```bash
npm test
```

## Create and publish the GitHub repository

With [GitHub CLI](https://cli.github.com/) installed and `gh auth login` complete, run from this project folder:

```bash
./publish-github.sh private
```

This initializes Git if necessary, commits the project, and creates/pushes the repository to the **currently authenticated GitHub account**. Use `./publish-github.sh public` instead only when you are ready to publish. You must have Git author name/email configured. An existing repo with the same name will make the command fail rather than overwrite it.

If you do not want to use GitHub CLI, create an empty repository at https://github.com/new and use **Add file → Upload files** to upload the unzipped contents.

## GitHub Pages deployment

Repository: https://github.com/uditkumar123/pshcp-benefit-explorer

**Deployment configuration (one-time, performed in GitHub):**

1. Open https://github.com/uditkumar123/pshcp-benefit-explorer/settings/pages
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/ (root)**, then **Save**.
4. Once GitHub reports the deployment as successful, open:
   **https://uditkumar123.github.io/pshcp-benefit-explorer/**

The site uses relative asset paths and needs no build pipeline or server. Every subsequent push to `main` triggers a new Pages deployment automatically. The `.nojekyll` file keeps the deployment fully static.

**Before sharing widely:** Confirm the Pages deployment succeeds, browse the app on desktop and mobile, test filters/search/calculation examples, check source links, and independently review the benefit details against the official plan terms. GitHub Pages is public hosting; do not add private member data or credentials.

**Troubleshooting:** A 404 before activation means Pages may not yet be enabled or its deployment has not succeeded. Check **Actions** or the Pages settings for the deployment status.

## Files

| Path | Responsibility |
|---|---|
| `index.html` | Semantic, accessible interface |
| `styles.css` | Responsive visual design |
| `app.js` | Filters, search, cards and interaction |
| `logic.js` | Pure testable calculations |
| `data.js` | Curated, page-referenced benefit entries |
| `tests/` | Data-integrity and behaviour tests |

## Data source and scope

**Primary source:** *Public Service Health Care Plan Member Booklet*, **November 2026**, provided for project development. Each entry links to the corresponding **printed page**, including the summary of maximum eligible expenses on pp. 80–85 and specific benefit details.

- Official booklet: https://www.canadalife.com/content/dam/rfp/welcome-sites/pshcp/PSHCP-member-booklet.pdf
- Governing Directive: https://www.njc-cnm.gc.ca/directive/d9/v283/en
- Canada Life member service: https://www.welcome.canadalife.com/pshcp
- MSH claims portal: https://pshcp-msh.ca/

**Careful interpretation:** A `$500` maximum generally refers to **eligible expenses** before 80% reimbursement, not a $500 payment. An estimate assumes eligible charges within Reasonable and Customary limits, no coordination of benefits, sufficient remaining limit, and no exclusion or authorization issue. The app does not determine individual eligibility, provider credentials, prescription requirements or current balances.

**Curation:** The directory is broad but not exhaustive. It should not be represented as all PSHCP benefits, nor as an official decision engine. Special rules include shared caps, frequency limits, dependant-specific conditions, and differences between employee and pensioner Comprehensive Coverage.

## Updating coverage data

Edit `data.js` and record:

1. The original wording/limit and printed booklet page(s).
2. Whether the limit is dollar-based **eligible expenses** or a frequency restriction.
3. Whether it is per person, shared across practitioners, per calendar year, lifetime, or a rolling-month period.
4. Applicability to Supplementary/Comprehensive Coverage and any pensioner exceptions.
5. Any authorization/documentation requirements, and whether the reimbursement illustration is safe to show.

Run `npm test` after changing data. Changes to the Directive and updates to the insurer's Reasonable and Customary charges are **not automatically synced**.

## Next steps before a public launch

- Have a benefits subject-matter expert audit all data entries and exceptions against the Directive.
- Test the experience with a screen reader, keyboard only, and mobile zoom at 200%/400%.
- Add the French experience using approved, reviewed translations (the prototype is English-only).
- Set up an owner and cadence for booklet updates, monitor broken source links, and add visible revision notes.
- Do not collect personal plan numbers, certificate numbers or health information without a proper privacy/security review.

## License

MIT for the original app code. Official PSHCP documents and government/insurer names remain with their respective rights holders. The original source PDF is deliberately **not bundled** in this repository.
