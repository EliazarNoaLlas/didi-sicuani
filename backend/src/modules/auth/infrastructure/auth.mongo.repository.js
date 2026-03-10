import UsuarioModel from '../../../shared/database/models/Usuario.model.js';
import { AuthRepository } from '../domain/auth.repository.js';
import { User } from '../domain/user.entity.js';

export class AuthMongoRepository extends AuthRepository {
  _toEntity(doc) {
    if (!doc) return null;
    const plain = doc.toObject ? doc.toObject() : doc;
    const entity = new User(plain);
    // Preservar contrasena para comparación si fue seleccionada
    entity.contrasena = plain.contrasena;
    return entity;
  }

  async findByEmail(correo) {
    const doc = await UsuarioModel.findOne({ correo }).select('+contrasena');
    return this._toEntity(doc);
  }

  async findById(id) {
    const doc = await UsuarioModel.findById(id);
    return this._toEntity(doc);
  }

  async create(userData) {
    const doc = await UsuarioModel.create(userData);
    return this._toEntity(doc);
  }

  async existsByEmail(correo) {
    const count = await UsuarioModel.countDocuments({ correo });
    return count > 0;
  }
}
