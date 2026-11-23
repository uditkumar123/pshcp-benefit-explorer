# Benefit Atlas — PSHCP Explorer

A lightweight, accessible, privacy-first web app that helps people explore **Public Service Health Care Plan (PSHCP)** benefits without digging through a long PDF.

> Independent informational tool. Not affiliated with the Government of Canada, the PSHCP, Canada Life or MSH International. The booklet is a summary; the PSHCP Directive controls if there is a discrepancy. **No live coverage verification or account balances.**

## Usage tracker (version 4)

Use **My usage** to add the **amount eligible** from a processed Canada Life claim. Each tracked benefit shows a bar for used versus remaining eligible expense, the remaining eligible amount, and what that remainder could still reimburse at the standard rate.

- Entries are saved only in this browser (`localStorage`), with no account, plan number, member ID or claim details. Use **Clear all my entries** to remove them.
- **Save to file** downloads a small JSON backup; **Load from file** restores it in another browser or device. Imports are validated and unknown benefits or invalid amounts are skipped.
- Only dollar-based limits can be shown as a bar. Frequency limits (for example, one CPAP device every 60 months) and per-day hospital amounts are not tracked.
- These figures are your own notes, not an official balance. The claim decision and remaining balance come from Canada Life or MSH.

## Guided issue finder (version 3)

Use **What do you need help with?** to describe an issue (for example `back pain`, `anxiety`, `foot pain`, or `sleep apnea`) or choose a topic button. The interface offers **possible benefit categories to explore**, not medical diagnoses, prescriptions, coverage approvals, or personalized eligibility determinations.

- Suggestions use a fixed, inspectable topic-to-benefit map in `guide.js`, not an AI service, with no server-side collection of the issue text.
- Every suggested service links back to the source-backed benefit card and page references.
- Explains **separate limits** (e.g. massage therapy and physiotherapy) versus **shared limits** (psychological providers: $5,000; eligible podiatry/chiropody/foot care: $500; speech-language pathology and audiology: $750, per calendar year).
- Maximum eligible expenses are **not** guaranteed reimbursements. Most listed practitioner services reimburse 80% of the eligible expense, subject to reasonable and customary fees and plan restrictions.
- Unrecognized queries explicitly return no match and encourage browsing instead of guessing.
- Run `npm test` for coverage of the topic mappings and existing app features.

**Source:** Public Service Health Care Plan Member Booklet (November 2026), printed pp. 39–42 and 80–81, plus applicable individual benefit pages. The PSHCP Directive remains authoritative.

## Other features

- **Search-first home page:** start with a service or common term instead of browsing a long booklet.
- **Relevance-ranked search:** direct benefit names and aliases come first, common misspellings are tolerated, and a no-match search can jump straight to the issue finder with the same wording.
- **Popular benefit shortcuts:** open frequently used entries directly.
- **Focused detail panel:** a **Before you spend** summary puts the limit type, reset period, documents and claim destination ahead of the calculator.
- **Claim routing:** a table and per-benefit guidance show whether a claim goes to Canada Life or MSH, including travel emergencies and Comprehensive Coverage abroad.
- **Usage tracker:** optional local bars for used versus remaining eligible expense, based on amounts you enter, with a JSON backup you can save and reload.
- **Local, optional calculator:** enters estimated eligible expense and previously used eligible expense cap, with caveats.
- **Manageable result list:** initially shows 9 benefits with “Show more” and accessible category filters.
- **Shareable deep links:** `?benefit=psychological` opens a specific benefit.
- Search by procedure, provider, equipment, or everyday term.
- Filter by benefit category and **Supplementary** vs. **Comprehensive** Coverage.
- See eligible expense limits, benefit periods, reimbursement rates, and special conditions.
- Open a specific **printed source page** in the official Member Booklet PDF from each benefit.
- Optional, clearly qualified reimbursement **illustration** for simple numeric eligible expense caps.
- Know which claims generally go to **Canada Life** vs **MSH**.
- Fully static: no login, database, API keys, analytics or cookies. Optional usage entries stay in this browser and are never transmitted.
- Keyboard-friendly layout with semantic controls, focus indicators and reduced-motion support.

## Quick start

Use Node.js 22 (with npm), the same major version used by the deployment workflow. No packages or Python installation are required. On Windows, macOS, or Linux, run:

```bash
npm start
```

Open http://127.0.0.1:4173/. The preview server listens only on this computer and serves only the app's public files. If the port is busy, use `npm start -- 4180` and open http://127.0.0.1:4180/. You can also open `index.html` directly in a modern browser. Run data and calculation tests with:

```bash
npm test
```

## End-to-end tests

The browser suite lives in `tests/e2e/` and uses Playwright, kept separate from the dependency-free unit tests. Install the test dependency and Chromium once:

```bash
npm install
npx playwright install chromium
```

Then run:

```bash
npm run test:e2e
```

`npm test` and `npm start` still need no installed packages — the app itself remains dependency-free at runtime.

## GitHub Pages deployment

- In the [existing repository's Pages settings](https://github.com/uditkumar123/pshcp-benefit-explorer/settings/pages), set **Build and deployment → Source** to **GitHub Actions**.
- The existing **Publish Benefit Atlas** workflow (`.github/workflows/pages.yml`) runs on pushes to `main`. It can also be run manually from the Actions tab (select `main`). It runs `npm test` before packaging and deploying the static app files.
- After a successful deployment, open https://uditkumar123.github.io/pshcp-benefit-explorer/ and verify that the app and benefit deep links load.

## Before sharing with PSHCP members

For a small, moderated comparison with the official coverage guide, see the [pilot kit](docs/pilot/moderator-guide.md).

- [ ] Ask a PSHCP plan expert to verify the pilot's benefit entries, limits, exceptions, and source links against the current PSHCP Directive. Record what was reviewed and flag gaps; automated tests do not validate plan accuracy.
- [ ] Check the app on mobile and desktop, at 200% and 400% zoom, with keyboard only (tab order, focus and Escape), and with a screen reader. Check benefit links and calculator examples too.
- [ ] Tell pilot participants the app is English-only. For broader sharing, confirm English/French expectations and arrange reviewed French content before inviting a bilingual audience.
- [ ] Make clear in the invitation that this is an independent reference, not an eligibility decision. Ask participants not to enter or share personal identifiers, plan/certificate numbers, or health information.
- [ ] Name a maintainer and set a review cadence for Directive/booklet changes, broken links, and revision notes. If using Pages, verify site visibility and permissions for the intended audience before sending the link; repository privacy alone is not a visibility check.

## Files

| Path | Responsibility |
|---|---|
| `index.html` | Semantic, accessible interface |
| `styles.css` | Responsive visual design |
| `app.js` | Search, progressive results, accessible benefit panel and shareable links |
| `logic.js` | Pure testable calculations |
| `data.js` | Curated, page-referenced benefit entries |
| `docs/content-changelog.md` | Dated content and claim-routing changes, with review status |
| `tests/` | Data-integrity, search, routing and behaviour tests; browser journeys in `tests/e2e/` |

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

## License

MIT for the original app code. Official PSHCP documents and government/insurer names remain with their respective rights holders. The original source PDF is deliberately **not bundled** in this repository.
