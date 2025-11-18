import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Inicializa la conexión Socket.io con reconexión automática
 * Mantiene una única instancia (singleton)
 */
export const initSocket = () => {
  // Si ya hay una conexión activa, retornarla
  if (socket && socket.connected) {
    return socket;
  }

  // Si ya está intentando conectar, esperar
  if (isConnecting) {
    return socket;
  }

  isConnecting = true;
  const token = useAuthStore.getState().token;

  if (!token) {
    console.warn('⚠️ No hay token disponible para Socket.io');
    isConnecting = false;
    return null;
  }

  // Si hay un socket desconectado, limpiarlo primero
  if (socket && !socket.connected) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  // Crear nueva conexión
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 20000,
    forceNew: false, // Reutilizar conexión si es posible
  });

  // Event: Conexión exitosa
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    reconnectAttempts = 0;
    isConnecting = false;
  });

  // Event: Desconexión
  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    isConnecting = false;

    // Si fue una desconexión involuntaria, intentar reconectar
    if (reason === 'io server disconnect') {
      // El servidor desconectó el socket, reconectar manualmente
      socket.connect();
    }
  });

  // Event: Intentando reconectar
  socket.on('reconnect_attempt', (attemptNumber) => {
    reconnectAttempts = attemptNumber;
    console.log(`🔄 Intentando reconectar... (intento ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS})`);
  });

  // Event: Reconexión exitosa
  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Socket reconectado después de ${attemptNumber} intentos`);
    reconnectAttempts = 0;
  });

  // Event: Error de reconexión
  socket.on('reconnect_error', (error) => {
    console.error('❌ Error de reconexión:', error.message);
  });

  // Event: Fallo de reconexión
  socket.on('reconnect_failed', () => {
    console.error('❌ Fallo al reconectar después de', MAX_RECONNECT_ATTEMPTS, 'intentos');
    // Opcional: Notificar al usuario o intentar reconectar manualmente
  });

  // Event: Error de conexión
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    isConnecting = false;
  });

  // Event: Error general
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socket;
};

/**
 * Obtiene la instancia del socket, inicializándola si es necesario
 */
export const getSocket = () => {
  if (!socket || !socket.connected) {
    return initSocket();
  }
  return socket;
};

/**
 * Desconecta el socket completamente
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
    reconnectAttempts = 0;
  }
};

/**
 * Actualiza el token de autenticación del socket
 * Útil cuando el usuario hace login o el token se renueva
 */
export const updateSocketToken = (newToken) => {
  if (socket) {
    // Desconectar y reconectar con nuevo token
    disconnectSocket();
  }
  return initSocket();
};

