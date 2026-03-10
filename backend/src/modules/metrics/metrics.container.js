import {
  GetDashboardMetricsUseCase,
  GetRideMetricsUseCase,
  GetDriverMetricsUseCase,
  GetEarningsMetricsUseCase,
  GetBiddingMetricsUseCase,
} from './application/getDashboardMetrics.usecase.js';
import { MetricsController } from './interfaces/metrics.controller.js';
import { createMetricsRouter } from './interfaces/metrics.routes.js';

export function buildMetricsContainer() {
  const dashboardUC = new GetDashboardMetricsUseCase();
  const rideMetricsUC = new GetRideMetricsUseCase();
  const driverMetricsUC = new GetDriverMetricsUseCase();
  const earningsMetricsUC = new GetEarningsMetricsUseCase();
  const biddingMetricsUC = new GetBiddingMetricsUseCase();

  const controller = new MetricsController({
    dashboardUC,
    rideMetricsUC,
    driverMetricsUC,
    earningsMetricsUC,
    biddingMetricsUC,
  });

  const router = createMetricsRouter(controller);

  return { router, controller };
}
