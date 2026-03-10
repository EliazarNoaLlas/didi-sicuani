import express from 'express';
import { autenticar, autorizar } from '../../../shared/middleware/auth.middleware.js';

export function createMetricsRouter(controller) {
  const enrutador = express.Router();

  enrutador.use(autenticar);
  enrutador.use(autorizar('administrador'));

  // Todas las métricas en un solo request
  enrutador.get('/', controller.getAllMetrics);
  enrutador.get('/dashboard', controller.getDashboard);

  // Métricas individuales
  enrutador.get('/viajes', controller.getRideMetrics);
  enrutador.get('/rides', controller.getRideMetrics); // alias inglés

  enrutador.get('/conductores', controller.getDriverMetrics);
  enrutador.get('/drivers', controller.getDriverMetrics); // alias inglés

  enrutador.get('/ingresos', controller.getEarningsMetrics);
  enrutador.get('/earnings', controller.getEarningsMetrics); // alias inglés

  enrutador.get('/subastas', controller.getBiddingMetrics);
  enrutador.get('/bidding', controller.getBiddingMetrics); // alias inglés

  return enrutador;
}
