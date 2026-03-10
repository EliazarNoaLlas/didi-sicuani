/**
 * Constantes de eventos Socket.io
 * Mantiene aliases en español e inglés para compatibilidad
 */

// ── Viajes / Rides ────────────────────────────────────────────────────────────
export const EVENTOS_VIAJE = {
  NUEVO: 'viaje:nuevo',
  ACEPTADO: 'viaje:aceptado',
  ACEPTADO_POR_PASAJERO: 'viaje:aceptado_por_pasajero',
  ASIGNADO: 'viaje:asignado',
  CONDUCTOR_EN_RUTA: 'viaje:conductor_en_ruta',
  EN_PROGRESO: 'viaje:en_progreso',
  COMPLETADO: 'viaje:completado',
  CANCELADO: 'viaje:cancelado',
  RONDA_FINALIZADA: 'ronda:finalizada',
  // Aliases en inglés (compatibilidad)
  NEW: 'viaje:nuevo',
  ACCEPTED: 'viaje:aceptado',
  ASSIGNED: 'viaje:asignado',
  DRIVER_EN_ROUTE: 'viaje:conductor_en_ruta',
  IN_PROGRESS: 'viaje:en_progreso',
  COMPLETED: 'viaje:completado',
  CANCELLED: 'viaje:cancelado',
};

// ── Ofertas / Bids ────────────────────────────────────────────────────────────
export const EVENTOS_OFERTA = {
  RECIBIDA: 'oferta:recibida',
  CREADA: 'oferta:creada',
  ACTUALIZADA: 'oferta:actualizada',
  RECHAZADA: 'oferta:rechazada',
  NUEVA: 'oferta:nueva',
  COMPETENCIA_ACTUALIZADA: 'competencia:actualizada',
  CONTRAOFERTA_ACTUALIZADA: 'contraoferta:actualizada',
  // Eventos de cliente → servidor
  ENVIAR: 'oferta:enviar',
  CONTRAOFERTAR: 'oferta:contraofertar',
  ACEPTAR: 'oferta:aceptar',
  RECHAZAR: 'oferta:rechazar',
  // Aliases en inglés
  RECEIVED: 'oferta:recibida',
  CREATED: 'oferta:creada',
  UPDATED: 'oferta:actualizada',
  REJECTED: 'oferta:rechazada',
};

// ── Cuenta / Account ──────────────────────────────────────────────────────────
export const EVENTOS_CUENTA = {
  DESACTIVADA: 'cuenta:desactivada',
  DEACTIVATED: 'cuenta:desactivada',
};

// ── Calificaciones / Ratings ──────────────────────────────────────────────────
export const EVENTOS_CALIFICACION = {
  RECIBIDA: 'rating:received',
};

// ── Comisiones / Commission ───────────────────────────────────────────────────
export const EVENTOS_COMISION = {
  ACTUALIZADA: 'commission:updated',
};

// ── Retenciones / Hold ────────────────────────────────────────────────────────
export const EVENTOS_RETENCION = {
  EN_ESPERA: 'ride:on_hold',
};

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const ROOMS = {
  CONDUCTORES: 'conductores',
  PASAJEROS: 'pasajeros',
  ADMINISTRADORES: 'administradores',
  USUARIO: (id) => `usuario:${id}`,
  USER: (id) => `user:${id}`,
  CONDUCTOR: (id) => `conductor:${id}`,
};

// Eventos de cliente → servidor (compatibilidad con inglés y español)
export const EVENTOS_CLIENTE = {
  SOLICITAR_VIAJE: 'viaje:solicitar',
  REQUEST_RIDE: 'ride:request',
  ACEPTAR_VIAJE: 'viaje:aceptar',
  ACCEPT_RIDE: 'ride:accept',
  ENVIAR_OFERTA: 'oferta:enviar',
  SUBMIT_BID: 'bid:submit',
  UBICACION_CONDUCTOR: 'conductor:ubicacion',
  DRIVER_LOCATION: 'driver:location',
};