import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';
import { ValidationError } from '../../../shared/errors/base.errors.js';

/**
 * Caso de uso: Borrar historial del pasajero (soft delete)
 */
export class DeletePassengerHistoryUseCase {
  async execute({ passengerId, rideIds, deleteAll }) {
    const ahora = new Date();
    let cantidadEliminados = 0;

    if (deleteAll) {
      const resultado = await SolicitudViajeModel.updateMany(
        { id_pasajero: passengerId, fecha_eliminacion: null },
        { fecha_eliminacion: ahora, eliminado_por: passengerId }
      );
      cantidadEliminados = resultado.modifiedCount;
    } else if (rideIds && Array.isArray(rideIds) && rideIds.length > 0) {
      const resultado = await SolicitudViajeModel.updateMany(
        { _id: { $in: rideIds }, id_pasajero: passengerId, fecha_eliminacion: null },
        { fecha_eliminacion: ahora, eliminado_por: passengerId }
      );
      cantidadEliminados = resultado.modifiedCount;
    } else {
      throw new ValidationError('Debe especificar rideIds o deleteAll: true');
    }

    return {
      cantidadEliminados,
      mensaje: `${cantidadEliminados} viaje(s) eliminado(s) del historial`,
    };
  }
}
