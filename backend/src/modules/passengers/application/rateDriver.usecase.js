import CalificacionModel from '../../../shared/database/models/Calificacion.model.js';
import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';
import UsuarioModel from '../../../shared/database/models/Usuario.model.js';
import { NotFoundError, BusinessRuleError, ConflictError, AuthorizationError } from '../../../shared/errors/base.errors.js';

/**
 * Caso de uso: Pasajero califica al conductor
 * RF-018
 */
export class RateDriverUseCase {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  async execute({ passengerId, rideId, rating, comment }) {
    // 1. Validar calificación
    if (!rating || rating < 1 || rating > 5) {
      throw new BusinessRuleError('La calificación debe estar entre 1 y 5');
    }

    // 2. Obtener el viaje
    const viaje = await SolicitudViajeModel.findById(rideId);
    if (!viaje) throw new NotFoundError('Viaje no encontrado');
    if (viaje.id_pasajero.toString() !== passengerId.toString()) {
      throw new AuthorizationError('No autorizado para calificar este viaje');
    }
    if (viaje.estado !== 'completado') {
      throw new BusinessRuleError('Solo se pueden calificar viajes completados');
    }
    if (!viaje.id_conductor_asignado) {
      throw new BusinessRuleError('Este viaje no tiene conductor asignado');
    }

    // 3. Verificar que no haya calificación previa
    const existente = await CalificacionModel.findOne({ id_viaje: rideId, id_calificador: passengerId });
    if (existente) throw new ConflictError('Este viaje ya fue calificado');

    // 4. Crear calificación
    const calificacion = await CalificacionModel.create({
      id_viaje: rideId,
      id_calificador: passengerId,
      id_calificado: viaje.id_conductor_asignado,
      calificacion: rating,
      comentario: comment || '',
      tipo_calificador: 'pasajero',
    });

    // 5. Recalcular rating del conductor
    await this._actualizarRatingConductor(viaje.id_conductor_asignado.toString());

    // 6. Notificar al conductor
    if (this.notificationService?.notifyDriverRatingReceived) {
      await this.notificationService.notifyDriverRatingReceived(
        viaje.id_conductor_asignado.toString(),
        rideId,
        rating,
        comment
      );
    }

    return calificacion;
  }

  async _actualizarRatingConductor(driverId) {
    const calificaciones = await CalificacionModel.find({
      id_calificado: driverId,
      tipo_calificador: 'pasajero',
    });
    if (calificaciones.length === 0) return;

    const promedio = calificaciones.reduce((s, c) => s + c.calificacion, 0) / calificaciones.length;
    await UsuarioModel.findByIdAndUpdate(driverId, {
      'informacion_conductor.calificacion': Math.round(promedio * 10) / 10,
    });
  }
}
