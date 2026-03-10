import express from 'express';
import { body, param } from 'express-validator';
import { autenticar, autorizar } from '../../../shared/middleware/auth.middleware.js';

/**
 * Crea el router para endpoints de conductores
 * Monta bajo /api/conductor (alias /api/driver)
 */
export function createDriverRouter(controller) {
  const enrutador = express.Router();

  enrutador.use(autenticar);
  enrutador.use(autorizar('conductor'));

  // Cola de viajes disponibles
  enrutador.get('/cola', controller.getRideQueue);
  enrutador.get('/queue', controller.getRideQueue); // alias inglés

  // Ganancias
  enrutador.get('/ganancias', controller.getEarnings);
  enrutador.get('/earnings', controller.getEarnings); // alias inglés

  // Bloqueos
  enrutador.post(
    '/bloqueos',
    [
      body('userId').optional().isMongoId(),
      body('user_id').optional().isMongoId(),
      body('zone').optional().isString(),
      body('zona').optional().isString(),
    ],
    controller.blockUser
  );
  enrutador.post('/blocks', controller.blockUser); // alias inglés

  enrutador.delete('/bloqueos/:idUsuario', [param('idUsuario').isMongoId()], controller.unblockUser);
  enrutador.delete('/blocks/:idUsuario', [param('idUsuario').isMongoId()], controller.unblockUser); // alias inglés

  enrutador.get('/bloqueos', controller.getBlocks);
  enrutador.get('/blocks', controller.getBlocks); // alias inglés

  // Retenciones (hold)
  enrutador.post('/retenciones/:idViaje', [param('idViaje').isMongoId()], controller.holdRide);
  enrutador.post('/holds/:idViaje', [param('idViaje').isMongoId()], controller.holdRide); // alias inglés

  enrutador.delete('/retenciones/:idViaje', [param('idViaje').isMongoId()], controller.releaseHold);
  enrutador.delete('/holds/:idViaje', [param('idViaje').isMongoId()], controller.releaseHold); // alias inglés

  enrutador.get('/retenciones', controller.getHolds);
  enrutador.get('/holds', controller.getHolds); // alias inglés

  return enrutador;
}
