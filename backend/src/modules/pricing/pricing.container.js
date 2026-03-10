import express from 'express';
import { body } from 'express-validator';
import { autenticar } from '../../shared/middleware/auth.middleware.js';
import { PricingUseCase } from './application/pricing.usecase.js';
import { PricingController } from './interfaces/pricing.controller.js';

export function buildPricingContainer() {
  const pricingUseCase = new PricingUseCase();
  const controller = new PricingController(pricingUseCase);

  const router = express.Router();
  router.post(
    '/calculate',
    autenticar,
    [
      body('origin_lat').isFloat(),
      body('origin_lon').isFloat(),
      body('destination_lat').isFloat(),
      body('destination_lon').isFloat(),
      body('vehicle_type').optional().isIn(['taxi', 'mototaxi', 'cualquiera']),
    ],
    controller.calculatePrice
  );
  // alias español
  router.post('/calcular', autenticar, controller.calculatePrice);

  return { pricingUseCase, controller, router, pricingService: pricingUseCase };
}
