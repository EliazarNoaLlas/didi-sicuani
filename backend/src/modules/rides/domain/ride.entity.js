/**
 * Entidad Viaje - lógica de negocio pura, sin framework
 */
export class Ride {
  constructor(data) {
    this.id = data.id || data._id?.toString();
    this.passengerId = data.id_pasajero?.toString();
    this.origin = {
      lat: data.origen_lat,
      lon: data.origen_lon,
      address: data.origen_direccion,
    };
    this.destination = {
      lat: data.destino_lat,
      lon: data.destino_lon,
      address: data.destino_direccion,
    };
    this.status = data.estado || 'subasta_activa';
    this.suggestedPrice = data.precio_sugerido_soles;
    this.passengerPrice = data.precio_ofrecido_pasajero;
    this.finalPrice = data.precio_final_acordado;
    this.distanceKm = data.distancia_estimada_km;
    this.durationMin = data.duracion_estimada_min;
    this.vehicleType = data.tipo_vehiculo || 'cualquiera';
    this.paymentMethod = data.metodo_pago || 'efectivo';
    this.expiresAt = data.fecha_expiracion;
    this.assignedDriverId = data.id_conductor_asignado?.toString();
    this.assignedAt = data.fecha_asignacion;
    this.createdAt = data.createdAt;
  }

  isExpired() {
    return this.expiresAt && new Date() > new Date(this.expiresAt);
  }

  canAcceptBids() {
    return this.status === 'subasta_activa' && !this.isExpired();
  }

  canTransitionTo(newStatus) {
    const validTransitions = {
      pendiente: ['subasta_activa', 'cancelado'],
      subasta_activa: ['asignado', 'cancelado'],
      asignado: ['conductor_en_ruta', 'cancelado'],
      conductor_en_ruta: ['en_progreso', 'cancelado'],
      en_progreso: ['completado', 'cancelado'],
      completado: [],
      cancelado: [],
    };
    return (validTransitions[this.status] || []).includes(newStatus);
  }

  cancel() {
    const terminal = ['completado', 'cancelado'];
    if (terminal.includes(this.status)) {
      throw new Error(`No se puede cancelar un viaje ${this.status}`);
    }
    this.status = 'cancelado';
  }
}
