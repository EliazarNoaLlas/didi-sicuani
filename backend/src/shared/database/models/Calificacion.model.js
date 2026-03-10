import mongoose from 'mongoose';

const esquemaCalificacion = new mongoose.Schema(
  {
    id_viaje: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudViaje', required: true },
    id_calificador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    id_calificado: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, trim: true },
    tipo_calificador: { type: String, enum: ['pasajero', 'conductor'], required: true },
  },
  { timestamps: true }
);

esquemaCalificacion.index({ id_viaje: 1 });
esquemaCalificacion.index({ id_calificador: 1 });
esquemaCalificacion.index({ id_calificado: 1 });
esquemaCalificacion.index({ id_viaje: 1, id_calificador: 1 }, { unique: true });

const Calificacion = mongoose.models['Calificacion'] || mongoose.model('Calificacion', esquemaCalificacion);

export default Calificacion;
export { Calificacion as Rating };
