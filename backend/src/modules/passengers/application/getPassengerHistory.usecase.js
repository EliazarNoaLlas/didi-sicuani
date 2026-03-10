import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';

/**
 * Caso de uso: Obtener historial de viajes del pasajero
 * RF-013
 */
export class GetPassengerHistoryUseCase {
  async execute({ passengerId, filters = {} }) {
    const { estado, fechaInicio, fechaFin, precioMinimo, precioMaximo } = filters;

    const query = {
      id_pasajero: passengerId,
      fecha_eliminacion: null,
    };

    if (estado) query.estado = estado;
    if (fechaInicio || fechaFin) {
      query.createdAt = {};
      if (fechaInicio) query.createdAt.$gte = new Date(fechaInicio);
      if (fechaFin) query.createdAt.$lte = new Date(fechaFin);
    }

    let viajes = await SolicitudViajeModel.find(query)
      .populate('id_conductor_asignado', 'nombre correo telefono informacion_conductor')
      .sort({ createdAt: -1 })
      .lean();

    // Filtro por precio
    if (precioMinimo || precioMaximo) {
      viajes = viajes.filter((v) => {
        const precio = v.precio_final_acordado || v.precio_sugerido_soles || 0;
        if (precioMinimo && precio < parseFloat(precioMinimo)) return false;
        if (precioMaximo && precio > parseFloat(precioMaximo)) return false;
        return true;
      });
    }

    const totalGastado = viajes
      .filter((v) => v.estado === 'completado')
      .reduce((s, v) => s + (v.precio_final_acordado || 0), 0);

    const viajesFormateados = viajes.map((v) => ({
      id: v._id,
      origen: { lat: v.origen_lat, lon: v.origen_lon, direccion: v.origen_direccion },
      destino: { lat: v.destino_lat, lon: v.destino_lon, direccion: v.destino_direccion },
      fecha: v.createdAt,
      estado: v.estado,
      precioAcordado: v.precio_final_acordado,
      precioSugerido: v.precio_sugerido_soles,
      distancia: v.distancia_estimada_km,
      duracion: v.duracion_estimada_min,
      conductor: v.id_conductor_asignado
        ? {
            id: v.id_conductor_asignado._id,
            nombre: v.id_conductor_asignado.nombre,
            correo: v.id_conductor_asignado.correo,
            telefono: v.id_conductor_asignado.telefono,
            calificacion: v.id_conductor_asignado.informacion_conductor?.calificacion,
            tipoVehiculo: v.id_conductor_asignado.informacion_conductor?.tipo_vehiculo,
          }
        : null,
    }));

    return {
      viajes: viajesFormateados,
      estadisticas: {
        totalViajes: viajesFormateados.length,
        viajesCompletados: viajes.filter((v) => v.estado === 'completado').length,
        totalGastado: totalGastado.toFixed(2),
      },
    };
  }
}
