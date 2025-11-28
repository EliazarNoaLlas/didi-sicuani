import servicioPrecios from '../services/servicio-precios.js';
import servicioSubasta from '../services/servicio-subasta.js';
import servicioContraoferta from '../services/servicio-contraoferta.js';
import { getRedisClient } from '../config/redis.js';
import SolicitudViaje from '../models/SolicitudViaje.js';
import Oferta from '../models/Oferta.js';
import { io } from '../server.js';

/**
 * Controlador de Subasta
 * Maneja la creación de solicitudes de viaje y el proceso de ofertas
 */

/**
 * Crear una nueva solicitud de viaje
 * RF-001: El cliente hace una solicitud de viaje
 * @param {Object} req - Request con datos del viaje (origen, destino, etc.)
 * @param {Object} res - Response
 */
export const crearSolicitudViaje = async (req, res) => {
  try {
    const {
      origen_lat,
      origen_lon,
      origen_direccion,
      destino_lat,
      destino_lon,
      destino_direccion,
      precio_ofrecido_pasajero,
      tipo_vehiculo,
      metodo_pago,
    } = req.body;

    const idPasajero = req.usuario.id;

    // Calcular precio sugerido usando el servicio de precios
    const precioSugerido = await servicioPrecios.calcularPrecioSugerido({
      origen_lat,
      origen_lon,
      destino_lat,
      destino_lon,
      tipo_vehiculo,
    });

    // Validar oferta del pasajero (si se proporciona)
    if (precio_ofrecido_pasajero) {
      const validacion = servicioPrecios.validarOfertaPasajero(
        precioSugerido,
        precio_ofrecido_pasajero
      );

      if (!validacion.esValido) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El precio ofrecido está fuera del rango aceptable',
          validacion,
        });
      }
    }

    // Calcular métricas del viaje (distancia, duración)
    const metricasRuta = await servicioPrecios.obtenerMetricasRuta(
      origen_lat,
      origen_lon,
      destino_lat,
      destino_lon
    );

    // Crear solicitud de viaje (guardar en MongoDB)
    const datosSolicitudViaje = {
      id_pasajero: idPasajero,
      origen_lat,
      origen_lon,
      origen_direccion,
      destino_lat,
      destino_lon,
      destino_direccion,
      precio_sugerido_soles: precioSugerido,
      precio_ofrecido_pasajero,
      distancia_estimada_km: metricasRuta.distancia_km,
      duracion_estimada_min: metricasRuta.duracion_min,
      tipo_vehiculo: tipo_vehiculo || 'cualquiera',
      metodo_pago: metodo_pago || 'efectivo',
      estado: 'subasta_activa',
      fecha_expiracion: new Date(Date.now() + 120 * 1000), // 2 minutos
    };

    // Guardar en MongoDB
    const solicitudViaje = await SolicitudViaje.create(datosSolicitudViaje);

    // Guardar en Redis para acceso rápido (opcional, no crítico)
    try {
      const redis = getRedisClient();
      if (redis && redis.isOpen) {
        await redis.setEx(
          `solicitud_viaje:${solicitudViaje._id}`,
          120,
          JSON.stringify(solicitudViaje)
        );
      }
    } catch (errorRedis) {
      // Redis no es crítico, continuar sin cache
      console.warn('Cache Redis no disponible, continuando sin cache');
    }

    // Notificar a conductores cercanos vía Socket.io
    io.to('conductores').emit('viaje:nuevo', solicitudViaje);

    res.status(201).json({
      exito: true,
      datos: solicitudViaje,
    });
  } catch (error) {
    console.error('❌ Error creando solicitud de viaje:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear solicitud de viaje',
    });
  }
};

/**
 * Enviar una oferta de precio por parte de un conductor
 * RF-003: Cada conductor puede ofrecer un precio
 * @param {Object} req - Request con datos de la oferta
 * @param {Object} res - Response
 */
export const enviarOferta = async (req, res) => {
  try {
    const { id_solicitud_viaje, precio_ofrecido } = req.body;
    const idConductor = req.usuario.id;

    // Validar que el usuario es conductor
    if (req.usuario.tipoUsuario !== 'conductor') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los conductores pueden enviar ofertas',
      });
    }

    // Validar precio
    if (!precio_ofrecido || precio_ofrecido <= 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe especificar un precio válido mayor a cero',
      });
    }

    // Usar servicio de subasta que ahora integra contraofertas
    const resultado = await servicioSubasta.enviarOferta(
      idConductor,
      id_solicitud_viaje,
      precio_ofrecido
    );

    res.status(201).json({
      exito: true,
      datos: {
        oferta: resultado.oferta,
        competencia: resultado.competencia,
      },
    });
  } catch (error) {
    console.error('❌ Error enviando oferta:', error);
    res.status(400).json({
      exito: false,
      mensaje: error.message || 'Error al enviar oferta',
    });
  }
};

/**
 * Realizar una contraoferta (mejorar oferta existente)
 * @param {Object} req - Request con datos de la contraoferta
 * @param {Object} res - Response
 */
