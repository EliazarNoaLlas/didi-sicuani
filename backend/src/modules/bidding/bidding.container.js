import { BidMongoRepository } from './infrastructure/bid.mongo.repository.js';
import { SubmitBidUseCase } from './application/submitBid.usecase.js';
import { MakeCounterofferUseCase } from './application/makeCounteroffer.usecase.js';
import { AcceptBidUseCase } from './application/acceptBid.usecase.js';
import { RejectBidUseCase } from './application/rejectBid.usecase.js';
import { GetBidsForRideUseCase } from './application/getBidsForRide.usecase.js';
import { BiddingController } from './interfaces/bidding.controller.js';
import { createBiddingRouter } from './interfaces/bidding.routes.js';
import { BiddingSocketHandler } from './interfaces/bidding.socket.handler.js';

export function buildBiddingContainer(rideRepository, notificationService) {
  const bidRepository = new BidMongoRepository();

  const submitBidUC = new SubmitBidUseCase(bidRepository, rideRepository, notificationService);
  const makeCounterofferUC = new MakeCounterofferUseCase(bidRepository, rideRepository, notificationService);
  const acceptBidUC = new AcceptBidUseCase(bidRepository, rideRepository, notificationService);
  const rejectBidUC = new RejectBidUseCase(bidRepository, rideRepository, notificationService);
  const getBidsForRideUC = new GetBidsForRideUseCase(bidRepository, rideRepository);

  const controller = new BiddingController(
    submitBidUC,
    makeCounterofferUC,
    acceptBidUC,
    rejectBidUC,
    getBidsForRideUC
  );

  const router = createBiddingRouter(controller);

  const socketHandler = new BiddingSocketHandler(
    submitBidUC,
    makeCounterofferUC,
    acceptBidUC,
    rejectBidUC
  );

  return {
    router,
    controller,
    socketHandler,
    bidRepository,
    submitBidUC,
    makeCounterofferUC,
    acceptBidUC,
    rejectBidUC,
    getBidsForRideUC,
  };
}
