import { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RideQueue() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    
    const socket = getSocket();
    
    // Solo agregar listener si el socket está conectado
    if (socket && socket.connected) {
      const handleNewRide = (ride) => {
        // Verificar que no esté ya en la lista
        setRides((prev) => {
          const exists = prev.some(r => r._id === ride._id || r._id === ride.rideRequestId);
          if (exists) return prev;
          return [ride, ...prev];
        });
        toast.success('🚗 Nueva solicitud de viaje disponible');
        // Recargar la cola para obtener datos completos
        loadQueue();
      };

      socket.on('ride:new', handleNewRide);

      // Cleanup: remover listener al desmontar
      return () => {
        if (socket) {
          socket.off('ride:new', handleNewRide);
        }
      };
    } else {
      // Si no está conectado, esperar a que se conecte
      const handleConnect = () => {
        socket.on('ride:new', (ride) => {
          setRides((prev) => [ride, ...prev]);
          toast.success('Nueva solicitud de viaje disponible');
        });
      };

      if (socket) {
        socket.once('connect', handleConnect);
      }

      return () => {
        if (socket) {
          socket.off('connect', handleConnect);
          socket.off('ride:new');
        }
      };
    }
  }, []);

  const loadQueue = async () => {
    try {
      const response = await api.get('/drivers/queue');
      setRides(response.data.data || []);
    } catch (error) {
      console.error('Error loading queue:', error);
      toast.error('Error al cargar la cola de viajes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/bids`, {
        bid_type: 'accept',
      });
      toast.success('✅ Solicitud aceptada');
      // Recargar la cola para actualizar
      loadQueue();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error(error.response?.data?.error || 'Error al aceptar la solicitud');
    }
  };

  const handleReject = async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/bids`, {
        bid_type: 'reject',
      });
      toast.success('Solicitud rechazada');
      // Recargar la cola para actualizar
      loadQueue();
    } catch (error) {
      console.error('Error rejecting ride:', error);
      toast.error(error.response?.data?.error || 'Error al rechazar la solicitud');
    }
  };

  const handleHold = async (rideId) => {
    try {
      const response = await api.post('/drivers/hold', {
        ride_id: rideId,
        duration_minutes: 5,
      });
      toast.success('⏸️ Viaje puesto en espera por 5 minutos');
      loadQueue();
    } catch (error) {
      console.error('Error putting ride on hold:', error);
      toast.error(error.response?.data?.error || 'Error al poner en espera');
    }
  };

  const handleBlock = async (rideId, userId) => {
    if (!userId) {
      toast.error('No se puede bloquear: ID de usuario no disponible');
      return;
    }

    const confirmed = window.confirm(
      '¿Estás seguro de que quieres bloquear a este usuario? No recibirás más solicitudes de él.'
    );

    if (!confirmed) return;

    try {
      const response = await api.post('/drivers/block-user', {
        user_id: userId,
        reason: 'Bloqueado por conductor',
        is_permanent: false,
      });
      toast.success('Usuario bloqueado');
      loadQueue();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error(error.response?.data?.error || 'Error al bloquear usuario');
    }
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cola de Viajes</h1>
        <button
          onClick={loadQueue}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">No hay solicitudes disponibles</p>
          <p className="text-sm text-gray-400 mt-2">
            Las nuevas solicitudes aparecerán aquí automáticamente
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div key={ride._id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {ride.origin?.address || 'Origen no especificado'}
                    </h3>
                    <span className="text-gray-400">→</span>
                    <h3 className="font-semibold text-lg">
                      {ride.destination?.address || 'Destino no especificado'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Pasajero</p>
                      <p className="font-medium">{ride.passenger?.name || 'N/A'}</p>
                      {ride.passenger?.phone && (
                        <p className="text-sm text-gray-400">{ride.passenger.phone}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Precio Ofrecido</p>
                      <p className="font-bold text-green-600 text-xl">
                        S/ {ride.pricing?.passenger_offered_price || ride.passenger_offered_price || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Sugerido: S/ {ride.pricing?.suggested_price || ride.suggested_price || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Distancia del Viaje</p>
                      <p className="font-medium">
                        {ride.trip?.distance_km || ride.estimated_distance_km || 'N/A'} km
                      </p>
                      <p className="text-sm text-gray-400">
                        Duración: {ride.trip?.duration_min || ride.estimated_duration_min || 'N/A'} min
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Distancia desde ti</p>
                      <p className="font-medium">
                        {ride.distance_from_driver_km 
                          ? `${ride.distance_from_driver_km} km`
                          : 'No disponible'}
                      </p>
                      {ride.eta_minutes && (
                        <p className="text-sm text-gray-400">
                          ETA: {ride.eta_minutes} min
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {ride.vehicle_type === 'taxi' ? '🚕 Taxi' : ride.vehicle_type === 'mototaxi' ? '🏍️ Mototaxi' : '🚗 Cualquiera'}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      💰 {ride.payment_method || 'Efectivo'}
                    </span>
                    {ride.expires_at && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        ⏰ Expira: {new Date(ride.expires_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleAccept(ride._id)}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    ✅ Aceptar
                  </button>
                  <button
                    onClick={() => handleHold(ride._id)}
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                  >
                    ⏸️ Poner en Espera
                  </button>
                  <button
                    onClick={() => handleReject(ride._id)}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    ❌ Rechazar
                  </button>
                  <button
                    onClick={() => handleBlock(ride._id, ride.passenger?.id)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                  >
                    🚫 Bloquear Usuario
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

