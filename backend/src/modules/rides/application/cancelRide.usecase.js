import { ViajeNoEncontradoError } from '../domain/ride.errors.js';

export class CancelRideUseCase {
  constructor(rideRepository, notificationService) {
    this.rideRepository = rideRepository;
    this.notificationService = notificationService;
  }

  async execute(rideId, reason = 'cancelado_por_usuario') {
    const viaje = await this.rideRepository.findById(rideId);
    if (!viaje) throw new ViajeNoEncontradoError();

    if (viaje.status === 'completado' || viaje.status === 'cancelado') {
      throw new Error('Este viaje no puede ser cancelado');
    }

    await this.rideRepository.updateStatus(rideId, 'cancelado');

    if (viaje.passengerId) {
      await this.notificationService.notifyPassengerRideCancelled(viaje.passengerId, reason);
    }

    return { exito: true };
  }
}
