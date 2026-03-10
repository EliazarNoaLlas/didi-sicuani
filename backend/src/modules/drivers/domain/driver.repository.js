/**
 * Interfaz abstracta del repositorio de conductores
 */
export class DriverRepository {
  async findById(id) { throw new Error('Not implemented') }
  async findAvailableDrivers(filters) { throw new Error('Not implemented') }
  async updateLocation(driverId, lat, lon) { throw new Error('Not implemented') }
  async updateAvailability(driverId, isAvailable) { throw new Error('Not implemented') }
  async updateOnlineStatus(driverId, isOnline) { throw new Error('Not implemented') }
}
