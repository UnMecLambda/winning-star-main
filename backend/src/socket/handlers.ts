import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

type MatchInfo = {
  gameId: string;
  gameType: string;
  players: { id: string; username: string }[];
  timestamp: number;
};

const queues: Record<string, AuthenticatedSocket[]> = {};

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => handleDisconnect(socket));

    socket.on('find_match', (gameType: string) => {
      enqueue(socket, gameType);
      socket.emit('matchmaking_started', { gameType });
      tryMatch(io, gameType);
    });

    socket.on('game_ready', (gameId: string) => {
      socket.to(gameId).emit('opponent_ready', { playerId: socket.userId });
    });

    socket.on('game_input', ({ gameId, input }) => {
      socket.to(gameId).emit('player_input', { playerId: socket.userId, input, ts: Date.now() });
    });
  });
}

function enqueue(socket: AuthenticatedSocket, gameType: string) {
  queues[gameType] = queues[gameType] || [];
  if (!queues[gameType].some(s => s.id === socket.id)) queues[gameType].push(socket);
}

function tryMatch(io: Server, gameType: string) {
  const q = queues[gameType] || [];
  while (q.length >= 2) {
    const p1 = q.shift()!;
    const p2 = q.shift()!;
    const gameId = `game:${gameType}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;
    p1.join(gameId); p2.join(gameId);
    const match: MatchInfo = {
      gameId, gameType,
      players: [
        { id: p1.userId || p1.id, username: p1.username || 'P1' },
        { id: p2.userId || p2.id, username: p2.username || 'P2' }
      ],
      timestamp: Date.now()
    };
    io.to(p1.id).emit('match_found', match);
    io.to(p2.id).emit('match_found', match);
  }
}

function handleDisconnect(socket: AuthenticatedSocket) {
  for (const k of Object.keys(queues)) queues[k] = (queues[k] || []).filter(s => s.id !== socket.id);
}
