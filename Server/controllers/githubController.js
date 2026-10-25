// controllers/githubController.js
const { getStore, getTeamByGithubUsername, updateTeamPoints } = require('../services/teamService');
const { getDifficultyFromLabels } = require('../utils/helpers');
const { verifyGithubSignature } = require('../utils/signature');

async function handleGithubEvent(req, res) {
  try {
    const secret = process.env.GITHUB_SECRET;
    if (secret && !verifyGithubSignature(req.rawBody, req.headers['x-hub-signature-256'], secret)) {
      console.warn('Rejected GitHub webhook with invalid signature');
      return res.sendStatus(401);
    }

    const event = req.headers['x-github-event'];
    const payload = req.body;

    console.log(`Received GitHub event: ${event}`);

    if (event !== 'pull_request') return res.sendStatus(200);

    const { action, pull_request: pr } = payload;
    if (action !== 'closed' || !pr?.merged) return res.sendStatus(200);

    const scoring = getDifficultyFromLabels(pr.labels);
    if (!scoring) {
      console.log(`PR #${pr.number} has no difficulty label; no points awarded.`);
      return res.status(200).json({ awarded: 0, reason: 'no difficulty label' });
    }

    const prUser = pr.user.login;
    const team = await getTeamByGithubUsername(prUser);
    if (!team) {
      console.warn(`Team not found for GitHub username: ${prUser}`);
      return res.status(200).json({ awarded: 0, reason: 'unknown team' });
    }
    if (team.disqualified) {
      console.log(`Team ${team.github_username} is disqualified and will not receive points.`);
      return res.status(200).json({ awarded: 0, reason: 'disqualified' });
    }

    // GitHub redelivers webhooks; only the first delivery of a PR scores.
    const prKey = String(pr.id ?? pr.html_url ?? `${prUser}#${pr.number}`);
    if (!(await getStore().markPrProcessed(prKey))) {
      return res.status(200).json({ awarded: 0, reason: 'already processed' });
    }

    console.log(`Awarding ${scoring.points} (${scoring.difficulty}) to team: ${team.github_username}`);
    await updateTeamPoints(team.github_username, scoring.difficulty);
    // The store's change listener broadcasts the new leaderboard.
    return res.status(200).json({ awarded: scoring.points, difficulty: scoring.difficulty, team: team.team_name });
  } catch (error) {
    console.error('Error handling GitHub webhook:', error);
    res.sendStatus(500);
  }
}

module.exports = { handleGithubEvent };
