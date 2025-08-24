import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient>;

export async function connectRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    // Redis is optional for MVP, continue without it
    console.warn('⚠️ Continuing without Redis cache');
  }
}

export function getRedisClient() {
  return redisClient;
}