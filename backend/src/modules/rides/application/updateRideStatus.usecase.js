import { ViajeNoEncontradoError, ViajeNoPermitidoError, TransicionEstadoInvalidaError } from '../domain/ride.errors.js';
import geospatial from '../../../shared/utils/geospatial.js';
import UsuarioModel from '../../../shared/database/models/Usuario.model.js';

export class UpdateRideStatusUseCase {
  constructor(rideRepository, notificationService) {
    this.rideRepository = rideRepository;
    this.notificationService = notificationService;
  }

  async iniciarEnRuta(rideId, driverId) {
    const viaje = await this.rideRepository.findById(rideId);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.assignedDriverId !== driverId) throw new ViajeNoPermitidoError('Este viaje no está asignado a ti');
    if (viaje.status !== 'asignado') throw new TransicionEstadoInvalidaError(viaje.status, 'conductor_en_ruta');

    await this.rideRepository.updateStatus(rideId, 'conductor_en_ruta');

    const conductor = await UsuarioModel.findById(driverId);
    let eta = null;
    if (conductor?.informacion_conductor?.latitud_actual && conductor?.informacion_conductor?.longitud_actual) {
      const distancia = geospatial.calcularDistanciaHaversine(
        conductor.informacion_conductor.latitud_actual,
        conductor.informacion_conductor.longitud_actual,
        viaje.origin.lat,
        viaje.origin.lon
      );
      eta = Math.ceil((distancia / 25) * 60);
    }

    await this.notificationService.notifyPassengerDriverEnRoute(
      viaje.passengerId, rideId, driverId, eta
    );

    return { estado: 'conductor_en_ruta', tiempoEstimadoLlegada: eta };
  }

  async iniciarViaje(rideId, driverId) {
    const viaje = await this.rideRepository.findById(rideId);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.assignedDriverId !== driverId) throw new ViajeNoPermitidoError('Este viaje no está asignado a ti');
    if (viaje.status !== 'conductor_en_ruta') throw new TransicionEstadoInvalidaError(viaje.status, 'en_progreso');

    await this.rideRepository.updateStatus(rideId, 'en_progreso');
    await this.notificationService.notifyPassengerRideInProgress(viaje.passengerId, rideId, driverId);

    return { estado: 'en_progreso' };
  }

  async completarViaje(rideId, driverId) {
    const viaje = await this.rideRepository.findById(rideId);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.assignedDriverId !== driverId) throw new ViajeNoPermitidoError('Este viaje no está asignado a ti');
    if (viaje.status !== 'en_progreso') throw new TransicionEstadoInvalidaError(viaje.status, 'completado');

    await this.rideRepository.updateStatus(rideId, 'completado');

    // Marcar conductor disponible y actualizar estadísticas
    await UsuarioModel.findByIdAndUpdate(driverId, {
      'informacion_conductor.esta_disponible': true,
    });
    const conductor = await UsuarioModel.findById(driverId);
    await UsuarioModel.findByIdAndUpdate(driverId, {
      'informacion_conductor.total_viajes': (conductor?.informacion_conductor?.total_viajes || 0) + 1,
    });

    await this.notificationService.notifyPassengerRideCompleted(
      viaje.passengerId, rideId, driverId, viaje.finalPrice
    );

    return { estado: 'completado' };
  }
}
