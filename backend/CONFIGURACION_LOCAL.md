# Configuración para Desarrollo Local

## 📝 Cambios Realizados

Se ha creado un archivo `.env.local.example` con las configuraciones optimizadas para desarrollo local.

## 🔧 Cambios Principales

### 1. **NODE_ENV**
- ❌ Antes: `NODE_ENV=production`
- ✅ Ahora: `NODE_ENV=development`

### 2. **CORS y Frontend**
- ✅ `SOCKET_CORS_ORIGIN=http://localhost:5173`
- ✅ `FRONTEND_URL=http://localhost:5173` (nuevo)

## 📋 Pasos para Configurar

### Opción 1: Copiar el archivo de ejemplo

```powershell
cd backend
Copy-Item .env.local.example .env
```

### Opción 2: Crear manualmente

1. Crea un archivo `.env` en la carpeta `backend/`
2. Copia el contenido de `.env.local.example`
3. Ajusta las variables según necesites

## 🔍 Variables Importantes para Local

```env
NODE_ENV=development
PORT=5000
SOCKET_CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

## 🚀 Uso

Una vez configurado el `.env`, simplemente ejecuta:

```powershell
cd backend
npm start
```

El servidor se iniciará en modo desarrollo con:
- ✅ CORS configurado para `http://localhost:5173`
- ✅ Logs detallados (morgan)
- ✅ Hot reload si usas nodemon

## 📌 Notas

- **MongoDB**: Se mantiene la conexión a Atlas, pero puedes cambiarla a local si prefieres
- **Redis**: Se mantiene la conexión a Redis Cloud, pero puedes cambiarla a local si prefieres
- **PostgreSQL**: Estas variables se mantienen por compatibilidad pero no se usan (el proyecto solo usa MongoDB)

## 🔄 Para Producción

Cuando vayas a desplegar, asegúrate de cambiar:
- `NODE_ENV=production`
- `SOCKET_CORS_ORIGIN` a la URL de producción
- `FRONTEND_URL` a la URL de producción

