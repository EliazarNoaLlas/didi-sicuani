import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * Servicio de API
 * Cliente HTTP centralizado para todas las peticiones al backend
 * Con fallback automático a localhost si la producción falla
 */

// URLs disponibles (producción primero, luego localhost como fallback)
const URL_API_PRODUCCION = import.meta.env.VITE_API_URL || 'https://didi-sicuani.onrender.com/api';
const URL_API_LOCAL = 'http://localhost:5000/api';

// Determinar qué URL usar inicialmente
// En desarrollo, intentar producción primero; en producción, usar siempre producción
let URL_API_ACTUAL = import.meta.env.DEV ? URL_API_PRODUCCION : URL_API_PRODUCCION;

// Crear el cliente API
const clienteApi = axios.create({
  baseURL: URL_API_ACTUAL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Función para verificar si la URL de producción está disponible
const verificarDisponibilidad = async (url) => {
  try {
    const response = await fetch(`${url.replace('/api', '')}/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// En desarrollo, verificar disponibilidad de producción en background
if (import.meta.env.DEV) {
  verificarDisponibilidad(URL_API_PRODUCCION).then((disponible) => {
    if (!disponible) {
      console.warn('⚠️ Servidor de producción no disponible, usando localhost');
      clienteApi.defaults.baseURL = URL_API_LOCAL;
    } else {
      console.log('✅ Usando servidor de producción');
      clienteApi.defaults.baseURL = URL_API_PRODUCCION;
    }
  });
}

/**
 * Interceptor de peticiones
 * Agrega automáticamente el token de autenticación a todas las peticiones
 */
clienteApi.interceptors.request.use(
  (configuracion) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        configuracion.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No hay token disponible para la petición:', configuracion.url);
      }
    } catch (error) {
      console.error('Error obteniendo token del store:', error);
    }
    return configuracion;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable para evitar loops infinitos de reintentos
let estaReintentando = false;

/**
 * Interceptor de respuestas
 * Maneja errores de autenticación, CORS y fallback a localhost
 */
clienteApi.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    // Si hay error de red/CORS y estamos en desarrollo, intentar con localhost
    if (
      import.meta.env.DEV &&
      !estaReintentando &&
      clienteApi.defaults.baseURL === URL_API_PRODUCCION &&
      (error.code === 'ERR_NETWORK' || 
       error.code === 'ERR_FAILED' || 
       error.message?.includes('CORS') ||
       !error.response)
    ) {
      console.warn('⚠️ Error de conexión con producción, intentando con localhost...');
      estaReintentando = true;
      clienteApi.defaults.baseURL = URL_API_LOCAL;
      
      // Reintentar la petición con localhost
      try {
        const config = error.config;
        config.baseURL = URL_API_LOCAL;
        const respuesta = await axios(config);
        estaReintentando = false;
        return respuesta;
      } catch (retryError) {
        estaReintentando = false;
        console.error('❌ Error también con localhost:', retryError);
        return Promise.reject(retryError);
      }
    }
    
    // Solo redirigir si no estamos en la página de login/registro
    // Esto permite que el componente Login maneje los errores 401 del login
    if (error.response?.status === 401) {
      const rutaActual = window.location.pathname;
      const esPaginaAutenticacion = rutaActual === '/iniciar-sesion' || rutaActual === '/registro';
      
      if (!esPaginaAutenticacion) {
        useAuthStore.getState().logout();
        window.location.href = '/iniciar-sesion';
      }
    }
    
    estaReintentando = false;
    return Promise.reject(error);
  }
);

// Exportar con nombre en español y mantener compatibilidad
export default clienteApi;
export { clienteApi as api }; // Alias para compatibilidad

