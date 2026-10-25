const { Server } = require('socket.io');
const { getLeaderboard } = require('../services/teamService');

let io;

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
    console.log('Total connected users:', io.engine.clientsCount);

    // Send the current leaderboard to the newly connected client
    sendLeaderboard(socket);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      console.log('Total connected users:', io.engine.clientsCount);
    });
  });

  return io;
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

module.exports = { initWebSocketServer, broadcastLeaderboard };
