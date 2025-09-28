// backend/src/socket/handlers.ts
import { Server, Socket } from 'socket.io';
import { PongRoom } from '../games/pong/PongRoom';

// === Manager imports (mini-jeux + teams) ===
import { User } from '../models/User';

// Types de socket authentifiée (middleware authenticateSocket déjà branché dans server.ts)
interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

// Infos de match arcade (Pong)
type MatchInfo = {
  gameId: string;
  gameType: string;
  players: { id: string; username: string }[];
  timestamp: number;
};

// File d’attente par type de jeu (arcade)
const queues: Record<string, AuthenticatedSocket[]> = {};
const pongRooms = new Map<string, PongRoom>();

// Règles économie mini-jeux (mêmes bornes que REST)
const EARN_COOLDOWN_SEC = 60;
const EARN_MAX_PER_HOUR = 500;

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    // Si auth ok (via authenticateSocket), joindre la room user
    if (socket.userId) socket.join(`user:${socket.userId}`);

    // ====== Matchmaking PONG (inchangé) ======
    socket.on('find_match', (gameType: string) => {
      enqueue(socket, gameType);
      socket.emit('matchmaking_started', { gameType });
      tryMatch(io, gameType);
    });

    // ====== Manager - visualisation de match ======
    // Le backend "live" émet sur la room `match:${matchId}` les events:
    //  - 'match:pbp' { matchId, ev }
    //  - 'match:ended' {...}
    socket.on('match:join', ({ matchId }: { matchId: string }) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);
      socket.emit('match:joined', { matchId });
    });

    socket.on('match:leave', ({ matchId }: { matchId: string }) => {
      if (!matchId) return;
      socket.leave(`match:${matchId}`);
    });

    // ====== Mini-jeux → économie (coins) ======
    // Appel côté client à la fin de partie:
    // socket.emit('mini:score', { game: 'pong'|'runner'|'dribble', score: number })
    socket.on('mini:score', async (payload: { game: 'pong'|'runner'|'dribble'; score: number }) => {
      try {
        const userId = socket.userId;
        if (!userId) return; // pas d'auth socket → ignore

        // validation simple
        const score = Math.max(0, Math.min(1_000_000, Math.floor(payload?.score ?? 0)));
        const game = payload?.game;
        if (!['pong','runner','dribble'].includes(String(game))) return;

        // récup user
        const user = await User.findById(userId);
        if (!user) return;

        const now = new Date();
        // cooldown
        if (user.lastEarnAt && (now.getTime() - user.lastEarnAt.getTime())/1000 < EARN_COOLDOWN_SEC) {
          socket.emit('mini:reward', { error: 'cooldown', nextInSec: EARN_COOLDOWN_SEC });
          return;
        }

        // fenêtre horaire
        const wStart = user.earnWindow?.windowStart ?? new Date(now.getTime() - 3600_000);
        const inWindow = (now.getTime() - new Date(wStart).getTime()) < 3600_000;
        const current = inWindow ? (user.earnWindow?.amount ?? 0) : 0;

        const k = game === 'pong' ? 50 : game === 'runner' ? 100 : 80;
        const delta = Math.min(200, Math.floor(score / k));

        if (current + delta > EARN_MAX_PER_HOUR) {
          socket.emit('mini:reward', { error: 'hour_cap', cap: EARN_MAX_PER_HOUR });
          return;
        }

        user.coins = (user.coins ?? 0) + delta;
        user.lastEarnAt = now;
        user.earnWindow = inWindow
          ? { windowStart: wStart, amount: current + delta }
          : { windowStart: now, amount: delta };
        await user.save();

        socket.emit('mini:reward', { earned: delta, balance: user.coins });
      } catch {
        // silence
      }
    });

    // ====== Déconnexion ======
    socket.on('disconnect', () => handleDisconnect(socket));
  });
}

/* ---------- helpers ---------- */
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

    const match: MatchInfo = {
      gameId,
      gameType,
      players: [
        { id: p1.userId || p1.id, username: p1.username || 'P1' },
        { id: p2.userId || p2.id, username: p2.username || 'P2' }
      ],
      timestamp: Date.now()
    };

    // annonce du match
    p1.emit('match_found', match);
    p2.emit('match_found', match);

    // crée la room pong (p1 = bottom, p2 = top)
    const room = new PongRoom(io, gameId, p1, p2);
    pongRooms.set(gameId, room);
  }
}

function handleDisconnect(socket: AuthenticatedSocket) {
  for (const k of Object.keys(queues)) {
    queues[k] = (queues[k] || []).filter(s => s.id !== socket.id);
  }
}
