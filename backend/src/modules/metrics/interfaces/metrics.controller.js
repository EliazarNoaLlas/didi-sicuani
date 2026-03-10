export class MetricsController {
  constructor({ dashboardUC, rideMetricsUC, driverMetricsUC, earningsMetricsUC, biddingMetricsUC }) {
    this.dashboardUC = dashboardUC;
    this.rideMetricsUC = rideMetricsUC;
    this.driverMetricsUC = driverMetricsUC;
    this.earningsMetricsUC = earningsMetricsUC;
    this.biddingMetricsUC = biddingMetricsUC;

    this.getDashboard = this.getDashboard.bind(this);
    this.getRideMetrics = this.getRideMetrics.bind(this);
    this.getDriverMetrics = this.getDriverMetrics.bind(this);
    this.getEarningsMetrics = this.getEarningsMetrics.bind(this);
    this.getBiddingMetrics = this.getBiddingMetrics.bind(this);
    this.getAllMetrics = this.getAllMetrics.bind(this);
  }

  async getDashboard(req, res) {
    try {
      const datos = await this.dashboardUC.execute();
      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  async getRideMetrics(req, res) {
    try {
      const datos = await this.rideMetricsUC.execute();
      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  async getDriverMetrics(req, res) {
    try {
      const datos = await this.driverMetricsUC.execute();
      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  async getEarningsMetrics(req, res) {
    try {
      const datos = await this.earningsMetricsUC.execute();
      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  async getBiddingMetrics(req, res) {
    try {
      const datos = await this.biddingMetricsUC.execute();
      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  /** GET /api/metricas - Todas las métricas de una vez */
  async getAllMetrics(req, res) {
    try {
      const [dashboard, viajes, conductores, ingresos, subastas] = await Promise.all([
        this.dashboardUC.execute(),
        this.rideMetricsUC.execute(),
        this.driverMetricsUC.execute(),
        this.earningsMetricsUC.execute(),
        this.biddingMetricsUC.execute(),
      ]);

      res.json({
        exito: true,
        datos: { dashboard, viajes, conductores, ingresos, subastas },
      });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }
}
