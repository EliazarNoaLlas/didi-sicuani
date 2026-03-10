import mongoose from 'mongoose';

const esquemaNegociacionOferta = new mongoose.Schema(
  {
    id_solicitud_viaje: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudViaje', required: true },
    id_conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    numero_ronda: { type: Number, default: 1, max: 2 },
    iniciador: { type: String, enum: ['pasajero', 'conductor'], required: true },
    precio_ofrecido: { type: Number, required: true },
    mensaje: String,
  },
  { timestamps: true }
);

esquemaNegociacionOferta.index({ id_solicitud_viaje: 1, id_conductor: 1 });
esquemaNegociacionOferta.index({ numero_ronda: 1 });

const NegociacionOferta = mongoose.models['NegociacionOferta'] || mongoose.model('NegociacionOferta', esquemaNegociacionOferta);

export default NegociacionOferta;
export { NegociacionOferta as BidNegotiation };
