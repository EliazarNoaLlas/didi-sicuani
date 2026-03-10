import { NotFoundError, BusinessRuleError, AuthorizationError } from '../../../shared/errors/base.errors.js';

export class ViajeNoEncontradoError extends NotFoundError {
  constructor() {
    super('Viaje no encontrado');
    this.code = 'RIDE_NOT_FOUND';
  }
}

export class ViajeNoPermitidoError extends AuthorizationError {
  constructor(mensaje = 'No autorizado para este viaje') {
    super(mensaje);
    this.code = 'RIDE_UNAUTHORIZED';
  }
}

export class TransicionEstadoInvalidaError extends BusinessRuleError {
  constructor(estadoActual, estadoNuevo) {
    super(`No se puede cambiar de estado '${estadoActual}' a '${estadoNuevo}'`);
    this.code = 'INVALID_STATE_TRANSITION';
  }
}

export class ViajeNoAceptandoOfertasError extends BusinessRuleError {
  constructor() {
    super('Este viaje ya no está aceptando ofertas');
    this.code = 'RIDE_NOT_ACCEPTING_BIDS';
  }
}
