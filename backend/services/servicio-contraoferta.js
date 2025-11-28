import Oferta from '../models/Oferta.js';
import SolicitudViaje from '../models/SolicitudViaje.js';
import { io } from '../server.js';

/**
 * Servicio de Contraofertas
 * Maneja la lógica de contraofertas entre conductores según la metodología propuesta
 */
class ServicioContraoferta {
  constructor() {
    // Reglas de negocio para contraofertas
    this.REGLAS_CONTRAOFERTA = {
      maxContraofertas: 2,              // Máximo 2 contraofertas por conductor
      tiempoEntreOfertas: 30000,        // 30 segundos entre contraoferta
      decrementoMinimo: 0.00,           // Sin decremento mínimo - permite contraofertas en la misma cantidad
      ventanaTiempo: 120000,            // 2 minutos total
      penalizacionAbandonoRapido: true  // Penaliza si oferta y luego no acepta
    };
  }

  /**
   * Realizar una oferta inicial por parte de un conductor
   * @param {String} idConductor - ID del conductor
   * @param {String} idSolicitudViaje - ID de la solicitud de viaje
   * @param {Number} montoOferta - Monto de la oferta inicial
   * @returns {Object} Oferta creada con información de competencia
   */
  async realizarOfertaInicial(idConductor, idSolicitudViaje, montoOferta) {
    // Validar que el viaje esté activo
    const solicitudViaje = await SolicitudViaje.findById(idSolicitudViaje);
    if (!solicitudViaje) {
      throw new Error('Viaje no encontrado');
    }

    if (solicitudViaje.estado !== 'subasta_activa') {
      throw new Error('Este viaje ya no está aceptando ofertas');
    }

    if (new Date() > new Date(solicitudViaje.fecha_expiracion)) {
      throw new Error('El tiempo para ofertar ha expirado');
    }

    // Verificar si el conductor ya tiene una oferta para este viaje
    const ofertaExistente = await Oferta.findOne({
      id_solicitud_viaje: idSolicitudViaje,
      id_conductor: idConductor,
      estado: 'pendiente',
      fecha_eliminacion: null,
    });

    if (ofertaExistente) {
      throw new Error('Ya tienes una oferta activa para este viaje. Usa contraofertar para modificarla.');
    }

    // Crear oferta inicial
    const oferta = await Oferta.create({
      id_solicitud_viaje: idSolicitudViaje,
      id_conductor: idConductor,
      tipo_oferta: 'contraoferta',
      precio_ofrecido: montoOferta,
      precio_inicial: montoOferta,
      contraofertas: [],
      numero_contraofertas: 0,
      estado: 'pendiente',
      fecha_expiracion: solicitudViaje.fecha_expiracion,
    });

    // Obtener información de competencia (ofuscada)
    const competencia = await this.obtenerCompetenciaOfuscada(idSolicitudViaje, idConductor, montoOferta);

    // Notificar al pasajero sobre la nueva oferta
    if (io) {
      io.to(`usuario:${solicitudViaje.id_pasajero}`).emit('oferta:recibida', {
        ...oferta.toObject(),
        id: oferta._id.toString(),
        _id: oferta._id.toString(),
      });
    }

    return {
      oferta,
      competencia,
    };
  }

