const { Server } = require('socket.io');
const { getLeaderboard } = require('../services/teamService');
const { getDatabase } = require('../config/database');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 1,
});

let io;
const users = new Set();

// Initialize WebSocket Server
function initWebSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);
    users.add(socket.id);
    console.log('Total connected users:', users.size);

    // Send the current leaderboard to the newly connected client
    sendLeaderboard(socket);

    socket.on('someEvent', async (data) => {
      try {
        await rateLimiter.consume(socket.id);
      } catch (rejRes) {
        socket.emit('rateLimitExceeded', 'Too many requests, please try again later.');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      users.delete(socket.id);
      console.log('Total connected users:', users.size);
    });
  });
}

// Helper to fetch and send leaderboard to a specific socket
async function sendLeaderboard(socket) {
  try {
    const leaderboard = await getLeaderboard();
    socket.emit('leaderboard_update', leaderboard);
  } catch (error) {
    console.error('Error sending leaderboard to client:', error);
  }
}

// Broadcast the leaderboard to all connected clients
function broadcastLeaderboard(leaderboard) {
  if (io) {
    io.emit('leaderboard_update', leaderboard);
    console.log('Broadcasted leaderboard to all clients.');
  }
}

// Set up MongoDB change stream and watch for updates
function setupChangeStream() {
  const db = getDatabase();
  const Teams = db.collection(process.env.TABLE_NAME);
  const changeStream = Teams.watch();

  console.log('Change stream setup complete.');

  changeStream.on('change', async (change) => {
    //console.log('Change detected in Teams collection:', change);

    try {
      const leaderboard = await getLeaderboard(); // Fetch the updated leaderboard
      broadcastLeaderboard(leaderboard); // Broadcast to all connected clients
    } catch (error) {
      console.error('Error broadcasting updated leaderboard:', error);
    }
  });

  // Handle errors in the change stream and attempt reconnection
  changeStream.on('error', (error) => {
    console.error('Change stream error:', error);

    setTimeout(() => {
      console.log('Reconnecting to the change stream...');
      setupChangeStream(); // Attempt to reinitialize the stream
    }, 5000); // Retry after 5 seconds
  });
}

module.exports = { initWebSocketServer, broadcastLeaderboard, setupChangeStream };
