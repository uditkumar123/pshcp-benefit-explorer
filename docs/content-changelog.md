# Benefit Atlas content change log

This log records visible changes to benefit content and claim guidance. It is not a substitute for the PSHCP Directive. Dates are the date the change was made in this repository.

## 23 November 2026 — usage tracker, claim routing and search improvements

**Usage tracker**

- Added an optional local tracker that turns entered eligible-expense amounts into a used-versus-remaining bar per benefit.
- Entries are stored with `localStorage` on the visitor's device, never sent to a server, and can be cleared with one button.
- Added **Save to file** and **Load from file** for a portable JSON backup, so entries can move between browsers or devices without an account.
- Imported files are validated strictly; unknown benefit ids and invalid amounts are skipped, and the file contains no plan, member or claim identifiers.
- Benefit cards and detail panels link into the tracker; no personal or plan identifiers are collected.

**Claim routing**

- Added a claim-destination table covering Supplementary and Comprehensive Coverage, location of the expense, and travel emergencies.
- Corrected the previous summary, which implied MSH handles all Comprehensive Coverage claims. Official PSHCP guidance assigns expenses incurred outside Canada under Comprehensive Coverage to MSH, while expenses incurred in Canada — including by a Comprehensive member visiting Canada — go to Canada Life.
- Added benefit-level routing, including MSH for emergency travel assistance and Comprehensive claims incurred abroad, and Canada Life for out-of-province referrals.
- Added the December 31 claim deadline and MSH's 24-hour emergency numbers.

**Search**

- Search results now rank direct title and alias matches above incidental mentions.
- Added limited typo tolerance for words of five or more characters.
- A search with no matches now offers a one-step switch to the issue finder with the same wording.

**Benefit details**

- Added a "Before you spend" summary covering whether the limit is separate or shared, when it resets, required documents and approvals, and where the claim goes.
- Added Directive cross-references where the booklet summary alone is not enough (hospital room levels, hospital care outside Canada).

**Freshness**

- Added the content review date to the sources section, the footer and each benefit panel.
- Added this change log.

## Review status

- Benefit entries were checked against the **PSHCP Member Booklet, November 2026** during this update. That is a self-review, not an independent plan-expert verification.
- Claim routing was checked against the PSHCP Administration Authority's published claim instructions and Bulletins 49 and 53 (October 2024 and September 2026).
- Independent review by a PSHCP plan expert is still required before wider sharing. See the pilot checklist in the project README.
