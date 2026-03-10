import { createClient } from 'redis';

let clienteRedis = null;
let estaConectando = false;
const MAX_INTENTOS_RECONEXION = 5;

const conectarRedis = async () => {
  if (estaConectando) return clienteRedis;
  if (clienteRedis && clienteRedis.isOpen) return clienteRedis;

  try {
    estaConectando = true;
    const redisUrl = process.env.REDIS_URL;
    let redisConfig;

    if (redisUrl) {
      redisConfig = { url: redisUrl };
    } else {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379');
      const password = process.env.REDIS_PASSWORD;
      if (password && host !== 'localhost' && host !== '127.0.0.1') {
        redisConfig = { url: `redis://default:${password}@${host}:${port}` };
      } else {
        redisConfig = { host, port, ...(password && { password }) };
      }
    }

    clienteRedis = createClient({
      ...redisConfig,
      socket: {
        reconnectStrategy: (reintentos) => {
          if (reintentos > MAX_INTENTOS_RECONEXION) return new Error('Máximo de intentos alcanzado');
          return Math.min(reintentos * 100, 3000);
        },
        connectTimeout: 5000,
      },
    });

    clienteRedis.on('error', (error) => console.error('❌ Error Redis:', error.message));
    clienteRedis.on('ready', () => console.log('✅ Redis listo'));

    await clienteRedis.connect();
    estaConectando = false;
    return clienteRedis;
  } catch (error) {
    estaConectando = false;
    console.error('❌ Error al conectar a Redis:', error.message);
    console.warn('⚠️  Continuando sin Redis.');
    return null;
  }
};

const obtenerClienteRedis = () => {
  if (!clienteRedis || !clienteRedis.isOpen) {
    conectarRedis().catch(() => {});
    if (!clienteRedis || !clienteRedis.isOpen) return null;
  }
  return clienteRedis;
};

export default conectarRedis;
export { obtenerClienteRedis };
export { conectarRedis as connectRedis };
export { obtenerClienteRedis as getRedisClient };