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
  const [rondaFinalizada, setRondaFinalizada] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // Verificar si la ronda ha finalizado
  useEffect(() => {
    if (!ride) return;
    
    const verificarRonda = () => {
      const fechaExpiracion = ride.fecha_expiracion || ride.expires_at || ride.fechaExpiracion;
      if (!fechaExpiracion) {
        setRondaFinalizada(false);
        return;
      }

      const ahora = new Date();
      const expiracion = new Date(fechaExpiracion);
      const segundosRestantes = Math.max(0, Math.floor((expiracion - ahora) / 1000));
      
      setTiempoRestante(segundosRestantes);
      const finalizada = ahora >= expiracion;
      setRondaFinalizada(finalizada);
      
      // Si la ronda acaba de finalizar, cargar ofertas
      if (finalizada && bids.length === 0) {
        loadBids();
      }
    };

    verificarRonda();
    const interval = setInterval(verificarRonda, 1000);

    return () => clearInterval(interval);
  }, [ride]);

  useEffect(() => {
    loadRide();

    const socket = getSocket();
    
    // Solo agregar listener si el socket está conectado
    if (socket && socket.connected) {
      const handleBidReceived = (bid) => {
        // Durante la ronda activa, NO mostrar ofertas al pasajero
        // Solo notificar que se recibió una oferta (sin mostrar detalles)
        if (!rondaFinalizada) {
          // No agregar a la lista durante la ronda activa
          // Solo mostrar notificación genérica
          return;
        }
        
        // Solo después de que termine la ronda, mostrar las ofertas
        const normalizedBid = {
          ...bid,
          id: bid._id || bid.id,
          _id: bid._id || bid.id,
        };

        setBids((prev) => {
          const exists = prev.some(b => (b._id || b.id) === normalizedBid.id);
          if (exists) return prev;
          return [normalizedBid, ...prev];
        });
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

      // Escuchar eventos en español (y mantener compatibilidad con inglés)
      socket.on('oferta:recibida', handleBidReceived);
      socket.on('bid:received', handleBidReceived); // Compatibilidad
      socket.on('viaje:aceptado', handleRideAccepted);
      socket.on('ride:accepted', handleRideAccepted); // Compatibilidad
      
      // Escuchar cuando la ronda finaliza
      const handleRondaFinalizada = (data) => {
        if (data.idSolicitudViaje === rideId || data.idSolicitudViaje === ride?._id || data.idSolicitudViaje === ride?.id) {
          setRondaFinalizada(true);
          loadBids();
          toast.success('La ronda de ofertas ha finalizado. Aquí están las ofertas recibidas.');
        }
      };
      socket.on('ronda:finalizada', handleRondaFinalizada);

      // Cleanup: remover listener al desmontar
      return () => {
        if (socket) {
          socket.off('oferta:recibida', handleBidReceived);
          socket.off('bid:received', handleBidReceived);
          socket.off('viaje:aceptado', handleRideAccepted);
          socket.off('ride:accepted', handleRideAccepted);
          socket.off('ronda:finalizada', handleRondaFinalizada);
        }
      };
    } else {
      // Si no está conectado, esperar a que se conecte
      const handleConnect = () => {
        const handleBidReceivedConnect = (bid) => {
          setBids((prev) => {
            const exists = prev.some(b => b._id === bid._id || b.id === bid.id);
            if (exists) return prev;
            return [bid, ...prev];
          });
          toast.success('Nueva oferta recibida');
        };

        const handleRideAcceptedConnect = (data) => {
          setAcceptedDriverInfo({
            driverName: data.nombreConductor || data.driverName,
            driverEmail: data.correoConductor || data.driverEmail,
            driverPhone: data.telefonoConductor || data.driverPhone,
            driverRating: data.calificacionConductor || data.driverRating,
            driverTotalRides: data.totalViajesConductor || data.driverTotalRides,
            vehicleType: data.tipoVehiculo || data.vehicleType,
            vehiclePlate: data.placaVehiculo || data.vehiclePlate,
            vehicleModel: data.modeloVehiculo || data.vehicleModel,
            vehicleColor: data.colorVehiculo || data.vehicleColor,
            driverDistanceKm: data.distancia || data.driverDistanceKm,
            driverEtaMin: data.duracion || data.driverEtaMin,
            agreedPrice: data.precioAcordado || data.agreedPrice,
            originAddress: data.direccionOrigen || data.originAddress,
            destinationAddress: data.direccionDestino || data.destinationAddress,
          });
          setShowAcceptedAnimation(true);
        };

        socket.on('oferta:recibida', handleBidReceivedConnect);
        socket.on('bid:received', handleBidReceivedConnect); // Compatibilidad
        socket.on('viaje:aceptado', handleRideAcceptedConnect);
        socket.on('ride:accepted', handleRideAcceptedConnect); // Compatibilidad
      };

      if (socket) {
        socket.once('connect', handleConnect);
      }

      return () => {
        if (socket) {
          socket.off('connect', handleConnect);
          socket.off('oferta:recibida');
          socket.off('bid:received');
          socket.off('viaje:aceptado');
          socket.off('ride:accepted');
        }
      };
    }
  }, [rideId]);

  const loadRide = async () => {
    try {
      const response = await api.get(`/viajes/${rideId}`);
      
      // El backend retorna: { exito: true, datos: { viaje, ofertas, rondaFinalizada } }
      const datos = response.data.datos || response.data.data || {};
      const viaje = datos.viaje || datos.ride || datos;
      
      setRide(viaje);
      
      // Usar el estado del backend si está disponible
      if (datos.rondaFinalizada !== undefined) {
        setRondaFinalizada(datos.rondaFinalizada);
      }
      
      // Si la ronda ha finalizado, cargar ofertas
      if (datos.rondaFinalizada && datos.ofertas) {
        const ofertas = datos.ofertas || [];
        const ofertasOrdenadas = [...ofertas].sort((a, b) => {
          const precioA = a.precio_ofrecido || a.offered_price || a.precioOfrecido || 0;
          const precioB = b.precio_ofrecido || b.offered_price || b.precioOfrecido || 0;
          return precioA - precioB;
        });
        setBids(ofertasOrdenadas);
      } else {
        setBids([]); // Limpiar ofertas durante la ronda activa
      }
    } catch (error) {
      console.error('Error loading ride:', error);
      const mensajeError = error.response?.data?.error || 
                           error.response?.data?.mensaje || 
                           error.response?.data?.message || 
                           error.message || 
                           'Error al cargar el viaje';
      toast.error(mensajeError);
    }
  };

  const loadBids = async () => {
    // Solo cargar ofertas si la ronda ha finalizado
    if (!rondaFinalizada) {
      setBids([]); // Limpiar ofertas durante la ronda activa
      return;
    }
    
    try {
      const response = await api.get(`/viajes/${rideId}`);
      
      // El backend retorna: { exito: true, datos: { viaje, ofertas } }
      const datos = response.data.datos || response.data.data || {};
      const ofertas = datos.ofertas || datos.bids || [];
      
      // Ordenar ofertas por precio (ascendente - menor precio primero)
      const ofertasOrdenadas = [...ofertas].sort((a, b) => {
        const precioA = a.precio_ofrecido || a.offered_price || a.precioOfrecido || 0;
        const precioB = b.precio_ofrecido || b.offered_price || b.precioOfrecido || 0;
        return precioA - precioB;
      });
      
      setBids(ofertasOrdenadas);
    } catch (error) {
      console.error('Error loading bids:', error);
      // No mostrar toast para este error, solo loguear
    }
  };

  // Cargar ofertas cuando la ronda finaliza
  useEffect(() => {
    if (rondaFinalizada) {
      loadBids();
    }
  }, [rondaFinalizada]);

  const handleAcceptBid = async (bidId) => {
    if (!bidId) {
      toast.error('ID de oferta no válido');
      return;
    }

    try {
      await api.post(`/viajes/${rideId}/bids/${bidId}/respond`, {
        action: 'aceptar', // Usar español para consistencia
      });
      toast.success('Oferta aceptada. Viaje confirmado!');
      loadRide();
      loadBids();
    } catch (error) {
      const mensajeError = error.response?.data?.error || 
                           error.response?.data?.mensaje || 
                           error.message || 
                           'Error al aceptar oferta';
      toast.error(mensajeError);
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!bidId) {
      toast.error('ID de oferta no válido');
      return;
    }

    try {
      await api.post(`/viajes/${rideId}/bids/${bidId}/respond`, {
        action: 'rechazar', // Usar español para consistencia
      });
      toast.success('Oferta rechazada');
      loadBids();
    } catch (error) {
      const mensajeError = error.response?.data?.error || 
                           error.response?.data?.mensaje || 
                           error.message || 
                           'Error al rechazar oferta';
      toast.error(mensajeError);
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
          <p className="text-lg">
            <span className="font-medium">
              {ride.origen_direccion || ride.origin_address || 'N/A'}
            </span>{' '}
            →{' '}
            <span className="font-medium">
              {ride.destino_direccion || ride.destination_address || 'N/A'}
            </span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Precio Sugerido</p>
              <p className="font-bold text-xl text-blue-600">
                S/ {ride.precio_sugerido_soles || ride.suggested_price_soles || ride.precioSugerido || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Distancia</p>
              <p className="font-medium">
                {ride.distancia_estimada_km || ride.estimated_distance_km || ride.distancia || 'N/A'} km
              </p>
            </div>
          </div>
          {rondaFinalizada ? (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800">
                ✅ Ronda de ofertas finalizada
              </p>
              <p className="text-xs text-green-600 mt-1">
                Puedes ver y seleccionar las ofertas de los conductores
              </p>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800">
                ⏰ Ronda de ofertas en curso
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Las ofertas se mostrarán cuando termine la ronda
              </p>
            </div>
          )}
        </div>
      )}

      {rondaFinalizada ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {bids.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No se recibieron ofertas de conductores</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4">
                <h2 className="text-xl font-bold">Ofertas Recibidas ({bids.length})</h2>
                <p className="text-sm mt-1">Ordenadas por precio (menor a mayor)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distancia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contraofertas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bids.map((bid, index) => {
            const bidId = bid.id || bid._id;
            if (!bidId) {
              console.warn('Bid sin ID:', bid);
              return null;
            }
            
            // Mapear campos en español e inglés para compatibilidad
            const nombreConductor = bid.nombre_conductor || bid.driver_name || 'Conductor';
            const calificacion = bid.calificacion || bid.calificacion_conductor || bid.rating || 5.0;
            const precioOferta = bid.precio_ofrecido || bid.offered_price || bid.precioOfrecido || 0;
            const etaMin = bid.tiempo_estimado_llegada_min || bid.driver_eta_min || bid.etaMin || 'N/A';
            const distanciaKm = bid.distancia_conductor_km || bid.driver_distance_km || bid.distanciaKm || 0;
            const tipoVehiculo = bid.tipo_vehiculo || bid.vehicle_type || bid.tipoVehiculo || '';
            const totalViajes = bid.total_viajes || bid.total_trips || bid.totalViajes || 0;
                      const fechaCreacion = bid.fecha_creacion || bid.created_at || bid.createdAt || new Date();
                      const estado = bid.estado || bid.status || 'pending';
                      const numeroContraofertas = bid.contraofertas?.length || bid.numero_contraofertas || 0;
                      
                      return (
                        <tr key={bidId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{nombreConductor}</div>
                            <div className="text-sm text-gray-500">Viajes: {totalViajes}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-yellow-500">⭐</span>
                              <span className="ml-1 text-sm font-medium text-gray-900">
                                {typeof calificacion === 'number' ? calificacion.toFixed(1) : calificacion}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600">
                              S/ {typeof precioOferta === 'number' ? precioOferta.toFixed(2) : precioOferta || 'N/A'}
                            </div>
                            {bid.precio_inicial && bid.precio_inicial !== precioOferta && (
                              <div className="text-xs text-gray-400 line-through">
                                S/ {bid.precio_inicial.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tipoVehiculo === 'taxi' ? '🚕 Taxi' : 
                             tipoVehiculo === 'mototaxi' ? '🏍️ Mototaxi' : 
                             tipoVehiculo === 'cualquiera' ? '🚗 Cualquiera' :
                             tipoVehiculo || '🚗'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof distanciaKm === 'number' ? distanciaKm.toFixed(2) : distanciaKm || 'N/A'} km
                            {etaMin !== 'N/A' && (
                              <div className="text-xs text-gray-400">ETA: {etaMin} min</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {numeroContraofertas > 0 ? (
                              <div className="text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {numeroContraofertas} {numeroContraofertas === 1 ? 'vez' : 'veces'}
                                </span>
                                {bid.contraofertas && bid.contraofertas.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {bid.contraofertas.map((c, idx) => (
                                      <span key={idx}>
                                        S/ {c.monto?.toFixed(2) || c.toFixed(2)}
                                        {idx < bid.contraofertas.length - 1 ? ' → ' : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {(estado === 'pending' || estado === 'pendiente') ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptBid(bidId)}
                                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium text-sm"
                                >
                                  ✅ Aceptar
                                </button>
                                <button
                                  onClick={() => handleRejectBid(bidId)}
                                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium text-sm"
                                >
                                  ❌
                                </button>
                              </div>
                            ) : estado === 'accepted' || estado === 'aceptada' ? (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                ✅ Aceptada
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                                ❌ Rechazada
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ronda de Ofertas en Curso</h2>
            <p className="text-gray-600 mb-4">
              Los conductores están realizando sus ofertas. Las ofertas se mostrarán cuando termine la ronda.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800">
                Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

