import RetencionConductorModel from '../../../shared/database/models/RetencionConductor.model.js';
import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';
import { ViajeNoDisponibleError, RetencionNoEncontradaError } from '../domain/driver.errors.js';

const DURACION_RETENCION_MIN = 5;

/**
 * Caso de uso: Conductor pone un viaje en espera
 */
export class HoldRideUseCase {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  async execute({ driverId, rideId, durationMinutes }) {
    const duracion = durationMinutes || DURACION_RETENCION_MIN;
    const fechaExpiracion = new Date(Date.now() + duracion * 60 * 1000);

    const viaje = await SolicitudViajeModel.findById(rideId);
    if (!viaje) throw new ViajeNoDisponibleError(rideId);
    if (viaje.estado !== 'subasta_activa') throw new ViajeNoDisponibleError(rideId);

    const retencion = await RetencionConductorModel.findOneAndUpdate(
      { id_conductor: driverId, id_solicitud_viaje: rideId, estado: 'activa' },
      { id_conductor: driverId, id_solicitud_viaje: rideId, fecha_expiracion: fechaExpiracion, estado: 'activa' },
      { upsert: true, new: true }
    );

    // Notificar al pasajero
    if (this.notificationService) {
      await this.notificationService.notifyPassengerRideOnHold(viaje.id_pasajero.toString(), rideId);
    }

    return {
      retencion_hasta: fechaExpiracion,
      mensaje: `Viaje puesto en espera hasta ${fechaExpiracion.toLocaleTimeString()}`,
    };
  }
}

/**
 * Caso de uso: Conductor libera un viaje de espera
 */
export class ReleaseHoldUseCase {
  async execute({ driverId, rideId }) {
    const retencion = await RetencionConductorModel.findOne({
      id_conductor: driverId,
      id_solicitud_viaje: rideId,
      estado: 'activa',
    });

    if (!retencion) throw new RetencionNoEncontradaError();

    await RetencionConductorModel.findByIdAndUpdate(retencion._id, { estado: 'liberada' });

    return { mensaje: 'Viaje liberado de espera' };
  }
}

/**
 * Caso de uso: Obtener viajes en espera del conductor
 */
export class GetHoldsUseCase {
  async execute(driverId) {
    const retenciones = await RetencionConductorModel.find({
      id_conductor: driverId,
      estado: 'activa',
      fecha_expiracion: { $gt: new Date() },
    })
      .populate('id_solicitud_viaje')
      .sort({ createdAt: -1 });

    return retenciones.map((r) => ({
      ...r.id_solicitud_viaje.toObject(),
      fecha_expiracion_retencion: r.fecha_expiracion,
      id_retencion: r._id,
    }));
  }
}
