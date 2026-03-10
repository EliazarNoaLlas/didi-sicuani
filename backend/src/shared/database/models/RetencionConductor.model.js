import mongoose from 'mongoose';

const esquemaRetencionConductor = new mongoose.Schema(
  {
    id_conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    id_solicitud_viaje: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudViaje', required: true },
    fecha_expiracion: { type: Date, required: true },
    estado: {
      type: String,
      enum: ['activa', 'aceptada', 'liberada', 'expirada'],
      default: 'activa',
    },
  },
  { timestamps: true }
);

esquemaRetencionConductor.index({ id_conductor: 1, estado: 1 });
esquemaRetencionConductor.index({ id_solicitud_viaje: 1 });
esquemaRetencionConductor.index({ fecha_expiracion: 1 });

const RetencionConductor = mongoose.models['RetencionConductor'] || mongoose.model('RetencionConductor', esquemaRetencionConductor);

export default RetencionConductor;
export { RetencionConductor as DriverHold };
