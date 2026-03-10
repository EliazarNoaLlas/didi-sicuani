import OfertaModel from '../../../shared/database/models/Oferta.model.js';
import { BidRepository } from '../domain/bid.repository.js';
import { Bid } from '../domain/bid.entity.js';

export class BidMongoRepository extends BidRepository {
  _toEntity(doc) {
    if (!doc) return null;
    return new Bid(doc.toObject ? doc.toObject() : doc);
  }

  async findById(id) {
    const doc = await OfertaModel.findById(id);
    return this._toEntity(doc);
  }

  /**
   * @param {string} rideId
   * @param {object} filters - { excludeDriver, status, sortBy, populate }
   */
  async findByRideId(rideId, filters = {}) {
    let query = OfertaModel.find({
      id_solicitud_viaje: rideId,
      fecha_eliminacion: null,
    });

    if (filters.excludeDriver) {
      query = query.where('id_conductor').ne(filters.excludeDriver);
    }
    if (filters.status) {
      query = query.where('estado').equals(filters.status);
    }
    if (filters.sortBy) {
      query = query.sort({ [filters.sortBy]: 1 });
    }
    if (filters.populate) {
      query = query.populate('id_conductor', 'nombre informacion_conductor');
    }

    const docs = await query.exec();
    return docs.map((d) => this._toEntity(d));
  }

  async findByDriverAndRide(driverId, rideId) {
    const doc = await OfertaModel.findOne({
      id_conductor: driverId,
      id_solicitud_viaje: rideId,
      estado: 'pendiente',
      fecha_eliminacion: null,
    });
    return this._toEntity(doc);
  }

  async findActiveByDriver(driverId) {
    const docs = await OfertaModel.find({
      id_conductor: driverId,
      estado: 'pendiente',
      fecha_eliminacion: null,
    });
    return docs.map((d) => this._toEntity(d));
  }

  async create(bidData) {
    const doc = await OfertaModel.create(bidData);
    return this._toEntity(doc);
  }

  async update(id, data) {
    const doc = await OfertaModel.findByIdAndUpdate(id, data, { new: true });
    return this._toEntity(doc);
  }

  async updateMany(filter, data) {
    return OfertaModel.updateMany(filter, data);
  }

  async countByRide(rideId) {
    return OfertaModel.countDocuments({
      id_solicitud_viaje: rideId,
      estado: 'pendiente',
      fecha_eliminacion: null,
    });
  }

  async findLowestPriceByRide(rideId) {
    const doc = await OfertaModel.findOne({
      id_solicitud_viaje: rideId,
      estado: 'pendiente',
      fecha_eliminacion: null,
    }).sort({ precio_ofrecido: 1 });
    return this._toEntity(doc);
  }
}
