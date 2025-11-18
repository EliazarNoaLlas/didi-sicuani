import cron from 'node-cron';
import metricsService from '../services/metrics.service.js';
import { io } from '../server.js';

// Actualizar métricas cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  try {
    const metrics = await metricsService.getDashboardMetrics();
    
    // Emitir actualización vía Socket.io a todos los admins
    if (io) {
      io.to('admins').emit('metrics:update', metrics);
    }
    
    console.log('📊 Métricas actualizadas:', new Date().toISOString());
  } catch (error) {
    console.error('Error actualizando métricas:', error);
  }
});

// Limpiar bids expirados cada hora
cron.schedule('0 * * * *', async () => {
  try {
    const Bid = (await import('../models/Bid.js')).default;
    const now = new Date();
    
    await Bid.updateMany(
      {
        status: 'pending',
        expires_at: { $lt: now },
      },
      {
        status: 'expired',
      }
    );
    
    console.log('🧹 Bids expirados limpiados:', new Date().toISOString());
  } catch (error) {
    console.error('Error limpiando bids expirados:', error);
  }
});

// Limpiar ride requests expirados cada 30 minutos
cron.schedule('*/30 * * * *', async () => {
  try {
    const RideRequest = (await import('../models/RideRequest.js')).default;
    const biddingService = (await import('../services/bidding.service.js')).default;
    const now = new Date();
    
    const expiredRides = await RideRequest.find({
      status: 'bidding_active',
      expires_at: { $lt: now },
    });
    
    for (const ride of expiredRides) {
      await biddingService.handleBiddingTimeout(ride._id.toString());
    }
    
    if (expiredRides.length > 0) {
      console.log(`⏰ ${expiredRides.length} viajes expirados procesados`);
    }
  } catch (error) {
    console.error('Error procesando viajes expirados:', error);
  }
});

console.log('✅ Cron jobs configurados');

