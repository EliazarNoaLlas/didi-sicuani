import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import RideAcceptedAnimation from '../components/RideAcceptedAnimation';

export default function BiddingPage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [ride, setRide] = useState(null);
  const [showAcceptedAnimation, setShowAcceptedAnimation] = useState(false);
  const [acceptedDriverInfo, setAcceptedDriverInfo] = useState(null);

  useEffect(() => {
    loadRide();
    loadBids();

    const socket = getSocket();
    
    // Solo agregar listener si el socket está conectado
    if (socket && socket.connected) {
      const handleBidReceived = (bid) => {
        setBids((prev) => {
          // Evitar duplicados
          const exists = prev.some(b => b._id === bid._id);
          if (exists) return prev;
          return [bid, ...prev];
        });
        
        if (bid.bid_type === 'accept') {
          toast.success('🎉 ¡Conductor aceptó tu solicitud!', {
            duration: 5000,
            icon: '✅',
          });
        } else {
          toast.success('Nueva oferta recibida');
        }
      };

      const handleRideAccepted = (data) => {
        // Mostrar animación de aceptación con toda la información
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
        
        // Actualizar estado del viaje
        if (ride) {
          setRide({ ...ride, status: 'matched' });
        }
        
        // Recargar datos
        loadRide();
        loadBids();
      };

      socket.on('bid:received', handleBidReceived);
      socket.on('ride:accepted', handleRideAccepted);

      // Cleanup: remover listener al desmontar
      return () => {
        if (socket) {
          socket.off('bid:received', handleBidReceived);
          socket.off('ride:accepted', handleRideAccepted);
        }
      };
    } else {
      // Si no está conectado, esperar a que se conecte
      const handleConnect = () => {
        socket.on('bid:received', (bid) => {
          setBids((prev) => {
            const exists = prev.some(b => b._id === bid._id);
            if (exists) return prev;
            return [bid, ...prev];
          });
          toast.success('Nueva oferta recibida');
        });

        socket.on('ride:accepted', (data) => {
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
        });
      };

      if (socket) {
        socket.once('connect', handleConnect);
      }

      return () => {
        if (socket) {
          socket.off('connect', handleConnect);
          socket.off('bid:received');
          socket.off('ride:accepted');
        }
      };
    }
  }, [rideId]);

  const loadRide = async () => {
    try {
      // TODO: Implementar endpoint para obtener ride
      // const response = await api.get(`/rides/${rideId}`);
      // setRide(response.data.data);
    } catch (error) {
      console.error('Error loading ride:', error);
    }
  };

  const loadBids = async () => {
    try {
      const response = await api.get(`/bidding/ride/${rideId}`);
      setBids(response.data.data);
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await api.post(`/bidding/accept/${bidId}`);
      toast.success('Oferta aceptada. Viaje confirmado!');
    } catch (error) {
      toast.error('Error al aceptar oferta');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Animación de aceptación */}
      <RideAcceptedAnimation
        show={showAcceptedAnimation}
        driverInfo={acceptedDriverInfo}
        onClose={() => {
          setShowAcceptedAnimation(false);
          // Opcional: Redirigir a página de viaje en progreso
          // navigate(`/ride/${rideId}`);
        }}
      />

      <h1 className="text-3xl font-bold mb-6">Ofertas de Conductores</h1>
      
      {ride && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="font-semibold text-lg mb-2">Detalles del Viaje</h2>
          <p>{ride.origin_address} → {ride.destination_address}</p>
          <p className="text-gray-600 mt-2">
            Tu oferta: <span className="font-bold">S/ {ride.passenger_offered_price}</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {bids.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">Esperando ofertas de conductores...</p>
          </div>
        ) : (
          bids.map((bid) => (
            <div key={bid.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Conductor #{bid.driver_id}</h3>
                  {bid.bid_type === 'accept' ? (
                    <p className="text-green-600 font-bold mt-2">
                      Acepta tu precio: S/ {ride?.passenger_offered_price}
                    </p>
                  ) : (
                    <p className="text-blue-600 font-bold mt-2">
                      Contraoferta: S/ {bid.offered_price}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    ETA: {bid.driver_eta_min} min • Distancia: {bid.driver_distance_km} km
                  </p>
                </div>
                <button
                  onClick={() => handleAcceptBid(bid.id)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                >
                  Aceptar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

