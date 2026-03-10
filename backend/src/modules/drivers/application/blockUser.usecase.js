import BloqueoConductorModel from '../../../shared/database/models/BloqueoConductor.model.js';

const DURACION_BLOQUEO_DIAS = 30;

/**
 * Caso de uso: Conductor bloquea un usuario o zona
 */
export class BlockUserUseCase {
  async execute({ driverId, userId, zone, reason, isPermanent }) {
    if (userId) {
      return this._blockUser(driverId, userId, reason, isPermanent);
    }
    if (zone) {
      return this._blockZone(driverId, zone, reason);
    }
    throw new Error('Debe especificar un usuario o zona a bloquear');
  }

  async _blockUser(driverId, userId, reason, isPermanent) {
    const fechaExpiracion = isPermanent
      ? null
      : new Date(Date.now() + DURACION_BLOQUEO_DIAS * 24 * 60 * 60 * 1000);

    const bloqueo = await BloqueoConductorModel.create({
      id_conductor: driverId,
      id_usuario_bloqueado: userId,
      tipo_bloqueo: 'usuario',
      razon: reason || null,
      es_permanente: isPermanent || false,
      fecha_expiracion: fechaExpiracion,
    });

    return { bloqueo, mensaje: 'Usuario bloqueado exitosamente' };
  }

  async _blockZone(driverId, zone, reason, durationHours = 24) {
    const fechaExpiracion = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const bloqueo = await BloqueoConductorModel.create({
      id_conductor: driverId,
      direccion_bloqueada: zone,
      tipo_bloqueo: 'zona',
      razon: reason || null,
      fecha_expiracion: fechaExpiracion,
    });

    return { bloqueo, mensaje: 'Zona bloqueada exitosamente' };
  }
}

/**
 * Caso de uso: Conductor desbloquea un usuario
 */
export class UnblockUserUseCase {
  async execute({ driverId, userId }) {
    await BloqueoConductorModel.deleteMany({
      id_conductor: driverId,
      id_usuario_bloqueado: userId,
      tipo_bloqueo: 'usuario',
    });
    return { mensaje: 'Usuario desbloqueado exitosamente' };
  }
}

/**
 * Caso de uso: Obtener bloqueos activos del conductor
 */
export class GetBlocksUseCase {
  async execute(driverId) {
    const bloqueos = await BloqueoConductorModel.find({
      id_conductor: driverId,
      $or: [{ fecha_expiracion: null }, { fecha_expiracion: { $gt: new Date() } }],
    })
      .populate('id_usuario_bloqueado', 'nombre correo')
      .sort({ createdAt: -1 });

    return bloqueos;
  }
}
