import { ConductorNoEncontradoError, NoEsConductorError } from '../domain/driver.errors.js';
import BloqueoConductorModel from '../../../shared/database/models/BloqueoConductor.model.js';
import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';
import UsuarioModel from '../../../shared/database/models/Usuario.model.js';

const VELOCIDAD_PROMEDIO_KMH = 25;

/**
 * Caso de uso: Obtener cola de viajes disponibles para un conductor
 * RF-002, RF-009: Todos los conductores ven todas las solicitudes activas
 * Filtra por bloqueos activos del conductor
 */
export class GetRideQueueUseCase {
  constructor(driverRepository) {
    this.driverRepository = driverRepository;
  }

  async execute(driverId) {
    // 1. Validar que el conductor existe
    const conductorDoc = await UsuarioModel.findById(driverId);
    if (!conductorDoc) throw new ConductorNoEncontradoError(driverId);
    if (conductorDoc.tipo_usuario !== 'conductor') throw new NoEsConductorError();

    const conductor = conductorDoc;
    const latConductor = conductor.informacion_conductor?.latitud_actual;
    const lonConductor = conductor.informacion_conductor?.longitud_actual;

    // 2. Obtener todas las solicitudes activas no vencidas y sin conductor asignado a otro
    const solicitudesActivas = await SolicitudViajeModel.find({
      estado: 'subasta_activa',
      fecha_expiracion: { $gt: new Date() },
      fecha_eliminacion: null,
      $or: [
        { id_conductor_asignado: { $exists: false } },
        { id_conductor_asignado: null },
        { id_conductor_asignado: driverId },
      ],
    }).populate('id_pasajero', 'nombre correo telefono');

    // 3. Calcular distancia/ETA y mapear datos
    const viajesConDatos = solicitudesActivas
      .map((viaje) => {
        if (!viaje.id_pasajero) return null;

        let distanciaKm = null;
        let etaMin = null;

        if (latConductor && lonConductor) {
          const dist = this._haversine(
            viaje.origen_lat, viaje.origen_lon,
            latConductor, lonConductor
          );
          distanciaKm = Math.round(dist * 100) / 100;
          etaMin = Math.ceil((dist / VELOCIDAD_PROMEDIO_KMH) * 60);
        }

        return {
          _id: viaje._id,
          _viajeDoc: viaje, // interno, se filtra después
          pasajero: {
            id: viaje.id_pasajero._id || viaje.id_pasajero,
            nombre: viaje.id_pasajero.nombre || 'Usuario',
            correo: viaje.id_pasajero.correo || 'N/A',
            telefono: viaje.id_pasajero.telefono || 'N/A',
          },
          origen: {
            lat: viaje.origen_lat,
            lon: viaje.origen_lon,
            direccion: viaje.origen_direccion,
          },
          destino: {
            lat: viaje.destino_lat,
            lon: viaje.destino_lon,
            direccion: viaje.destino_direccion,
          },
          precios: {
            precio_sugerido: viaje.precio_sugerido_soles,
            precio_ofrecido_pasajero: viaje.precio_ofrecido_pasajero,
          },
          viaje_info: {
            distancia_km: viaje.distancia_estimada_km,
            duracion_min: viaje.duracion_estimada_min,
          },
          tipo_vehiculo: viaje.tipo_vehiculo,
          metodo_pago: viaje.metodo_pago,
          distancia_desde_conductor_km: distanciaKm,
          tiempo_estimado_llegada_min: etaMin,
          fecha_expiracion: viaje.fecha_expiracion,
          fecha_creacion: viaje.createdAt,
        };
      })
      .filter(Boolean);

    // 4. Filtrar viajes bloqueados
    const pasajeroIds = solicitudesActivas
      .filter(v => v.id_pasajero)
      .map(v => v.id_pasajero._id || v.id_pasajero);

    const bloqueosActivos = await BloqueoConductorModel.find({
      id_conductor: driverId,
      $or: [{ fecha_expiracion: null }, { fecha_expiracion: { $gt: new Date() } }],
    });

    const usuariosBloqueados = new Set(
      bloqueosActivos
        .filter(b => b.tipo_bloqueo === 'usuario')
        .map(b => b.id_usuario_bloqueado?.toString())
    );
    const zonasBloqueadas = new Set(
      bloqueosActivos
        .filter(b => b.tipo_bloqueo === 'zona')
        .map(b => b.direccion_bloqueada)
    );

    const viajesFiltrados = viajesConDatos.filter((v) => {
      const pasajeroId = v.pasajero.id?.toString();
      if (usuariosBloqueados.has(pasajeroId)) return false;
      if (zonasBloqueadas.has(v.origen.direccion)) return false;
      return true;
    });

    // 5. Ordenar: distancia ASC, luego fecha_creacion DESC
    const viajesOrdenados = viajesFiltrados.sort((a, b) => {
      if (a.distancia_desde_conductor_km !== null && b.distancia_desde_conductor_km !== null) {
        return a.distancia_desde_conductor_km - b.distancia_desde_conductor_km;
      }
      if (a.distancia_desde_conductor_km !== null) return -1;
      if (b.distancia_desde_conductor_km !== null) return 1;
      return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    });

    // 6. Limpiar campo interno _viajeDoc
    return viajesOrdenados.map(({ _viajeDoc, ...v }) => v);
  }

  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
