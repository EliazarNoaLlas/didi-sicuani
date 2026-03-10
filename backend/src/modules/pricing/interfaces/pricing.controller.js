export class PricingController {
  constructor(pricingUseCase) {
    this.pricingUseCase = pricingUseCase;
    this.calculatePrice = this.calculatePrice.bind(this);
  }

  async calculatePrice(req, res) {
    try {
      const { origin_lat, origin_lon, destination_lat, destination_lon, vehicle_type } = req.body;

      const precioSugerido = await this.pricingUseCase.calculateSuggestedPrice({
        origen_lat: parseFloat(origin_lat),
        origen_lon: parseFloat(origin_lon),
        destino_lat: parseFloat(destination_lat),
        destino_lon: parseFloat(destination_lon),
        tipo_vehiculo: vehicle_type || 'cualquiera',
      });

      const metricas = await this.pricingUseCase.getRouteMetrics(
        parseFloat(origin_lat),
        parseFloat(origin_lon),
        parseFloat(destination_lat),
        parseFloat(destination_lon)
      );

      res.json({
        exito: true,
        datos: {
          precio_sugerido: precioSugerido,
          distancia_km: metricas.distancia_km,
          duracion_estimada_min: metricas.duracion_min,
          rango_precio: {
            minimo: Math.round(precioSugerido * 0.7 * 2) / 2,
            maximo: Math.round(precioSugerido * 1.3 * 2) / 2,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ exito: false, mensaje: error.message });
    }
  }
}
