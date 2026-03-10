import { SubastaNoActivaError, OfertaDuplicadaError, PrecioInvalidoError } from '../domain/bid.errors.js';

/**
 * Caso de uso: Conductor envía oferta inicial para un viaje
 */
export class SubmitBidUseCase {
  constructor(bidRepository, rideRepository, notificationService) {
    this.bidRepository = bidRepository;
    this.rideRepository = rideRepository;
    this.notificationService = notificationService;
  }

  async execute({ driverId, rideId, offeredPrice, driverInfo }) {
    // 1. Validar precio
    if (!offeredPrice || offeredPrice <= 0) {
      throw new PrecioInvalidoError('Debe especificar un precio válido mayor a cero');
    }

    // 2. Validar que el viaje esté aceptando ofertas
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new SubastaNoActivaError(rideId);
    }
    if (!ride.canAcceptBids()) {
      throw new SubastaNoActivaError(rideId);
    }

    // 3. Verificar que el conductor no tenga oferta activa para este viaje
    const ofertaExistente = await this.bidRepository.findByDriverAndRide(driverId, rideId);
    if (ofertaExistente) {
      throw new OfertaDuplicadaError(driverId, rideId);
    }

    // 4. Calcular distancia y ETA del conductor al origen
    let distanciaKm = null;
    let etaMin = null;
    if (driverInfo?.lat && driverInfo?.lon) {
      const distancia = this._haversine(
        driverInfo.lat, driverInfo.lon,
        ride.origin.lat, ride.origin.lon
      );
      distanciaKm = Math.round(distancia * 100) / 100;
      etaMin = Math.ceil((distancia / 25) * 60);
    }

    // 5. Crear oferta
    const bid = await this.bidRepository.create({
      id_solicitud_viaje: rideId,
      id_conductor: driverId,
      tipo_oferta: 'oferta_inicial',
      precio_ofrecido: offeredPrice,
      precio_inicial: offeredPrice,
      contraofertas: [],
      numero_contraofertas: 0,
      estado: 'pendiente',
      fecha_expiracion: ride.expiresAt,
      distancia_conductor_km: distanciaKm,
      tiempo_estimado_llegada_min: etaMin,
      calificacion_conductor: driverInfo?.rating || 5.0,
    });

    // 6. Obtener información de competencia ofuscada
    const competencia = await this._getObfuscatedCompetition(rideId, driverId, offeredPrice);

    // 7. Notificar al pasajero
    if (this.notificationService?.notifyPassengerNewBid) {
      await this.notificationService.notifyPassengerNewBid(ride.passengerId, { bid, rideId, driverInfo });
    } else if (this.notificationService?.notifyPassengerBidReceived) {
      await this.notificationService.notifyPassengerBidReceived(ride.passengerId, bid, driverInfo || {});
    }

    // 8. Notificar al conductor con su oferta y competencia
    if (this.notificationService?.notifyDriverBidCreated) {
      await this.notificationService.notifyDriverBidCreated(
        driverId, bid?.id || bid?._id, rideId, bid, competencia
      );
    }

    // 9. Notificar a otros conductores (ofuscado)
    const rangoActual = await this._getRangeOfLowestBid(rideId);
    if (this.notificationService?.notifyDriversCompetitionUpdate) {
      await this.notificationService.notifyDriversCompetitionUpdate(rideId, driverId, rangoActual);
    } else if (this.notificationService?.notifyOtherDriversNewBid) {
      await this.notificationService.notifyOtherDriversNewBid(rideId, driverId, rangoActual);
    }

    return { bid, competencia };
  }

  async _getObfuscatedCompetition(rideId, driverId, currentPrice) {
    const otherBids = await this.bidRepository.findByRideId(rideId, {
      excludeDriver: driverId,
      status: 'pendiente',
    });

    if (!otherBids || otherBids.length === 0) {
      return {
        hayOfertasMenores: false,
        rangoMenorOferta: null,
        totalCompetidores: 0,
        mensaje: 'No hay competidores aún',
      };
    }

    const minPrice = Math.min(...otherBids.map(b => b.offeredPrice));
    const diff = currentPrice - minPrice;
    const rango = this._calcularRango(minPrice);

    let mensaje;
    if (diff > 10) mensaje = 'Hay ofertas significativamente menores';
    else if (diff > 5) mensaje = 'Hay ofertas competitivas';
    else if (diff > 2) mensaje = 'Tu oferta es competitiva';
    else mensaje = 'Tu oferta está entre las mejores';

    return {
      hayOfertasMenores: diff > 0,
      rangoMenorOferta: rango,
      totalCompetidores: otherBids.length,
      mensaje,
      diferencia: diff > 0 ? diff : 0,
    };
  }

  async _getRangeOfLowestBid(rideId) {
    const lowestBid = await this.bidRepository.findLowestPriceByRide(rideId);
    if (!lowestBid) return null;
    return this._calcularRango(lowestBid.offeredPrice);
  }

  _calcularRango(precio) {
    if (precio < 10) return 'S/ 5 - 10';
    if (precio < 15) return 'S/ 10 - 15';
    if (precio < 20) return 'S/ 15 - 20';
    if (precio < 25) return 'S/ 20 - 25';
    return 'S/ 25+';
  }

  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
