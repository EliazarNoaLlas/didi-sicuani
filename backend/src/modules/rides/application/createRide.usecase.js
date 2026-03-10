/**
 * Caso de uso: Crear solicitud de viaje
 */
export class CreateRideUseCase {
  constructor(rideRepository, pricingService, notificationService) {
    this.rideRepository = rideRepository;
    this.pricingService = pricingService;
    this.notificationService = notificationService;
    this.TIEMPO_ESPERA_SUBASTA_S = 120;
  }

  async execute({ passengerId, originLat, originLon, originAddress, destLat, destLon, destAddress, vehicleType, paymentMethod, passengerPrice }) {
    if (!originAddress || !destAddress) {
      throw new Error('Las direcciones de origen y destino son requeridas');
    }

    // Coordenadas por defecto de Sicuani si no se proporcionan
    const SICUANI_LAT = -14.2694;
    const SICUANI_LON = -71.2256;

    let latOrigen = (originLat === null || originLat === undefined || isNaN(originLat)) ? SICUANI_LAT : parseFloat(originLat);
    let lonOrigen = (originLon === null || originLon === undefined || isNaN(originLon)) ? SICUANI_LON : parseFloat(originLon);
    let latDestino = (destLat === null || destLat === undefined || isNaN(destLat)) ? -14.2700 : parseFloat(destLat);
    let lonDestino = (destLon === null || destLon === undefined || isNaN(destLon)) ? -71.2260 : parseFloat(destLon);

    const metricas = await this.pricingService.getRouteMetrics(latOrigen, lonOrigen, latDestino, lonDestino);

    if (!metricas || isNaN(metricas.distancia_km) || isNaN(metricas.duracion_min)) {
      throw new Error('Error al calcular métricas de ruta');
    }

    const precioSugerido = await this.pricingService.calculateSuggestedPrice({
      origen_lat: latOrigen,
      origen_lon: lonOrigen,
      destino_lat: latDestino,
      destino_lon: lonDestino,
      tipo_vehiculo: vehicleType || 'cualquiera',
    });

    if (!precioSugerido || isNaN(precioSugerido)) {
      throw new Error('Error al calcular precio sugerido');
    }

    const fechaExpiracion = new Date(Date.now() + this.TIEMPO_ESPERA_SUBASTA_S * 1000);

    const viaje = await this.rideRepository.save({
      id_pasajero: passengerId,
      origen_lat: latOrigen,
      origen_lon: lonOrigen,
      origen_direccion: originAddress,
      destino_lat: latDestino,
      destino_lon: lonDestino,
      destino_direccion: destAddress,
      precio_sugerido_soles: precioSugerido,
      precio_ofrecido_pasajero: passengerPrice || null,
      distancia_estimada_km: metricas.distancia_km,
      duracion_estimada_min: metricas.duracion_min,
      tipo_vehiculo: vehicleType || 'cualquiera',
      metodo_pago: paymentMethod || 'efectivo',
      estado: 'subasta_activa',
      fecha_expiracion: fechaExpiracion,
    });

    await this.notificationService.notifyDriversNewRide(viaje);

    // Timeout automático
    setTimeout(() => this._handleExpiration(viaje._id?.toString() || viaje.id), this.TIEMPO_ESPERA_SUBASTA_S * 1000);

    return { solicitudViaje: viaje, precioSugerido };
  }

  async _handleExpiration(rideId) {
    // La expiración es manejada por tareas programadas
    console.log(`⏰ Expiración de viaje ${rideId} - verificar si hay ofertas`);
  }
}
