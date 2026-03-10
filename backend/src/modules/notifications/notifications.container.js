import { SocketNotificationService } from './application/socket.notification.service.js';
import { SocketHandler } from './interfaces/socket.handler.js';

export function buildNotificationsContainer(io) {
  const notificationService = new SocketNotificationService(io);
  const socketHandler = new SocketHandler(io);

  return {
    notificationService,
    socketHandler,
    /**
     * Inicializar el handler de Socket.io
     * Debe llamarse DESPUÉS de que todos los módulos estén montados
     */
    initialize(biddingSocketHandler = null) {
      socketHandler.initialize(biddingSocketHandler);
    },
  };
}
