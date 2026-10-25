import { describe, expect, it } from 'vitest';
import { buildLeaderboard, computeStats, diffRanks, normalizeTeam, slugify } from './leaderboard';
import data from '../FINAL-LIST.json';

const team = (name, problems_solved, extra = {}) => ({
  team_name: name,
  team_members: [{ name: `${name} member` }],
  problems_solved,
  penalty: 0,
  disqualified: false,
  github_username: name.toLowerCase(),
  ...extra,
});

describe('normalizeTeam', () => {
  it('scores every difficulty and treats a negative penalty as a bonus', () => {
    const t = normalizeTeam(team('A', { easy: 1, medium: 1, hard: 2 }, { penalty: -3 }));
    expect(t.problemPoints).toBe(2 + 4 + 14);
    expect(t.adjustment).toBe(3);
    expect(t.score).toBe(23);
  });

  it('ignores a stale server-provided score and recomputes', () => {
    expect(normalizeTeam(team('A', { hard: 1 }, { score: 999 })).score).toBe(7);
  });

  it('accepts members as strings or objects', () => {
    expect(normalizeTeam({ team_name: 'X', team_members: ['a', { name: 'b' }] }).members).toEqual(['a', 'b']);
  });
});

describe('buildLeaderboard', () => {
  it('uses competition ranking for ties', () => {
    const { ranked } = buildLeaderboard([
      team('Low', { hard: 1 }),
      team('TieB', { hard: 3 }),
      team('Top', { hard: 5 }),
      team('TieA', { hard: 3 }),
    ]);
    expect(ranked.map((t) => [t.name, t.rank, t.tied])).toEqual([
      ['Top', 1, false],
      ['TieA', 2, true],
      ['TieB', 2, true],
      ['Low', 4, false],
    ]);
  });

  it('keeps disqualified teams out of the ranking', () => {
    const { ranked, disqualified } = buildLeaderboard([
      team('Good', { hard: 1 }),
      team('Banned', { hard: 9 }, { disqualified: true }),
    ]);
    expect(ranked.map((t) => t.name)).toEqual(['Good']);
    expect(disqualified.map((t) => t.name)).toEqual(['Banned']);
  });

  it('matches the published final standings', () => {
    const { ranked, disqualified } = buildLeaderboard(data);
    expect(ranked[0]).toMatchObject({ name: "Gennady Korotkevich's Disciples", score: 65, rank: 1 });
    expect(ranked.filter((t) => t.score === 34).every((t) => t.rank === 4)).toBe(true);
    expect(ranked).toHaveLength(9);
    expect(disqualified).toHaveLength(5);
  });
});

describe('diffRanks', () => {
  it('reports movers and score changes only', () => {
    const before = buildLeaderboard([team('A', { hard: 2 }), team('B', { hard: 1 }), team('C', {})]).ranked;
    const after = buildLeaderboard([team('A', { hard: 2 }), team('B', { hard: 3 }), team('C', {})]).ranked;
    expect(diffRanks(before, after)).toEqual([
      { id: 'b', name: 'B', prevRank: 2, rank: 1, prevScore: 7, score: 21, climbed: 1 },
      { id: 'a', name: 'A', prevRank: 1, rank: 2, prevScore: 14, score: 14, climbed: -1 },
    ]);
  });
});

it('computeStats summarises the board', () => {
  const stats = computeStats(buildLeaderboard(data));
  expect(stats).toMatchObject({ teams: 9, topScore: 65, problemsSolved: 39, pointsAwarded: 273 });
});

it('slugify makes URL-safe ids', () => {
  expect(slugify("Gennady Korotkevich's Disciples")).toBe('gennady-korotkevich-s-disciples');
  expect(slugify('Tech Titans (3)')).toBe('tech-titans-3');
});
