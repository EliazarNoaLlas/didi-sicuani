import { createClient } from 'redis';

let clienteRedis = null;
let estaConectando = false;
let intentosReconexion = 0;
const MAX_INTENTOS_RECONEXION = 5;

/**
 * Conecta al servidor Redis
 * @returns {Promise<RedisClient|null>} Cliente Redis o null si falla la conexión
 */
const conectarRedis = async () => {
  // Evitar múltiples intentos de conexión simultáneos
  if (estaConectando) {
    return clienteRedis;
  }

  if (clienteRedis && clienteRedis.isOpen) {
    return clienteRedis;
  }

  try {
    estaConectando = true;
    
    // Soporte para URL de Redis (Redis Cloud) o host/port separados
    const redisUrl = process.env.REDIS_URL;
    let redisConfig;
    
    if (redisUrl) {
      // Usar URL completa (recomendado para Redis Cloud)
      redisConfig = { url: redisUrl };
    } else {
      // Construir URL si tenemos host, port y password (para Redis Cloud)
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379');
      const password = process.env.REDIS_PASSWORD;
      
      // Si hay password y no es localhost, construir URL (Redis Cloud)
      if (password && host !== 'localhost' && host !== '127.0.0.1') {
        redisConfig = { 
          url: `redis://default:${password}@${host}:${port}` 
        };
      } else {
        // Configuración local sin password o con password local
        redisConfig = {
          host: host,
          port: port,
          ...(password && { password: password }),
        };
      }
    }
    
    clienteRedis = createClient({
      ...redisConfig,
      socket: {
        reconnectStrategy: (reintentos) => {
          if (reintentos > MAX_INTENTOS_RECONEXION) {
            console.error('❌ Redis: Máximo de intentos de reconexión alcanzado');
            return new Error('Máximo de intentos de reconexión alcanzado');
          }
          const retraso = Math.min(reintentos * 100, 3000);
          console.log(`🔄 Redis: Intentando reconectar en ${retraso}ms (intento ${reintentos}/${MAX_INTENTOS_RECONEXION})`);
          return retraso;
        },
        connectTimeout: 5000,
      },
    });

    clienteRedis.on('error', (error) => {
      console.error('❌ Error del cliente Redis:', error.message);
      // No lanzar error, solo loguear para permitir que la app continúe
    });

    clienteRedis.on('connect', () => {
      console.log('🔄 Cliente Redis conectando...');
      intentosReconexion = 0;
    });

    clienteRedis.on('ready', () => {
      console.log('✅ Redis listo');
      intentosReconexion = 0;
    });

    clienteRedis.on('reconnecting', () => {
      intentosReconexion++;
      console.log(`🔄 Redis: Reconectando... (intento ${intentosReconexion})`);
    });

    clienteRedis.on('end', () => {
      console.log('⚠️  Conexión Redis finalizada');
    });

    await clienteRedis.connect();
    estaConectando = false;
    return clienteRedis;
  } catch (error) {
    estaConectando = false;
    console.error('❌ Error al conectar a Redis:', error.message);
    // No lanzar error fatal, permitir que la app continúe sin Redis
    console.warn('⚠️  Continuando sin Redis. Algunas funcionalidades pueden estar limitadas.');
    return null;
  }
};

/**
 * Obtiene el cliente Redis actual
 * @returns {RedisClient|null} Cliente Redis o null si no está disponible
 */
const obtenerClienteRedis = () => {
  if (!clienteRedis || !clienteRedis.isOpen) {
    // Intentar reconectar si no está conectado
    console.warn('⚠️  Redis no está conectado. Intentando reconectar...');
    conectarRedis().catch(() => {
      // Si falla la reconexión, retornar null para que el código maneje el caso
    });
    
    // Si aún no hay cliente después del intento, retornar null
    if (!clienteRedis || !clienteRedis.isOpen) {
      return null;
    }
  }
  return clienteRedis;
};

export default conectarRedis;
export { obtenerClienteRedis };
// Exportar también con los nombres anteriores para compatibilidad
export { conectarRedis as connectRedis };
export { obtenerClienteRedis as getRedisClient };

