import mongoose from 'mongoose';

const esquemaOferta = new mongoose.Schema(
  {
    id_solicitud_viaje: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudViaje', required: true },
    id_conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    tipo_oferta: { type: String, enum: ['aceptar', 'contraoferta', 'rechazar'], required: true },
    precio_ofrecido: {
      type: Number,
      required: function () { return this.tipo_oferta === 'contraoferta'; },
    },
    precio_inicial: Number,
    contraofertas: [{ monto: { type: Number, required: true }, timestamp: { type: Date, default: Date.now } }],
    numero_contraofertas: { type: Number, default: 0 },
    ultima_contraoferta_fecha: Date,
    distancia_conductor_km: Number,
    tiempo_estimado_llegada_min: Number,
    calificacion_conductor: Number,
    estado: { type: String, enum: ['pendiente', 'aceptada', 'rechazada', 'expirada'], default: 'pendiente' },
    fecha_respuesta: Date,
    fecha_expiracion: Date,
    fecha_eliminacion: { type: Date, default: null },
  },
  { timestamps: true }
);

esquemaOferta.index({ id_solicitud_viaje: 1 });
esquemaOferta.index({ id_conductor: 1 });
esquemaOferta.index({ estado: 1 });
esquemaOferta.index({ fecha_expiracion: 1 });
esquemaOferta.index({ fecha_eliminacion: 1 });

const Oferta = mongoose.models['Oferta'] || mongoose.model('Oferta', esquemaOferta);

export default Oferta;
export { Oferta as Bid };
