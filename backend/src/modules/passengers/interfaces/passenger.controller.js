import { validationResult } from 'express-validator';

export class PassengerController {
  constructor({ getHistoryUC, deleteHistoryUC, rateDriverUC }) {
    this.getHistoryUC = getHistoryUC;
    this.deleteHistoryUC = deleteHistoryUC;
    this.rateDriverUC = rateDriverUC;

    this.getHistory = this.getHistory.bind(this);
    this.deleteHistory = this.deleteHistory.bind(this);
    this.rateDriver = this.rateDriver.bind(this);
  }

  /** GET /api/pasajero/historial */
  async getHistory(req, res) {
    try {
      const passengerId = req.user.id || req.usuario?.id;
      const { estado, fechaInicio, fechaFin, precioMinimo, precioMaximo } = req.query;

      const datos = await this.getHistoryUC.execute({
        passengerId,
        filters: { estado, fechaInicio, fechaFin, precioMinimo, precioMaximo },
      });

      res.json({ exito: true, datos });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  }

  /** DELETE /api/pasajero/historial */
  async deleteHistory(req, res) {
    try {
      const passengerId = req.user.id || req.usuario?.id;
      const { idsViajes, rideIds, borrarTodo, deleteAll } = req.body;

      const datos = await this.deleteHistoryUC.execute({
        passengerId,
        rideIds: rideIds || idsViajes,
        deleteAll: deleteAll || borrarTodo,
      });

      res.json({ exito: true, ...datos });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** POST /api/pasajero/viajes/:idViaje/calificar */
  async rateDriver(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ exito: false, error: 'Datos inválidos', detalles: errores.array() });
      }

      const passengerId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje;
      const { calificacion, rating, comentario, comment } = req.body;

      const datos = await this.rateDriverUC.execute({
        passengerId,
        rideId,
        rating: calificacion || rating,
        comment: comentario || comment,
      });

      res.json({ exito: true, datos, mensaje: 'Calificación registrada exitosamente' });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }
}
