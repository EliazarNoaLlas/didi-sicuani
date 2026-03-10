import { GetPassengerHistoryUseCase } from './application/getPassengerHistory.usecase.js';
import { DeletePassengerHistoryUseCase } from './application/deletePassengerHistory.usecase.js';
import { RateDriverUseCase } from './application/rateDriver.usecase.js';
import { PassengerController } from './interfaces/passenger.controller.js';
import { createPassengerRouter } from './interfaces/passenger.routes.js';

export function buildPassengersContainer(notificationService) {
  const getHistoryUC = new GetPassengerHistoryUseCase();
  const deleteHistoryUC = new DeletePassengerHistoryUseCase();
  const rateDriverUC = new RateDriverUseCase(notificationService);

  const controller = new PassengerController({ getHistoryUC, deleteHistoryUC, rateDriverUC });

  const router = createPassengerRouter(controller);

  return {
    router,
    controller,
    getHistoryUC,
    deleteHistoryUC,
    rateDriverUC,
  };
}
