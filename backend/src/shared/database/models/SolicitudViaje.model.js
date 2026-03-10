import mongoose from 'mongoose';

const solicitudViajeSchema = new mongoose.Schema(
  {
    id_pasajero: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    origen_lat: { type: Number, required: true },
    origen_lon: { type: Number, required: true },
    origen_direccion: { type: String, required: true },
    destino_lat: { type: Number, required: true },
    destino_lon: { type: Number, required: true },
    destino_direccion: { type: String, required: true },
    precio_sugerido_soles: { type: Number, required: true },
    precio_ofrecido_pasajero: { type: Number, required: false },
    precio_final_acordado: Number,
    distancia_estimada_km: Number,
    duracion_estimada_min: Number,
    tipo_vehiculo: {
      type: String,
      enum: ['taxi', 'mototaxi', 'cualquiera'],
      default: 'cualquiera',
    },
    metodo_pago: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'billetera'],
      default: 'efectivo',
    },
    estado: {
      type: String,
      enum: ['pendiente', 'subasta_activa', 'asignado', 'conductor_en_ruta', 'en_progreso', 'completado', 'cancelado'],
      default: 'pendiente',
    },
    id_conductor_asignado: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha_asignacion: Date,
    fecha_expiracion: Date,
    fecha_eliminacion: { type: Date, default: null },
    eliminado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  },
  { timestamps: true }
);

solicitudViajeSchema.index({ id_pasajero: 1 });
solicitudViajeSchema.index({ estado: 1 });
solicitudViajeSchema.index({ fecha_expiracion: 1 });
solicitudViajeSchema.index({ origen_lat: 1, origen_lon: 1 });
solicitudViajeSchema.index({ id_conductor_asignado: 1 });
solicitudViajeSchema.index({ fecha_eliminacion: 1 });

const SolicitudViaje = mongoose.models['SolicitudViaje'] || mongoose.model('SolicitudViaje', solicitudViajeSchema);

export default SolicitudViaje;
export { SolicitudViaje as RideRequest };
