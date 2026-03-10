import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CredencialesInvalidasError } from '../domain/auth.errors.js';

export class LoginUseCase {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async execute({ correo, contrasena }) {
    const usuario = await this.authRepository.findByEmail(correo);

    if (!usuario) {
      throw new CredencialesInvalidasError();
    }

    const contrasenaCoincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaCoincide) {
      throw new CredencialesInvalidasError();
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        tipoUsuario: usuario.tipoUsuario,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return {
      usuario: usuario.toPublicJSON(),
      token,
    };
  }
}
