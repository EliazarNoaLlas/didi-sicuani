import { NotFoundError, BusinessRuleError, ConflictError } from '../../../shared/errors/base.errors.js';

export class OfertaNoEncontradaError extends NotFoundError {
  constructor(id) {
    super(`Oferta no encontrada: ${id}`);
    this.name = 'OfertaNoEncontradaError';
  }
}

export class OfertaDuplicadaError extends ConflictError {
  constructor(driverId, rideId) {
    super(`El conductor ${driverId} ya tiene una oferta activa para el viaje ${rideId}`);
    this.name = 'OfertaDuplicadaError';
  }
}

export class OfertaExpiradaError extends BusinessRuleError {
  constructor() {
    super('La oferta ha expirado');
    this.name = 'OfertaExpiradaError';
  }
}

export class ContraofertaNoPermitidaError extends BusinessRuleError {
  constructor(reason) {
    super(reason || 'No se puede realizar contraoferta en este momento');
    this.name = 'ContraofertaNoPermitidaError';
  }
}

export class SubastaNoActivaError extends BusinessRuleError {
  constructor(rideId) {
    super(`La subasta para el viaje ${rideId} no está activa`);
    this.name = 'SubastaNoActivaError';
  }
}

export class OfertaEstadoInvalidoError extends BusinessRuleError {
  constructor(estadoActual, accion) {
    super(`No se puede realizar '${accion}' en una oferta con estado '${estadoActual}'`);
    this.name = 'OfertaEstadoInvalidoError';
  }
}

export class PrecioInvalidoError extends BusinessRuleError {
  constructor(reason) {
    super(reason || 'El precio ofrecido no es válido');
    this.name = 'PrecioInvalidoError';
  }
}
