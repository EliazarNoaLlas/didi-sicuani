/**
 * Entidad Oferta - lógica de negocio pura, sin framework
 */
export class Bid {
  constructor(data) {
    this.id = data.id || data._id?.toString();
    this.rideId = data.id_solicitud_viaje?.toString();
    this.driverId = data.id_conductor?.toString();
    this.offerType = data.tipo_oferta;
    this.offeredPrice = data.precio_ofrecido;
    this.initialPrice = data.precio_inicial;
    this.counteroffers = data.contraofertas || [];
    this.counteroffersCount = data.numero_contraofertas || 0;
    this.lastCounteroffer = data.ultima_contraoferta_fecha;
    this.driverDistanceKm = data.distancia_conductor_km;
    this.driverEtaMin = data.tiempo_estimado_llegada_min;
    this.driverRating = data.calificacion_conductor;
    this.status = data.estado || 'pendiente';
    this.expiresAt = data.fecha_expiracion;
    this.createdAt = data.createdAt;
  }

  canCounteroffer(maxCounterOffers = 2) {
    return this.status === 'pendiente' && this.counteroffersCount < maxCounterOffers;
  }

  isActive() {
    return this.status === 'pendiente';
  }
}
