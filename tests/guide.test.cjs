const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { topics, matchTopic, findTopic, sharedLimits } = require('../guide.js');
const { benefits } = require('../data.js');
const byId = new Map(benefits.map(b => [b.id, b]));

test('all guided suggestions use sourced existing benefits', () => {
  for (const topic of topics) {
    assert.ok(topic.label && topic.intro && topic.benefits.length);
    for (const [id, reason] of topic.benefits) {
      assert.ok(byId.has(id), `${topic.id}: ${id} missing`);
      assert.ok(reason.length > 15);
      assert.ok(byId.get(id).pages.length);
    }
  }
});
test('back pain offers RMT, physio and separate limits', () => {
  const topic = matchTopic('I have back pain');
  assert.equal(topic.id, 'back');
  assert.ok(topic.benefits.some(([id]) => id === 'massage'));
  assert.ok(topic.benefits.some(([id]) => id === 'physiotherapy'));
  assert.match(topic.notes.join(' '), /separate annual limits/i);
});
test('common concerns match guidance and unknown concerns are not guessed', () => {
  assert.equal(matchTopic('I am anxious and want counselling').id, 'mental');
  assert.equal(matchTopic('foot and heel pain').id, 'feet');
  assert.equal(matchTopic('hearing loss').id, 'speech');
  assert.equal(matchTopic('CPAP mask replacement').id, 'sleep');
  assert.equal(matchTopic('unrelated nonmatching text'), null);
  assert.equal(findTopic('nothing'), null);
});
test('specific concerns and services outrank generic finder words', () => {
  assert.equal(matchTopic('I have sore feet').id, 'feet');
  assert.equal(matchTopic('speech therapy').id, 'speech');
  assert.equal(matchTopic('massage therapy').id, 'back');
  assert.equal(matchTopic('occupational therapy').id, 'injury');
  assert.equal(matchTopic('massage therapy for a knee injury').id, 'back');
  assert.equal(matchTopic('physical therapy').id, 'injury');
});
test('generic finder queries retain their fallback topics', () => {
  assert.equal(matchTopic('sore').id, 'back');
  assert.equal(matchTopic('therapy').id, 'mental');
});
test('shared practitioner limits are explicit and traceable', () => {
  assert.match(sharedLimits.psychological, /5,000/);
  assert.match(sharedLimits.footcare, /500/);
  assert.match(sharedLimits.speech, /750/);
  for (const id of Object.keys(sharedLimits)) assert.equal(byId.get(id).combined, id);
});
test('guided form and script are included on home page', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  for (const id of ['help-finder', 'finder-form', 'issue-input', 'finder-topics', 'finder-results', 'finder-results-content']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /src="guide\.js"/);
});
