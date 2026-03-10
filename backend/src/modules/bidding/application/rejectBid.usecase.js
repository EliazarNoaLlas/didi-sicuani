import { OfertaNoEncontradaError, OfertaEstadoInvalidoError } from '../domain/bid.errors.js';
import { AuthorizationError } from '../../../shared/errors/base.errors.js';

/**
 * Caso de uso: Pasajero rechaza una oferta de conductor
 */
export class RejectBidUseCase {
  constructor(bidRepository, rideRepository, notificationService) {
    this.bidRepository = bidRepository;
    this.rideRepository = rideRepository;
    this.notificationService = notificationService;
  }

  async execute({ passengerId, rideId, bidId }) {
    const ahora = new Date();

    // 1. Obtener y validar la oferta
    const bid = await this.bidRepository.findById(bidId);
    if (!bid) throw new OfertaNoEncontradaError(bidId);
    if (bid.rideId.toString() !== rideId.toString()) {
      throw new OfertaNoEncontradaError(bidId);
    }
    if (bid.status !== 'pendiente') {
      throw new OfertaEstadoInvalidoError(bid.status, 'rechazar');
    }

    // 2. Validar propiedad del viaje
    const ride = await this.rideRepository.findById(rideId);
    if (!ride || ride.passengerId.toString() !== passengerId.toString()) {
      throw new AuthorizationError('No autorizado para rechazar esta oferta');
    }

    // 3. Marcar oferta como rechazada
    await this.bidRepository.update(bidId, {
      estado: 'rechazada',
      fecha_respuesta: ahora,
    });

    // 4. Notificar al conductor
    if (this.notificationService?.notifyDriverBidRejected) {
      await this.notificationService.notifyDriverBidRejected(bid.driverId, bidId, rideId);
    }

    return { bidId, rideId, driverId: bid.driverId };
  }
}
