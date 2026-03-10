import mongoose from 'mongoose';

const esquemaUsuario = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es requerido'], trim: true },
    correo: {
      type: String,
      required: [true, 'El correo electrónico es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    contrasena: { type: String, required: [true, 'La contraseña es requerida'], minlength: 6, select: false },
    telefono: { type: String, trim: true },
    tipo_usuario: {
      type: String,
      enum: ['pasajero', 'conductor', 'administrador'],
      required: true,
    },
    esta_activo: { type: Boolean, default: true },
    informacion_conductor: {
      tipo_vehiculo: { type: String, enum: ['taxi', 'mototaxi'] },
      placa_vehiculo: String,
      modelo_vehiculo: String,
      numero_licencia: String,
      calificacion: { type: Number, default: 5.0, min: 0, max: 5 },
      total_viajes: { type: Number, default: 0 },
      esta_en_linea: { type: Boolean, default: false },
      esta_disponible: { type: Boolean, default: false },
      latitud_actual: Number,
      longitud_actual: Number,
    },
  },
  { timestamps: true }
);

esquemaUsuario.index({ tipo_usuario: 1 });
esquemaUsuario.index({ 'informacion_conductor.esta_en_linea': 1, 'informacion_conductor.esta_disponible': 1 });

const Usuario = mongoose.models['Usuario'] || mongoose.model('Usuario', esquemaUsuario);

export default Usuario;
export { Usuario as User };
