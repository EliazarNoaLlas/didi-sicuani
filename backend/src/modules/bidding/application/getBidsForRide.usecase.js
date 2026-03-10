import { SubastaNoActivaError } from '../domain/bid.errors.js';

/**
 * Caso de uso: Obtener ofertas para un viaje (con control de visibilidad por rol)
 */
export class GetBidsForRideUseCase {
  constructor(bidRepository, rideRepository) {
    this.bidRepository = bidRepository;
    this.rideRepository = rideRepository;
  }

  /**
   * @param {string} rideId
   * @param {object} requester - { id, role: 'pasajero'|'conductor'|'administrador' }
   */
  async execute(rideId, requester) {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new SubastaNoActivaError(rideId);

    const ahora = new Date();
    const rondaFinalizada = ride.expiresAt ? ahora >= new Date(ride.expiresAt) : false;
    const esConductor = requester.role === 'conductor' || requester.role === 'driver';
    const esPasajero = requester.id.toString() === ride.passengerId.toString();

    let ofertas = [];

    if (esConductor || (esPasajero && rondaFinalizada)) {
      // Conductores y pasajeros (después de que termine la ronda) ven las ofertas
      ofertas = await this.bidRepository.findByRideId(rideId, {
        sortBy: 'precio_ofrecido',
        populate: true,
      });
    }
    // Pasajero durante la ronda activa: no ve las ofertas individuales (solo el count)
    const totalOfertas = await this.bidRepository.countByRide(rideId);

    return {
      ride,
      rondaFinalizada,
      ofertas,
      totalOfertas,
    };
  }
}
