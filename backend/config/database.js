import mongoose from 'mongoose';

/**
 * Conecta a la base de datos MongoDB (compatible con MongoDB Atlas y local)
 * @returns {Promise<mongoose.Connection>} Conexión a MongoDB
 */
const conectarBD = async () => {
  try {
    // Validar que MONGODB_URI esté definida
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    // Opciones de conexión optimizadas para MongoDB Atlas
    const opcionesConexion = {
      // Timeouts
      serverSelectionTimeoutMS: 5000, // 5 segundos para seleccionar servidor
      socketTimeoutMS: 45000, // 45 segundos para operaciones de socket
      connectTimeoutMS: 10000, // 10 segundos para conexión inicial
      
      // Pool de conexiones
      maxPoolSize: 10, // Máximo de conexiones en el pool
      minPoolSize: 2, // Mínimo de conexiones en el pool
      maxIdleTimeMS: 30000, // 30 segundos de inactividad antes de cerrar conexión
      
      // Reintentos y escrituras
      retryWrites: true, // Reintentar escrituras fallidas
      retryReads: true, // Reintentar lecturas fallidas
      
      // Compresión (reduce ancho de banda)
      compressors: ['zlib'],
      
      // Heartbeat para mantener conexión activa
      heartbeatFrequencyMS: 10000, // 10 segundos
    };

    const conexion = await mongoose.connect(process.env.MONGODB_URI, opcionesConexion);

    // Detectar si es MongoDB Atlas o local
    const esAtlas = process.env.MONGODB_URI.includes('mongodb+srv://');
    const tipoConexion = esAtlas ? 'MongoDB Atlas' : 'MongoDB Local';
    
    console.log(`✅ ${tipoConexion} conectado: ${conexion.connection.host}`);
    console.log(`📊 Base de datos: ${conexion.connection.name}`);
    
    // Manejar eventos de conexión
    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de conexión a MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });

    mongoose.connection.on('connecting', () => {
      console.log('🔄 Conectando a MongoDB...');
    });

    return conexion;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    
    // Mensajes de error más descriptivos
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Sugerencia: Verifica que MongoDB Atlas tenga acceso de red configurado (0.0.0.0/0)');
    } else if (error.name === 'MongoAuthenticationError') {
      console.error('💡 Sugerencia: Verifica el usuario y contraseña en MONGODB_URI');
    }
    
    throw error;
  }
};

export default conectarBD;
// Exportar también con el nombre anterior para compatibilidad
export { conectarBD as connectDB };

