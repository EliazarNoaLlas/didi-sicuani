import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';
import { RideRepository } from '../domain/ride.repository.js';
import { Ride } from '../domain/ride.entity.js';

export class RideMongoRepository extends RideRepository {
  _toEntity(doc) {
    if (!doc) return null;
    const plain = doc.toObject ? doc.toObject() : doc;
    return new Ride(plain);
  }

  async findById(id) {
    const doc = await SolicitudViajeModel.findById(id);
    return this._toEntity(doc);
  }

  async findByIdRaw(id) {
    return SolicitudViajeModel.findById(id);
  }

  async save(rideData) {
    const doc = await SolicitudViajeModel.create(rideData);
    return doc; // Return raw doc for notification compatibility
  }

  async updateStatus(id, status, extraFields = {}) {
    return SolicitudViajeModel.findByIdAndUpdate(
      id,
      { estado: status, ...extraFields },
      { new: true }
    );
  }

  async findByPassengerId(passengerId, filters = {}) {
    return SolicitudViajeModel.find({
      id_pasajero: passengerId,
      fecha_eliminacion: null,
      ...filters,
    })
      .populate('id_conductor_asignado', 'nombre correo telefono informacion_conductor')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByDriverId(driverId, filters = {}) {
    return SolicitudViajeModel.find({
      id_conductor_asignado: driverId,
      fecha_eliminacion: null,
      ...filters,
    })
      .populate('id_pasajero', 'nombre correo telefono')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findActiveBiddingRides(driverId) {
    return SolicitudViajeModel.find({
      estado: 'subasta_activa',
      fecha_expiracion: { $gt: new Date() },
      fecha_eliminacion: null,
      $or: [
        { id_conductor_asignado: { $exists: false } },
        { id_conductor_asignado: null },
        { id_conductor_asignado: driverId },
      ],
    }).populate('id_pasajero', 'nombre correo telefono');
  }

  async findActiveRideForDriver(driverId) {
    return SolicitudViajeModel.findOne({
      id_conductor_asignado: driverId,
      estado: { $in: ['asignado', 'conductor_en_ruta', 'en_progreso'] },
    })
      .populate('id_pasajero', 'nombre correo telefono')
      .lean();
  }

  async update(id, fields) {
    return SolicitudViajeModel.findByIdAndUpdate(id, fields, { new: true });
  }

  async cancel(id) {
    return SolicitudViajeModel.findByIdAndUpdate(id, { estado: 'cancelado' });
  }

  async softDeleteByPassenger(passengerId, rideIds, deleteAll) {
    const filtro = { id_pasajero: passengerId, fecha_eliminacion: null };
    if (!deleteAll) filtro._id = { $in: rideIds };
    return SolicitudViajeModel.updateMany(filtro, {
      fecha_eliminacion: new Date(),
      eliminado_por: passengerId,
    });
  }

  async softDeleteByDriver(driverId, rideIds, deleteAll) {
    const filtro = { id_conductor_asignado: driverId, fecha_eliminacion: null };
    if (!deleteAll) filtro._id = { $in: rideIds };
    return SolicitudViajeModel.updateMany(filtro, {
      fecha_eliminacion: new Date(),
      eliminado_por: driverId,
    });
  }
}
