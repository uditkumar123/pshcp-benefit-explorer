const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const js = fs.readFileSync(path.join(root,'app.js'),'utf8');

test('primary search, coverage and category controls have predictable targets', () => {
  for(const id of ['benefit-search','benefit-grid','category-list','category-select','result-count','benefit-sort','benefit-dialog','dialog-content','close-dialog','clear-filters','load-more']) {
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/name="coverage" value="supplementary" checked/);
  assert.match(html,/name="coverage" value="comprehensive"/);
});
test('benefit detail supports native keyboard-accessible modal and source links', () => {
  assert.match(html,/<dialog\b/);
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
  assert.match(html,/Where to submit a claim/);
  assert.match(html,/id="empty-state"/);
  assert.match(html,/id="try-issue"/);
  assert.match(html,/Close benefit details/);
  assert.match(html,/23 November 2026/);
  assert.match(js,/claimRoute\(/);
  assert.match(js,/rankBenefits\(/);
});
test('usage tracker is present with an accessible progress bar and local-only storage', () => {
  for (const id of ['usage', 'usage-form', 'usage-benefit', 'usage-amount', 'usage-board', 'usage-summary', 'usage-clear', 'usage-export', 'usage-export-csv', 'usage-import', 'usage-file', 'usage-file-status']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(js, /role="progressbar"/);
  assert.match(js, /localStorage/);
  assert.match(js, /pshcp-usage-v1/);
  assert.match(html, /Saved in this browser only/);
  assert.match(html, /Save backup \(JSON\)/);
  assert.match(html, /Save spreadsheet \(CSV\)/);
  assert.match(html, /Load file/);
  assert.match(js, /createUsageExport\(/);
  assert.match(js, /createUsageCsv\(/);
  assert.match(js, /readUsageFile\(/);
});
