# Solución CORS y Fallback a Localhost

## 🔴 Problema Original

1. **Error CORS**: El backend solo permitía `https://didi-sicuani-frontend.onrender.com`, pero el frontend local intentaba acceder desde `http://localhost:5173`
2. **Sin fallback**: Si la producción fallaba, no había forma de usar localhost automáticamente

## ✅ Soluciones Implementadas

### 1. Backend - Configuración CORS Mejorada

**Archivo**: `backend/server.js`

- ✅ Permite múltiples orígenes (localhost y producción)
- ✅ Permite cualquier puerto localhost en desarrollo
- ✅ Configurado tanto para Express CORS como Socket.io CORS

**Orígenes permitidos**:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (React default)
- `http://localhost:5174` (Vite alternativo)
- `https://didi-sicuani-frontend.onrender.com`
- `https://frontend-*.vercel.app` (cualquier despliegue de Vercel)
- Cualquier localhost en desarrollo

### 2. Frontend - Fallback Automático a Localhost

**Archivo**: `frontend/src/services/api.js`

- ✅ Intenta usar producción primero
- ✅ Si falla (CORS, red, etc.), automáticamente cambia a localhost
- ✅ Solo funciona en desarrollo (`import.meta.env.DEV`)
- ✅ En producción, siempre usa la URL configurada

**Comportamiento**:
1. En desarrollo, intenta conectar a producción
2. Si hay error de red/CORS, automáticamente reintenta con `http://localhost:5000/api`
3. Muestra mensajes en consola para debugging

## 🚀 Cómo Funciona

### En Desarrollo Local

```javascript
// 1. Intenta: https://didi-sicuani.onrender.com/api/autenticacion/register
// 2. Si falla (CORS/red): http://localhost:5000/api/autenticacion/register
```

### En Producción

```javascript
// Siempre usa: https://didi-sicuani.onrender.com/api/autenticacion/register
```

## 📝 Cambios Realizados

### Backend (`backend/server.js`)

1. **Lista de orígenes permitidos**:
   ```javascript
   const origenesPermitidos = [
     'http://localhost:5173',
     'http://localhost:3000',
     'http://localhost:5174',
     'https://didi-sicuani-frontend.onrender.com',
     'https://frontend-*.vercel.app',
     // ... más orígenes
   ];
   ```

2. **CORS dinámico**:
   - Permite cualquier localhost en desarrollo
   - Valida orígenes en producción
   - Permite requests sin origen (Postman, curl, etc.)

### Frontend (`frontend/src/services/api.js`)

1. **Detección automática**:
   - Verifica disponibilidad de producción al iniciar
   - Cambia a localhost si producción no está disponible

2. **Interceptor de errores**:
   - Detecta errores de red/CORS
   - Reintenta automáticamente con localhost
   - Evita loops infinitos

## 🧪 Pruebas

### Probar en Desarrollo

1. **Con backend local corriendo**:
   ```bash
   cd backend
   npm start
   ```
   - El frontend debería usar localhost automáticamente si producción falla

2. **Sin backend local**:
   - El frontend intentará producción
   - Si falla, mostrará error (esperado)

### Probar en Producción

- El frontend siempre usa la URL de producción configurada en Vercel
- No hay fallback a localhost en producción

## ⚠️ Notas Importantes

1. **Variables de entorno necesarias en Vercel**:
   - `VITE_API_URL` = `https://didi-sicuani.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://didi-sicuani.onrender.com`

2. **Backend debe estar desplegado**:
   - Los cambios en el backend necesitan ser desplegados en Render
   - El CORS mejorado solo funcionará después del despliegue

3. **Puertos locales**:
   - Si usas un puerto diferente a 5000 para el backend, actualiza `URL_API_LOCAL` en `api.js`
   - Si usas un puerto diferente a 5173 para el frontend, agrégalo a `origenesPermitidos` en `server.js`

## 🔄 Próximos Pasos

1. **Desplegar backend en Render** para aplicar los cambios de CORS
2. **Probar en local** que el fallback funciona
3. **Verificar en producción** que todo funciona correctamente

