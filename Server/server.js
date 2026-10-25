require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { getStore, getLeaderboard } = require('./services/teamService');
const { initWebSocketServer, broadcastLeaderboard } = require('./services/websocketManager');

const port = process.env.PORT || 5000;

async function updateAndBroadcastLeaderboard() {
  try {
    broadcastLeaderboard(await getLeaderboard());
  } catch (error) {
    console.error('Error retrieving leaderboard:', error);
  }
}

async function main() {
  const store = getStore();
  await store.init();
  console.log(`Using ${store.name} data store`);

  const server = http.createServer(createApp());

  // Initialize Socket.IO server
  initWebSocketServer(server);

  // Any change to team data (webhook, manual DB edit) is pushed to every client.
  store.onChange(updateAndBroadcastLeaderboard);

  server.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
  });

  // Handle server shutdown
  process.on('SIGINT', () => {
    server.close(() => {
      console.log('Server shut down gracefully');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
