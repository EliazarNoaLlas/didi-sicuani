import express from 'express';
import { body, param, query } from 'express-validator';
import { autenticar, autorizar } from '../../../shared/middleware/auth.middleware.js';

export function createRideRouter(controller) {
  const enrutador = express.Router();

  // POST /calculate-price - Calcular precio sin crear viaje
  enrutador.post(
    '/calculate-price',
    autenticar,
    [
      body('origin_lat').isFloat().withMessage('Se requiere la latitud de origen'),
      body('origin_lon').isFloat().withMessage('Se requiere la longitud de origen'),
      body('destination_lat').isFloat().withMessage('Se requiere la latitud de destino'),
      body('destination_lon').isFloat().withMessage('Se requiere la longitud de destino'),
      body('vehicle_type').optional().isIn(['taxi', 'mototaxi', 'cualquiera']),
    ],
    controller.pricingController ? controller.pricingController.calculatePrice : (req, res) => res.status(501).json({ exito: false, mensaje: 'No implementado' })
  );

  // GET /route - Geometría de ruta para mapa
  enrutador.get(
    '/route',
    autenticar,
    [
      query('origin_lat').isFloat(),
      query('origin_lon').isFloat(),
      query('dest_lat').isFloat(),
      query('dest_lon').isFloat(),
    ],
    controller.getRouteGeometry
  );

  // POST /request - Crear solicitud de viaje
  enrutador.post(
    '/request',
    autenticar,
    [
      body('origin_address').optional(),
      body('origen_direccion').optional(),
      body('destination_address').optional(),
      body('destino_direccion').optional(),
    ],
    controller.createRide
  );

  // GET /:id - Obtener detalles de viaje
  enrutador.get(
    '/:id',
    autenticar,
    [param('id').isMongoId()],
    controller.getRide
  );

  // POST /:id/cancel - Cancelar viaje
  enrutador.post(
    '/:id/cancel',
    autenticar,
    [param('id').isMongoId()],
    controller.cancelRide
  );

  // POST /:id/bids - Conductor envía oferta
  enrutador.post(
    '/:id/bids',
    autenticar,
    [
      param('id').isMongoId(),
      body('offered_price').isFloat({ min: 0.01 }),
    ],
    async (req, res) => {
      // Delegado al bidding container en app.js
      res.status(501).json({ exito: false, mensaje: 'Use /api/subasta para enviar ofertas' });
    }
  );

  // POST /:id/bids/:idOferta/respond - Pasajero responde oferta
  enrutador.post(
    '/:id/bids/:idOferta/respond',
    autenticar,
    [
      param('id').isMongoId(),
      param('idOferta').isMongoId(),
      body('action').isIn(['accept', 'reject', 'aceptar', 'rechazar']),
    ],
    async (req, res) => {
      res.status(501).json({ exito: false, mensaje: 'Use /api/subasta para responder ofertas' });
    }
  );

  // POST /:idViaje/rate - Calificar conductor
  enrutador.post(
    '/:idViaje/rate',
    autenticar,
    [
      param('idViaje').isMongoId(),
      body('rating').isInt({ min: 1, max: 5 }),
      body('comment').optional().isString(),
    ],
    async (req, res) => {
      // Delegado al módulo de ratings
      res.status(501).json({ exito: false, mensaje: 'Endpoint de calificación' });
    }
  );

  return enrutador;
}

export function createDriverRideRouter(rideController) {
  const enrutador = express.Router();

  enrutador.use(autenticar);
  enrutador.use(autorizar('conductor'));

  enrutador.get('/viaje-activo', rideController.getActiveRide);
  enrutador.post('/rides/:idViaje/en-route', rideController.iniciarEnRuta);
  enrutador.post('/rides/:idViaje/start', rideController.iniciarViaje);
  enrutador.post('/rides/:idViaje/complete', rideController.completarViaje);

  return enrutador;
}
