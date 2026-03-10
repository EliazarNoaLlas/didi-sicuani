import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';

const TASA_COMISION = 0.15;

/**
 * Caso de uso: Obtener ganancias de un conductor por período
 * RF-015
 */
export class GetEarningsUseCase {
  async execute({ driverId, period, startDate, endDate }) {
    const { fechaInicio, fechaFin } = this._calcularRango(period, startDate, endDate);

    const viajes = await SolicitudViajeModel.find({
      id_conductor_asignado: driverId,
      estado: 'completado',
      fecha_asignacion: { $gte: fechaInicio, $lte: fechaFin },
    }).lean();

    const gananciasBrutas = viajes.reduce((s, v) => s + (v.precio_final_acordado || 0), 0);
    const comision = gananciasBrutas * TASA_COMISION;
    const gananciasNetas = gananciasBrutas - comision;
    const promedioPorViaje = viajes.length > 0 ? gananciasBrutas / viajes.length : 0;

    return {
      periodo: { inicio: fechaInicio, fin: fechaFin, tipo: period || 'month' },
      ganancias: {
        brutas: gananciasBrutas.toFixed(2),
        comision: comision.toFixed(2),
        netas: gananciasNetas.toFixed(2),
      },
      viajes: {
        total: viajes.length,
        promedioPorViaje: promedioPorViaje.toFixed(2),
      },
      desglose: viajes.map((v) => ({
        id: v._id,
        fecha: v.fecha_asignacion,
        precio: v.precio_final_acordado,
        comision: (v.precio_final_acordado || 0) * TASA_COMISION,
        neto: (v.precio_final_acordado || 0) * (1 - TASA_COMISION),
      })),
    };
  }

  _calcularRango(period, startDate, endDate) {
    const ahora = new Date();
    switch (period) {
      case 'day': {
        const inicio = new Date(ahora); inicio.setHours(0, 0, 0, 0);
        const fin = new Date(ahora); fin.setHours(23, 59, 59, 999);
        return { fechaInicio: inicio, fechaFin: fin };
      }
      case 'week': {
        const inicio = new Date(ahora); inicio.setDate(ahora.getDate() - 7);
        return { fechaInicio: inicio, fechaFin: ahora };
      }
      case 'year': {
        const inicio = new Date(ahora.getFullYear(), 0, 1);
        return { fechaInicio: inicio, fechaFin: ahora };
      }
      case 'custom': {
        if (!startDate || !endDate) throw new Error('startDate y endDate son requeridos para período personalizado');
        return { fechaInicio: new Date(startDate), fechaFin: new Date(endDate) };
      }
      default: { // month
        const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        return { fechaInicio: inicio, fechaFin: ahora };
      }
    }
  }
}