  /**
   * Realizar una contraoferta (mejorar la oferta actual)
   * @param {String} idConductor - ID del conductor
   * @param {String} idSolicitudViaje - ID de la solicitud de viaje
   * @param {Number} nuevoMonto - Nuevo monto de la contraoferta
   * @returns {Object} Oferta actualizada
   */
  async realizarContraoferta(idConductor, idSolicitudViaje, nuevoMonto) {
    // Validar que el viaje esté activo
    const solicitudViaje = await SolicitudViaje.findById(idSolicitudViaje);
    if (!solicitudViaje) {
      throw new Error('Viaje no encontrado');
    }

    if (solicitudViaje.estado !== 'subasta_activa') {
      throw new Error('Este viaje ya no está aceptando ofertas');
    }

    if (new Date() > new Date(solicitudViaje.fecha_expiracion)) {
      throw new Error('El tiempo para ofertar ha expirado');
    }

    // Obtener oferta actual del conductor
    const ofertaActual = await Oferta.findOne({
      id_solicitud_viaje: idSolicitudViaje,
      id_conductor: idConductor,
      estado: 'pendiente',
      fecha_eliminacion: null,
    });

    if (!ofertaActual) {
      throw new Error('No tienes una oferta activa. Realiza una oferta inicial primero.');
    }

    // Validar límite de contraofertas
    if (ofertaActual.numero_contraofertas >= this.REGLAS_CONTRAOFERTA.maxContraofertas) {
      throw new Error(`Has alcanzado el límite de ${this.REGLAS_CONTRAOFERTA.maxContraofertas} contraofertas`);
    }

    // Validar tiempo entre contraofertas
    const ahora = new Date();
    if (ofertaActual.ultima_contraoferta_fecha) {
      const tiempoTranscurrido = ahora - new Date(ofertaActual.ultima_contraoferta_fecha);
      if (tiempoTranscurrido < this.REGLAS_CONTRAOFERTA.tiempoEntreOfertas) {
        const segundosRestantes = Math.ceil((this.REGLAS_CONTRAOFERTA.tiempoEntreOfertas - tiempoTranscurrido) / 1000);
        throw new Error(`Debes esperar ${segundosRestantes} segundos para contraofertar nuevamente`);
      }
    }

    // Validar que el nuevo monto no sea mayor (permite igual o menor para competir)
    // Usar tolerancia pequeña para comparación de punto flotante
    const precioActual = parseFloat(ofertaActual.precio_ofrecido) || 0;
    const diferencia = nuevoMonto - precioActual;
    if (diferencia > 0.01) { // Permitir diferencia de hasta 1 centavo por precisión
      throw new Error('La contraoferta no puede ser mayor que tu oferta actual');
    }

    // Actualizar oferta con contraoferta
    const nuevaContraoferta = {
      monto: nuevoMonto,
      timestamp: ahora,
    };

    ofertaActual.contraofertas.push(nuevaContraoferta);
    ofertaActual.precio_ofrecido = nuevoMonto;
    ofertaActual.numero_contraofertas = ofertaActual.contraofertas.length;
    ofertaActual.ultima_contraoferta_fecha = ahora;

    await ofertaActual.save();

    // Notificar al pasajero sobre la contraoferta (solo después de que termine la ronda)
    if (io) {
      const fechaExpiracion = solicitudViaje.fecha_expiracion;
      const rondaFinalizada = fechaExpiracion ? ahora >= new Date(fechaExpiracion) : false;
      
      if (rondaFinalizada) {
        io.to(`usuario:${solicitudViaje.id_pasajero}`).emit('contraoferta:actualizada', {
          idOferta: ofertaActual._id.toString(),
          idSolicitudViaje: idSolicitudViaje.toString(),
          idConductor: idConductor.toString(),
          nuevoMonto: nuevoMonto,
          timestamp: ahora,
        });
      }

      // Notificar SOLO al conductor que hizo la contraoferta con su oferta actualizada
      io.to(`conductor:${idConductor}`).emit('oferta:actualizada', {
        idOferta: ofertaActual._id.toString(),
        idSolicitudViaje: idSolicitudViaje.toString(),
        oferta: {
          _id: ofertaActual._id,
          precio_ofrecido: ofertaActual.precio_ofrecido,
          precio_inicial: ofertaActual.precio_inicial,
          contraofertas: ofertaActual.contraofertas,
          numero_contraofertas: ofertaActual.numero_contraofertas,
          ultima_contraoferta_fecha: ofertaActual.ultima_contraoferta_fecha,
        },
        timestamp: ahora,
      });

      // Notificar a OTROS conductores (NO incluir la oferta actualizada, solo información ofuscada)
      // Emitir a todos los conductores excepto al que hizo la contraoferta
      const rangoActual = await this.calcularRangoMenorOferta(idSolicitudViaje);
      
      // Obtener todos los sockets en la room 'conductores'
      const roomConductores = io.sockets.adapter.rooms.get('conductores');
      if (roomConductores) {
        const datosNotificacion = {
          idSolicitudViaje: idSolicitudViaje.toString(),
          mensaje: 'Un conductor ha mejorado su oferta',
          rangoActual: rangoActual,
          // NO incluir información específica de la oferta
        };
        
        roomConductores.forEach((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          // Solo notificar a otros conductores, NO al que hizo la contraoferta
          if (socket && socket.idUsuario && socket.idUsuario.toString() !== idConductor.toString()) {
            socket.emit('competencia:actualizada', datosNotificacion);
          }
        });
      }
    }

    return ofertaActual;
  }

