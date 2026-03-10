import UsuarioModel from '../../../shared/database/models/Usuario.model.js';
import { DriverRepository } from '../domain/driver.repository.js';
import { Driver } from '../domain/driver.entity.js';

export class DriverMongoRepository extends DriverRepository {
  _toEntity(doc) {
    if (!doc) return null;
    return new Driver(doc.toObject ? doc.toObject() : doc);
  }

  async findById(id) {
    const doc = await UsuarioModel.findOne({ _id: id, tipo_usuario: 'conductor' });
    return this._toEntity(doc);
  }

  async findAvailableDrivers(filters = {}) {
    const query = {
      tipo_usuario: 'conductor',
      'informacion_conductor.esta_en_linea': true,
      'informacion_conductor.esta_disponible': true,
    };
    const docs = await UsuarioModel.find(query);
    return docs.map((d) => this._toEntity(d));
  }

  async updateLocation(driverId, lat, lon) {
    const doc = await UsuarioModel.findByIdAndUpdate(
      driverId,
      {
        'informacion_conductor.latitud_actual': lat,
        'informacion_conductor.longitud_actual': lon,
      },
      { new: true }
    );
    return this._toEntity(doc);
  }

  async updateAvailability(driverId, isAvailable) {
    const doc = await UsuarioModel.findByIdAndUpdate(
      driverId,
      { 'informacion_conductor.esta_disponible': isAvailable },
      { new: true }
    );
    return this._toEntity(doc);
  }

  async updateOnlineStatus(driverId, isOnline) {
    const doc = await UsuarioModel.findByIdAndUpdate(
      driverId,
      { 'informacion_conductor.esta_en_linea': isOnline },
      { new: true }
    );
    return this._toEntity(doc);
  }
}
