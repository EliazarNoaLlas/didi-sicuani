import { AppError, AuthenticationError, ConflictError } from '../../../shared/errors/base.errors.js';

export class CredencialesInvalidasError extends AuthenticationError {
  constructor() {
    super('Credenciales inválidas');
    this.code = 'INVALID_CREDENTIALS';
  }
}

export class UsuarioYaExisteError extends ConflictError {
  constructor() {
    super('El usuario ya existe');
    this.code = 'USER_ALREADY_EXISTS';
  }
}

export class TokenInvalidoError extends AuthenticationError {
  constructor() {
    super('Token inválido o expirado');
    this.code = 'INVALID_TOKEN';
  }
}
