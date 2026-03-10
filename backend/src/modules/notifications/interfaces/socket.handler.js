import jwt from 'jsonwebtoken';
import { EVENTOS_CLIENTE, ROOMS } from '../../../shared/events/socket.events.js';

/**
 * Handler de Socket.io - inicialización y eventos de cliente
 */
export class SocketHandler {
  constructor(io) {
    this.io = io;
  }

  initialize() {
    // Middleware de autenticación
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Error de autenticación'));

      try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        socket.idUsuario = decodificado.id;
        socket.tipoUsuario = decodificado.tipoUsuario || decodificado.userType;
        next();
      } catch (err) {
        next(new Error('Error de autenticación'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`✅ Usuario conectado: ${socket.idUsuario} (${socket.tipoUsuario})`);

      // Unirse a salas personales (español e inglés)
      socket.join(ROOMS.USUARIO(socket.idUsuario));
      socket.join(ROOMS.USER(socket.idUsuario));

      // Unirse a salas de rol
      const tipo = socket.tipoUsuario;
      if (tipo === 'conductor' || tipo === 'driver') {
        socket.join(ROOMS.CONDUCTORES);
        socket.join(ROOMS.CONDUCTOR(socket.idUsuario));
      } else if (tipo === 'pasajero' || tipo === 'passenger') {
        socket.join('pasajeros');
      } else if (tipo === 'administrador' || tipo === 'admin') {
        socket.join('administradores');
      }

      // Eventos de solicitud de viaje (español e inglés)
      socket.on(EVENTOS_CLIENTE.SOLICITAR_VIAJE, (datos) => {
        socket.to(ROOMS.CONDUCTORES).emit('viaje:nuevo', datos);
      });
      socket.on(EVENTOS_CLIENTE.REQUEST_RIDE, (datos) => {
        socket.to(ROOMS.CONDUCTORES).emit('viaje:nuevo', datos);
      });

      // Eventos de aceptación (español e inglés)
      socket.on(EVENTOS_CLIENTE.ACEPTAR_VIAJE, (datos) => {
        const { idViaje, idConductor } = datos;
        this.io.to(ROOMS.USUARIO(datos.idPasajero)).emit('viaje:aceptado', { idViaje, idConductor });
      });
      socket.on(EVENTOS_CLIENTE.ACCEPT_RIDE, (datos) => {
        const { idViaje, idConductor } = datos;
        this.io.to(ROOMS.USUARIO(datos.idPasajero)).emit('viaje:aceptado', { idViaje, idConductor });
      });

      // Eventos de oferta (español e inglés)
      socket.on(EVENTOS_CLIENTE.ENVIAR_OFERTA, (datos) => {
        const { idViaje, idConductor, tipoOferta, precio } = datos;
        this.io.to(ROOMS.USUARIO(datos.idPasajero)).emit('oferta:recibida', { idViaje, idConductor, tipoOferta, precio });
      });
      socket.on(EVENTOS_CLIENTE.SUBMIT_BID, (datos) => {
        const { idViaje, idConductor, tipoOferta, precio } = datos;
        this.io.to(ROOMS.USUARIO(datos.idPasajero)).emit('oferta:recibida', { idViaje, idConductor, tipoOferta, precio });
      });

      // Ubicación del conductor (español e inglés)
      socket.on(EVENTOS_CLIENTE.UBICACION_CONDUCTOR, (datos) => {
        const { idConductor, latitud, longitud } = datos;
        socket.broadcast.emit('conductor:ubicacion:actualizada', { idConductor, latitud, longitud });
      });
      socket.on(EVENTOS_CLIENTE.DRIVER_LOCATION, (datos) => {
        const { idConductor, latitud, longitud } = datos;
        socket.broadcast.emit('conductor:ubicacion:actualizada', { idConductor, latitud, longitud });
      });

      socket.on('disconnect', (razon) => {
        console.log(`❌ Usuario desconectado: ${socket.idUsuario} (razón: ${razon})`);
      });
    });

    return this.io;
  }
}
