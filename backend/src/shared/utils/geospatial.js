/**
 * Utilidades geoespaciales
 * Cálculos de distancia y métricas de ruta sin dependencias externas
 */

class UtilidadesGeoespaciales {
  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const RADIO_TIERRA_KM = 6371;
    const dLat = this.convertirARadianes(lat2 - lat1);
    const dLon = this.convertirARadianes(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.convertirARadianes(lat1)) *
        Math.cos(this.convertirARadianes(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return RADIO_TIERRA_KM * c;
  }

  convertirARadianes(grados) {
    return (grados * Math.PI) / 180;
  }

  /**
   * Calcula métricas de ruta (distancia y duración estimada)
   */
  calcularMetricasRuta(latOrigen, lonOrigen, latDestino, lonDestino) {
    if (isNaN(latOrigen) || isNaN(lonOrigen) || isNaN(latDestino) || isNaN(lonDestino)) {
      return { distancia_km: 0.5, duracion_min: 5, distance_km: 0.5, duration_min: 5 };
    }

    const distanciaKm = this.calcularDistanciaHaversine(latOrigen, lonOrigen, latDestino, lonDestino);

    if (isNaN(distanciaKm) || !isFinite(distanciaKm)) {
      return { distancia_km: 0.5, duracion_min: 5, distance_km: 0.5, duration_min: 5 };
    }

    const distanciaFinal = Math.max(distanciaKm, 0.5);
    const distanciaAjustada = distanciaFinal * 1.3;
    const duracionMin = Math.ceil((distanciaAjustada / 30) * 60);
    const duracionFinal = isNaN(duracionMin) || !isFinite(duracionMin) ? 5 : Math.max(duracionMin, 3);

    return {
      distancia_km: Math.round(distanciaFinal * 100) / 100,
      duracion_min: duracionFinal,
      distance_km: Math.round(distanciaFinal * 100) / 100,
      duration_min: duracionFinal,
    };
  }

  estaDentroDelRadio(latCentro, lonCentro, latPunto, lonPunto, radioKm) {
    const distancia = this.calcularDistanciaHaversine(latCentro, lonCentro, latPunto, lonPunto);
    return distancia <= radioKm;
  }

  calcularDireccion(lat1, lon1, lat2, lon2) {
    const dLon = this.convertirARadianes(lon2 - lon1);
    const lat1Rad = this.convertirARadianes(lat1);
    const lat2Rad = this.convertirARadianes(lat2);
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = Math.atan2(y, x);
    return ((bearing * 180) / Math.PI + 360) % 360;
  }
}

export default new UtilidadesGeoespaciales();