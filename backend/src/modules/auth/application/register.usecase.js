import bcrypt from 'bcryptjs';
import { UsuarioYaExisteError } from '../domain/auth.errors.js';

export class RegisterUseCase {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async execute({ correo, contrasena, nombre, tipoUsuario, telefono }) {
    const existe = await this.authRepository.existsByEmail(correo);
    if (existe) {
      throw new UsuarioYaExisteError();
    }

    const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

    const usuario = await this.authRepository.create({
      correo,
      contrasena: contrasenaHasheada,
      nombre,
      tipo_usuario: tipoUsuario,
      telefono,
    });

    return {
      usuario: usuario.toPublicJSON(),
    };
  }
}
