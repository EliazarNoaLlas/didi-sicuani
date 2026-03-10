import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';
import OfertaModel from '../../../shared/database/models/Oferta.model.js';
import UsuarioModel from '../../../shared/database/models/Usuario.model.js';

const TASA_COMISION = 0.15;

/**
 * Caso de uso: Obtener métricas del dashboard (admin)
 */
export class GetDashboardMetricsUseCase {
  async execute() {
    const [
      totalViajes,
      viajesActivos,
      totalConductores,
      conductoresEnLinea,
      totalPasajeros,
      ingresos,
    ] = await Promise.all([
      SolicitudViajeModel.countDocuments(),
      SolicitudViajeModel.countDocuments({ estado: { $in: ['subasta_activa', 'asignado', 'en_progreso'] } }),
      UsuarioModel.countDocuments({ tipo_usuario: 'conductor' }),
      UsuarioModel.countDocuments({ tipo_usuario: 'conductor', 'informacion_conductor.esta_en_linea': true }),
      UsuarioModel.countDocuments({ tipo_usuario: 'pasajero' }),
      this._calcularIngresos(),
    ]);

    return {
      totalViajes,
      viajesActivos,
      totalConductores,
      conductoresEnLinea,
      totalPasajeros,
      ingresos,
    };
  }

  async _calcularIngresos() {
    const viajes = await SolicitudViajeModel.find({ estado: 'completado' }).lean();
    return viajes.reduce((s, v) => s + (v.precio_final_acordado || 0) * TASA_COMISION, 0);
  }
}

/**
 * Caso de uso: Métricas de viajes por hora (últimas 24h)
 */
export class GetRideMetricsUseCase {
  async execute() {
    const ahora = new Date();
    const horas = [];

    for (let i = 23; i >= 0; i--) {
      const inicioHora = new Date(ahora);
      inicioHora.setHours(ahora.getHours() - i, 0, 0, 0);
      const finHora = new Date(inicioHora);
      finHora.setHours(inicioHora.getHours() + 1);

      const cantidad = await SolicitudViajeModel.countDocuments({
        createdAt: { $gte: inicioHora, $lt: finHora },
      });

      horas.push({ hora: inicioHora.getHours(), viajes: cantidad });
    }

    return horas;
  }
}

/**
 * Caso de uso: Métricas de conductores por tipo de vehículo
 */
export class GetDriverMetricsUseCase {
  async execute() {
    const conductores = await UsuarioModel.aggregate([
      { $match: { tipo_usuario: 'conductor' } },
      { $group: { _id: '$informacion_conductor.tipo_vehiculo', cantidad: { $sum: 1 } } },
    ]);
    return conductores.map((c) => ({ tipo: c._id || 'desconocido', cantidad: c.cantidad }));
  }
}

/**
 * Caso de uso: Métricas de ingresos (últimos 7 días)
 */
export class GetEarningsMetricsUseCase {
  async execute() {
    const ahora = new Date();
    const dias = [];

    for (let i = 6; i >= 0; i--) {
      const inicioDia = new Date(ahora);
      inicioDia.setDate(ahora.getDate() - i);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(inicioDia);
      finDia.setHours(23, 59, 59, 999);

      const viajes = await SolicitudViajeModel.find({
        estado: 'completado',
        fecha_asignacion: { $gte: inicioDia, $lte: finDia },
      }).lean();

      const ingresos = viajes.reduce((s, v) => s + (v.precio_final_acordado || 0) * TASA_COMISION, 0);
      dias.push({ fecha: inicioDia.toISOString().split('T')[0], ingresos: ingresos.toFixed(2) });
    }

    return dias;
  }
}

/**
 * Caso de uso: Métricas de subastas
 */
export class GetBiddingMetricsUseCase {
  async execute() {
    const [totalOfertas, ofertasAceptadas, contraofertas, promedio] = await Promise.all([
      OfertaModel.countDocuments(),
      OfertaModel.countDocuments({ estado: 'aceptada' }),
      OfertaModel.countDocuments({ tipo_oferta: 'contraoferta' }),
      SolicitudViajeModel.aggregate([
        { $lookup: { from: 'ofertas', localField: '_id', foreignField: 'id_solicitud_viaje', as: 'ofertas' } },
        { $project: { cantidadOfertas: { $size: '$ofertas' } } },
        { $group: { _id: null, promedioOfertas: { $avg: '$cantidadOfertas' } } },
      ]),
    ]);

    return {
      totalOfertas,
      ofertasAceptadas,
      contraofertas,
      tasaAceptacion: totalOfertas > 0 ? (ofertasAceptadas / totalOfertas) * 100 : 0,
      promedioOfertasPorViaje: promedio[0]?.promedioOfertas || 0,
    };
  }
}
