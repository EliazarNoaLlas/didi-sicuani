import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import RideAcceptedAnimation from '../components/RideAcceptedAnimation';

export default function RideRequest() {
  const [formData, setFormData] = useState({
    origin_address: '',
    destination_address: '',
    passenger_offered_price: '',
    vehicle_type: 'any',
  });
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rideRequestId, setRideRequestId] = useState(null);
  const [showAcceptedAnimation, setShowAcceptedAnimation] = useState(false);
  const [acceptedDriverInfo, setAcceptedDriverInfo] = useState(null);
  const navigate = useNavigate();

  // Escuchar notificaciones de aceptación
  useEffect(() => {
    if (!rideRequestId) return;

    const socket = getSocket();
    
    if (socket && socket.connected) {
      const handleRideAccepted = (data) => {
        // Verificar que es para este viaje
        if (data.rideRequestId === rideRequestId || data.rideRequestId?.toString() === rideRequestId?.toString()) {
          setAcceptedDriverInfo({
            driverName: data.driverName,
            driverEmail: data.driverEmail,
            driverPhone: data.driverPhone,
            driverRating: data.driverRating,
            driverTotalRides: data.driverTotalRides,
            vehicleType: data.vehicleType,
            vehiclePlate: data.vehiclePlate,
            vehicleModel: data.vehicleModel,
            vehicleColor: data.vehicleColor,
            driverDistanceKm: data.driverDistanceKm,
            driverEtaMin: data.driverEtaMin,
            agreedPrice: data.agreedPrice,
            originAddress: data.originAddress,
            destinationAddress: data.destinationAddress,
          });
          setShowAcceptedAnimation(true);
          
          toast.success('🎉 ¡Conductor aceptó tu solicitud!', {
            duration: 5000,
          });
        }
      };

      socket.on('ride:accepted', handleRideAccepted);

      return () => {
        if (socket) {
          socket.off('ride:accepted', handleRideAccepted);
        }
      };
    }
  }, [rideRequestId]);

  const handleCalculatePrice = async () => {
    // TODO: Implementar cálculo de precio sugerido
    setSuggestedPrice(25.50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/bidding/request', {
        ...formData,
        origin_lat: -14.2694, // Mock coordinates
        origin_lon: -71.2256,
        destination_lat: -14.2700,
        destination_lon: -71.2260,
        passenger_offered_price: parseFloat(formData.passenger_offered_price),
      });

      const newRideId = response.data.data.rideRequest?._id || response.data.data.id;
      setRideRequestId(newRideId);
      
      toast.success('Solicitud creada. Esperando ofertas de conductores...');
      // Opcional: Redirigir a página de bidding o mantener aquí
      // navigate(`/bidding/${newRideId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Animación de aceptación */}
      <RideAcceptedAnimation
        show={showAcceptedAnimation}
        driverInfo={acceptedDriverInfo}
        onClose={() => {
          setShowAcceptedAnimation(false);
          // Opcional: Redirigir a página de viaje en progreso
          // navigate(`/ride/${rideRequestId}`);
        }}
      />

      <h1 className="text-3xl font-bold mb-6">Solicitar Viaje</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Origen
          </label>
          <input
            type="text"
            required
            value={formData.origin_address}
            onChange={(e) =>
              setFormData({ ...formData, origin_address: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ingresa tu ubicación"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destino
          </label>
          <input
            type="text"
            required
            value={formData.destination_address}
            onChange={(e) =>
              setFormData({ ...formData, destination_address: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ingresa tu destino"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Vehículo
          </label>
          <select
            value={formData.vehicle_type}
            onChange={(e) =>
              setFormData({ ...formData, vehicle_type: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="any">Cualquiera</option>
            <option value="taxi">Taxi</option>
            <option value="mototaxi">Mototaxi</option>
          </select>
        </div>
        {suggestedPrice && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Precio sugerido:</p>
            <p className="text-2xl font-bold text-blue-600">S/ {suggestedPrice}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu Precio Ofrecido (S/)
          </label>
          <input
            type="number"
            step="0.50"
            min="0"
            required
            value={formData.passenger_offered_price}
            onChange={(e) =>
              setFormData({ ...formData, passenger_offered_price: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ej: 25.00"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCalculatePrice}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Calcular Precio Sugerido
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Solicitar Viaje'}
          </button>
        </div>
      </form>
    </div>
  );
}

