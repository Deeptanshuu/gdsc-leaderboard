// In-memory team store seeded from the frontend's static team list.
// Lets the whole live pipeline run locally with no MongoDB.
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

const DEFAULT_SEED = path.join(__dirname, '../../gdsc-leaderboard/src/FINAL-LIST.json');

function createMemoryStore({ seed, seedFile = DEFAULT_SEED } = {}) {
  const initial = seed || JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  const teams = structuredClone(initial);
  const processedPrs = new Set();
  const events = new EventEmitter();

  return {
    name: 'memory',

    async init() {},

    async findTeamByGithubUsername(username) {
      const lower = String(username).toLowerCase();
      return teams.find((team) => team.github_username?.toLowerCase() === lower) || null;
    },

    async incrementSolved(username, difficulty) {
      const team = await this.findTeamByGithubUsername(username);
      if (!team) return false;
      team.problems_solved = team.problems_solved || {};
      team.problems_solved[difficulty] = (team.problems_solved[difficulty] || 0) + 1;
      events.emit('change');
      return true;
    },

    // Returns true the first time a PR id is seen, false on redelivery.
    async markPrProcessed(prId) {
      if (processedPrs.has(prId)) return false;
      processedPrs.add(prId);
      return true;
    },

    async listTeams() {
      return structuredClone(teams);
    },

    onChange(listener) {
      events.on('change', listener);
    },
  };
}

module.exports = { createMemoryStore };
