import { useState, useEffect } from 'react';
import { MapPin, Clock, User, Star, TrendingDown, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';

/**
 * Componente para la vista de conductor con sistema de contraofertas
 * Basado en la metodología propuesta
 */
export default function VistaContraofertaConductor({ viaje, ofertaActual, onActualizar }) {
  const [tiempoRestante, setTiempoRestante] = useState(120);
  const [nuevaOferta, setNuevaOferta] = useState('');
  const [mensajeAlerta, setMensajeAlerta] = useState('');
  const [competencia, setCompetencia] = useState(null);
  const [cargandoCompetencia, setCargandoCompetencia] = useState(false);

  // Calcular tiempo restante
  useEffect(() => {
    if (!viaje?.fecha_expiracion && !viaje?.expires_at && !viaje?.fechaExpiracion) {
      return;
    }

    const fechaExpiracion = new Date(viaje.fecha_expiracion || viaje.expires_at || viaje.fechaExpiracion);
    const actualizarTiempo = () => {
      const ahora = new Date();
      const segundosRestantes = Math.max(0, Math.floor((fechaExpiracion - ahora) / 1000));
      setTiempoRestante(segundosRestantes);
    };

    actualizarTiempo();
    const interval = setInterval(actualizarTiempo, 1000);

    return () => clearInterval(interval);
  }, [viaje]);

  // Cargar información de competencia
  useEffect(() => {
    if (ofertaActual && viaje?._id) {
      cargarCompetencia();
    }
  }, [ofertaActual, viaje]);

  // Escuchar actualizaciones de competencia y de la propia oferta
  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.connected && viaje?._id) {
      // Escuchar actualizaciones de competencia (información ofuscada)
      const handleCompetenciaActualizada = (data) => {
        if (data.idSolicitudViaje === (viaje._id || viaje.id)) {
          cargarCompetencia();
        }
      };

      // Escuchar cuando ESTE conductor actualiza su propia oferta
      const handleOfertaActualizada = (data) => {
        if (data.idSolicitudViaje === (viaje._id || viaje.id) && data.oferta) {
          // Actualizar SOLO la oferta de este conductor
          if (onActualizar) {
            onActualizar();
          }
          cargarCompetencia();
        }
      };

      socket.on('competencia:actualizada', handleCompetenciaActualizada);
      socket.on('oferta:actualizada', handleOfertaActualizada);
      socket.on('oferta:creada', handleOfertaActualizada);

      return () => {
        socket.off('competencia:actualizada', handleCompetenciaActualizada);
        socket.off('oferta:actualizada', handleOfertaActualizada);
        socket.off('oferta:creada', handleOfertaActualizada);
      };
    }
  }, [viaje, onActualizar]);

  const cargarCompetencia = async () => {
    if (!viaje?._id) return;

    setCargandoCompetencia(true);
    try {
      const response = await api.get(`/subasta/competencia/${viaje._id || viaje.id}`);
      if (response.data.exito) {
        setCompetencia(response.data.datos);
      }
    } catch (error) {
      console.error('Error cargando competencia:', error);
    } finally {
      setCargandoCompetencia(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const realizarContraoferta = async () => {
    const monto = parseFloat(nuevaOferta);

    if (!monto || monto <= 0) {
      setMensajeAlerta('⚠️ Ingresa un monto válido');
      return;
    }

    if (!ofertaActual) {
      setMensajeAlerta('⚠️ No tienes una oferta activa');
      return;
    }

    if (ofertaActual.numero_contraofertas >= 2) {
      setMensajeAlerta('❌ Has alcanzado el límite de 2 contraofertas');
      return;
    }

    // Validar que el nuevo monto no sea mayor (permite igual o menor para competir)
    // Usar tolerancia pequeña para comparación de punto flotante
    const precioActual = parseFloat(ofertaActual.precio_ofrecido) || 0;
    const diferencia = monto - precioActual;
    if (diferencia > 0.01) { // Permitir diferencia de hasta 1 centavo por precisión
      setMensajeAlerta('⚠️ La nueva oferta no puede ser mayor a la actual');
      return;
    }

    try {
      await api.post('/subasta/contraoferta', {
        id_solicitud_viaje: viaje._id || viaje.id,
        nuevo_monto: monto,
      });

      setMensajeAlerta('✅ Contraoferta enviada exitosamente');
      setNuevaOferta('');
      toast.success('Contraoferta enviada exitosamente');

      // Recargar información
      if (onActualizar) {
        onActualizar();
      }
      cargarCompetencia();
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || error.message || 'Error al enviar contraoferta';
      setMensajeAlerta(`❌ ${mensaje}`);
      toast.error(mensaje);
    }

    setTimeout(() => setMensajeAlerta(''), 5000);
  };

  const mantenerOferta = () => {
    toast.success('Manteniendo oferta actual');
  };

  const rechazarViaje = () => {
    toast('Viaje rechazado', { icon: 'ℹ️' });
  };

  if (!viaje) {
    return <div className="p-6">Cargando información del viaje...</div>;
  }

  const precioSugerido = viaje.precio_sugerido_soles || viaje.suggested_price_soles || viaje.precioSugerido || 0;
  const origen = viaje.origen_direccion || viaje.origin?.address || viaje.origen?.direccion || 'Origen no especificado';
  const destino = viaje.destino_direccion || viaje.destination?.address || viaje.destino?.direccion || 'Destino no especificado';
  const distancia = viaje.distancia_estimada_km || viaje.estimated_distance_km || viaje.distancia || '0.5';
  const pasajero = viaje.pasajero?.nombre || viaje.passenger?.name || 'Pasajero';
  const ratingPasajero = viaje.pasajero?.calificacion || viaje.passenger?.rating || 4.9;

  const montoActual = ofertaActual?.precio_ofrecido || 0;
  const montoInicial = ofertaActual?.precio_inicial || montoActual;
  const contraofertas = ofertaActual?.contraofertas || [];
  const numeroContraofertas = ofertaActual?.numero_contraofertas || 0;

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🚗 Nueva Solicitud de Viaje
          </h2>
          <div className="bg-white/20 px-4 py-2 rounded-full flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold text-lg">{formatTime(tiempoRestante)}</span>
          </div>
        </div>
      </div>

      {/* Información del Viaje */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-start gap-4 mb-4">
          <MapPin className="w-6 h-6 text-purple-600 mt-1" />
          <div className="flex-1">
            <p className="text-lg font-semibold text-gray-800">{origen}</p>
            <div className="flex items-center gap-2 my-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-sm text-gray-500">{distancia} km</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
            <p className="text-lg font-semibold text-gray-800">{destino}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-sm text-gray-600">Precio Sugerido</p>
            <p className="text-2xl font-bold text-purple-600">S/ {precioSugerido.toFixed(2)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-sm text-gray-600">Pasajero</p>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">{pasajero}</span>
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm">{ratingPasajero}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tu Oferta Actual */}
      {ofertaActual && (
        <div className="p-6 border-b">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Tu oferta actual</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                {numeroContraofertas}/2 contraofertas usadas
              </span>
            </div>
            <p className="text-4xl font-bold text-purple-700">S/ {montoActual.toFixed(2)}</p>

            {contraofertas.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-gray-600 mb-2">Historial:</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-gray-500 line-through">S/ {montoInicial.toFixed(2)}</span>
                  {contraofertas.map((c, idx) => (
                    <span key={idx} className="text-sm text-purple-600 font-semibold">
                      → S/ {c.monto.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado de Competencia */}
      {competencia && (
        <div className="p-6 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-purple-600" />
            Estado de Competencia
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="text-sm text-gray-600">Competidores activos</span>
              <span className="font-bold text-gray-800">{competencia.totalCompetidores} conductores</span>
            </div>

            {competencia.rangoMenorOferta && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-600">Rango de ofertas</span>
                <span className="font-bold text-purple-600">{competencia.rangoMenorOferta}</span>
              </div>
            )}

            <div
              className={`p-4 rounded-lg border-2 ${
                competencia.color?.includes('red') ? 'bg-red-50 border-red-200' :
                competencia.color?.includes('orange') ? 'bg-orange-50 border-orange-200' :
                competencia.color?.includes('green') ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <p className={`font-semibold ${competencia.color || 'text-gray-700'}`}>
                {competencia.icono} {competencia.mensaje}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Contraoferta */}
      {ofertaActual && (
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Realizar Contraoferta</h3>

          {mensajeAlerta && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                mensajeAlerta.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {mensajeAlerta}
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-2">Nueva oferta (S/)</label>
              <input
                type="number"
                step="0.50"
                value={nuevaOferta}
                onChange={(e) => setNuevaOferta(e.target.value)}
                placeholder="Ej: 18.00"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-semibold"
                disabled={numeroContraofertas >= 2}
              />
              <p className="text-xs text-gray-500 mt-1">Puede ser igual o menor que tu oferta actual</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={realizarContraoferta}
              disabled={numeroContraofertas >= 2}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-5 h-5" />
              Contraofertar
            </button>

            <button
              onClick={mantenerOferta}
              className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              <Check className="w-5 h-5" />
              Mantener
            </button>

            <button
              onClick={rechazarViaje}
              className="flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
            >
              <X className="w-5 h-5" />
              Rechazar
            </button>
          </div>
        </div>
      )}

      {!ofertaActual && (
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-4">No has realizado una oferta para este viaje aún</p>
          <p className="text-sm text-gray-500">Usa el botón "Hacer Oferta" en la cola de viajes para comenzar</p>
        </div>
      )}
    </div>
  );
}

