const test = require('node:test');
const assert = require('node:assert/strict');
const { benefits, source, categories } = require('../data.js');
const {filterBenefits,computeIllustration,isOddCycleYear,formatCurrency} = require('../logic.js');

test('directory is usable, traceable and free of duplicate identifiers', () => {
  assert.ok(benefits.length >= 40);
  assert.equal(new Set(benefits.map(x=>x.id)).size,benefits.length);
  for (const b of benefits) {
    assert.ok(b.title && b.category && b.limit && b.period && b.docs && b.notes);
    assert.ok(categories.some(c => c.id === b.category));
    assert.ok(b.pages.length > 0 && b.pages.every(p => Number.isInteger(p) && p>=7 && p<=86));
    assert.ok(b.planTypes.length && b.planTypes.every(p=> ['supplementary','comprehensive'].includes(p)));
    assert.ok([80,100].includes(b.rate));
  }
  assert.match(source.edition,/2026/);
});
test('coverage filter excludes supplementary-only travel coverage abroad', () => {
  assert.ok(filterBenefits(benefits,{coverage:'supplementary'}).some(b=>b.id==='travel-emergency'));
  assert.ok(!filterBenefits(benefits,{coverage:'comprehensive'}).some(b=>b.id==='travel-emergency'));
  assert.ok(filterBenefits(benefits,{coverage:'comprehensive'}).some(b=>b.id==='basic-abroad'));
  assert.ok(!filterBenefits(benefits,{coverage:'supplementary'}).some(b=>b.id==='basic-abroad'));
});
test('hospital room levels distinguish Canadian room and board from the rules abroad', () => {
  for (const coverage of ['supplementary','comprehensive']) {
    const listed = filterBenefits(benefits,{coverage,category:'travel'});
    for (const [id, limit] of [['hospital-one','$90/day'],['hospital-two','$170/day'],['hospital-three','$250/day']]) {
      const room = listed.find(b=>b.id===id);
      assert.ok(room, `${id} missing for ${coverage}`);
      assert.equal(room.limit,limit);
      assert.equal(room.rate,100);
      assert.equal(room.period,'Per hospital day');
      assert.match(room.notes,/Booklet p\. 61 describes .*room and board charges .* in Canada/i);
      assert.match(room.notes,/section 7 applies regardless of where members reside/i);
      assert.match(room.notes,/separate hospital charges rule for pensioners residing outside Canada \(section 7\.2\.2\)/i);
      assert.ok(room.pages.includes(61));
    }
    assert.equal(listed.some(b=>b.id==='hospital-abroad'),coverage==='comprehensive');
  }
  assert.match(benefits.find(b=>b.id==='hospital-abroad').notes,/separate .*section 9 provision .*posted or deployed employees/i);
});
test('full text search and category filtering work together', () => {
  assert.equal(filterBenefits(benefits,{search:'massage',category:'therapy'}).length,1);
  assert.equal(filterBenefits(benefits,{search:'CPAP',category:'vision'}).length,0);
  assert.ok(filterBenefits(benefits,{search:'ADHD'}).some(b=>b.id==='psychological'));
});
test('basic 80% illustration uses eligible expense cap, not the payout limit', () => {
  const result=computeIllustration({price:500,alreadyUsed:0,eligibleExpenseCap:500,rate:80});
  assert.equal(result.planPays,400);
  assert.equal(result.memberPays,100);
  assert.equal(computeIllustration({price:400,alreadyUsed:350,eligibleExpenseCap:500,rate:80}).planPays,120);
  assert.equal(computeIllustration({price:100,alreadyUsed:500,eligibleExpenseCap:500,rate:80}).planPays,0);
  assert.equal(computeIllustration({price:-1,alreadyUsed:0,eligibleExpenseCap:500,rate:80}),null);
});
test('odd-year vision cycle is calendar-based', () => {
  assert.deepEqual(isOddCycleYear(new Date('2026-06-01T12:00:00')), {firstYear:2025,lastYear:2026});
  assert.deepEqual(isOddCycleYear(new Date('2027-06-01T12:00:00')), {firstYear:2027,lastYear:2028});
});
test('CAD amounts are labeled',()=>assert.match(formatCurrency(400),/400/));
test('spot-check key caps and shared limits against booklet appendix',()=>{
  const byId=Object.fromEntries(benefits.map(x=>[x.id,x]));
  assert.equal(byId.psychological.cap,5000);
  assert.equal(byId.physiotherapy.cap,1500);
  assert.equal(byId.glasses.cap,400);
  assert.equal(byId['laser-eye'].cap,2000);
  assert.equal(byId['cpap-parts'].cap,500);
  assert.equal(byId['gender-care'].cap,75000);
  assert.equal(byId['travel-emergency'].rate,100);
  assert.equal(byId['hospital-one'].rate,100);
  assert.equal(byId.speech.combined,'speech');
});

test('practitioner benefits explain what the provider does', () => {
  const byId = Object.fromEntries(benefits.map(b => [b.id, b]));
  const ids = ['physiotherapy', 'psychological', 'massage', 'chiropractor', 'acupuncture', 'osteopathy', 'naturopathy', 'dietitian', 'occupational', 'lactation', 'nursing', 'footcare', 'speech', 'electrology'];
  for (const id of ids) {
    const item = byId[id];
    assert.ok(item, `${id} missing`);
    assert.ok(item.whatItIs.length > 40, `${id} needs a provider description`);
    assert.ok(item.focus.length > 10, `${id} needs a focus summary`);
  }
  assert.notEqual(byId.physiotherapy.whatItIs, byId.massage.whatItIs);
  assert.match(byId.osteopathy.whatItIs, /doctor of osteopathy/i);
  assert.match(byId.speech.whatItIs, /swallowing/i);
  assert.match(byId.psychological.whatItIs, /share one PSHCP limit|sharing one PSHCP limit/i);
});
