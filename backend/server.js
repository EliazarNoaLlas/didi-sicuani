import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import connectRedis from './config/redis.js';
import { initializeSocket } from './utils/socket.js';
import { swaggerSpec, swaggerUi } from './config/swagger.js';
import './utils/cron.js'; // Inicializar cron jobs

// Nota: PostgreSQL ha sido removido. El proyecto ahora usa solo MongoDB.

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize Socket.io
initializeSocket(io);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DiDi-Sicuani API Documentation'
}));

// Health check
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
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   example: 2024-01-15T10:30:00.000Z
 *                 service:
 *                   type: string
 *                   example: DiDi-Sicuani Backend
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'DiDi-Sicuani Backend'
  });
});

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import driverRoutes from './routes/driver.routes.js';
import rideRoutes from './routes/rides.routes.js';
import biddingRoutes from './routes/bidding.routes.js';
import geocodingRoutes from './routes/geocoding.routes.js';
import routeRoutes from './routes/route.routes.js';
import queueRoutes from './routes/queue.routes.js';
import adminRoutes from './routes/admin.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bidding', biddingRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);

// También mantener ruta legacy para compatibilidad
app.use('/api/ride', rideRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected');

    // Connect to Redis (opcional, no crítico)
    try {
      const redis = await connectRedis();
      if (redis && redis.isOpen) {
        console.log('✅ Redis connected');
      } else {
        console.warn('⚠️  Redis no disponible, continuando sin cache');
      }
    } catch (error) {
      console.warn('⚠️  Redis no disponible, continuando sin cache:', error.message);
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };

