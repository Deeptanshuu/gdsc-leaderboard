const test = require('node:test');
const assert = require('node:assert/strict');
const { getDifficultyFromLabels, calculateScore } = require('../utils/helpers');
const { signPayload, verifyGithubSignature } = require('../utils/signature');

test('difficulty comes from PR labels, hardest wins', () => {
  assert.deepEqual(getDifficultyFromLabels([{ name: 'easy' }]), { difficulty: 'easy', points: 2 });
  assert.deepEqual(getDifficultyFromLabels([{ name: 'Difficulty: Medium' }]), { difficulty: 'medium', points: 4 });
  assert.deepEqual(getDifficultyFromLabels([{ name: 'easy' }, { name: 'level-hard' }]), { difficulty: 'hard', points: 7 });
});

test('PRs without a difficulty label score nothing', () => {
  assert.equal(getDifficultyFromLabels([]), null);
  assert.equal(getDifficultyFromLabels(undefined), null);
  assert.equal(getDifficultyFromLabels([{ name: 'hacktoberfest-accepted' }]), null);
  assert.equal(getDifficultyFromLabels([{ name: 'hardware' }]), null);
});

test('score subtracts penalty, so a negative penalty is a bonus', () => {
  assert.equal(calculateScore({ problems_solved: { hard: 8 }, penalty: -9 }), 65);
  assert.equal(calculateScore({ problems_solved: { easy: 1, medium: 1, hard: 1 }, penalty: 3 }), 10);
  assert.equal(calculateScore({ problems_solved: {} }), 0);
  assert.equal(calculateScore({}), 0);
});

test('webhook signatures verify only with the right secret and body', () => {
  const body = Buffer.from('{"hello":"world"}');
  const sig = signPayload(body, 's3cret');
  assert.ok(verifyGithubSignature(body, sig, 's3cret'));
  assert.ok(!verifyGithubSignature(body, sig, 'wrong'));
  assert.ok(!verifyGithubSignature(Buffer.from('{"hello":"there"}'), sig, 's3cret'));
  assert.ok(!verifyGithubSignature(body, undefined, 's3cret'));
  assert.ok(!verifyGithubSignature(body, 'sha256=short', 's3cret'));
});
