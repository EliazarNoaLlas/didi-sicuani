import { validationResult } from 'express-validator';

export class DriverController {
  constructor({
    getRideQueueUC,
    blockUserUC,
    unblockUserUC,
    getBlocksUC,
    holdRideUC,
    releaseHoldUC,
    getHoldsUC,
    getEarningsUC,
  }) {
    this.getRideQueueUC = getRideQueueUC;
    this.blockUserUC = blockUserUC;
    this.unblockUserUC = unblockUserUC;
    this.getBlocksUC = getBlocksUC;
    this.holdRideUC = holdRideUC;
    this.releaseHoldUC = releaseHoldUC;
    this.getHoldsUC = getHoldsUC;
    this.getEarningsUC = getEarningsUC;

    this.getRideQueue = this.getRideQueue.bind(this);
    this.blockUser = this.blockUser.bind(this);
    this.unblockUser = this.unblockUser.bind(this);
    this.getBlocks = this.getBlocks.bind(this);
    this.holdRide = this.holdRide.bind(this);
    this.releaseHold = this.releaseHold.bind(this);
    this.getHolds = this.getHolds.bind(this);
    this.getEarnings = this.getEarnings.bind(this);
  }

  /** GET /api/conductor/cola */
  async getRideQueue(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const datos = await this.getRideQueueUC.execute(driverId);
      res.json({ exito: true, datos, cantidad: datos.length });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** POST /api/conductor/bloqueos */
  async blockUser(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ exito: false, error: 'Datos inválidos', detalles: errores.array() });
      }
      const driverId = req.user.id || req.usuario?.id;
      const { userId, user_id, zone, zona, reason, razon, isPermanent, es_permanente } = req.body;

      const resultado = await this.blockUserUC.execute({
        driverId,
        userId: userId || user_id,
        zone: zone || zona,
        reason: reason || razon,
        isPermanent: isPermanent || es_permanente || false,
      });

      res.status(201).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.bloqueo });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** DELETE /api/conductor/bloqueos/:idUsuario */
  async unblockUser(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const userId = req.params.idUsuario || req.params.userId;

      const resultado = await this.unblockUserUC.execute({ driverId, userId });
      res.json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** GET /api/conductor/bloqueos */
  async getBlocks(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const datos = await this.getBlocksUC.execute(driverId);
      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  /** POST /api/conductor/retenciones/:idViaje */
  async holdRide(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje;
      const durationMinutes = req.body.duracion_minutos || req.body.duration_minutes || null;

      const resultado = await this.holdRideUC.execute({ driverId, rideId, durationMinutes });
      res.json({ exito: true, ...resultado });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** DELETE /api/conductor/retenciones/:idViaje */
  async releaseHold(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje;

      const resultado = await this.releaseHoldUC.execute({ driverId, rideId });
      res.json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** GET /api/conductor/retenciones */
  async getHolds(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const datos = await this.getHoldsUC.execute(driverId);
      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  /** GET /api/conductor/ganancias */
  async getEarnings(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const { period, startDate, endDate } = req.query;

      const datos = await this.getEarningsUC.execute({ driverId, period, startDate, endDate });
      res.json({ exito: true, datos });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }
}
