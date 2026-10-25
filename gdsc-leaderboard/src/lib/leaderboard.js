// Single source of truth for scoring and ranking. Every page and the live socket feed go
// through here, so the board can't disagree with itself. Mirrors Server/utils/helpers.js.

export const POINTS = { easy: 2, medium: 4, hard: 7 };
export const DIFFICULTIES = ['hard', 'medium', 'easy'];

export const slugify = (name) =>
  String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Accepts a team in either the static JSON shape or the server's leaderboard shape.
export function normalizeTeam(raw) {
  const solved = {
    easy: raw.problems_solved?.easy || 0,
    medium: raw.problems_solved?.medium || 0,
    hard: raw.problems_solved?.hard || 0,
  };
  const problemPoints = DIFFICULTIES.reduce((sum, level) => sum + solved[level] * POINTS[level], 0);
  // The data stores time adjustments as "penalty"; a negative penalty is a bonus.
  const adjustment = -(raw.penalty || 0);
  return {
    id: raw.github_username || slugify(raw.team_name),
    slug: slugify(raw.team_name),
    name: raw.team_name,
    members: (raw.team_members || []).map((member) => (typeof member === 'string' ? member : member.name)),
    githubUsername: raw.github_username,
    solved,
    totalSolved: solved.easy + solved.medium + solved.hard,
    problemPoints,
    adjustment,
    score: problemPoints + adjustment,
    disqualified: Boolean(raw.disqualified),
  };
}

const byStanding = (a, b) =>
  b.score - a.score || b.solved.hard - a.solved.hard || a.name.localeCompare(b.name);

// Standard competition ranking: equal scores share a rank and the next rank is skipped (1, 2, 2, 4).
// Disqualified teams are kept out of the ranking entirely rather than padding the bottom.
export function buildLeaderboard(rawTeams) {
  const teams = rawTeams.map(normalizeTeam);
  const eligible = teams.filter((team) => !team.disqualified).sort(byStanding);
  const ranked = eligible.map((team) => {
    const firstWithScore = eligible.findIndex((other) => other.score === team.score);
    const shared = eligible.filter((other) => other.score === team.score).length > 1;
    return { ...team, rank: firstWithScore + 1, tied: shared };
  });
  const disqualified = teams.filter((team) => team.disqualified).sort((a, b) => a.name.localeCompare(b.name));
  return { ranked, disqualified };
}

// What changed between two rankings, for toasts and ▲▼ markers.
export function diffRanks(previous, next) {
  const before = new Map(previous.map((team) => [team.id, team]));
  return next
    .map((team) => {
      const old = before.get(team.id);
      if (!old || (old.rank === team.rank && old.score === team.score)) return null;
      return {
        id: team.id,
        name: team.name,
        prevRank: old.rank,
        rank: team.rank,
        prevScore: old.score,
        score: team.score,
        climbed: old.rank - team.rank,
      };
    })
    .filter(Boolean);
}

export function computeStats({ ranked, disqualified }) {
  const all = [...ranked, ...disqualified];
  return {
    teams: ranked.length,
    hackers: all.reduce((sum, team) => sum + team.members.length, 0),
    problemsSolved: ranked.reduce((sum, team) => sum + team.totalSolved, 0),
    pointsAwarded: ranked.reduce((sum, team) => sum + team.problemPoints, 0),
    topScore: ranked[0]?.score ?? 0,
  };
}
