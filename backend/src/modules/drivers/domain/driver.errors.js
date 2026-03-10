import { NotFoundError, BusinessRuleError } from '../../../shared/errors/base.errors.js';

export class ConductorNoEncontradoError extends NotFoundError {
  constructor(id) {
    super(`Conductor no encontrado: ${id}`);
    this.name = 'ConductorNoEncontradoError';
  }
}

export class NoEsConductorError extends BusinessRuleError {
  constructor() {
    super('El usuario no tiene permisos de conductor');
    this.name = 'NoEsConductorError';
  }
}

export class BloqueoNoEncontradoError extends NotFoundError {
  constructor() {
    super('Bloqueo no encontrado');
    this.name = 'BloqueoNoEncontradoError';
  }
}

export class RetencionNoEncontradaError extends NotFoundError {
  constructor() {
    super('El viaje no está en espera para este conductor');
    this.name = 'RetencionNoEncontradaError';
  }
}

export class ViajeNoDisponibleError extends BusinessRuleError {
  constructor(rideId) {
    super(`El viaje ${rideId} no está disponible para retención`);
    this.name = 'ViajeNoDisponibleError';
  }
}
