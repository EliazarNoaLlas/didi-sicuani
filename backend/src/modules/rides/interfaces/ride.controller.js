import { validationResult } from 'express-validator';
import OfertaModel from '../../../shared/database/models/Oferta.model.js';
import geospatial from '../../../shared/utils/geospatial.js';
import UsuarioModel from '../../../shared/database/models/Usuario.model.js';

export class RideController {
  constructor(createRideUseCase, cancelRideUseCase, getRideUseCase, updateStatusUseCase) {
    this.createRideUseCase = createRideUseCase;
    this.cancelRideUseCase = cancelRideUseCase;
    this.getRideUseCase = getRideUseCase;
    this.updateStatusUseCase = updateStatusUseCase;
    this.createRide = this.createRide.bind(this);
    this.cancelRide = this.cancelRide.bind(this);
    this.getRide = this.getRide.bind(this);
    this.iniciarEnRuta = this.iniciarEnRuta.bind(this);
    this.iniciarViaje = this.iniciarViaje.bind(this);
    this.completarViaje = this.completarViaje.bind(this);
    this.getActiveRide = this.getActiveRide.bind(this);
    this.getRouteGeometry = this.getRouteGeometry.bind(this);
  }

  async createRide(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ exito: false, error: 'Datos de entrada inválidos', detalles: errores.array() });
      }

      const idPasajero = req.user.id || req.usuario.id;
      const body = req.body;

      const resultado = await this.createRideUseCase.execute({
        passengerId: idPasajero,
        originLat: body.origen_lat || body.origin_lat ? parseFloat(body.origen_lat || body.origin_lat) : null,
        originLon: body.origen_lon || body.origin_lon ? parseFloat(body.origen_lon || body.origin_lon) : null,
        originAddress: body.origen_direccion || body.origin_address || '',
        destLat: body.destino_lat || body.destination_lat ? parseFloat(body.destino_lat || body.destination_lat) : null,
        destLon: body.destino_lon || body.destination_lon ? parseFloat(body.destino_lon || body.destination_lon) : null,
        destAddress: body.destino_direccion || body.destination_address || '',
        vehicleType: body.tipo_vehiculo || body.vehicle_type || 'cualquiera',
        paymentMethod: body.metodo_pago || body.payment_method || 'efectivo',
        passengerPrice: body.precio_ofrecido_pasajero || body.passenger_offered_price || null,
      });

      res.status(201).json({ exito: true, datos: resultado });
    } catch (error) {
      console.error('Error en createRide:', error);
      res.status(400).json({ exito: false, error: error.message });
    }
  }

  async getRide(req, res) {
    try {
      const idViaje = req.params.id;
      const viaje = await this.getRideUseCase.execute(idViaje);
      const viajeRaw = await OfertaModel.find({ id_solicitud_viaje: idViaje });

      const ahora = new Date();
      const rondaFinalizada = viaje.expiresAt ? ahora >= new Date(viaje.expiresAt) : false;
      const tipoUsuario = req.user.tipoUsuario || req.user.userType;
      const esConductor = tipoUsuario === 'conductor' || tipoUsuario === 'driver';
      const esPasajero = req.user.id.toString() === viaje.passengerId;

      let ofertas = [];
      if (esConductor || (esPasajero && rondaFinalizada)) {
        const docs = await OfertaModel.find({ id_solicitud_viaje: idViaje })
          .populate('id_conductor', 'nombre informacion_conductor')
          .sort({ precio_ofrecido: 1 });
        ofertas = docs.map((o) => ({
          _id: o._id, id: o._id,
          id_conductor: o.id_conductor?._id,
          nombre_conductor: o.id_conductor?.nombre,
          tipo_vehiculo: o.id_conductor?.informacion_conductor?.tipo_vehiculo,
          calificacion: o.calificacion_conductor,
          calificacion_conductor: o.calificacion_conductor,
          total_viajes: o.id_conductor?.informacion_conductor?.total_viajes || 0,
          tipo_oferta: o.tipo_oferta,
          precio_ofrecido: o.precio_ofrecido,
          precio_inicial: o.precio_inicial,
          contraofertas: o.contraofertas || [],
          numero_contraofertas: o.numero_contraofertas || 0,
          tiempo_estimado_llegada_min: o.tiempo_estimado_llegada_min,
          distancia_conductor_km: o.distancia_conductor_km,
          estado: o.estado,
          fecha_creacion: o.createdAt,
          createdAt: o.createdAt,
        }));
      }

      res.json({ exito: true, datos: { viaje, rondaFinalizada, ofertas } });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  async cancelRide(req, res) {
    try {
      const idViaje = req.params.id;
      const razon = req.body.razon || req.body.reason || 'cancelado_por_usuario';
      await this.cancelRideUseCase.execute(idViaje, razon);
      res.json({ exito: true, mensaje: 'Viaje cancelado' });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  async iniciarEnRuta(req, res) {
    try {
      const idConductor = req.user.id || req.usuario.id;
      const idViaje = req.params.idViaje;
      const resultado = await this.updateStatusUseCase.iniciarEnRuta(idViaje, idConductor);
      res.json({ exito: true, mensaje: 'Estado actualizado: En camino al punto de recogida', datos: resultado });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  async iniciarViaje(req, res) {
    try {
      const idConductor = req.user.id || req.usuario.id;
      const idViaje = req.params.idViaje;
      const resultado = await this.updateStatusUseCase.iniciarViaje(idViaje, idConductor);
      res.json({ exito: true, mensaje: 'Viaje iniciado. En camino al destino', datos: resultado });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  async completarViaje(req, res) {
    try {
      const idConductor = req.user.id || req.usuario.id;
      const idViaje = req.params.idViaje;
      const resultado = await this.updateStatusUseCase.completarViaje(idViaje, idConductor);
      res.json({ exito: true, mensaje: 'Viaje completado exitosamente', datos: resultado });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  async getActiveRide(req, res) {
    try {
      const idConductor = req.user.id || req.usuario.id;
      const { RideMongoRepository } = await import('../infrastructure/ride.mongo.repository.js');
      const repo = new RideMongoRepository();
      const viajeActivo = await repo.findActiveRideForDriver(idConductor);

      if (!viajeActivo) {
        return res.json({ exito: true, datos: null, mensaje: 'No hay viaje activo' });
      }

      let tiempoEstimadoLlegada = null;
      if (viajeActivo.estado === 'conductor_en_ruta') {
        const conductor = await UsuarioModel.findById(idConductor);
        if (conductor?.informacion_conductor?.latitud_actual) {
          const distancia = geospatial.calcularDistanciaHaversine(
            conductor.informacion_conductor.latitud_actual,
            conductor.informacion_conductor.longitud_actual,
            viajeActivo.origen_lat,
            viajeActivo.origen_lon
          );
          tiempoEstimadoLlegada = Math.ceil((distancia / 25) * 60);
        }
      }

      res.json({ exito: true, datos: { ...viajeActivo, tiempoEstimadoLlegada } });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  async getRouteGeometry(req, res) {
    try {
      const { origin_lat, origin_lon, dest_lat, dest_lon } = req.query;
      const metricas = geospatial.calcularMetricasRuta(
        parseFloat(origin_lat), parseFloat(origin_lon),
        parseFloat(dest_lat), parseFloat(dest_lon)
      );
      const geometriaRuta = {
        type: 'LineString',
        coordinates: [
          [parseFloat(origin_lon), parseFloat(origin_lat)],
          [parseFloat(dest_lon), parseFloat(dest_lat)],
        ],
      };
      res.json({ exito: true, datos: { geometria_ruta: geometriaRuta, total_minutos: metricas.duration_min, total_km: metricas.distance_km } });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }
}
