const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = {
  home: read('index.html'),
  benefits: read('benefits.html'),
  practitioners: read('practitioners.html'),
  finder: read('finder.html'),
  usage: read('usage.html'),
  claims: read('claims.html')
};
const js = read('app.js');

test('the home page is a short entry point to focused pages', () => {
  assert.doesNotMatch(pages.home, /id="benefit-grid"/);
  assert.doesNotMatch(pages.home, /id="usage-form"/);
  assert.doesNotMatch(pages.home, /id="finder-form"/);
  assert.doesNotMatch(pages.home, /id="practitioner-rows"/);
  assert.doesNotMatch(pages.home, /id="claim-help"/);
  assert.match(pages.home, /action="benefits\.html"/);
  assert.match(pages.home, /href="benefits\.html\?benefit=psychological"/);
  for (const [name, html] of Object.entries(pages)) {
    assert.match(html, /<main id="main">/, `${name} needs a main landmark`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name} needs exactly one h1`);
  }
});

test('navigation is shared and marks the active page', () => {
  const links = ['benefits.html', 'practitioners.html', 'finder.html', 'usage.html', 'claims.html'];
  for (const [name, html] of Object.entries(pages)) {
    for (const href of links) assert.match(html, new RegExp(`href="${href}"`), `${name} -> ${href}`);
    if (name !== 'home') assert.match(html, new RegExp(`href="${name === 'benefits' ? 'benefits' : name}\\.html" aria-current="page"`), `${name} needs aria-current`);
  }
});

test('primary search, coverage and category controls have predictable targets', () => {
  for(const id of ['benefit-search','benefit-grid','category-list','category-select','result-count','benefit-sort','benefit-dialog','dialog-content','close-dialog','clear-filters','load-more','empty-state']) {
    assert.match(pages.benefits,new RegExp(`id="${id}"`));
  }
  assert.match(pages.benefits,/name="coverage" value="supplementary" checked/);
  assert.match(pages.benefits,/name="coverage" value="comprehensive"/);
  assert.match(pages.home,/id="benefit-search"/);
});

test('benefit detail supports native keyboard-accessible modal and source links', () => {
  for (const page of [pages.benefits, pages.practitioners, pages.finder]) assert.match(page, /<dialog\b/);
  assert.match(js,/\.showModal\(\)/);
  assert.match(js,/\.close\(\)/);
  assert.match(js,/source\.pdf.*#page=/);
  assert.match(js,/new URLSearchParams\(window\.location\.search\)/);
});

test('illustrative estimator uses pure calculations with explicit caveats', () => {
  assert.match(js,/computeIllustration\(/);
  assert.match(js,/reasonable and customary charges/);
  assert.match(js,/item\.noEstimate/);
  assert.match(js,/eligibleExpenseCap/);
});

test('claim routing and content freshness are visible in the interface', () => {
  assert.match(pages.claims,/Where to submit a claim/);
  assert.match(pages.claims,/23 November 2026/);
  assert.match(pages.claims,/id="sources"/);
  assert.match(js,/claimRoute\(/);
  assert.match(js,/rankBenefits\(/);
});

test('practitioner comparison is separate and wired to benefit details', () => {
  assert.match(pages.practitioners, /id="practitioners"/);
  assert.match(pages.practitioners, /id="practitioner-rows"/);
  assert.match(pages.practitioners, /Which practitioner\?/);
  assert.match(js, /initPractitioners\(/);
  assert.match(js, /whatItIs/);
});

test('usage tracker is its own page with accessible progress and local-only storage', () => {
  for (const id of ['usage', 'usage-form', 'usage-benefit', 'usage-amount', 'usage-board', 'usage-summary', 'usage-clear', 'usage-export', 'usage-export-csv', 'usage-import', 'usage-file', 'usage-file-status']) {
    assert.match(pages.usage, new RegExp(`id="${id}"`));
  }
  assert.match(js, /role="progressbar"/);
  assert.match(js, /localStorage/);
  assert.match(js, /pshcp-usage-v1/);
  assert.match(pages.usage, /Saved in this browser only/);
  assert.match(pages.usage, /Save backup \(JSON\)/);
  assert.match(pages.usage, /Save spreadsheet \(CSV\)/);
  assert.match(pages.usage, /Load file/);
  assert.match(js, /createUsageExport\(/);
  assert.match(js, /createUsageCsv\(/);
  assert.match(js, /readUsageFile\(/);
  assert.match(js, /usage\.html\?benefit=/);
});

test('issue finder lives on its own page and supports shareable queries', () => {
  for (const id of ['help-finder', 'finder-form', 'issue-input', 'finder-topics', 'finder-results', 'finder-results-content']) {
    assert.match(pages.finder, new RegExp(`id="${id}"`));
  }
  assert.match(pages.finder, /src="guide\.js"/);
  assert.match(js, /finder\.html\?q=/);
});

test('all pages and shared scripts are served locally and deployed', () => {
  const serve = fs.readFileSync(path.join(root, 'scripts/serve.cjs'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  for (const file of ['benefits.html', 'practitioners.html', 'finder.html', 'usage.html', 'claims.html']) {
    assert.match(serve, new RegExp(file.replace('.', '\\.')));
  }
  assert.match(workflow, /cp \*\.html/);
});
