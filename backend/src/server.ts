import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { mountManager } from './mountManager';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import storeRoutes from './routes/store';
import racketRoutes from './routes/rackets';
import characterRoutes from './routes/characters';
import gameRoutes from './routes/game';
import ledgerRoutes from './routes/ledger';
import withdrawalRoutes from './routes/withdrawals';
import { setupSocketHandlers } from './socket/handlers';
import { errorHandler } from './middleware/errorHandler';
import { authenticateSocket } from './middleware/socketAuth';
import { seedRacketData } from './data/rackets';
import { seedCharacterData } from './data/characters';

// 👇 live Manager
import { setLiveIO } from './manager/services/live';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:4200',
      'http://127.0.0.1:4200',
      process.env.GAME_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:4200',
    'http://127.0.0.1:4200',
    process.env.GAME_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Manager REST
mountManager(app);

// autres routes existantes…
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/rackets', racketRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use(errorHandler);

// sockets
io.use(authenticateSocket);
setupSocketHandlers(io);

// 👇 branche le live + handler join_room
// Live manager
setLiveIO(io);
io.on('connection', (socket) => {
  console.log('[socket] connected', socket.id, 'userId=', (socket as any).userId);

  socket.on('join_room', (room: string, ack?: (res: { ok: boolean }) => void) => {
    try {
      socket.join(room);
      console.log('[socket] join_room', room, 'by', socket.id);
      ack?.({ ok: true });
    } catch {
      ack?.({ ok: false });
    }
  });

  socket.on('disconnect', () => console.log('[socket] disconnected', socket.id));
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
    await seedRacketData();
    await seedCharacterData();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
startServer();

export { io };
