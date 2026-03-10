import mongoose from 'mongoose';

const esquemaConfiguracionSistema = new mongoose.Schema(
  {
    clave: { type: String, required: true, unique: true },
    valor: { type: mongoose.Schema.Types.Mixed, required: true },
    descripcion: String,
    actualizado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  },
  { timestamps: true }
);

esquemaConfiguracionSistema.index({ clave: 1 });

const ConfiguracionSistema = mongoose.models['ConfiguracionSistema'] || mongoose.model('ConfiguracionSistema', esquemaConfiguracionSistema);

export default ConfiguracionSistema;
export { ConfiguracionSistema as SystemConfig };
