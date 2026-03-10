import { NotificationService } from '../domain/notification.service.js';
import { EVENTOS_VIAJE, EVENTOS_OFERTA, EVENTOS_CUENTA, EVENTOS_CALIFICACION, EVENTOS_COMISION, EVENTOS_RETENCION, ROOMS } from '../../../shared/events/socket.events.js';
import geospatial from '../../../shared/utils/geospatial.js';
import UsuarioModel from '../../../shared/database/models/Usuario.model.js';

export class SocketNotificationService extends NotificationService {
  constructor(io) {
    super();
    this.io = io;
  }

  async notifyDriversNewRide(ride) {
    if (!this.io) return;

    const todosConductores = await UsuarioModel.find({
      tipo_usuario: 'conductor',
      'informacion_conductor.esta_en_linea': true,
      'informacion_conductor.esta_disponible': true,
    });

    const payload = {
      _id: ride._id?.toString() || ride.id,
      idSolicitudViaje: ride._id?.toString() || ride.id,
      id_pasajero: ride.id_pasajero?.toString(),
      origen: { lat: ride.origen_lat, lon: ride.origen_lon, direccion: ride.origen_direccion },
      destino: { lat: ride.destino_lat, lon: ride.destino_lon, direccion: ride.destino_direccion },
      precio_ofrecido_pasajero: ride.precio_ofrecido_pasajero,
      precio_sugerido_soles: ride.precio_sugerido_soles,
      precioOfrecido: ride.precio_ofrecido_pasajero,
      precioSugerido: ride.precio_sugerido_soles,
      distancia_estimada_km: ride.distancia_estimada_km,
      duracion_estimada_min: ride.duracion_estimada_min,
      distancia: ride.distancia_estimada_km,
      duracion: ride.duracion_estimada_min,
      tipo_vehiculo: ride.tipo_vehiculo,
      metodo_pago: ride.metodo_pago,
      metodoPago: ride.metodo_pago,
      estado: ride.estado,
      fecha_expiracion: ride.fecha_expiracion,
      fechaExpiracion: ride.fecha_expiracion,
      fecha_creacion: ride.createdAt,
    };

    this.io.to(ROOMS.CONDUCTORES).emit(EVENTOS_VIAJE.NUEVO, payload);

    todosConductores.forEach((conductor) => {
      this.io.to(ROOMS.CONDUCTOR(conductor._id.toString())).emit(EVENTOS_VIAJE.NUEVO, payload);
    });

    console.log(`🔔 Notificados ${todosConductores.length} conductores para viaje ${ride._id}`);
  }

