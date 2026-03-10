import { EVENTOS_OFERTA, EVENTOS_VIAJE } from '../../../shared/events/socket.events.js';

/**
 * Manejador de eventos Socket.io para el módulo de subastas
 * Se registra en el socket handler principal
 */
export class BiddingSocketHandler {
  constructor(submitBidUC, makeCounterofferUC, acceptBidUC, rejectBidUC) {
    this.submitBidUC = submitBidUC;
    this.makeCounterofferUC = makeCounterofferUC;
    this.acceptBidUC = acceptBidUC;
    this.rejectBidUC = rejectBidUC;
  }

  /**
   * Registra los eventos de bidding en un socket específico
   * @param {Socket} socket
   */
  registerEvents(socket) {
    const userId = socket.idUsuario;
    const role = socket.tipoUsuario;

    // Conductor envía oferta
    socket.on(EVENTOS_OFERTA.ENVIAR, async (data) => {
      try {
        if (role !== 'conductor' && role !== 'driver') {
          socket.emit('error', { mensaje: 'Solo los conductores pueden enviar ofertas' });
          return;
        }
        const { idViaje, precioOfrecido, offered_price } = data;
        const offeredPrice = parseFloat(precioOfrecido || offered_price);

        const driverInfo = {
          lat: data.lat || null,
          lon: data.lon || null,
          rating: socket.calificacion || 5.0,
        };

        const resultado = await this.submitBidUC.execute({
          driverId: userId,
          rideId: idViaje,
          offeredPrice,
          driverInfo,
        });

        socket.emit(EVENTOS_OFERTA.CREADA, {
          exito: true,
          datos: resultado,
        });
      } catch (error) {
        socket.emit('error', { mensaje: error.message });
      }
    });

    // Alias inglés: 'bid:submit'
    socket.on('bid:submit', async (data) => {
      socket.emit(EVENTOS_OFERTA.ENVIAR, data);
    });

    // Conductor hace contraoferta
    socket.on(EVENTOS_OFERTA.CONTRAOFERTAR, async (data) => {
      try {
        if (role !== 'conductor' && role !== 'driver') {
          socket.emit('error', { mensaje: 'Solo los conductores pueden contraofertar' });
          return;
        }
        const { idViaje, nuevoPrecio, new_price } = data;
        const newPrice = parseFloat(nuevoPrecio || new_price);

        const resultado = await this.makeCounterofferUC.execute({
          driverId: userId,
          rideId: idViaje,
          newPrice,
        });

        socket.emit(EVENTOS_OFERTA.ACTUALIZADA, {
          exito: true,
          datos: resultado,
        });
      } catch (error) {
        socket.emit('error', { mensaje: error.message });
      }
    });

    // Alias inglés: 'bid:counteroffer'
    socket.on('bid:counteroffer', async (data) => {
      socket.emit(EVENTOS_OFERTA.CONTRAOFERTAR, data);
    });

    // Pasajero acepta oferta
    socket.on(EVENTOS_OFERTA.ACEPTAR, async (data) => {
      try {
        if (role !== 'pasajero' && role !== 'passenger') {
          socket.emit('error', { mensaje: 'Solo los pasajeros pueden aceptar ofertas' });
          return;
        }
        const { idViaje, idOferta } = data;

        const resultado = await this.acceptBidUC.execute({
          passengerId: userId,
          rideId: idViaje,
          bidId: idOferta,
        });

        socket.emit(EVENTOS_VIAJE.ACEPTADO, {
          exito: true,
          datos: resultado,
        });
      } catch (error) {
        socket.emit('error', { mensaje: error.message });
      }
    });

    // Alias inglés: 'bid:accept'
    socket.on('bid:accept', async (data) => {
      socket.emit(EVENTOS_OFERTA.ACEPTAR, data);
    });

    // Pasajero rechaza oferta
    socket.on(EVENTOS_OFERTA.RECHAZAR, async (data) => {
      try {
        if (role !== 'pasajero' && role !== 'passenger') {
          socket.emit('error', { mensaje: 'Solo los pasajeros pueden rechazar ofertas' });
          return;
        }
        const { idViaje, idOferta } = data;

        const resultado = await this.rejectBidUC.execute({
          passengerId: userId,
          rideId: idViaje,
          bidId: idOferta,
        });

        socket.emit(EVENTOS_OFERTA.RECHAZADA, {
          exito: true,
          datos: resultado,
        });
      } catch (error) {
        socket.emit('error', { mensaje: error.message });
      }
    });

    // Alias inglés: 'bid:reject'
    socket.on('bid:reject', async (data) => {
      socket.emit(EVENTOS_OFERTA.RECHAZAR, data);
    });
  }
}
