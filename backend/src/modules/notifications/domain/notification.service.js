/**
 * Interfaz abstracta del servicio de notificaciones
 */
export class NotificationService {
  async notifyDriversNewRide(ride) { throw new Error('Not implemented') }
  async notifyPassengerBidReceived(passengerId, bid, driverInfo) { throw new Error('Not implemented') }
  async notifyDriverBidAccepted(driverId, ride, passenger) { throw new Error('Not implemented') }
  async notifyPassengerRideAccepted(passengerId, ride, driver) { throw new Error('Not implemented') }
  async notifyAllDriversRideAssigned(rideId) { throw new Error('Not implemented') }
  async notifyDriverBidRejected(driverId, bidId, rideId) { throw new Error('Not implemented') }
  async notifyPassengerDriverEnRoute(passengerId, rideId, driverId, eta) { throw new Error('Not implemented') }
  async notifyPassengerRideInProgress(passengerId, rideId, driverId) { throw new Error('Not implemented') }
  async notifyPassengerRideCompleted(passengerId, rideId, driverId, finalPrice) { throw new Error('Not implemented') }
  async notifyPassengerRideCancelled(passengerId, reason) { throw new Error('Not implemented') }
  async notifyDriverRatingReceived(driverId, rideId, rating, comment) { throw new Error('Not implemented') }
  async notifyUserAccountDeactivated(userId) { throw new Error('Not implemented') }
  async notifyDriversCommissionUpdated(rate) { throw new Error('Not implemented') }
  async notifyDriverBidCreated(driverId, bidId, rideId, bid, competition) { throw new Error('Not implemented') }
  async notifyOtherDriversNewBid(rideId, fromDriverId, priceRange) { throw new Error('Not implemented') }
  async notifyDriverBidUpdated(driverId, bidId, rideId, bidData) { throw new Error('Not implemented') }
  async notifyPassengerAuctionRoundEnded(passengerId, rideId, bidsCount) { throw new Error('Not implemented') }
}
