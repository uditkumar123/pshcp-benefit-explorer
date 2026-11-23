const test = require('node:test');
const assert = require('node:assert/strict');
const { benefits } = require('../data.js');
const { filterBenefits, rankBenefits, claimRoute, claimDestinations, editDistance, usageSummary, createUsageExport, createUsageCsv, parseCsv, readUsageExport, readUsageCsv, readUsageFile } = require('../logic.js');
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

test('usage export is sorted, portable and free of plan identifiers', () => {
  const out = createUsageExport({ physiotherapy: 1250, massage: 125 }, benefits, new Date('2026-11-23T12:00:00Z'));
  assert.equal(out.format, 'pshcp-usage');
  assert.equal(out.version, 1);
  assert.equal(out.exportedAt, '2026-11-23T12:00:00.000Z');
  assert.deepEqual(Object.keys(out.entries[0]), ['benefit', 'title', 'eligible']);
  assert.deepEqual(out.entries.map(entry => entry.benefit), ['massage', 'physiotherapy']);
  assert.equal(out.entries[1].eligible, 1250);
  assert.equal(out.entries[1].title, 'Physiotherapy');
  const raw = JSON.stringify(out);
  assert.ok(!/plan number|member id|certificate/i.test(raw));
});

test('usage import validates the file and skips unusable entries', () => {
  const file = JSON.stringify(createUsageExport({ physiotherapy: 1250, massage: 125 }, benefits));
  const loaded = readUsageExport(file, benefits);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.entries.physiotherapy, 1250);
  assert.equal(loaded.entries.massage, 125);
  assert.equal(loaded.skipped, 0);

  const mixed = readUsageExport(JSON.stringify({
    format: 'pshcp-usage',
    entries: [
      { benefit: 'physiotherapy', eligible: 100 },
      { benefit: 'not-a-benefit', eligible: 50 },
      { benefit: 'massage', eligible: -2 },
      { benefit: 'massage', eligible: 'oops' },
      { benefit: 'massage', eligible: 75 },
      { benefit: 'massage', eligible: 25 }
    ]
  }), benefits);
  assert.equal(mixed.ok, true);
  assert.equal(mixed.entries.physiotherapy, 100);
  assert.equal(mixed.entries.massage, 100);
  assert.equal(mixed.skipped, 3);

  assert.equal(readUsageExport('not json', benefits).ok, false);
  assert.match(readUsageExport('not json', benefits).message, /valid JSON/);
  assert.equal(readUsageExport(JSON.stringify({ format: 'other', entries: [] }), benefits).ok, false);
  assert.match(readUsageExport(JSON.stringify({ format: 'other', entries: [] }), benefits).message, /not created by/);
  assert.match(readUsageExport(JSON.stringify({ format: 'pshcp-usage', entries: [] }), benefits).message, /No usable/);
});

test('CSV export is spreadsheet friendly and round-trips', () => {
  const csv = createUsageCsv({ physiotherapy: 1250, massage: 125 }, benefits);
  assert.equal(csv.split('\r\n')[0], 'benefit,title,eligible');
  assert.match(csv, /physiotherapy,Physiotherapy,1250\.00/);
  assert.match(csv, /massage,Massage therapy,125\.00/);

  const loaded = readUsageCsv(csv, benefits);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.entries.physiotherapy, 1250);
  assert.equal(loaded.entries.massage, 125);
  assert.equal(loaded.skipped, 0);

  assert.equal(readUsageFile(csv, benefits).entries.physiotherapy, 1250);
  assert.equal(readUsageFile(JSON.stringify(createUsageExport({ massage: 200 }, benefits)), benefits).entries.massage, 200);
  assert.match(readUsageFile('not json', benefits, 'backup.json').message, /valid JSON/);
  assert.match(readUsageFile('name,value', benefits, 'backup.csv').message, /“benefit” column/);
});

test('CSV import accepts benefit titles, quoted amounts and skips unknown rows', () => {
  const parsed = readUsageCsv('benefit,eligible\r\n"Massage therapy","$1,250.50"\r\nUnknown,20\r\n,5\r\n', benefits);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.entries.massage, 1250.5);
  assert.equal(parsed.skipped, 2);

  const reordered = readUsageCsv('eligible,title,benefit\n100,"Mental health & counselling",psychological\n', benefits);
  assert.equal(reordered.ok, true);
  assert.equal(reordered.entries.psychological, 100);

  assert.deepEqual(parseCsv('a,"b, c","d""e"\r\nf,g,h'), [['a', 'b, c', 'd"e'], ['f', 'g', 'h']]);
});

test('CSV import explains a missing column or empty file', () => {
  const missing = readUsageCsv('name,value\nMassage,100\n', benefits);
  assert.equal(missing.ok, false);
  assert.match(missing.message, /“benefit” column/);
  assert.equal(readUsageCsv('', benefits).ok, false);
  assert.match(readUsageCsv('', benefits).message, /empty/);
});
