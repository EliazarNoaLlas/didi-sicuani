/**
 * Interfaz abstracta del repositorio de ofertas
 */
export class BidRepository {
  async findById(id) { throw new Error('Not implemented') }
  async findByRideId(rideId, filters) { throw new Error('Not implemented') }
  async findByDriverAndRide(driverId, rideId) { throw new Error('Not implemented') }
  async findActiveByDriver(driverId) { throw new Error('Not implemented') }
  async create(bidData) { throw new Error('Not implemented') }
  async update(id, data) { throw new Error('Not implemented') }
  async updateMany(filter, data) { throw new Error('Not implemented') }
  async countByRide(rideId) { throw new Error('Not implemented') }
  async findLowestPriceByRide(rideId) { throw new Error('Not implemented') }
}
