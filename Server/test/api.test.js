const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { setStore } = require('../services/teamService');
const { createMemoryStore } = require('../stores/memoryStore');
const { signPayload } = require('../utils/signature');

const SEED = [
  { team_name: 'Alpha', team_members: [{ name: 'A' }], problems_solved: { hard: 1 }, penalty: 0, disqualified: false, github_username: 'alpha-dev' },
  { team_name: 'Banned', team_members: [{ name: 'B' }], problems_solved: {}, penalty: 0, disqualified: true, github_username: 'banned-dev' },
];

async function withServer(fn, { secret } = {}) {
  const store = createMemoryStore({ seed: SEED });
  let changes = 0;
  store.onChange(() => changes++);
  setStore(store);
  const previousSecret = process.env.GITHUB_SECRET;
  if (secret) process.env.GITHUB_SECRET = secret;
  else delete process.env.GITHUB_SECRET;

  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn({ base, changes: () => changes });
  } finally {
    server.close();
    if (previousSecret === undefined) delete process.env.GITHUB_SECRET;
    else process.env.GITHUB_SECRET = previousSecret;
  }
}

function mergedPr({ id = 1, login = 'alpha-dev', labels = [{ name: 'medium' }] } = {}) {
  return JSON.stringify({ action: 'closed', pull_request: { id, number: id, merged: true, labels, user: { login } } });
}

async function postWebhook(base, body, headers = {}) {
  const res = await fetch(`${base}/api/github`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-github-event': 'pull_request', ...headers },
    body,
  });
  return { status: res.status, json: res.status === 200 ? await res.json().catch(() => null) : null };
}

const scoreOf = async (base, name) =>
  (await (await fetch(`${base}/api/leaderboard`)).json()).find((team) => team.team_name === name).score;

test('GET /api/leaderboard returns JSON, not the SPA catch-all', async () => {
  await withServer(async ({ base }) => {
    const res = await fetch(`${base}/api/leaderboard`);
    assert.match(res.headers.get('content-type'), /application\/json/);
    const body = await res.json();
    assert.equal(body.length, 2);
    assert.deepEqual(body.find((t) => t.team_name === 'Banned').disqualified, true);
  });
});

test('merged labelled PR awards points once, even if redelivered', async () => {
  await withServer(async ({ base, changes }) => {
    assert.equal(await scoreOf(base, 'Alpha'), 7);
    const first = await postWebhook(base, mergedPr({ id: 42 }));
    assert.deepEqual(first.json, { awarded: 4, difficulty: 'medium', team: 'Alpha' });
    const redelivery = await postWebhook(base, mergedPr({ id: 42 }));
    assert.equal(redelivery.json.reason, 'already processed');
    assert.equal(await scoreOf(base, 'Alpha'), 11);
    assert.equal(changes(), 1);
  });
});

test('unlabelled, disqualified, and unknown PRs award nothing', async () => {
  await withServer(async ({ base }) => {
    assert.equal((await postWebhook(base, mergedPr({ id: 1, labels: [] }))).json.reason, 'no difficulty label');
    assert.equal((await postWebhook(base, mergedPr({ id: 2, login: 'banned-dev' }))).json.reason, 'disqualified');
    assert.equal((await postWebhook(base, mergedPr({ id: 3, login: 'nobody' }))).json.reason, 'unknown team');
    assert.equal(await scoreOf(base, 'Alpha'), 7);
  });
});

test('with GITHUB_SECRET set, unsigned or forged webhooks are rejected', async () => {
  await withServer(async ({ base }) => {
    const body = mergedPr({ id: 7 });
    assert.equal((await postWebhook(base, body)).status, 401);
    assert.equal((await postWebhook(base, body, { 'x-hub-signature-256': signPayload(body, 'nope') })).status, 401);
    const ok = await postWebhook(base, body, { 'x-hub-signature-256': signPayload(body, 'topsecret') });
    assert.equal(ok.json.awarded, 4);
  }, { secret: 'topsecret' });
});