export const realizarContraoferta = async (req, res) => {
  try {
    const { id_solicitud_viaje, nuevo_monto } = req.body;
    const idConductor = req.usuario.id;

    // Validar que el usuario es conductor
    if (req.usuario.tipoUsuario !== 'conductor') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los conductores pueden realizar contraofertas',
      });
    }

    // Validar nuevo monto
    if (!nuevo_monto || nuevo_monto <= 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe especificar un precio válido mayor a cero',
      });
    }

    // Realizar contraoferta
    const ofertaActualizada = await servicioContraoferta.realizarContraoferta(
      idConductor,
      id_solicitud_viaje,
      nuevo_monto
    );

    // Obtener información de competencia actualizada
    const competencia = await servicioContraoferta.obtenerInformacionCompetencia(
      id_solicitud_viaje,
      idConductor
    );

    res.status(200).json({
      exito: true,
      datos: {
        oferta: ofertaActualizada,
        competencia,
      },
    });
  } catch (error) {
    console.error('❌ Error realizando contraoferta:', error);
    res.status(400).json({
      exito: false,
      mensaje: error.message || 'Error al realizar contraoferta',
    });
  }
};

/**
 * Obtener información de competencia para un conductor
 * @param {Object} req - Request con ID de solicitud de viaje
 * @param {Object} res - Response
 */
export const obtenerCompetencia = async (req, res) => {
  try {
    const { idSolicitudViaje } = req.params;
    const idConductor = req.usuario.id;

    // Validar que el usuario es conductor
    if (req.usuario.tipoUsuario !== 'conductor') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los conductores pueden ver información de competencia',
      });
    }

    const competencia = await servicioContraoferta.obtenerInformacionCompetencia(
      idSolicitudViaje,
      idConductor
    );

    if (!competencia) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No tienes una oferta activa para este viaje',
      });
    }

    res.status(200).json({
      exito: true,
      datos: competencia,
    });
  } catch (error) {
    console.error('❌ Error obteniendo competencia:', error);
    res.status(500).json({
      exito: false,
      mensaje: error.message || 'Error al obtener información de competencia',
    });
  }
};

/**
 * Aceptar una oferta de un conductor
 * RF-005: El cliente recibe una notificación si su pedido fue aceptado
 * @param {Object} req - Request con ID de la oferta
 * @param {Object} res - Response
 */
export const aceptarOferta = async (req, res) => {
  try {
    const { idOferta } = req.params;
    const idPasajero = req.usuario.id;

    // TODO: Implementar lógica de aceptar oferta
    // - Validar que la oferta pertenece a un viaje del pasajero
    // - Actualizar estado del viaje a 'asignado'
    // - Notificar al conductor

    res.json({
      exito: true,
      mensaje: 'Oferta aceptada',
    });
  } catch (error) {
    console.error('❌ Error aceptando oferta:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al aceptar oferta',
    });
  }
};

/**
 * Rechazar una oferta de un conductor
 * @param {Object} req - Request con ID de la oferta
 * @param {Object} res - Response
 */
export const rechazarOferta = async (req, res) => {
  try {
    const { idOferta } = req.params;

    // TODO: Implementar lógica de rechazar oferta

    res.json({
      exito: true,
      mensaje: 'Oferta rechazada',
    });
  } catch (error) {
    console.error('❌ Error rechazando oferta:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al rechazar oferta',
    });
  }
};

/**
 * Obtener todas las ofertas de una solicitud de viaje
 * RF-004: El cliente debe ver todas las ofertas en tiempo real
 * @param {Object} req - Request con ID del viaje
 * @param {Object} res - Response
 */
export const obtenerOfertasPorViaje = async (req, res) => {
  try {
    const { idViaje } = req.params;
    const Oferta = (await import('../models/Oferta.js')).default;
    const SolicitudViaje = (await import('../models/SolicitudViaje.js')).default;

    // Verificar que el viaje existe
    const viaje = await SolicitudViaje.findById(idViaje);
    if (!viaje) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Viaje no encontrado',
      });
    }

    // Obtener todas las ofertas pendientes del viaje
    const ofertas = await Oferta.find({
      id_solicitud_viaje: idViaje,
      estado: 'pendiente',
      fecha_eliminacion: null,
    })
    .populate('id_conductor', 'nombre correo telefono informacion_conductor')
    .sort({ precio_ofrecido: 1 }); // Ordenar por precio ascendente

    res.json({
      exito: true,
      datos: ofertas,
    });
  } catch (error) {
    console.error('❌ Error obteniendo ofertas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener ofertas',
    });
  }
};

/**
 * Obtener ofertas activas del conductor actual
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
export const obtenerOfertasActivas = async (req, res) => {
  try {
    const idConductor = req.usuario.id;

    // Validar que el usuario es conductor
    if (req.usuario.tipoUsuario !== 'conductor') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los conductores pueden ver sus ofertas activas',
      });
    }

    const Oferta = (await import('../models/Oferta.js')).default;
    const SolicitudViaje = (await import('../models/SolicitudViaje.js')).default;

    // Obtener todas las ofertas pendientes del conductor
    const ofertas = await Oferta.find({
      id_conductor: idConductor,
      estado: 'pendiente',
      fecha_eliminacion: null,
    })
    .populate('id_solicitud_viaje')
    .sort({ createdAt: -1 });

    // Filtrar solo las que pertenecen a viajes activos
    const ofertasActivas = ofertas.filter(oferta => {
      const viaje = oferta.id_solicitud_viaje;
      return viaje && viaje.estado === 'subasta_activa';
    });

    res.json({
      exito: true,
      datos: ofertasActivas,
    });
  } catch (error) {
    console.error('❌ Error obteniendo ofertas activas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener ofertas activas',
    });
  }
};

// Exportar también con nombres en inglés para compatibilidad temporal
export const createRideRequest = crearSolicitudViaje;
export const submitBid = enviarOferta;
export const acceptBid = aceptarOferta;
export const rejectBid = rechazarOferta;
export const getBidsForRide = obtenerOfertasPorViaje;


