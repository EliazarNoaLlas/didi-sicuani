import { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import VistaContraofertaConductor from '../components/VistaContraofertaConductor';

export default function RideQueue() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ofertasActivas, setOfertasActivas] = useState({}); // { rideId: oferta }
  const [mostrarVistaContraoferta, setMostrarVistaContraoferta] = useState(null); // rideId que está mostrando la vista

  useEffect(() => {
    loadQueue();
    cargarOfertasActivas();
    
    const socket = getSocket();
    
    // Solo agregar listener si el socket está conectado
    if (socket && socket.connected) {
      const handleNewRide = (ride) => {
        // Normalizar ID del nuevo ride
        const normalizeId = (r) => {
          if (r._id) return typeof r._id === 'string' ? r._id : r._id.toString();
          if (r.id) return typeof r.id === 'string' ? r.id : r.id.toString();
          if (r.idSolicitudViaje) return typeof r.idSolicitudViaje === 'string' ? r.idSolicitudViaje : r.idSolicitudViaje.toString();
          if (r.rideRequestId) return typeof r.rideRequestId === 'string' ? r.rideRequestId : r.rideRequestId.toString();
          return null;
        };
        
        const newRideId = normalizeId(ride);
        
        // Verificar que no esté ya en la lista usando IDs normalizados
        setRides((prev) => {
          if (!newRideId) {
            // Si no hay ID, solo mostrar notificación y recargar
            toast.success('🚗 Nueva solicitud de viaje disponible');
            // Recargar después de un delay para evitar conflictos
            setTimeout(() => loadQueue(), 500);
            return prev;
          }
          
          const exists = prev.some(r => {
            const rId = normalizeId(r);
            return rId && rId === newRideId;
          });
          
          if (exists) {
            // Si existe, actualizar el existente sin duplicar
            const updated = prev.map(r => {
              const rId = normalizeId(r);
              return rId === newRideId ? { ...r, ...ride } : r;
            });
            // Filtrar duplicados adicionales por si acaso
            const idsVistos = new Set();
            return updated.filter(r => {
              const rId = normalizeId(r);
              if (!rId || idsVistos.has(rId)) return false;
              idsVistos.add(rId);
              return true;
            });
          }
          
          // Si no existe, agregar al inicio
          const newRides = [ride, ...prev];
          // Filtrar duplicados adicionales por si acaso
          const idsVistos = new Set();
          return newRides.filter(r => {
            const rId = normalizeId(r);
            if (!rId) return true; // Mantener si no tiene ID (poco probable)
            if (idsVistos.has(rId)) return false;
            idsVistos.add(rId);
            return true;
          });
        });
        toast.success('🚗 Nueva solicitud de viaje disponible');
      };

      // Escuchar cuando una solicitud es asignada a otro conductor
      const handleRideMatched = (data) => {
        const rideIdToRemove = data.idSolicitudViaje || data.rideRequestId || data._id;
        setRides((prev) => prev.filter(r => {
          const rId = r._id || r.id || r.idSolicitudViaje || r.rideRequestId;
          return rId !== rideIdToRemove;
        }));
        toast('Una solicitud fue asignada a otro conductor', { icon: 'ℹ️' });
        loadQueue();
      };

      // Escuchar actualizaciones de competencia (solo información ofuscada)
      const handleCompetenciaActualizada = (data) => {
        const rideId = data.idSolicitudViaje;
        if (rideId && ofertasActivas[rideId]) {
          // Solo actualizar información de competencia, NO la oferta actual
          // La oferta solo se actualiza cuando este conductor hace una contraoferta
        }
      };
      
      // Escuchar cuando ESTE conductor actualiza su propia oferta
      const handleOfertaActualizada = (data) => {
        const rideId = data.idSolicitudViaje;
        if (rideId && data.oferta) {
          // Actualizar SOLO la oferta de este conductor
          setOfertasActivas(prev => ({
            ...prev,
            [rideId]: {
              ...prev[rideId],
              ...data.oferta,
            }
          }));
          
          // Si está viendo la vista de contraofertas, actualizar
          if (mostrarVistaContraoferta === rideId && onActualizar) {
            onActualizar();
          }
        }
      };
      
      socket.on('competencia:actualizada', handleCompetenciaActualizada);
      socket.on('oferta:actualizada', handleOfertaActualizada);
      socket.on('oferta:creada', handleOfertaActualizada); // También escuchar cuando se crea una oferta

      // Escuchar eventos en español (y mantener compatibilidad con inglés)
      socket.on('viaje:asignado', handleRideMatched);
      socket.on('ride:matched', handleRideMatched); // Compatibilidad
      socket.on('viaje:nuevo', handleNewRide);
      socket.on('ride:new', handleNewRide); // Compatibilidad

      // Cleanup: remover listener al desmontar
      return () => {
        if (socket) {
          socket.off('viaje:asignado', handleRideMatched);
          socket.off('ride:matched', handleRideMatched);
          socket.off('viaje:nuevo', handleNewRide);
          socket.off('ride:new', handleNewRide);
          socket.off('competencia:actualizada', handleCompetenciaActualizada);
          socket.off('oferta:actualizada', handleOfertaActualizada);
          socket.off('oferta:creada', handleOfertaActualizada);
        }
      };
    } else {
      // Si no está conectado, esperar a que se conecte
      const handleConnect = () => {
        const handleNewRideConnect = (ride) => {
          setRides((prev) => [ride, ...prev]);
          toast.success('Nueva solicitud de viaje disponible');
        };

        socket.on('viaje:nuevo', handleNewRideConnect);
        socket.on('ride:new', handleNewRideConnect); // Compatibilidad
      };

      if (socket) {
        socket.once('connect', handleConnect);
      }

      return () => {
        if (socket) {
          socket.off('connect', handleConnect);
          socket.off('viaje:nuevo');
          socket.off('ride:new');
        }
      };
    }
  }, []);

  const loadQueue = async () => {
    try {
      const response = await api.get('/conductores/queue');
      // El backend retorna: { exito: true, datos: [...] }
      const datos = response.data.datos || response.data.data || [];
      
      // Normalizar IDs y filtrar duplicados usando Set para mayor eficiencia
      const idsVistos = new Set();
      const ridesUnicos = datos.filter((ride) => {
        // Normalizar ID: convertir a string si es objeto
        const rideId = ride._id 
          ? (typeof ride._id === 'string' ? ride._id : ride._id.toString())
          : (ride.id ? (typeof ride.id === 'string' ? ride.id : ride.id.toString()) : null);
        
        if (!rideId) {
          // Si no hay ID, generar uno temporal basado en otros campos
          const tempId = `${ride.origen?.direccion || ride.origin?.address || ''}-${ride.destino?.direccion || ride.destination?.address || ''}-${ride.fecha_creacion || ride.createdAt || Date.now()}`;
          if (idsVistos.has(tempId)) return false;
          idsVistos.add(tempId);
          return true;
        }
        
        if (idsVistos.has(rideId)) {
          return false; // Duplicado, filtrar
        }
        
        idsVistos.add(rideId);
        return true; // Único, incluir
      });
      
      setRides(ridesUnicos);
    } catch (error) {
      console.error('Error loading queue:', error);
      toast.error('Error al cargar la cola de viajes');
    } finally {
      setLoading(false);
    }
  };

  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bidPrice, setBidPrice] = useState('');

  const handleMakeBid = (ride) => {
    setSelectedRide(ride);
    const precioSugerido = ride.precios?.precio_sugerido || ride.pricing?.suggested_price || ride.precio_sugerido_soles || 0;
    setBidPrice(typeof precioSugerido === 'number' ? precioSugerido.toFixed(2) : '');
    setShowBidModal(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedRide || !bidPrice || parseFloat(bidPrice) <= 0) {
      toast.error('Ingresa un precio válido');
      return;
    }

    try {
      const rideId = selectedRide._id || selectedRide.id;
      // El backend usa /viajes/:id/bids (en inglés) y espera 'offered_price'
      const response = await api.post(`/viajes/${rideId}/bids`, {
        offered_price: parseFloat(bidPrice),
      });
      
      // Guardar la oferta activa
      if (response.data.datos) {
        const oferta = response.data.datos.oferta || response.data.datos;
        setOfertasActivas(prev => ({
          ...prev,
          [rideId]: oferta
        }));
        
        // Mostrar vista de contraofertas
        setMostrarVistaContraoferta(rideId);
      }
      
      toast.success('✅ Oferta enviada exitosamente');
      setShowBidModal(false);
      setSelectedRide(null);
      setBidPrice('');
      loadQueue();
    } catch (error) {
      console.error('Error submitting bid:', error);
      const mensajeError = error.response?.data?.error || 
                           error.response?.data?.mensaje || 
                           error.message || 
                           'Error al enviar oferta';
      toast.error(mensajeError);
    }
  };

  // Cargar ofertas activas del conductor
  const cargarOfertasActivas = async () => {
    try {
      // Obtener todas las ofertas pendientes del conductor
      const response = await api.get('/subasta/ofertas-activas');
      if (response.data.exito && response.data.datos) {
        const ofertas = Array.isArray(response.data.datos) ? response.data.datos : [response.data.datos];
        const ofertasMap = {};
        ofertas.forEach(oferta => {
          const rideId = oferta.id_solicitud_viaje?._id || oferta.id_solicitud_viaje;
          if (rideId) {
            ofertasMap[rideId] = oferta;
          }
        });
        setOfertasActivas(ofertasMap);
      }
    } catch (error) {
      // Si el endpoint no existe, intentar cargar desde cada viaje
      console.log('No se pudo cargar ofertas activas desde endpoint dedicado');
    }
  };

  // Cargar oferta activa para un viaje específico
  const cargarOfertaParaViaje = async (rideId) => {
    try {
      const response = await api.get(`/viajes/${rideId}`);
      if (response.data.exito && response.data.datos) {
        const datos = response.data.datos;
        const ofertas = datos.ofertas || datos.bids || [];
        // Buscar la oferta del conductor actual
        const ofertaConductor = ofertas.find(o => o.estado === 'pendiente' || o.status === 'pending');
        if (ofertaConductor) {
          setOfertasActivas(prev => ({
            ...prev,
            [rideId]: ofertaConductor
          }));
        }
      }
    } catch (error) {
      console.error('Error cargando oferta para viaje:', error);
    }
  };

  const handleReject = async (rideId) => {
    // Rechazar simplemente no hacer nada o remover de la vista
    toast('Solicitud ignorada', { icon: 'ℹ️' });
    loadQueue();
  };

  const handleHold = async (rideId) => {
    try {
      const respuesta = await api.post('/conductores/espera', {
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
      const respuesta = await api.post('/conductores/bloquear-usuario', {
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
      ) : mostrarVistaContraoferta ? (
        // Mostrar vista de contraofertas para el viaje seleccionado
        <div className="space-y-4">
          {(() => {
            const ride = rides.find(r => {
              const rideId = r._id || r.id;
              return rideId === mostrarVistaContraoferta;
            });
            const oferta = ofertasActivas[mostrarVistaContraoferta];
            
            if (!ride) {
              return <div className="p-6">Viaje no encontrado</div>;
            }
            
            return (
              <div key={mostrarVistaContraoferta}>
                <button
                  onClick={() => setMostrarVistaContraoferta(null)}
                  className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Volver a la cola de viajes
                </button>
                <VistaContraofertaConductor
                  viaje={ride}
                  ofertaActual={oferta}
                  onActualizar={async () => {
                    await cargarOfertaParaViaje(mostrarVistaContraoferta);
                    loadQueue();
                  }}
                />
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride, index) => {
            // Normalizar ID y asegurar que el key sea único
            const normalizeId = (r) => {
              if (r._id) return typeof r._id === 'string' ? r._id : r._id.toString();
              if (r.id) return typeof r.id === 'string' ? r.id : r.id.toString();
              return null;
            };
            
            const rideId = normalizeId(ride);
            // Usar ID normalizado o combinación única con índice
            const rideKey = rideId || `ride-${index}-${Date.now()}`;
            
            return (
            <div key={rideKey} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {ride.origen?.direccion || ride.origin?.address || ride.origin?.direccion || 'Origen no especificado'}
                    </h3>
                    <span className="text-gray-400">→</span>
                    <h3 className="font-semibold text-lg">
                      {ride.destino?.direccion || ride.destination?.address || ride.destination?.direccion || 'Destino no especificado'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Pasajero</p>
                      <p className="font-medium">{ride.pasajero?.nombre || ride.passenger?.name || 'N/A'}</p>
                      {(ride.pasajero?.telefono || ride.passenger?.phone) && (
                        <p className="text-sm text-gray-400">{ride.pasajero?.telefono || ride.passenger?.phone}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Precio Sugerido</p>
                      <p className="font-bold text-blue-600 text-xl">
                        S/ {ride.precios?.precio_sugerido || ride.pricing?.suggested_price || ride.precio_sugerido_soles || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Distancia del Viaje</p>
                      <p className="font-medium">
                        {ride.viaje_info?.distancia_km || ride.trip?.distance_km || ride.distancia_estimada_km || 'N/A'} km
                      </p>
                      <p className="text-sm text-gray-400">
                        Duración: {ride.viaje_info?.duracion_min || ride.trip?.duration_min || ride.duracion_estimada_min || 'N/A'} min
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Distancia desde ti</p>
                      <p className="font-medium">
                        {ride.distancia_desde_conductor_km || ride.distance_from_driver_km
                          ? `${ride.distancia_desde_conductor_km || ride.distance_from_driver_km} km`
                          : 'No disponible'}
                      </p>
                      {(ride.tiempo_estimado_llegada_min || ride.eta_minutes) && (
                        <p className="text-sm text-gray-400">
                          ETA: {ride.tiempo_estimado_llegada_min || ride.eta_minutes} min
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {ride.tipo_vehiculo === 'taxi' ? '🚕 Taxi' : ride.tipo_vehiculo === 'mototaxi' ? '🏍️ Mototaxi' : ride.tipo_vehiculo === 'cualquiera' ? '🚗 Cualquiera' : ride.vehicle_type === 'taxi' ? '🚕 Taxi' : ride.vehicle_type === 'mototaxi' ? '🏍️ Mototaxi' : '🚗 Cualquiera'}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      💰 {ride.metodo_pago || ride.payment_method || 'Efectivo'}
                    </span>
                    {(ride.fecha_expiracion || ride.expires_at) && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        ⏰ Expira: {new Date(ride.fecha_expiracion || ride.expires_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {ofertasActivas[rideId] ? (
                    <>
                      <button
                        onClick={() => {
                          cargarOfertaParaViaje(rideId);
                          setMostrarVistaContraoferta(rideId);
                        }}
                        className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                      >
                        🔄 Ver Contraofertas
                      </button>
                      <div className="text-xs text-center text-gray-600 mt-1">
                        Oferta: S/ {ofertasActivas[rideId]?.precio_ofrecido?.toFixed(2) || ofertasActivas[rideId]?.precioOfrecido?.toFixed(2) || 'N/A'}
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleMakeBid(ride)}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      💰 Hacer Oferta
                    </button>
                  )}
                  <button
                    onClick={() => handleHold(ride._id)}
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                  >
                    ⏸️ Poner en Espera
                  </button>
                  <button
                    onClick={() => handleReject(ride._id)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    ⏭️ Ignorar
                  </button>
                  <button
                    onClick={() => handleBlock(ride._id, ride.pasajero?.id || ride.passenger?.id)}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                  >
                    🚫 Bloquear Usuario
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal para hacer oferta con vista de contraofertas */}
      {showBidModal && selectedRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 my-4">
            <h2 className="text-2xl font-bold mb-4">Hacer Oferta de Precio</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Origen:</strong> {selectedRide.origen?.direccion || selectedRide.origin?.address || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Destino:</strong> {selectedRide.destino?.direccion || selectedRide.destination?.address || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Precio sugerido:</strong> S/ {selectedRide.precios?.precio_sugerido || selectedRide.pricing?.suggested_price || selectedRide.precio_sugerido_soles || 'N/A'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Precio Ofrecido (S/)
              </label>
              <input
                type="number"
                step="0.50"
                min="0.01"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: 15.50"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Después de enviar tu oferta, podrás ver información de competencia y realizar contraofertas
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubmitBid}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 font-medium"
              >
                Enviar Oferta
              </button>
              <button
                onClick={() => {
                  setShowBidModal(false);
                  setSelectedRide(null);
                  setBidPrice('');
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

