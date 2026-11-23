const test = require('node:test');
const assert = require('node:assert/strict');
const { benefits } = require('../data.js');
const { filterBenefits, rankBenefits, claimRoute, claimDestinations, editDistance, usageSummary } = require('../logic.js');
const byId = new Map(benefits.map(b => [b.id, b]));

test('direct name and alias matches rank above incidental mentions', () => {
  assert.equal(rankBenefits(benefits, { search: 'massage' })[0].id, 'massage');
  assert.equal(rankBenefits(benefits, { search: 'mental health' })[0].id, 'psychological');
  assert.equal(rankBenefits(benefits, { search: 'cpap' })[0].id, 'cpap');
  assert.equal(rankBenefits(benefits, { search: 'hearing aids' })[0].id, 'hearing-aids');
  assert.equal(filterBenefits(benefits, { search: 'massage', category: 'therapy' }).length, 1);
});

test('common misspellings still find the benefit', () => {
  assert.equal(editDistance('massage', 'massge'), 1);
  assert.equal(rankBenefits(benefits, { search: 'massge' })[0].id, 'massage');
  assert.equal(rankBenefits(benefits, { search: 'glases' })[0].id, 'glasses');
  assert.equal(rankBenefits(benefits, { search: 'perscription' })[0].id, 'prescriptions');
});

test('unrelated text is not guessed or fuzzy-matched into results', () => {
  assert.equal(filterBenefits(benefits, { search: 'sore feet' }).length, 0);
  assert.equal(filterBenefits(benefits, { search: 'zzzzzz' }).length, 0);
  assert.equal(rankBenefits(benefits, { search: 'zzzzzz' }).length, 0);
});

test('A–Z sorting still overrides ranking when requested', () => {
  const titles = rankBenefits(benefits, { search: 'therapy', sort: 'az' }).map(b => b.title);
  const sorted = titles.slice().sort((a, b) => a.localeCompare(b, 'en-CA'));
  assert.deepEqual(titles, sorted);
});

test('claim routing follows administrator and coverage rules', () => {
  assert.equal(claimRoute(byId.get('travel-emergency'), 'supplementary').provider, 'MSH International');
  assert.equal(claimRoute(byId.get('travel-family'), 'supplementary').key, 'msh-emergency');
  assert.equal(claimRoute(byId.get('travel-referral'), 'supplementary').provider, 'Canada Life');
  assert.equal(claimRoute(byId.get('basic-abroad'), 'comprehensive').key, 'msh-comprehensive');
  assert.equal(claimRoute(byId.get('hospital-abroad'), 'comprehensive').key, 'msh-comprehensive');
  assert.equal(claimRoute(byId.get('hospital-one'), 'comprehensive').provider, 'Canada Life');
  assert.equal(claimRoute(byId.get('massage'), 'supplementary').provider, 'Canada Life');
  assert.match(claimRoute(byId.get('basic-abroad'), 'comprehensive').detail, /visiting Canada go to Canada Life/i);
});

test('every benefit has a valid, explicit claim destination', () => {
  for (const item of benefits) {
    const route = claimRoute(item, 'supplementary');
    assert.ok(claimDestinations[route.key], `${item.id} has no route`);
    assert.ok(route.provider && route.detail && route.url);
  }
  assert.equal(byId.get('travel-emergency').submit, 'msh-emergency');
  assert.equal(byId.get('basic-abroad').submit, 'msh-comprehensive');
});

test('usage summary reports remaining eligible expense and possible payment', () => {
  const result = usageSummary(1250, 1500, 80);
  assert.equal(result.remaining, 250);
  assert.equal(result.percent, 83.3);
  assert.equal(result.availablePayout, 200);
  assert.equal(result.overBy, 0);

  const over = usageSummary(2000, 1500, 80);
  assert.equal(over.remaining, 0);
  assert.equal(over.percent, 100);
  assert.equal(over.overBy, 500);
  assert.equal(over.availablePayout, 0);

  assert.equal(usageSummary(-1, 500, 80), null);
  assert.equal(usageSummary(100, 0, 80), null);
  assert.equal(usageSummary(100, 500, 80).availablePayout, 320);
});
