import geospatial from '../../../shared/utils/geospatial.js';
import UsuarioModel from '../../../shared/database/models/Usuario.model.js';
import SolicitudViajeModel from '../../../shared/database/models/SolicitudViaje.model.js';

/**
 * Servicio de precios - Calcula precios sugeridos para viajes
 */
export class PricingUseCase {
    constructor() {
        this.TARIFA_BASE = 8.0;
        this.TARIFA_POR_KM = 3.5;
        this.TARIFA_POR_MIN = 0.6;
        this.TARIFA_MINIMA = 10.0;
        this.DISTANCIA_MINIMA_KM = 0.5;
        this.MULTIPLICADOR_HORA_PICO = 1.3;
        this.MULTIPLICADOR_MADRUGADA = 1.5;
        this.MULTIPLICADOR_ZONA_TURISTICA = 1.2;
        this.DESCUENTO_MOTOTAXI = 0.75;
    }

    async calculateSuggestedPrice({origen_lat, origen_lon, destino_lat, destino_lon, tipo_vehiculo}) {
        const metricas = await this.getRouteMetrics(origen_lat, origen_lon, destino_lat, destino_lon);

        let precioBase =
            this.TARIFA_BASE +
            metricas.distancia_km * this.TARIFA_POR_KM +
            metricas.duracion_min * this.TARIFA_POR_MIN;

        if (tipo_vehiculo === 'mototaxi') {
            precioBase *= this.DESCUENTO_MOTOTAXI;
        }

        const horaActual = new Date().getHours();
        if (this._esHoraPico(horaActual)) {
            precioBase *= this.MULTIPLICADOR_HORA_PICO;
        } else if (this._esMadrugada(horaActual)) {
            precioBase *= this.MULTIPLICADOR_MADRUGADA;
        }

        if (await this._esZonaTuristica(origen_lat, origen_lon)) {
            precioBase *= this.MULTIPLICADOR_ZONA_TURISTICA;
        }

        const ratio = await this._obtenerRatioOfertaDemanda(origen_lat, origen_lon);
        precioBase *= this._calcularMultiplicadorDemanda(ratio);

        const precioFinal = Math.max(precioBase, this.TARIFA_MINIMA);
        return Math.round(precioFinal * 2) / 2;
    }

    async getRouteMetrics(latOrigen, lonOrigen, latDestino, lonDestino) {
        if (isNaN(latOrigen) || isNaN(lonOrigen) || isNaN(latDestino) || isNaN(lonDestino)) {
            return {distancia_km: this.DISTANCIA_MINIMA_KM, duracion_min: 5};
        }

        const metricas = geospatial.calcularMetricasRuta(latOrigen, lonOrigen, latDestino, lonDestino);

        const distanciaFinal = isNaN(metricas.distancia_km) || !isFinite(metricas.distancia_km)
            ? this.DISTANCIA_MINIMA_KM
            : Math.max(metricas.distancia_km, this.DISTANCIA_MINIMA_KM);

        const duracionFinal = isNaN(metricas.duracion_min) || !isFinite(metricas.duracion_min)
            ? 3
            : Math.max(metricas.duracion_min, 3);

        return {distancia_km: distanciaFinal, duracion_min: duracionFinal};
    }

    validatePassengerOffer(precioSugerido, precioOfrecido) {
        const minimoAceptable = precioSugerido * 0.5;
        const maximoAceptable = precioSugerido * 2.0;
        return {
            esValido: precioOfrecido >= minimoAceptable && precioOfrecido <= maximoAceptable,
            minimoAceptable,
            maximoAceptable,
            porcentajeDelSugerido: (precioOfrecido / precioSugerido) * 100,
        };
    }

    _esHoraPico(hora) {
        return (hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19);
    }

    _esMadrugada(hora) {
        return hora >= 23 || hora <= 5;
    }

    async _esZonaTuristica(latitud, longitud) {
        const zonasTuristicas = [
            {lat: -14.2694, lon: -71.2256, radio_km: 0.5},
        ];

        for (const zona of zonasTuristicas) {
            const distancia = geospatial.calcularDistanciaHaversine(latitud, longitud, zona.lat, zona.lon);
            if (distancia <= zona.radio_km) return true;
        }
        return false;
    }

    async _obtenerRatioOfertaDemanda(latitud, longitud) {
        const radioKm = 5;
        const conductores = await UsuarioModel.find({
            tipo_usuario: 'conductor',
            'informacion_conductor.esta_en_linea': true,
            'informacion_conductor.esta_disponible': true,
            'informacion_conductor.latitud_actual': {$exists: true},
            'informacion_conductor.longitud_actual': {$exists: true},
        });

        const conductoresCercanos = conductores.filter((c) =>
            geospatial.estaDentroDelRadio(
                latitud, longitud,
                c.informacion_conductor.latitud_actual,
                c.informacion_conductor.longitud_actual,
                radioKm
            )
        );

        const viajesPendientes = await SolicitudViajeModel.find({
            estado: {$in: ['pendiente', 'subasta_activa']},
            origen_lat: {$exists: true},
            origen_lon: {$exists: true},
        });

        const viajesCercanos = viajesPendientes.filter((v) =>
            geospatial.estaDentroDelRadio(latitud, longitud, v.origen_lat, v.origen_lon, radioKm)
        );

        const demanda = viajesCercanos.length;
        return demanda > 0 ? conductoresCercanos.length / demanda : 2.0;
    }

    _calcularMultiplicadorDemanda(ratio) {
        if (ratio < 0.5) return 1.4;
        if (ratio < 0.8) return 1.2;
        if (ratio <= 1.2) return 1.0;
        if (ratio <= 2.0) return 0.9;
        return 0.85;
    }
}

export default new PricingUseCase();
