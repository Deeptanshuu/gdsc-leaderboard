const { calculateScore } = require('../utils/helpers');
const { createMemoryStore } = require('../stores/memoryStore');
const { createMongoStore } = require('../stores/mongoStore');

let store;

// DATA_STORE=mongo|memory. Defaults to mongo only when a connection string is configured.
function createStoreFromEnv() {
  const kind = process.env.DATA_STORE || (process.env.MONGODB_URI ? 'mongo' : 'memory');
  return kind === 'mongo' ? createMongoStore() : createMemoryStore();
}

function setStore(newStore) {
  store = newStore;
}

function getStore() {
  if (!store) store = createStoreFromEnv();
  return store;
}

async function getTeamByGithubUsername(username) {
  return getStore().findTeamByGithubUsername(username);
}

async function updateTeamPoints(username, difficulty) {
  try {
    return await getStore().incrementSolved(username, difficulty);
  } catch (error) {
    console.error('Error updating team points:', error);
    return false;
  }
}

// Every team, with its computed score. Disqualified teams are included and flagged
// so clients can show them separately instead of silently dropping them.
async function getLeaderboard() {
  const teams = await getStore().listTeams();
  return teams.map((team) => ({
    team_name: team.team_name,
    team_members: team.team_members,
    score: calculateScore(team),
    problems_solved: team.problems_solved || {},
    penalty: team.penalty || 0,
    disqualified: Boolean(team.disqualified),
    github_username: team.github_username,
  }));
}

module.exports = { getStore, setStore, getTeamByGithubUsername, updateTeamPoints, getLeaderboard };
