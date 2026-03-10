import { DriverMongoRepository } from './infrastructure/driver.mongo.repository.js';
import { GetRideQueueUseCase } from './application/getRideQueue.usecase.js';
import { BlockUserUseCase, UnblockUserUseCase, GetBlocksUseCase } from './application/blockUser.usecase.js';
import { HoldRideUseCase, ReleaseHoldUseCase, GetHoldsUseCase } from './application/holdRide.usecase.js';
import { GetEarningsUseCase } from './application/getEarnings.usecase.js';
import { DriverController } from './interfaces/driver.controller.js';
import { createDriverRouter } from './interfaces/driver.routes.js';

export function buildDriversContainer(notificationService) {
  const driverRepository = new DriverMongoRepository();

  const getRideQueueUC = new GetRideQueueUseCase(driverRepository);
  const blockUserUC = new BlockUserUseCase();
  const unblockUserUC = new UnblockUserUseCase();
  const getBlocksUC = new GetBlocksUseCase();
  const holdRideUC = new HoldRideUseCase(notificationService);
  const releaseHoldUC = new ReleaseHoldUseCase();
  const getHoldsUC = new GetHoldsUseCase();
  const getEarningsUC = new GetEarningsUseCase();

  const controller = new DriverController({
    getRideQueueUC,
    blockUserUC,
    unblockUserUC,
    getBlocksUC,
    holdRideUC,
    releaseHoldUC,
    getHoldsUC,
    getEarningsUC,
  });

  const router = createDriverRouter(controller);

  return {
    router,
    controller,
    driverRepository,
  };
}
