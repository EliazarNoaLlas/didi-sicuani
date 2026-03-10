# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DiDi-Sicuani** is a ride-hailing platform for mototaxis in Sicuani, Peru. It features a bidding/auction system where passengers request rides and drivers submit competitive offers. The platform has three user roles: passenger (pasajero), driver (conductor), and admin (administrador).

## Monorepo Structure

```
backend/    - Node.js + Express REST API + Socket.io
frontend/   - React + Vite web dashboard
mobile/     - React Native mobile app (incomplete/in progress)
scripts/    - Utility scripts
```

## Commands

### Backend
```bash
cd backend
npm run dev    # Development with nodemon (auto-reload)
npm start      # Production
npm test       # Jest (uses --experimental-vm-modules for ESM support)
```

### Frontend
```bash
cd frontend
npm run dev    # Vite dev server at http://localhost:5173
npm run build  # Production build
npm run lint   # ESLint
npm run preview
```

### Mobile
```bash
cd mobile
npm start           # Metro bundler
npm run android
npm run ios
```

## Backend Architecture (Clean Architecture / Modular Monolith)

**New structure under `backend/src/`** — Legacy `backend/controllers/`, `backend/services/`, `backend/routes/` preserved intact. New routes available at `/api/v2/*`.

```
backend/src/
  app.js                    ← buildApp(io): ensambla todos los módulos con DI
  modules/
    auth/                   ← JWT login/register
    rides/                  ← ciclo de vida del viaje
    bidding/                ← subastas, ofertas, contraofertas
    drivers/                ← cola, bloqueos, retenciones, ganancias
    passengers/             ← historial, calificaciones
    pricing/                ← cálculo de precios y comisiones
    metrics/                ← KPIs para admin
    notifications/          ← Socket.io event broadcaster
  shared/
    config/                 ← database.js, redis.js
    database/models/        ← Schemas Mongoose (*.model.js), sin lógica de negocio
    errors/base.errors.js   ← AppError, NotFoundError, AuthorizationError, etc.
    events/socket.events.js ← constantes de eventos Socket.io
    middleware/auth.middleware.js
    utils/geospatial.js
```

**Capas dentro de cada módulo:**
- `domain/` — Entidades JS puras (sin framework), interfaces de repositorio, errores de dominio
- `application/` — Use cases con método `execute()`, reciben dependencias por constructor
- `infrastructure/` — Implementaciones MongoDB (`*.mongo.repository.js`)
- `interfaces/` — Controllers HTTP delgados, Express routes, Socket.io handlers
- `*.container.js` — Función `buildXContainer()` que hace Dependency Injection

**Patrón de DI:** `app.js` llama a cada `buildXContainer()` y pasa dependencias entre módulos (ej: `ridesContainer.rideRepository` va al `biddingContainer`).

**Modelos compartidos:** Usan `mongoose.models['X'] || mongoose.model('X', schema)` para no conflictuar con los modelos legacy.

---

## Legacy Backend Architecture

**Entry point:** `backend/server.js` — Express app with Socket.io, connects MongoDB then Redis (Redis is optional/non-critical).

**Route prefix pattern:** All routes exist in both Spanish and English (legacy compat). E.g., `/api/autenticacion` and `/api/auth` both point to the same handler.

**Directory layout:**
- `config/` — `database.js` (MongoDB), `redis.js`, `swagger.js`
- `routes/` — Named `rutas-*.js` (Spanish)
- `controllers/` — Named `controlador-*.js` (Spanish)
- `models/` — Mongoose models (Spanish names: `SolicitudViaje`, `Usuario`, `Oferta`, etc.)
- `services/` — Named `servicio-*.js` — business logic layer between controllers and models (auction, pricing, metrics, blocking, retention, audit, counter-offer)
- `utils/` — `utilidades-socket.js` (Socket.io setup), `tareas-programadas.js` (cron jobs), `utilidades-geoespaciales.js`, `cron.js` (cron helper)
- `middleware/` — `middleware-autenticacion.js` exports `autenticar` and `autorizar(...roles)`

**Key models:**
- `Usuario` — All user types (passenger/driver/admin) in one collection with `tipoUsuario` field
- `SolicitudViaje` (also exported as `RideRequest` for compat) — Ride requests with states: `pendiente → subasta_activa → asignado → conductor_en_ruta → en_progreso → completado/cancelado`
- `Oferta` / `NegociacionOferta` — Bidding/auction offers from drivers

**Socket.io rooms:** `conductores`, `pasajeros`, `administradores`, `user:{id}`, `usuario:{id}`, `conductor:{id}`. Socket events exist in both Spanish and English (e.g., `viaje:solicitar` / `ride:request`).

**API response envelope:** All responses use `{ exito: boolean, mensaje: string, datos?: any }` shape.

**Auth middleware:** `autenticar` sets both `req.user` and `req.usuario` (alias for compat). `autorizar()` accepts both Spanish and English role names (`pasajero`/`passenger`, `conductor`/`driver`, `administrador`/`admin`).

**Health check:** `GET /health` — returns `{ estado, timestamp, servicio }`.

**API docs:** Swagger UI available at `http://localhost:5000/api-docs` when backend is running.

## Frontend Architecture

**Stack:** React 19 + Vite + React Router v7 + MUI + Tailwind CSS + Zustand + Socket.io-client + Recharts

**Auth state:** Zustand store with persistence (`frontend/src/store/authStore.js`). Auth is stored in `localStorage` as `auth-storage`.

**API client:** `frontend/src/services/api.js` — Axios instance with auto-fallback: in development, if production server (`https://didi-sicuani.onrender.com`) is unreachable, it automatically switches to `http://localhost:5000`. JWT token is injected via interceptor.

**Routing:** Protected routes via `RutaPrivada` wrapper. Routes are in Spanish (e.g., `/iniciar-sesion`, `/solicitar-viaje`, `/subasta/:rideId`).

**Pages by role:**
- Passenger: `PassengerDashboard`, `RideRequest`, `BiddingPage`, `ActiveRide`, `PassengerHistory`
- Driver: `DriverDashboard`, `RideQueue`, `ActiveRide`, `DriverHistory`
- Admin: `AdminDashboard`, `Metrics`

## Environment Setup

Copy `backend/env.local.txt` to `backend/.env`. Key variables:
- `MONGODB_URI` — MongoDB Atlas URI (or `mongodb://localhost:27017/didi-sicuani` for local)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis is optional; backend starts without it
- `JWT_SECRET` — JWT signing secret
- `PORT` — Defaults to 5000
- `FRONTEND_URL` / `SOCKET_CORS_ORIGIN` — Frontend origin for CORS (default: `http://localhost:5173`)

## Deployment

- Backend: Render.com (`render.yaml` at root)
- Frontend: Vercel (`vercel.json` at root)
- Production backend URL: `https://didi-sicuani.onrender.com`
- Production frontend: `https://didi-sicuani-frontend.onrender.com`

## Code Conventions

- **Language mixing:** Code is written primarily in Spanish (variable names, function names, comments, route paths) but all Socket.io events and many API routes also have English aliases for backward compatibility. Do not remove English aliases.
- **ES Modules:** Backend uses `"type": "module"` — use `import/export`, not `require`.
- **No PostgreSQL:** PostgreSQL was removed; only MongoDB is used. The `pg` package remains as a dependency but is not active.
- **Soft delete:** Models use `fecha_eliminacion` + `eliminado_por` fields instead of hard deletes.
