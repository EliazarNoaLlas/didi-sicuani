import connectDB from './config/database.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔍 Intentando conectar a MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    console.log('');
    
    await connectDB();
    console.log('✅ MongoDB conectado exitosamente');
    console.log('');
    
    // Listar bases de datos
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log('📊 Bases de datos disponibles:');
    databases.forEach(db => {
      const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
      const marker = db.name === 'didi-sicuani' ? '✅' : '  ';
      console.log(`${marker} - ${db.name} (${sizeMB} MB)`);
    });
    console.log('');
    
    // Verificar si la base de datos existe
    const dbExists = databases.some(db => db.name === 'didi-sicuani');
    
    if (!dbExists) {
      console.log('⚠️  La base de datos "didi-sicuani" no existe aún.');
      console.log('💡 Se creará automáticamente cuando insertes el primer documento.');
      console.log('');
    }
    
    // Listar colecciones de didi-sicuani
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      console.log('📁 Colecciones en didi-sicuani:');
      if (collections.length === 0) {
        console.log('  (ninguna - se crearán automáticamente cuando las uses)');
      } else {
        collections.forEach(col => {
          console.log(`  ✅ ${col.name}`);
        });
      }
      console.log('');
    } catch (err) {
      console.log('📁 Colecciones: (base de datos aún no creada)');
      console.log('');
    }
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('✅ Test completado exitosamente');
    console.log('');
    console.log('🎉 ¡Todo listo! Puedes iniciar el servidor con: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('💡 Verifica:');
    
    // Detectar tipo de conexión
    const esAtlas = process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv://');
    
    if (esAtlas) {
      console.error('  1. La URI de MongoDB Atlas es correcta');
      console.error('  2. El usuario y contraseña son correctos');
      console.error('  3. La IP de tu servidor está en la whitelist de MongoDB Atlas');
      console.error('  4. El cluster está activo en MongoDB Atlas');
      console.error('');
      console.error('🔧 Para MongoDB Atlas:');
      console.error('  - Ve a MongoDB Atlas → Network Access → Add IP Address');
      console.error('  - Para desarrollo: Agrega 0.0.0.0/0 (Allow Access from Anywhere)');
    } else {
      console.error('  1. MongoDB está corriendo');
      console.error('  2. La URI en .env es correcta');
      console.error('  3. Las credenciales son correctas (si aplica)');
      console.error('');
      console.error('🔧 Para iniciar MongoDB en Windows:');
      console.error('   Start-Service -Name MongoDB');
    }
    console.error('');
    process.exit(1);
  }
};

testConnection();

