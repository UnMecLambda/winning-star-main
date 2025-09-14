import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Charge toujours le .env situé dans backend/.env
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

// Security middleware
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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/rackets', racketRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Socket.IO setup
io.use(authenticateSocket);
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
    await seedRacketData();
    await seedCharacterData();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 CORS enabled for: http://localhost:4200, http://127.0.0.1:4200, http://localhost:3000, http://127.0.0.1:3000`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };
