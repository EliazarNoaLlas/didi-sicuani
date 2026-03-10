/**
 * Interfaz abstracta del repositorio de autenticación
 */
export class AuthRepository {
  async findByEmail(correo) { throw new Error('Not implemented') }
  async findById(id) { throw new Error('Not implemented') }
  async create(userData) { throw new Error('Not implemented') }
  async existsByEmail(correo) { throw new Error('Not implemented') }
}
