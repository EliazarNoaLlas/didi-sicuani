import mongoose from 'mongoose';

const esquemaBloqueoConductor = new mongoose.Schema(
  {
    id_conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    id_usuario_bloqueado: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    direccion_bloqueada: String,
    tipo_bloqueo: { type: String, enum: ['usuario', 'zona', 'ruta'], required: true },
    razon: String,
    fecha_expiracion: Date,
    es_permanente: { type: Boolean, default: false },
  },
  { timestamps: true }
);

esquemaBloqueoConductor.index({ id_conductor: 1 });
esquemaBloqueoConductor.index({ id_usuario_bloqueado: 1 });
esquemaBloqueoConductor.index({ fecha_expiracion: 1 });

const BloqueoConductor = mongoose.models['BloqueoConductor'] || mongoose.model('BloqueoConductor', esquemaBloqueoConductor);

export default BloqueoConductor;
export { BloqueoConductor as DriverBlock };
