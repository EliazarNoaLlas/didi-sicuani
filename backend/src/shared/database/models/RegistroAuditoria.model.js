import mongoose from 'mongoose';

const esquemaRegistroAuditoria = new mongoose.Schema(
  {
    id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    accion: { type: String, required: true },
    tipo_recurso: {
      type: String,
      enum: ['usuario', 'viaje', 'oferta', 'sistema', 'configuracion'],
    },
    id_recurso: mongoose.Schema.Types.ObjectId,
    detalles: mongoose.Schema.Types.Mixed,
    direccion_ip: String,
    agente_usuario: String,
  },
  { timestamps: true }
);

esquemaRegistroAuditoria.index({ id_usuario: 1 });
esquemaRegistroAuditoria.index({ accion: 1 });
esquemaRegistroAuditoria.index({ tipo_recurso: 1 });
esquemaRegistroAuditoria.index({ createdAt: -1 });

const RegistroAuditoria = mongoose.models['RegistroAuditoria'] || mongoose.model('RegistroAuditoria', esquemaRegistroAuditoria);

export default RegistroAuditoria;
export { RegistroAuditoria as AuditLog };
