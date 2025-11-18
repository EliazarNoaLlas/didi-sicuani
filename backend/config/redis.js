import { createClient } from 'redis';

let redisClient = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const connectRedis = async () => {
  // Evitar múltiples intentos de conexión simultáneos
  if (isConnecting) {
    return redisClient;
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    isConnecting = true;
    
    redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ Redis: Máximo de intentos de reconexión alcanzado');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 100, 3000);
          console.log(`🔄 Redis: Intentando reconectar en ${delay}ms (intento ${retries}/${MAX_RECONNECT_ATTEMPTS})`);
          return delay;
        },
        connectTimeout: 5000,
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      // No lanzar error, solo loguear para permitir que la app continúe
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      reconnectAttempts = 0;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
      reconnectAttempts = 0;
    });

    redisClient.on('reconnecting', () => {
      reconnectAttempts++;
      console.log(`🔄 Redis: Reconectando... (intento ${reconnectAttempts})`);
    });

    redisClient.on('end', () => {
      console.log('Redis connection ended');
    });

    await redisClient.connect();
    isConnecting = false;
    return redisClient;
  } catch (error) {
    isConnecting = false;
    console.error('Error connecting to Redis:', error.message);
    // No lanzar error fatal, permitir que la app continúe sin Redis
    console.warn('⚠️  Continuando sin Redis. Algunas funcionalidades pueden estar limitadas.');
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    // Intentar reconectar si no está conectado
    console.warn('⚠️  Redis no está conectado. Intentando reconectar...');
    connectRedis().catch(() => {
      // Si falla la reconexión, retornar null para que el código maneje el caso
    });
    
    // Si aún no hay cliente después del intento, retornar null
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }
  }
  return redisClient;
};

export default connectRedis;
export { getRedisClient };

