import { validationResult } from 'express-validator';

export class BiddingController {
  constructor(submitBidUC, makeCounterofferUC, acceptBidUC, rejectBidUC, getBidsForRideUC) {
    this.submitBidUC = submitBidUC;
    this.makeCounterofferUC = makeCounterofferUC;
    this.acceptBidUC = acceptBidUC;
    this.rejectBidUC = rejectBidUC;
    this.getBidsForRideUC = getBidsForRideUC;

    this.submitBid = this.submitBid.bind(this);
    this.makeCounteroffer = this.makeCounteroffer.bind(this);
    this.acceptBid = this.acceptBid.bind(this);
    this.rejectBid = this.rejectBid.bind(this);
    this.getBidsForRide = this.getBidsForRide.bind(this);
    this.getCompetitionInfo = this.getCompetitionInfo.bind(this);
  }

  /** POST /api/subasta/:idViaje/ofertas - Conductor envía oferta */
  async submitBid(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ exito: false, error: 'Datos inválidos', detalles: errores.array() });
      }

      const driverId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje || req.params.id;
      const offeredPrice = parseFloat(req.body.offered_price || req.body.precio_ofrecido);

      // Información del conductor para calcular distancia/ETA
      const driverInfo = {
        lat: req.user.lat || req.body.driver_lat || null,
        lon: req.user.lon || req.body.driver_lon || null,
        rating: req.user.rating || req.user.calificacion || 5.0,
      };

      const resultado = await this.submitBidUC.execute({ driverId, rideId, offeredPrice, driverInfo });

      res.status(201).json({
        exito: true,
        mensaje: 'Oferta enviada exitosamente',
        datos: resultado,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** POST /api/subasta/:idViaje/contraofertas - Conductor hace contraoferta */
  async makeCounteroffer(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ exito: false, error: 'Datos inválidos', detalles: errores.array() });
      }

      const driverId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje || req.params.id;
      const newPrice = parseFloat(req.body.nuevo_precio || req.body.new_price);

      const resultado = await this.makeCounterofferUC.execute({ driverId, rideId, newPrice });

      res.json({
        exito: true,
        mensaje: 'Contraoferta realizada exitosamente',
        datos: resultado,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** POST /api/subasta/:idViaje/ofertas/:idOferta/aceptar - Pasajero acepta oferta */
  async acceptBid(req, res) {
    try {
      const passengerId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje || req.params.id;
      const bidId = req.params.idOferta;

      const resultado = await this.acceptBidUC.execute({ passengerId, rideId, bidId });

      res.json({
        exito: true,
        mensaje: 'Oferta aceptada. Conductor asignado.',
        datos: resultado,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** POST /api/subasta/:idViaje/ofertas/:idOferta/rechazar - Pasajero rechaza oferta */
  async rejectBid(req, res) {
    try {
      const passengerId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje || req.params.id;
      const bidId = req.params.idOferta;

      const resultado = await this.rejectBidUC.execute({ passengerId, rideId, bidId });

      res.json({
        exito: true,
        mensaje: 'Oferta rechazada',
        datos: resultado,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** GET /api/subasta/:idViaje/ofertas - Ver ofertas del viaje */
  async getBidsForRide(req, res) {
    try {
      const rideId = req.params.idViaje || req.params.id;
      const requester = {
        id: req.user.id || req.usuario?.id,
        role: req.user.tipoUsuario || req.user.userType || req.user.tipo_usuario,
      };

      const resultado = await this.getBidsForRideUC.execute(rideId, requester);

      res.json({ exito: true, datos: resultado });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }

  /** GET /api/subasta/:idViaje/competencia - Información de competencia para un conductor */
  async getCompetitionInfo(req, res) {
    try {
      const driverId = req.user.id || req.usuario?.id;
      const rideId = req.params.idViaje || req.params.id;

      // Delegado al bidRepository a través de getBidsForRide
      const requester = { id: driverId, role: 'conductor' };
      const resultado = await this.getBidsForRideUC.execute(rideId, requester);

      res.json({ exito: true, datos: resultado });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ exito: false, error: error.message });
    }
  }
}
