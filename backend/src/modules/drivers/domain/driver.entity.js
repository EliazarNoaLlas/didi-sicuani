/**
 * Entidad Conductor - lógica de negocio pura, sin framework
 */
export class Driver {
  constructor(data) {
    this.id = data.id || data._id?.toString();
    this.name = data.nombre;
    this.email = data.correo;
    this.phone = data.telefono;
    this.isOnline = data.informacion_conductor?.esta_en_linea ?? false;
    this.isAvailable = data.informacion_conductor?.esta_disponible ?? false;
    this.lat = data.informacion_conductor?.latitud_actual ?? null;
    this.lon = data.informacion_conductor?.longitud_actual ?? null;
    this.rating = data.informacion_conductor?.calificacion ?? 5.0;
    this.totalRides = data.informacion_conductor?.total_viajes ?? 0;
    this.vehicleType = data.informacion_conductor?.tipo_vehiculo;
    this.vehiclePlate = data.informacion_conductor?.placa_vehiculo;
    this.vehicleModel = data.informacion_conductor?.modelo_vehiculo;
    this.vehicleColor = data.informacion_conductor?.color_vehiculo;
    this.commissionRate = data.informacion_conductor?.tasa_comision ?? 0.15;
    this.driverInfo = data.informacion_conductor || {};
  }

  isReadyForRides() {
    return this.isOnline && this.isAvailable;
  }

  hasLocation() {
    return this.lat !== null && this.lon !== null;
  }

  toPublicJSON() {
    return {
      id: this.id,
      nombre: this.name,
      correo: this.email,
      telefono: this.phone,
      calificacion: this.rating,
      total_viajes: this.totalRides,
      tipo_vehiculo: this.vehicleType,
      placa_vehiculo: this.vehiclePlate,
      modelo_vehiculo: this.vehicleModel,
      color_vehiculo: this.vehicleColor,
      esta_en_linea: this.isOnline,
      esta_disponible: this.isAvailable,
    };
  }
}