  /**
   * Obtener información de competencia ofuscada para un conductor
   * @param {String} idSolicitudViaje - ID de la solicitud de viaje
   * @param {String} idConductor - ID del conductor
   * @param {Number} montoActual - Monto actual de la oferta del conductor
   * @returns {Object} Información ofuscada de competencia
   */
  async obtenerCompetenciaOfuscada(idSolicitudViaje, idConductor, montoActual) {
    // Obtener todas las ofertas de otros conductores
    const otrasOfertas = await Oferta.find({
      id_solicitud_viaje: idSolicitudViaje,
      id_conductor: { $ne: idConductor },
      estado: 'pendiente',
      fecha_eliminacion: null,
    });

    if (otrasOfertas.length === 0) {
      return {
        hayOfertasMenores: false,
        rangoMenorOferta: null,
        totalCompetidores: 0,
        mensaje: 'No hay competidores aún',
        icono: '✅',
        color: 'text-green-600',
      };
    }

    const menorOferta = Math.min(...otrasOfertas.map(o => o.precio_ofrecido));
    const diferencia = montoActual - menorOferta;
    const rango = this.calcularRango(menorOferta);

    let mensaje = '';
    let icono = '';
    let color = '';

    if (diferencia > 10) {
      mensaje = 'Hay ofertas significativamente menores';
      icono = '⚠️';
      color = 'text-red-600';
    } else if (diferencia > 5) {
      mensaje = 'Hay ofertas competitivas';
      icono = '💡';
      color = 'text-orange-600';
    } else if (diferencia > 2) {
      mensaje = 'Tu oferta es competitiva';
      icono = '✅';
      color = 'text-green-600';
    } else {
      mensaje = 'Tu oferta está entre las mejores';
      icono = '🏆';
      color = 'text-blue-600';
    }

    return {
      hayOfertasMenores: diferencia > 0,
      rangoMenorOferta: rango,
      totalCompetidores: otrasOfertas.length,
      mensaje,
      icono,
      color,
      diferencia: diferencia > 0 ? diferencia : 0,
    };
  }

  /**
   * Calcular rango de precio (ofuscación)
   * @param {Number} precio - Precio a ofuscar
   * @returns {String} Rango de precio
   */
  calcularRango(precio) {
    if (precio < 10) return 'S/ 5 - 10';
    if (precio < 15) return 'S/ 10 - 15';
    if (precio < 20) return 'S/ 15 - 20';
    if (precio < 25) return 'S/ 20 - 25';
    return 'S/ 25+';
  }

  /**
   * Calcular el rango de la menor oferta para notificaciones
   * @param {String} idSolicitudViaje - ID de la solicitud de viaje
   * @returns {String} Rango de la menor oferta
   */
  async calcularRangoMenorOferta(idSolicitudViaje) {
    const ofertas = await Oferta.find({
      id_solicitud_viaje: idSolicitudViaje,
      estado: 'pendiente',
      fecha_eliminacion: null,
    });

    if (ofertas.length === 0) return null;

    const menorOferta = Math.min(...ofertas.map(o => o.precio_ofrecido));
    return this.calcularRango(menorOferta);
  }

  /**
   * Obtener información de competencia para un conductor específico
   * @param {String} idSolicitudViaje - ID de la solicitud de viaje
   * @param {String} idConductor - ID del conductor
   * @returns {Object} Información de competencia
   */
  async obtenerInformacionCompetencia(idSolicitudViaje, idConductor) {
    const ofertaActual = await Oferta.findOne({
      id_solicitud_viaje: idSolicitudViaje,
      id_conductor: idConductor,
      estado: 'pendiente',
      fecha_eliminacion: null,
    });

    if (!ofertaActual) {
      return null;
    }

    return await this.obtenerCompetenciaOfuscada(
      idSolicitudViaje,
      idConductor,
      ofertaActual.precio_ofrecido
    );
  }
}

export default new ServicioContraoferta();

