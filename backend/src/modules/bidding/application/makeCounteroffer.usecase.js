import {
  OfertaNoEncontradaError,
  SubastaNoActivaError,
  ContraofertaNoPermitidaError,
  PrecioInvalidoError,
} from '../domain/bid.errors.js';

const MAX_CONTRAOFERTAS = 2;
const TIEMPO_ENTRE_OFERTAS_MS = 30000; // 30 segundos

/**
 * Caso de uso: Conductor realiza una contraoferta (mejora su oferta anterior)
 */
export class MakeCounterofferUseCase {
  constructor(bidRepository, rideRepository, notificationService) {
    this.bidRepository = bidRepository;
    this.rideRepository = rideRepository;
    this.notificationService = notificationService;
  }

  async execute({ driverId, rideId, newPrice }) {
    // 1. Validar precio
    if (!newPrice || newPrice <= 0) {
      throw new PrecioInvalidoError('Debe especificar un precio válido mayor a cero');
    }

    // 2. Validar que el viaje siga activo
    const ride = await this.rideRepository.findById(rideId);
    if (!ride || !ride.canAcceptBids()) {
      throw new SubastaNoActivaError(rideId);
    }

    // 3. Obtener oferta actual del conductor
    const bid = await this.bidRepository.findByDriverAndRide(driverId, rideId);
    if (!bid) {
      throw new OfertaNoEncontradaError(`${driverId}:${rideId}`);
    }

    if (!bid.canCounteroffer(MAX_CONTRAOFERTAS)) {
      throw new ContraofertaNoPermitidaError(
        `Has alcanzado el límite de ${MAX_CONTRAOFERTAS} contraofertas`
      );
    }

    // 4. Validar tiempo entre contraofertas
    if (bid.lastCounteroffer) {
      const elapsed = Date.now() - new Date(bid.lastCounteroffer).getTime();
      if (elapsed < TIEMPO_ENTRE_OFERTAS_MS) {
        const secsLeft = Math.ceil((TIEMPO_ENTRE_OFERTAS_MS - elapsed) / 1000);
        throw new ContraofertaNoPermitidaError(
          `Debes esperar ${secsLeft} segundos para contraofertar nuevamente`
        );
      }
    }

    // 5. Validar que el nuevo precio no sea mayor al actual
    if (newPrice - bid.offeredPrice > 0.01) {
      throw new PrecioInvalidoError('La contraoferta no puede ser mayor que tu oferta actual');
    }

    // 6. Actualizar oferta
    const ahora = new Date();
    const nuevaContraoferta = { monto: newPrice, timestamp: ahora };
    const contraofertas = [...(bid.counteroffers || []), nuevaContraoferta];

    const updatedBid = await this.bidRepository.update(bid.id, {
      precio_ofrecido: newPrice,
      contraofertas,
      numero_contraofertas: contraofertas.length,
      ultima_contraoferta_fecha: ahora,
    });

    // 7. Notificar al conductor que hizo la contraoferta
    if (this.notificationService?.notifyDriverBidUpdated) {
      await this.notificationService.notifyDriverBidUpdated(
        driverId, updatedBid?.id || updatedBid?._id, rideId, updatedBid
      );
    }

    // 8. Notificar al pasajero si la ronda finalizó
    const rondaFinalizada = ride.isExpired();
    if (rondaFinalizada && this.notificationService?.notifyPassengerCounterofferUpdated) {
      await this.notificationService.notifyPassengerCounterofferUpdated(ride.passengerId, {
        bidId: bid.id,
        rideId,
        driverId,
        newPrice,
        timestamp: ahora,
      });
    }

    // 9. Notificar a otros conductores (ofuscado)
    const lowestBid = await this.bidRepository.findLowestPriceByRide(rideId);
    const rangoActual = lowestBid ? this._calcularRango(lowestBid.offeredPrice) : null;
    if (this.notificationService?.notifyDriversCompetitionUpdate) {
      await this.notificationService.notifyDriversCompetitionUpdate(rideId, driverId, rangoActual);
    } else if (this.notificationService?.notifyOtherDriversBidUpdated) {
      await this.notificationService.notifyOtherDriversBidUpdated(rideId, driverId, rangoActual);
    }

    return updatedBid;
  }

  _calcularRango(precio) {
    if (precio < 10) return 'S/ 5 - 10';
    if (precio < 15) return 'S/ 10 - 15';
    if (precio < 20) return 'S/ 15 - 20';
    if (precio < 25) return 'S/ 20 - 25';
    return 'S/ 25+';
  }
}
