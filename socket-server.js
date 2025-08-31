// Simple Socket.IO server to broadcast tournament updates across viewers
// Run locally: node socket-server.js (uses PORT 4000 by default)

const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;

// In-memory tournament snapshots keyed by accessCode
const accessCodeToTournament = new Map();
// Also map tournamentId for quick room naming
const tournamentIdToAccessCode = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
  });
  res.end('Socket server is running.\n');
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

function getRoomName(tournamentId) {
  return `tournament:${tournamentId}`;
}

io.on('connection', (socket) => {
  // Client announces it created a tournament
  socket.on('create-tournament', (tournament) => {
    if (!tournament || !tournament.accessCode || !tournament.id) return;
    accessCodeToTournament.set(tournament.accessCode, tournament);
    tournamentIdToAccessCode.set(tournament.id, tournament.accessCode);

    const room = getRoomName(tournament.id);
    socket.join(room);
    io.to(room).emit('tournament:sync', tournament);
  });

  // Client joins by access code (spectators/players)
  socket.on('join-tournament', (accessCode) => {
    const tournament = accessCodeToTournament.get(accessCode);
    if (!tournament) return; // Client should retry or show error
    const room = getRoomName(tournament.id);
    socket.join(room);
    socket.emit('tournament:sync', tournament);
  });

  // Client sends updated tournament snapshot after a score update
  socket.on('tournament:update', (tournament) => {
    if (!tournament || !tournament.id || !tournament.accessCode) return;
    accessCodeToTournament.set(tournament.accessCode, tournament);
    tournamentIdToAccessCode.set(tournament.id, tournament.accessCode);
    io.to(getRoomName(tournament.id)).emit('tournament:sync', tournament);
  });
});

server.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});


