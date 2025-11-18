# DiDi-Sicuani - Plataforma de Movilidad Urbana

Plataforma de ride-hailing tipo DiDi para Sicuani, Perú con sistema de **Reverse Bidding** y geolocalización offline.

## 🎯 Características Principales

- ✅ **Sistema de Reverse Bidding** - Los pasajeros proponen el precio, los conductores aceptan/contraofrecen
- ✅ **Geolocalización Offline** - PostgreSQL + PostGIS + pgRouting (sin dependencia de Google Maps API)
- ✅ **Optimización de Rutas** - Algoritmos de routing inteligente
- ✅ **Dashboard en Tiempo Real** - Métricas actualizadas con Recharts y Socket.io
- ✅ **Sistema de Colas Inteligente** - Para conductores con teoría de colas
- ✅ **Bloqueo y Gestión** - Conductores pueden bloquear usuarios/zonas

## 🚀 Stack Tecnológico

### Backend
- **Node.js 18+** + **Express 4.21+**
- **MongoDB 6+** - Base de datos principal (usuarios, viajes, bids)
- **PostgreSQL 14+** + **PostGIS 3.3+** + **pgRouting 3.5+** - Base de datos geoespacial
- **Redis 7+** - Cache y colas
- **Socket.io 4.8+** - Comunicación en tiempo real

### Frontend
- **React 18.3+** + **JavaScript (ES6+)**
- **Vite 7.2+** - Build tool moderno
- **Tailwind CSS 4.1+** - Framework de estilos
- **Material UI 6.1+** - Componentes UI
- **Recharts 2.15+** - Gráficos y métricas en tiempo real
- **Zustand 4.5+** - Estado global
- **Socket.io Client 4.8+** - WebSockets

## 📁 Estructura del Proyecto

```
didi-sicuani/
├── backend/              # API Backend (Express)
│   ├── config/          # Configuraciones (DB, Redis, Postgres)
│   ├── controllers/     # Controladores
│   ├── models/          # Modelos MongoDB
│   ├── routes/          # Rutas API
│   ├── services/        # Servicios de negocio
│   └── utils/           # Utilidades (Socket.io)
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/ # Componentes reutilizables
│   │   ├── pages/       # Páginas
│   │   ├── services/    # Servicios API
│   │   └── store/       # Estado global (Zustand)
├── postgres-geo/        # Scripts PostgreSQL/PostGIS
└── README.md
```

## 🛠️ Instalación Rápida

Ver [INSTALLATION.md](./INSTALLATION.md) para guía completa.

### Requisitos Previos
- Node.js 18+
- MongoDB 6+
- PostgreSQL 14+ con PostGIS
- Redis 7+

### Pasos Rápidos

1. **Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

2. **Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

3. **Acceder:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📚 Documentación

- [INSTALLATION.md](./INSTALLATION.md) - Guía de instalación detallada
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Estructura del proyecto
- [Metodologia_Geolocalizacion_DB.md](../Metodologia_Geolocalizacion_DB.md) - Metodología de geolocalización
- [Metodologia_Conductor_Mototaxi.md](../Metodologia_Conductor_Mototaxi.md) - Metodología para conductores

## 🔐 Autenticación

Sistema de autenticación JWT. Todas las rutas protegidas requieren:
```
Authorization: Bearer <JWT_TOKEN>
```

## 📡 Socket.io Events

### Cliente → Servidor
- `ride:request` - Nueva solicitud de viaje
- `ride:accept` - Aceptar viaje
- `bid:submit` - Enviar oferta
- `driver:location` - Actualizar ubicación

### Servidor → Cliente
- `ride:new` - Nueva solicitud disponible
- `ride:accepted` - Viaje aceptado
- `bid:received` - Nueva oferta recibida
- `metrics:update` - Actualización de métricas

## 🎨 Características del Sistema

### Para Pasajeros
- Solicitar viaje con precio propuesto
- Ver ofertas de conductores en tiempo real
- Aceptar/rechazar ofertas
- Historial de viajes

### Para Conductores
- Ver cola de solicitudes ordenada por prioridad
- Aceptar/rechazar/bloquear solicitudes
- Enviar contraofertas
- Optimización de rutas
- Dashboard de ganancias

### Para Administradores
- Dashboard con métricas en tiempo real
- Gestión de usuarios
- Gestión de viajes
- Analytics y reportes

## 🚧 Estado del Proyecto

✅ **Completado:**
- ✅ Estructura base del proyecto (Backend + Frontend + Mobile)
- ✅ Autenticación JWT completa
- ✅ Sistema de Reverse Bidding completo
- ✅ Socket.io setup con eventos en tiempo real
- ✅ Dashboard de métricas con Recharts
- ✅ Modelos MongoDB (User, RideRequest, Bid, BidNegotiation)
- ✅ Servicios de Pricing y Bidding
- ✅ Integración con PostGIS (funciones SQL)
- ✅ Scripts de actualización OSM
- ✅ Cron jobs para tareas automáticas
- ✅ App móvil React Native con Mapbox GL

🔄 **En Desarrollo:**
- Integración completa con datos OSM de Sicuani
- Tests unitarios y de integración
- Optimización de performance
- Sistema de notificaciones push (Firebase)

## 📱 Aplicación Móvil

El proyecto incluye una aplicación React Native completa:
- Mapas offline con Mapbox GL
- Sistema de Reverse Bidding
- Notificaciones en tiempo real
- Tracking de viajes

Ver [MOBILE_SETUP.md](./MOBILE_SETUP.md) para configuración.

## 📊 Métricas y Monitoreo

- Dashboard en tiempo real con Recharts
- Actualización automática cada 5 minutos
- Socket.io para actualizaciones instantáneas
- Vista materializada en PostgreSQL para performance

## 💰 Ahorro de Costos

Comparativa detallada en [COSTS_COMPARISON.md](./COSTS_COMPARISON.md):
- **Ahorro del 90%** vs Google Maps API
- **$6,000 USD/año** en costos operativos (10K viajes/mes)
- **ROI:** Recuperación en < 1 mes

## 📝 Licencia

Este proyecto es privado y está en desarrollo.

## 👥 Contribuidores

Desarrollado para DiDi-Sicuani - Plataforma de Movilidad Urbana

