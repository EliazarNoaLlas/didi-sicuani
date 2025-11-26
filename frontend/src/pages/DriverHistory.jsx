import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DriverHistory() {
  const [rides, setRides] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRides, setSelectedRides] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const loadHistory = async () => {
    try {
      const params = new URLSearchParams();
      // El backend espera parámetros en español
      if (filters.status) params.append('estado', filters.status);
      if (filters.startDate) params.append('fechaInicio', filters.startDate);
      if (filters.endDate) params.append('fechaFin', filters.endDate);

      const response = await api.get(`/conductores/history?${params.toString()}`);
      // El backend retorna: { exito: true, datos: { viajes, estadisticas } }
      const datos = response.data.datos || response.data.data || {};
      const viajesRaw = datos.viajes || datos.rides || [];
      
      // Normalizar IDs y filtrar duplicados usando Set
      const idsVistos = new Set();
      const viajesUnicos = viajesRaw.filter((ride) => {
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
      
      setRides(viajesUnicos);
      setStatistics(datos.estadisticas || datos.statistics || {});
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRides.length === 0) {
      toast.error('Selecciona al menos un viaje para borrar');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que quieres borrar ${selectedRides.length} viaje(s) del historial?`)) {
      return;
    }

    try {
      const response = await api.post('/conductores/history/delete', {
        idsViajes: selectedRides,
        rideIds: selectedRides, // Compatibilidad
      });
      toast.success(response.data.mensaje || response.data.message || 'Viajes eliminados del historial');
      setSelectedRides([]);
      loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.mensaje || 'Error al borrar viajes');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('¿Estás seguro de que quieres borrar TODO tu historial? Esta acción no se puede deshacer.')) {
      return;
    }

    if (!window.confirm('Esta acción es permanente. ¿Continuar?')) {
      return;
    }

    try {
      const response = await api.post('/conductores/history/delete', {
        borrarTodo: true,
        deleteAll: true, // Compatibilidad
        borrarOfertas: true, // También borrar ofertas
        deleteBids: true, // Compatibilidad
      });
      toast.success(response.data.mensaje || response.data.message || 'Historial borrado completamente');
      setSelectedRides([]);
      loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.mensaje || 'Error al borrar historial');
    }
  };

  // Función para normalizar IDs de rides
  const normalizarIdRide = (ride) => {
    if (ride._id) return typeof ride._id === 'string' ? ride._id : ride._id.toString();
    if (ride.id) return typeof ride.id === 'string' ? ride.id : ride.id.toString();
    // Si no hay ID, generar uno temporal
    return `${ride.origen?.direccion || ride.origin?.address || ''}-${ride.destino?.direccion || ride.destination?.address || ''}-${ride.fecha_creacion || ride.createdAt || Date.now()}`;
  };

  const toggleRideSelection = (rideId) => {
    setSelectedRides((prev) =>
      prev.includes(rideId)
        ? prev.filter((id) => id !== rideId)
        : [...prev, rideId]
    );
  };

  const getStatusBadge = (status) => {
    // Mapear estados en español e inglés
    const statusMap = {
      'completado': 'completado',
      'completed': 'completado',
      'cancelado': 'cancelado',
      'cancelled': 'cancelado',
      'asignado': 'asignado',
      'matched': 'asignado',
      'conductor_en_ruta': 'conductor_en_ruta',
      'driver_en_route': 'conductor_en_ruta',
      'en_progreso': 'en_progreso',
      'in_progress': 'en_progreso',
    };
    
    const estadoNormalizado = statusMap[status] || status;
    
    const badges = {
      completado: { text: 'Completado', color: 'bg-green-100 text-green-800' },
      cancelado: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
      asignado: { text: 'Asignado', color: 'bg-blue-100 text-blue-800' },
      conductor_en_ruta: { text: 'En camino', color: 'bg-yellow-100 text-yellow-800' },
      en_progreso: { text: 'En viaje', color: 'bg-purple-100 text-purple-800' },
    };
    const badge = badges[estadoNormalizado] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Historial de Viajes</h1>

      {/* Estadísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total de Viajes</p>
            <p className="text-2xl font-bold">{statistics.totalViajes || statistics.totalRides || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.viajesCompletados || statistics.completedRides || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Ganancias Totales</p>
            <p className="text-2xl font-bold text-green-600">
              S/ {statistics.gananciasNetas || statistics.netEarnings || '0.00'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Rating Promedio</p>
            <p className="text-2xl font-bold">⭐ {statistics.calificacionPromedio || statistics.averageRating || '0.0'}</p>
          </div>
        </div>
      )}

      {/* Acciones de borrado */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedRides.length === 0}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              🗑️ Borrar Seleccionados ({selectedRides.length})
            </button>
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🗑️ Borrar Todo el Historial
            </button>
          </div>
          {selectedRides.length > 0 && (
            <button
              onClick={() => setSelectedRides([])}
              className="text-gray-600 hover:text-gray-800"
            >
              Limpiar selección
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
              <option value="matched">Asignados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', startDate: '', endDate: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Viajes */}
      <div className="space-y-4">
        {rides.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No hay viajes en el historial</p>
          </div>
        ) : (
          rides.map((ride, index) => {
            // Normalizar ID para usar como key y en selección
            const rideId = normalizarIdRide(ride);
            const rideKey = rideId || `ride-${index}-${Date.now()}`;
            
            return (
            <div
              key={rideKey}
              className={`bg-white p-6 rounded-lg shadow hover:shadow-lg transition ${
                selectedRides.includes(rideId) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedRides.includes(rideId)}
                    onChange={() => toggleRideSelection(rideId)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(ride.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(ride.fecha_creacion || ride.createdAt || ride.date || new Date()).toLocaleString()}
                      </span>
                    </div>
                  <div className="flex items-start gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Origen</p>
                      <p className="font-semibold">{ride.origen?.direccion || ride.origin?.address || 'N/A'}</p>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Destino</p>
                      <p className="font-semibold">{ride.destino?.direccion || ride.destination?.address || 'N/A'}</p>
                    </div>
                  </div>
                  {(ride.pasajero || ride.passenger) && (
                    <p className="text-sm text-gray-600">
                      👤 Pasajero: {ride.pasajero?.nombre || ride.passenger?.name || 'N/A'}
                    </p>
                  )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    S/ {(ride.precio_final_acordado || ride.agreedPrice || ride.precioAcordado || 0).toFixed(2)}
                  </p>
                  {(ride.distancia_estimada_km || ride.distance) && (
                    <p className="text-sm text-gray-500">
                      {(ride.distancia_estimada_km || ride.distance).toFixed(2)} km
                    </p>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

