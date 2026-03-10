import { RideMongoRepository } from './infrastructure/ride.mongo.repository.js';
import { CreateRideUseCase } from './application/createRide.usecase.js';
import { CancelRideUseCase } from './application/cancelRide.usecase.js';
import { GetRideUseCase } from './application/getRide.usecase.js';
import { UpdateRideStatusUseCase } from './application/updateRideStatus.usecase.js';
import { RideController } from './interfaces/ride.controller.js';
import { createRideRouter, createDriverRideRouter } from './interfaces/ride.routes.js';

export function buildRidesContainer(pricingService, notificationService) {
  const rideRepository = new RideMongoRepository();

  const createRideUseCase = new CreateRideUseCase(rideRepository, pricingService, notificationService);
  const cancelRideUseCase = new CancelRideUseCase(rideRepository, notificationService);
  const getRideUseCase = new GetRideUseCase(rideRepository);
  const updateStatusUseCase = new UpdateRideStatusUseCase(rideRepository, notificationService);

  const controller = new RideController(createRideUseCase, cancelRideUseCase, getRideUseCase, updateStatusUseCase);

  const router = createRideRouter(controller);
  const driverRouter = createDriverRideRouter(controller);

  return { router, driverRouter, controller, rideRepository, createRideUseCase, cancelRideUseCase };
}
