/**
 * Interfaz abstracta del repositorio de viajes
 */
export class RideRepository {
  async findById(id) { throw new Error('Not implemented') }
  async save(rideData) { throw new Error('Not implemented') }
  async updateStatus(id, status, extraFields) { throw new Error('Not implemented') }
  async findByPassengerId(passengerId, filters) { throw new Error('Not implemented') }
  async findByDriverId(driverId, filters) { throw new Error('Not implemented') }
  async findActiveBiddingRides(driverId) { throw new Error('Not implemented') }
  async findActiveRideForDriver(driverId) { throw new Error('Not implemented') }
  async update(id, fields) { throw new Error('Not implemented') }
  async cancel(id) { throw new Error('Not implemented') }
  async softDeleteByPassenger(passengerId, rideIds, deleteAll) { throw new Error('Not implemented') }
  async softDeleteByDriver(driverId, rideIds, deleteAll) { throw new Error('Not implemented') }
}
