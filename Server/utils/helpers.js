const DIFFICULTY_POINTS = {
  'easy': 2,
  'medium': 4,
  'hard': 7
};

function getDifficultyAndPoints() {
  return DIFFICULTY_POINTS;
}

// Pick the hardest difficulty label on a PR (labels like "hard", "Difficulty: Medium", "level-easy").
// Returns null when the PR carries no difficulty label, so unlabelled PRs earn nothing.
function getDifficultyFromLabels(labels = []) {
  const names = labels.map((label) => String(label.name || label).toLowerCase());
  const difficulty = ['hard', 'medium', 'easy'].find((level) =>
    names.some((name) => name.split(/[^a-z]+/).includes(level))
  );
  return difficulty ? { difficulty, points: DIFFICULTY_POINTS[difficulty] } : null;
}

function calculateScore(team) {
  const { easy = 0, medium = 0, hard = 0 } = team.problems_solved || {};
  // A negative penalty is a bonus, so it is subtracted either way.
  return easy * DIFFICULTY_POINTS.easy
    + medium * DIFFICULTY_POINTS.medium
    + hard * DIFFICULTY_POINTS.hard
    - (team.penalty || 0);
}

module.exports = { getDifficultyAndPoints, getDifficultyFromLabels, calculateScore };
