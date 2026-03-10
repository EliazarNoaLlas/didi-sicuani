import { ViajeNoEncontradoError } from '../domain/ride.errors.js';

export class GetRideUseCase {
  constructor(rideRepository) {
    this.rideRepository = rideRepository;
  }

  async execute(rideId) {
    const viaje = await this.rideRepository.findById(rideId);
    if (!viaje) throw new ViajeNoEncontradoError();
    return viaje;
  }
}
