import mongoose from 'mongoose';

/**
 * Conecta a la base de datos MongoDB
 */
const conectarBD = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    const opcionesConexion = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
      compressors: ['zlib'],
      heartbeatFrequencyMS: 10000,
    };

    const conexion = await mongoose.connect(process.env.MONGODB_URI, opcionesConexion);

    const esAtlas = process.env.MONGODB_URI.includes('mongodb+srv://');
    const tipoConexion = esAtlas ? 'MongoDB Atlas' : 'MongoDB Local';
    console.log(`✅ ${tipoConexion} conectado: ${conexion.connection.host}`);

    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de conexión a MongoDB:', error);
    });
    mongoose.connection.on('disconnected', () => console.log('⚠️  MongoDB desconectado'));
    mongoose.connection.on('reconnected', () => console.log('🔄 MongoDB reconectado'));

    return conexion;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    throw error;
  }
};

export default conectarBD;
export { conectarBD as connectDB };