const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const js = fs.readFileSync(path.join(root,'app.js'),'utf8');

test('primary search, coverage and category controls have predictable targets', () => {
  for(const id of ['benefit-search','benefit-grid','category-list','result-count','benefit-sort','benefit-dialog','dialog-content','close-dialog','clear-filters','load-more']) {
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
