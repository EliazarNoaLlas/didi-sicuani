import { OfertaNoEncontradaError, OfertaEstadoInvalidoError, SubastaNoActivaError } from '../domain/bid.errors.js';
import { AuthorizationError } from '../../../shared/errors/base.errors.js';

/**
 * Caso de uso: Pasajero acepta una oferta → asigna el viaje al conductor
 */
export class AcceptBidUseCase {
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
      throw new OfertaEstadoInvalidoError(bid.status, 'aceptar');
    }

    // 2. Validar que el viaje pertenece al pasajero y está activo
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) throw new SubastaNoActivaError(rideId);
    if (ride.passengerId.toString() !== passengerId.toString()) {
      throw new AuthorizationError('No autorizado para aceptar esta oferta');
    }
    if (ride.status !== 'subasta_activa' && ride.status !== 'pendiente') {
      throw new SubastaNoActivaError(rideId);
    }

    // 3. Actualizar la solicitud de viaje: estado → asignado
    await this.rideRepository.update(rideId, {
      estado: 'asignado',
      id_conductor_asignado: bid.driverId,
      fecha_asignacion: ahora,
      precio_final_acordado: bid.offeredPrice,
    });

    // 4. Marcar oferta como aceptada
    await this.bidRepository.update(bidId, {
      estado: 'aceptada',
      fecha_respuesta: ahora,
    });

    // 5. Rechazar todas las demás ofertas
    await this.bidRepository.updateMany(
      { id_solicitud_viaje: rideId, _id: { $ne: bidId } },
      { estado: 'rechazada' }
    );

    // 6. Notificar al conductor asignado con todos los detalles
    if (this.notificationService?.notifyDriverRideAccepted) {
      await this.notificationService.notifyDriverRideAccepted(bid.driverId, { rideId, bidId, passengerId, ride, bid });
    } else if (this.notificationService?.notifyDriverBidAccepted) {
      await this.notificationService.notifyDriverBidAccepted(bid.driverId, rideId, bidId, {}, ride, bid.offeredPrice);
    }

    // 7. Notificar al pasajero con datos del conductor
    if (this.notificationService?.notifyPassengerRideAssigned) {
      await this.notificationService.notifyPassengerRideAssigned(passengerId, {
        rideId, bidId, driverId: bid.driverId, ride, bid,
      });
    } else if (this.notificationService?.notifyPassengerRideAccepted) {
      await this.notificationService.notifyPassengerRideAccepted(
        passengerId, rideId, bidId, bid.driverId, {}, bid.offeredPrice, ride
      );
    }

    // 8. Notificar a todos los conductores que la subasta cerró
    if (this.notificationService?.notifyDriversRideAssigned) {
      await this.notificationService.notifyDriversRideAssigned(rideId);
    } else if (this.notificationService?.notifyAllDriversRideAssigned) {
      await this.notificationService.notifyAllDriversRideAssigned(rideId);
    }

    return { rideId, bidId, driverId: bid.driverId, precioFinal: bid.offeredPrice };
  }
}
