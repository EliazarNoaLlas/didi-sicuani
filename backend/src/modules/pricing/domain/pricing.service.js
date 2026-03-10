/**
 * Interfaz abstracta del servicio de precios
 */
export class PricingService {
  async calculateSuggestedPrice(params) { throw new Error('Not implemented') }
  async getRouteMetrics(latOrigen, lonOrigen, latDestino, lonDestino) { throw new Error('Not implemented') }
  validatePassengerOffer(suggestedPrice, offeredPrice) { throw new Error('Not implemented') }
}