  async notifyPassengerBidReceived(passengerId, bidData, driverInfo) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_OFERTA.RECIBIDA, {
      ...bidData,
      nombre_conductor: driverInfo?.nombre,
      tipo_vehiculo: driverInfo?.informacion_conductor?.tipo_vehiculo,
      total_viajes: driverInfo?.informacion_conductor?.total_viajes || 0,
      calificacion_conductor: driverInfo?.informacion_conductor?.calificacion || 5.0,
    });
  }

  async notifyDriverBidCreated(driverId, bidId, rideId, bid, competition) {
    if (!this.io) return;
    this.io.to(ROOMS.CONDUCTOR(driverId)).emit(EVENTOS_OFERTA.CREADA, {
      idOferta: bidId,
      idSolicitudViaje: rideId,
      oferta: bid,
      competencia: competition,
    });
  }

  async notifyOtherDriversNewBid(rideId, fromDriverId, priceRange) {
    if (!this.io) return;
    const roomConductores = this.io.sockets.adapter.rooms.get(ROOMS.CONDUCTORES);
    if (!roomConductores) return;

    const datosNotificacion = {
      idSolicitudViaje: rideId,
      mensaje: 'Un conductor ha realizado una oferta',
      rangoActual: priceRange,
    };

    roomConductores.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.idUsuario && socket.idUsuario.toString() !== fromDriverId.toString()) {
        socket.emit(EVENTOS_OFERTA.NUEVA, datosNotificacion);
      }
    });
  }

  async notifyDriverBidUpdated(driverId, bidId, rideId, bidData) {
    if (!this.io) return;
    this.io.to(ROOMS.CONDUCTOR(driverId)).emit(EVENTOS_OFERTA.ACTUALIZADA, {
      idOferta: bidId,
      idSolicitudViaje: rideId,
      oferta: bidData,
      timestamp: new Date(),
    });
  }

  async notifyOtherDriversBidUpdated(rideId, fromDriverId, priceRange) {
    if (!this.io) return;
    const roomConductores = this.io.sockets.adapter.rooms.get(ROOMS.CONDUCTORES);
    if (!roomConductores) return;

    const datosNotificacion = {
      idSolicitudViaje: rideId,
      mensaje: 'Un conductor ha mejorado su oferta',
      rangoActual: priceRange,
    };

    roomConductores.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.idUsuario && socket.idUsuario.toString() !== fromDriverId.toString()) {
        socket.emit(EVENTOS_OFERTA.COMPETENCIA_ACTUALIZADA, datosNotificacion);
      }
    });
  }

  async notifyDriverBidAccepted(driverId, rideId, bidId, passenger, ride, finalPrice) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(driverId)).emit(EVENTOS_VIAJE.ACEPTADO_POR_PASAJERO, {
      idSolicitudViaje: rideId,
      idOferta: bidId,
      pasajero: {
        id: passenger._id?.toString() || passenger.id,
        nombre: passenger.nombre,
        correo: passenger.correo,
        telefono: passenger.telefono,
      },
      origen: { lat: ride.origen_lat, lon: ride.origen_lon, direccion: ride.origen_direccion },
      destino: { lat: ride.destino_lat, lon: ride.destino_lon, direccion: ride.destino_direccion },
      precioAcordado: finalPrice,
      distancia: ride.distancia_estimada_km,
      duracion: ride.duracion_estimada_min,
      mensaje: '¡Tu oferta fue aceptada! Dirígete al punto de recogida',
      estado: 'asignado',
      timestamp: new Date(),
    });
  }

  async notifyPassengerRideAccepted(passengerId, rideId, bidId, driverId, driver, finalPrice, ride) {
    if (!this.io) return;
    const infoConductor = driver.informacion_conductor || {};
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_VIAJE.ACEPTADO, {
      idSolicitudViaje: rideId,
      idOferta: bidId,
      idConductor: driverId,
      nombreConductor: driver.nombre,
      correoConductor: driver.correo,
      telefonoConductor: driver.telefono,
      calificacionConductor: infoConductor.calificacion || 5.0,
      totalViajesConductor: infoConductor.total_viajes || 0,
      tipoVehiculo: infoConductor.tipo_vehiculo,
      placaVehiculo: infoConductor.placa_vehiculo,
      modeloVehiculo: infoConductor.modelo_vehiculo,
      precioAcordado: finalPrice,
      direccionOrigen: ride?.origen_direccion,
      direccionDestino: ride?.destino_direccion,
      mensaje: '¡Conductor asignado! Está en camino',
      estado: 'asignado',
      timestamp: new Date(),
    });
  }

  async notifyAllDriversRideAssigned(rideId) {
    if (!this.io) return;
    this.io.to(ROOMS.CONDUCTORES).emit(EVENTOS_VIAJE.ASIGNADO, {
      idSolicitudViaje: rideId,
      mensaje: 'Esta solicitud ya fue asignada a otro conductor',
      timestamp: new Date(),
    });
  }

  async notifyDriverBidRejected(driverId, bidId, rideId) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(driverId)).emit(EVENTOS_OFERTA.RECHAZADA, {
      idOferta: bidId,
      idSolicitudViaje: rideId,
      mensaje: 'El pasajero rechazó tu oferta',
    });
  }

  async notifyPassengerDriverEnRoute(passengerId, rideId, driverId, eta) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_VIAJE.CONDUCTOR_EN_RUTA, {
      idViaje: rideId,
      idConductor: driverId,
      tiempoEstimadoLlegada: eta,
      mensaje: 'El conductor está en camino al punto de recogida',
      timestamp: new Date(),
    });
  }

  async notifyPassengerRideInProgress(passengerId, rideId, driverId) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_VIAJE.EN_PROGRESO, {
      idViaje: rideId,
      idConductor: driverId,
      mensaje: 'Viaje en progreso. En camino al destino',
      timestamp: new Date(),
    });
  }

  async notifyPassengerRideCompleted(passengerId, rideId, driverId, finalPrice) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_VIAJE.COMPLETADO, {
      idViaje: rideId,
      idConductor: driverId,
      precioFinal: finalPrice,
      mensaje: 'Viaje completado. ¡Gracias por usar nuestro servicio!',
      timestamp: new Date(),
    });
  }

  async notifyPassengerRideCancelled(passengerId, reason) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_VIAJE.CANCELADO, {
      razon: reason,
      mensaje: reason === 'no_hay_conductores_disponibles'
        ? 'No hay conductores disponibles en este momento'
        : 'Tu viaje ha sido cancelado',
    });
  }

  async notifyDriverRatingReceived(driverId, rideId, rating, comment) {
    if (!this.io) return;
    this.io.to(ROOMS.USER(driverId)).emit(EVENTOS_CALIFICACION.RECIBIDA, {
      rideId,
      rating,
      comment,
      message: 'Has recibido una nueva calificación',
    });
  }

  // --- Alias methods called by use cases with object-param signatures ---

  async notifyPassengerNewBid(passengerId, { bid, rideId, driverInfo }) {
    return this.notifyPassengerBidReceived(passengerId, bid, driverInfo || {});
  }

  /** Called by submitBid / makeCounteroffer use cases */
  async notifyDriversCompetitionUpdate(rideId, fromDriverId, rangoActual) {
    return this.notifyOtherDriversNewBid(rideId, fromDriverId, rangoActual);
  }

  async notifyPassengerCounterofferUpdated(passengerId, data) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_OFERTA.ACTUALIZADA, data);
  }

  async notifyDriverRideAccepted(driverId, { rideId, bidId, passengerId, ride, bid }) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(driverId)).emit(EVENTOS_VIAJE.ACEPTADO_POR_PASAJERO, {
      idSolicitudViaje: rideId,
      idOferta: bidId,
      precioAcordado: bid?.offeredPrice || bid?.precio_ofrecido,
      mensaje: '¡Tu oferta fue aceptada! Dirígete al punto de recogida',
      estado: 'asignado',
      timestamp: new Date(),
    });
  }

  async notifyPassengerRideAssigned(passengerId, { rideId, bidId, driverId, ride, bid }) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit(EVENTOS_VIAJE.ACEPTADO, {
      idSolicitudViaje: rideId,
      idOferta: bidId,
      idConductor: driverId,
      precioAcordado: bid?.offeredPrice || bid?.precio_ofrecido,
      mensaje: '¡Conductor asignado! Está en camino',
      estado: 'asignado',
      timestamp: new Date(),
    });
  }

  async notifyDriversRideAssigned(rideId) {
    return this.notifyAllDriversRideAssigned(rideId);
  }

  async notifyPassengerRideOnHold(passengerId, rideId) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit('viaje:en_espera', {
      idSolicitudViaje: rideId,
      mensaje: 'Un conductor está considerando tu solicitud',
    });
  }

  async notifyUserAccountDeactivated(userId) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(userId)).emit(EVENTOS_CUENTA.DESACTIVADA, {
      mensaje: 'Tu cuenta ha sido desactivada por un administrador',
    });
  }

  async notifyDriversCommissionUpdated(rate) {
    if (!this.io) return;
    this.io.to('drivers').emit(EVENTOS_COMISION.ACTUALIZADA, {
      commissionRate: rate,
      percentage: (rate * 100).toFixed(2),
      message: `La tasa de comisión ha sido actualizada a ${(rate * 100).toFixed(2)}%`,
    });
  }

  async notifyPassengerAuctionRoundEnded(passengerId, rideId, bidsCount) {
    if (!this.io) return;
    this.io.to(ROOMS.USUARIO(passengerId)).emit('ronda:finalizada', {
      idSolicitudViaje: rideId,
      cantidadOfertas: bidsCount,
      mensaje: 'La ronda de ofertas ha finalizado. Puedes ver las ofertas recibidas.',
    });
  }
}
