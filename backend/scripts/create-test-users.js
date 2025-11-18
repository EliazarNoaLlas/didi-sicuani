/**
 * Script para crear usuarios de prueba (pasajero y conductor)
 * 
 * Uso:
 *   node scripts/create-test-users.js
 * 
 * Esto crea:
 * - 1 pasajero de prueba
 * - 1 conductor de prueba (taxi)
 * - 1 conductor de prueba (mototaxi)
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';

dotenv.config();

const createTestUsers = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    console.log('✅ Conectado a MongoDB');

    const User = (await import('../models/User.js')).default;

    // Contraseña para todos los usuarios de prueba
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // 1. Crear Pasajero de Prueba
    const passengerData = {
      name: 'Juan Pasajero',
      email: 'pasajero@test.com',
      password: hashedPassword,
      userType: 'passenger',
      phone: '+51987654321',
      isActive: true,
    };

    let passenger = await User.findOne({ email: passengerData.email });
    if (passenger) {
      console.log('⚠️  Pasajero ya existe, actualizando...');
      passenger.name = passengerData.name;
      passenger.password = hashedPassword;
      passenger.phone = passengerData.phone;
      await passenger.save();
    } else {
      passenger = await User.create(passengerData);
      console.log('✅ Pasajero creado');
    }

    // 2. Crear Conductor Taxi
    const driverTaxiData = {
      name: 'Carlos Conductor Taxi',
      email: 'conductor.taxi@test.com',
      password: hashedPassword,
      userType: 'driver',
      phone: '+51987654322',
      isActive: true,
      driverInfo: {
        vehicleType: 'taxi',
        vehiclePlate: 'ABC-123',
        vehicleModel: 'Toyota Corolla',
        licenseNumber: 'LIC-12345',
        rating: 4.8,
        totalRides: 150,
        isOnline: true,
        isAvailable: true,
        currentLatitude: -14.2694,
        currentLongitude: -71.2256,
      },
    };

    let driverTaxi = await User.findOne({ email: driverTaxiData.email });
    if (driverTaxi) {
      console.log('⚠️  Conductor Taxi ya existe, actualizando...');
      driverTaxi.name = driverTaxiData.name;
      driverTaxi.password = hashedPassword;
      driverTaxi.driverInfo = driverTaxiData.driverInfo;
      await driverTaxi.save();
    } else {
      driverTaxi = await User.create(driverTaxiData);
      console.log('✅ Conductor Taxi creado');
    }

    // 3. Crear Conductor Mototaxi
    const driverMototaxiData = {
      name: 'Pedro Conductor Mototaxi',
      email: 'conductor.mototaxi@test.com',
      password: hashedPassword,
      userType: 'driver',
      phone: '+51987654323',
      isActive: true,
      driverInfo: {
        vehicleType: 'mototaxi',
        vehiclePlate: 'XYZ-789',
        vehicleModel: 'Honda Biz',
        licenseNumber: 'LIC-67890',
        rating: 4.5,
        totalRides: 200,
        isOnline: true,
        isAvailable: true,
        currentLatitude: -14.2700,
        currentLongitude: -71.2260,
      },
    };

    let driverMototaxi = await User.findOne({ email: driverMototaxiData.email });
    if (driverMototaxi) {
      console.log('⚠️  Conductor Mototaxi ya existe, actualizando...');
      driverMototaxi.name = driverMototaxiData.name;
      driverMototaxi.password = hashedPassword;
      driverMototaxi.driverInfo = driverMototaxiData.driverInfo;
      await driverMototaxi.save();
    } else {
      driverMototaxi = await User.create(driverMototaxiData);
      console.log('✅ Conductor Mototaxi creado');
    }

    // Mostrar resumen
    console.log('\n📋 Usuarios de Prueba Creados:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 PASAJERO:');
    console.log(`   Email: ${passenger.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   ID: ${passenger._id}`);
    console.log('\n🚕 CONDUCTOR TAXI:');
    console.log(`   Email: ${driverTaxi.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   ID: ${driverTaxi._id}`);
    console.log(`   Ubicación: ${driverTaxi.driverInfo.currentLatitude}, ${driverTaxi.driverInfo.currentLongitude}`);
    console.log('\n🏍️  CONDUCTOR MOTOTAXI:');
    console.log(`   Email: ${driverMototaxi.email}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   ID: ${driverMototaxi._id}`);
    console.log(`   Ubicación: ${driverMototaxi.driverInfo.currentLatitude}, ${driverMototaxi.driverInfo.currentLongitude}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Próximos pasos:');
    console.log('   1. Inicia sesión con cada usuario para obtener tokens JWT');
    console.log('   2. Usa diferentes herramientas (Postman, navegadores) para cada sesión');
    console.log('   3. Consulta GUIA_MULTIPLES_SESIONES.md para más detalles\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
    process.exit(1);
  }
};

createTestUsers();

