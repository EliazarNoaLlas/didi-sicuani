/**
 * app.js — Ensamblaje de la aplicación Clean Architecture
 *
 * Importa todos los módulos, construye los containers con DI,
 * registra las rutas (español + inglés) y configura Socket.io.
 *
 * Esta función es llamada desde server.js después de conectar MongoDB.
 */

import express from 'express';

// Módulo containers
import { buildAuthContainer } from './modules/auth/auth.container.js';
import { buildNotificationsContainer } from './modules/notifications/notifications.container.js';
import { buildPricingContainer } from './modules/pricing/pricing.container.js';
import { buildRidesContainer } from './modules/rides/rides.container.js';
import { buildBiddingContainer } from './modules/bidding/bidding.container.js';
import { buildDriversContainer } from './modules/drivers/drivers.container.js';
import { buildPassengersContainer } from './modules/passengers/passengers.container.js';
import { buildMetricsContainer } from './modules/metrics/metrics.container.js';

/**
 * Construye y configura la aplicación Express con todos los módulos.
 * @param {import('socket.io').Server} io - Instancia de Socket.io
 * @returns {express.Application} Aplicación Express configurada
 */
export function buildApp(io) {
  const app = express();

  // ─── 1. Construir módulos con Dependency Injection ───────────────────────

  // Notifications (necesita io, se construye primero porque lo usan otros módulos)
  const notificationsContainer = buildNotificationsContainer(io);
  const { notificationService } = notificationsContainer;

  // Pricing (sin dependencias externas)
  const pricingContainer = buildPricingContainer();
  const pricingService = pricingContainer.pricingService; // alias for pricingUseCase

  // Auth
  const authContainer = buildAuthContainer();

  // Rides (depende de pricing y notifications)
  const ridesContainer = buildRidesContainer(pricingService, notificationService);

  // Bidding (depende de rideRepository y notifications)
  const biddingContainer = buildBiddingContainer(ridesContainer.rideRepository, notificationService);

  // Drivers (depende de notifications)
  const driversContainer = buildDriversContainer(notificationService);

  // Passengers (depende de notifications)
  const passengersContainer = buildPassengersContainer(notificationService);

  // Metrics (sin dependencias externas)
  const metricsContainer = buildMetricsContainer();

  // ─── 2. Inicializar Socket.io handler con soporte de bidding ─────────────
  notificationsContainer.initialize(biddingContainer.socketHandler);

  // ─── 3. Registrar rutas ───────────────────────────────────────────────────

  const router = express.Router();

  // Auth — /api/autenticacion y /api/auth
  router.use('/autenticacion', authContainer.router);
  router.use('/auth', authContainer.router);

  // Pricing — /api/precios y /api/pricing
  if (pricingContainer.router) {
    router.use('/precios', pricingContainer.router);
    router.use('/pricing', pricingContainer.router);
  }

  // Rides — /api/viajes y /api/rides
  router.use('/viajes', ridesContainer.router);
  router.use('/rides', ridesContainer.router);

  // Driver ride actions (estado del viaje activo) — /api/conductor y /api/driver
  if (ridesContainer.driverRouter) {
    router.use('/conductor', ridesContainer.driverRouter);
    router.use('/driver', ridesContainer.driverRouter);
  }

  // Bidding / Subasta — /api/subasta y /api/bidding
  router.use('/subasta', biddingContainer.router);
  router.use('/bidding', biddingContainer.router);

  // Drivers (cola, bloqueos, retenciones, ganancias) — /api/conductor y /api/driver
  router.use('/conductor', driversContainer.router);
  router.use('/driver', driversContainer.router);

  // Passengers (historial, calificaciones) — /api/pasajero y /api/passenger
  router.use('/pasajero', passengersContainer.router);
  router.use('/passenger', passengersContainer.router);

  // Metrics (admin only) — /api/metricas y /api/metrics
  router.use('/metricas', metricsContainer.router);
  router.use('/metrics', metricsContainer.router);

  // Montar todos los routers (el prefijo /api lo agrega server.js al montar en /api/v2)
  app.use('/', router);

  // ─── 4. Health check ──────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      architecture: 'Clean Architecture / Modular Monolith',
      modules: ['auth', 'rides', 'bidding', 'drivers', 'passengers', 'pricing', 'metrics', 'notifications'],
    });
  });

  return app;
}

/**
 * Exportar containers para uso en tests o scripts de mantenimiento
 */
export { buildAuthContainer, buildNotificationsContainer, buildPricingContainer, buildRidesContainer };
