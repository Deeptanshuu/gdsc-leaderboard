#!/usr/bin/env node
// Fires fake "merged PR" GitHub webhooks at a running server so you can watch the
// leaderboard move live. Signs them with GITHUB_SECRET when it is set.
//
//   node scripts/simulate.js [--url http://localhost:5000] [--count 20] [--interval 1500]
require('dotenv').config();
const { signPayload } = require('../utils/signature');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, [])
);
const baseUrl = args.url || `http://localhost:${process.env.PORT || 5000}`;
const count = Number(args.count || 20);
const interval = Number(args.interval || 1500);

// Weighted so easy PRs are common and hard ones are rare and dramatic.
const LABELS = ['easy', 'easy', 'easy', 'medium', 'medium', 'hard'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendMergedPr(username, label, n) {
  const body = JSON.stringify({
    action: 'closed',
    pull_request: {
      id: Date.now() * 1000 + n,
      number: n,
      merged: true,
      labels: [{ name: label }],
      user: { login: username },
    },
  });
  const headers = { 'content-type': 'application/json', 'x-github-event': 'pull_request' };
  if (process.env.GITHUB_SECRET) headers['x-hub-signature-256'] = signPayload(body, process.env.GITHUB_SECRET);

  const res = await fetch(`${baseUrl}/api/github`, { method: 'POST', headers, body });
  return res.json().catch(() => ({ status: res.status }));
}

async function main() {
  const leaderboard = await (await fetch(`${baseUrl}/api/leaderboard`)).json();
  const eligible = leaderboard.filter((team) => !team.disqualified);
  if (!eligible.length) throw new Error('No eligible teams on the server');

  console.log(`Simulating ${count} merged PRs against ${baseUrl} (${eligible.length} teams)\n`);
  for (let n = 1; n <= count; n++) {
    const team = pick(eligible);
    const label = pick(LABELS);
    const result = await sendMergedPr(team.github_username, label, n);
    console.log(`#${String(n).padStart(3)}  ${label.padEnd(6)} → ${team.team_name.padEnd(32)} ${JSON.stringify(result)}`);
    if (n < count) await sleep(interval);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
