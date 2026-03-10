import express from 'express';
import { body, param } from 'express-validator';
import { autenticar, autorizar } from '../../../shared/middleware/auth.middleware.js';

/**
 * Crea el router de subastas/bidding
 * Monta bajo /api/subasta (alias /api/bidding)
 */
export function createBiddingRouter(controller) {
  const enrutador = express.Router();

  // Conductor envía oferta inicial
  // POST /api/subasta/:idViaje/ofertas
  enrutador.post(
    '/:idViaje/ofertas',
    autenticar,
    autorizar('conductor'),
    [
      param('idViaje').isMongoId(),
      body('offered_price').optional().isFloat({ min: 0.01 }),
      body('precio_ofrecido').optional().isFloat({ min: 0.01 }),
    ],
    controller.submitBid
  );

  // Alias inglés
  enrutador.post(
    '/:idViaje/bids',
    autenticar,
    autorizar('conductor'),
    [
      param('idViaje').isMongoId(),
      body('offered_price').optional().isFloat({ min: 0.01 }),
    ],
    controller.submitBid
  );

  // Conductor hace contraoferta (mejora su oferta)
  // POST /api/subasta/:idViaje/contraofertas
  enrutador.post(
    '/:idViaje/contraofertas',
    autenticar,
    autorizar('conductor'),
    [
      param('idViaje').isMongoId(),
      body('nuevo_precio').optional().isFloat({ min: 0.01 }),
      body('new_price').optional().isFloat({ min: 0.01 }),
    ],
    controller.makeCounteroffer
  );

  // Alias inglés
  enrutador.post(
    '/:idViaje/counteroffers',
    autenticar,
    autorizar('conductor'),
    [
      param('idViaje').isMongoId(),
      body('new_price').optional().isFloat({ min: 0.01 }),
    ],
    controller.makeCounteroffer
  );

  // Pasajero acepta una oferta
  // POST /api/subasta/:idViaje/ofertas/:idOferta/aceptar
  enrutador.post(
    '/:idViaje/ofertas/:idOferta/aceptar',
    autenticar,
    autorizar('pasajero'),
    [
      param('idViaje').isMongoId(),
      param('idOferta').isMongoId(),
    ],
    controller.acceptBid
  );

  // Alias inglés
  enrutador.post(
    '/:idViaje/bids/:idOferta/accept',
    autenticar,
    autorizar('pasajero'),
    [
      param('idViaje').isMongoId(),
      param('idOferta').isMongoId(),
    ],
    controller.acceptBid
  );

  // Pasajero rechaza una oferta
  // POST /api/subasta/:idViaje/ofertas/:idOferta/rechazar
  enrutador.post(
    '/:idViaje/ofertas/:idOferta/rechazar',
    autenticar,
    autorizar('pasajero'),
    [
      param('idViaje').isMongoId(),
      param('idOferta').isMongoId(),
    ],
    controller.rejectBid
  );

  // Alias inglés
  enrutador.post(
    '/:idViaje/bids/:idOferta/reject',
    autenticar,
    autorizar('pasajero'),
    [
      param('idViaje').isMongoId(),
      param('idOferta').isMongoId(),
    ],
    controller.rejectBid
  );

  // Responder a oferta (acción unificada: aceptar o rechazar)
  // POST /api/subasta/:idViaje/ofertas/:idOferta/responder
  enrutador.post(
    '/:idViaje/ofertas/:idOferta/responder',
    autenticar,
    autorizar('pasajero'),
    [
      param('idViaje').isMongoId(),
      param('idOferta').isMongoId(),
      body('accion').isIn(['aceptar', 'rechazar', 'accept', 'reject']),
    ],
    async (req, res, next) => {
      const accion = req.body.accion;
      if (accion === 'aceptar' || accion === 'accept') {
        return controller.acceptBid(req, res, next);
      }
      return controller.rejectBid(req, res, next);
    }
  );

  // Alias inglés
  enrutador.post(
    '/:idViaje/bids/:idOferta/respond',
    autenticar,
    autorizar('pasajero'),
    [
      param('idViaje').isMongoId(),
      param('idOferta').isMongoId(),
      body('action').isIn(['accept', 'reject', 'aceptar', 'rechazar']),
    ],
    async (req, res, next) => {
      const action = req.body.action || req.body.accion;
      if (action === 'accept' || action === 'aceptar') {
        return controller.acceptBid(req, res, next);
      }
      return controller.rejectBid(req, res, next);
    }
  );

  // Ver ofertas de un viaje
  // GET /api/subasta/:idViaje/ofertas
  enrutador.get(
    '/:idViaje/ofertas',
    autenticar,
    [param('idViaje').isMongoId()],
    controller.getBidsForRide
  );

  // Alias inglés
  enrutador.get(
    '/:idViaje/bids',
    autenticar,
    [param('idViaje').isMongoId()],
    controller.getBidsForRide
  );

  // Información de competencia para el conductor
  // GET /api/subasta/:idViaje/competencia
  enrutador.get(
    '/:idViaje/competencia',
    autenticar,
    autorizar('conductor'),
    [param('idViaje').isMongoId()],
    controller.getCompetitionInfo
  );

  return enrutador;
}
