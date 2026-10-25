const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const githubController = require('./controllers/githubController');
const leaderboardController = require('./controllers/leaderboardController');

const DIST_DIR = path.join(__dirname, '../gdsc-leaderboard/dist');

function createApp() {
  const app = express();

  // Middleware
  app.use(cors()); // Enable CORS for all routes
  // Keep the raw body around: webhook signatures are computed over the exact bytes GitHub sent.
  app.use(bodyParser.json({ limit: '5mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  // API routes go before the SPA catch-all, otherwise GET /api/leaderboard returns index.html.
  app.post('/api/github', githubController.handleGithubEvent);
  app.get('/api/leaderboard', leaderboardController.handleLeaderboardEvent);
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Serve static files
  app.use(express.static(DIST_DIR));

  app.get('/*', function(req, res) {
    res.sendFile(path.join(DIST_DIR, 'index.html'), function(err) {
      if (err) {
        res.status(404).send('Frontend not built. Run `npm run build` in gdsc-leaderboard/.');
      }
    });
  });

  return app;
}

module.exports = { createApp };
