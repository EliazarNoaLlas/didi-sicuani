/**
 * Entidad Usuario - lógica de negocio pura, sin framework
 */
export class User {
  constructor(data) {
    this.id = data.id || data._id?.toString();
    this.nombre = data.nombre;
    this.correo = data.correo;
    this.telefono = data.telefono;
    this.tipoUsuario = data.tipo_usuario;
    this.estaActivo = data.esta_activo !== undefined ? data.esta_activo : true;
    this.informacionConductor = data.informacion_conductor || null;
    this.createdAt = data.createdAt;
  }

  esConductor() {
    return this.tipoUsuario === 'conductor';
  }

  esPasajero() {
    return this.tipoUsuario === 'pasajero';
  }

  esAdministrador() {
    return this.tipoUsuario === 'administrador';
  }

  puedeIniciarSesion() {
    return this.estaActivo;
  }

  toPublicJSON() {
    return {
      id: this.id,
      correo: this.correo,
      nombre: this.nombre,
      tipoUsuario: this.tipoUsuario,
      telefono: this.telefono,
    };
  }
}
