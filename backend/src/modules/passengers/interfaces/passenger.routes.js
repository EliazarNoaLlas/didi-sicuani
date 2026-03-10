import express from 'express';
import { body, param } from 'express-validator';
import { autenticar, autorizar } from '../../../shared/middleware/auth.middleware.js';

/**
 * Crea el router para endpoints de pasajeros
 * Monta bajo /api/pasajero (alias /api/passenger)
 */
export function createPassengerRouter(controller) {
  const enrutador = express.Router();

  enrutador.use(autenticar);
  enrutador.use(autorizar('pasajero'));

  // Historial de viajes
  enrutador.get('/historial', controller.getHistory);
  enrutador.get('/history', controller.getHistory); // alias inglés

  // Borrar historial (soft delete)
  enrutador.delete('/historial', controller.deleteHistory);
  enrutador.delete('/history', controller.deleteHistory); // alias inglés

  // Calificar conductor
  enrutador.post(
    '/viajes/:idViaje/calificar',
    [
      param('idViaje').isMongoId(),
      body('calificacion').optional().isInt({ min: 1, max: 5 }),
      body('rating').optional().isInt({ min: 1, max: 5 }),
      body('comentario').optional().isString(),
      body('comment').optional().isString(),
    ],
    controller.rateDriver
  );

  // Alias inglés
  enrutador.post(
    '/rides/:idViaje/rate',
    [
      param('idViaje').isMongoId(),
      body('rating').isInt({ min: 1, max: 5 }),
      body('comment').optional().isString(),
    ],
    controller.rateDriver
  );

  return enrutador;
}
