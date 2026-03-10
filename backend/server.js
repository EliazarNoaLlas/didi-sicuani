import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import conectarBD from './config/database.js';
import conectarRedis from './config/redis.js';
import { inicializarSocket } from './utils/utilidades-socket.js';
import { swaggerSpec, swaggerUi } from './config/swagger.js';
import './utils/tareas-programadas.js'; // Inicializar tareas programadas

// Nota: PostgreSQL ha sido removido. El proyecto ahora usa solo MongoDB.

// Cargar variables de entorno
dotenv.config();

const aplicacion = express();
const servidorHttp = createServer(aplicacion);

// Configuración de orígenes permitidos para CORS
const origenesPermitidos = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://didi-sicuani-frontend.onrender.com',
  'https://frontend-irdyp2zf8-eliazarnoallas-projects.vercel.app',
  'https://frontend-c5puf2sjv-eliazarnoallas-projects.vercel.app',
  process.env.SOCKET_CORS_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean); // Eliminar valores undefined/null

// Configuración de Socket.io
const io = new Server(servidorHttp, {
  cors: {
    origin: (origin, callback) => {
      // Permitir requests sin origen (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (origenesPermitidos.includes(origin) || origenesPermitidos.some(allowed => origin.includes(allowed))) {
        callback(null, true);
      } else {
        // En desarrollo, permitir cualquier origen localhost
        if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
          callback(null, true);
        } else {
          callback(new Error('No permitido por CORS'));
        }
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// Inicializar Socket.io
inicializarSocket(io);

// Middleware
aplicacion.use(helmet());
aplicacion.use(compression());
aplicacion.use(morgan('dev'));

// Configuración CORS más completa
const opcionesCors = {
  origin: (origin, callback) => {
    // Permitir requests sin origen (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está en la lista de permitidos
    if (origenesPermitidos.includes(origin) || origenesPermitidos.some(allowed => origin.includes(allowed))) {
      callback(null, true);
    } else {
      // En desarrollo, permitir cualquier origen localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        // En producción, registrar el origen no permitido para debugging
        console.warn('⚠️ Origen CORS no permitido:', origin);
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

aplicacion.use(cors(opcionesCors));

aplicacion.use(express.json({ limit: '10mb' }));
aplicacion.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Documentación Swagger
aplicacion.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DiDi-Sicuani API Documentation'
}));

// Verificación de salud
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado del servidor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   example: 2024-01-15T10:30:00.000Z
 *                 servicio:
 *                   type: string
 *                   example: DiDi-Sicuani Backend
 */
aplicacion.get('/health', (req, res) => {
  res.json({ 
    estado: 'OK', 
    timestamp: new Date().toISOString(),
    servicio: 'DiDi-Sicuani Backend'
  });
});

// Rutas
import rutasAutenticacion from './routes/rutas-autenticacion.js';
import rutasUsuario from './routes/rutas-usuario.js';
import rutasConductor from './routes/rutas-conductor.js';
import rutasViajes from './routes/rutas-viajes.js';
import rutasSubasta from './routes/rutas-subasta.js';
import rutasGeocodificacion from './routes/rutas-geocodificacion.js';
import rutasRuta from './routes/rutas-ruta.js';
import rutasCola from './routes/rutas-cola.js';
import rutasAdmin from './routes/rutas-admin.js';

aplicacion.use('/api/autenticacion', rutasAutenticacion);
aplicacion.use('/api/usuarios', rutasUsuario);
aplicacion.use('/api/conductores', rutasConductor);
aplicacion.use('/api/viajes', rutasViajes);
aplicacion.use('/api/subasta', rutasSubasta);
aplicacion.use('/api/geocodificacion', rutasGeocodificacion);
aplicacion.use('/api/rutas', rutasRuta);
aplicacion.use('/api/cola', rutasCola);
aplicacion.use('/api/administrador', rutasAdmin);

// También mantener rutas legacy en inglés para compatibilidad
aplicacion.use('/api/auth', rutasAutenticacion);
aplicacion.use('/api/users', rutasUsuario);
aplicacion.use('/api/drivers', rutasConductor);
aplicacion.use('/api/rides', rutasViajes);
aplicacion.use('/api/bidding', rutasSubasta);
aplicacion.use('/api/geocoding', rutasGeocodificacion);
aplicacion.use('/api/routes', rutasRuta);
aplicacion.use('/api/queue', rutasCola);
aplicacion.use('/api/admin', rutasAdmin);
aplicacion.use('/api/ride', rutasViajes);

// Middleware de manejo de errores
aplicacion.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    exito: false,
    mensaje: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Manejador 404 - Solo para rutas que no sean de Socket.io
aplicacion.use((req, res) => {
  // Ignorar peticiones de Socket.io
  if (req.path.startsWith('/socket.io/')) {
    return res.status(404).end();
  }
  
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada'
  });
});

// Iniciar servidor
const PUERTO = process.env.PORT || 5000;

const iniciarServidor = async () => {
  try {
    // Conectar a MongoDB
    await conectarBD();
    console.log('✅ MongoDB conectado');

    // Montar Clean Architecture routes (src/app.js) bajo /api/v2 y como alias directos
    try {
      const { buildApp } = await import('./src/app.js');
      const srcApp = buildApp(io);
      // Expose under /api/v2 for explicit versioned access
      aplicacion.use('/api/v2', srcApp);
      console.log('✅ Clean Architecture modules cargados (/api/v2)');
    } catch (e) {
      console.warn('⚠️  Clean Architecture src/app.js no disponible:', e.message);
    }

    // Conectar a Redis (opcional, no crítico)
    try {
      const redis = await conectarRedis();
      if (redis && redis.isOpen) {
        console.log('✅ Redis conectado');
      } else {
        console.warn('⚠️  Redis no disponible, continuando sin cache');
      }
    } catch (error) {
      console.warn('⚠️  Redis no disponible, continuando sin cache:', error.message);
    }

    // Iniciar servidor HTTP
    servidorHttp.listen(PUERTO, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PUERTO}`);
      console.log(`📡 Socket.io listo`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`📚 Documentación API: http://localhost:${PUERTO}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

iniciarServidor();

export { io };
