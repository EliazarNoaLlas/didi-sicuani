# Solución al Error "Ruta no encontrada"

## 🔴 Error Reportado
```
URL: https://didi-sicuani.onrender.com/autenticacion/register
Respuesta: {"exito":false,"mensaje":"Ruta no encontrada"}
```

## 📋 Explicación del Error

### Problema Principal
**Falta el prefijo `/api` en la URL**

El backend tiene todas las rutas montadas con el prefijo `/api`:
- ✅ Ruta correcta: `/api/autenticacion/register`
- ❌ Ruta incorrecta: `/autenticacion/register`

### Código del Backend
En `backend/server.js` línea 109:
```javascript
aplicacion.use('/api/autenticacion', rutasAutenticacion);
```

### Problemas Adicionales

1. **Método HTTP incorrecto**: La ruta `/api/autenticacion/register` solo acepta **POST**, no GET
   - Si accedes desde el navegador (GET), obtendrás 404
   - Debes hacer una petición POST con datos JSON

2. **Variable de entorno no configurada**: El frontend necesita `VITE_API_URL` en Vercel

## ✅ Soluciones

### Solución 1: Configurar Variables de Entorno en Vercel

#### Opción A: Desde el Dashboard (Recomendado)
1. Ve a: https://vercel.com/eliazarnoallas-projects/frontend/settings/environment-variables
2. Agrega las siguientes variables:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_API_URL` | `https://didi-sicuani.onrender.com/api` | Production, Preview, Development |
| `VITE_SOCKET_URL` | `https://didi-sicuani.onrender.com` | Production, Preview, Development |

3. Guarda los cambios
4. Redespliega el proyecto:
   ```powershell
   cd frontend
   npx vercel --prod
   ```

#### Opción B: Desde la Línea de Comandos
```powershell
cd frontend

# Configurar VITE_API_URL
echo "https://didi-sicuani.onrender.com/api" | npx vercel env add VITE_API_URL production
echo "https://didi-sicuani.onrender.com/api" | npx vercel env add VITE_API_URL preview
echo "https://didi-sicuani.onrender.com/api" | npx vercel env add VITE_API_URL development

# Configurar VITE_SOCKET_URL
echo "https://didi-sicuani.onrender.com" | npx vercel env add VITE_SOCKET_URL production
echo "https://didi-sicuani.onrender.com" | npx vercel env add VITE_SOCKET_URL preview
echo "https://didi-sicuani.onrender.com" | npx vercel env add VITE_SOCKET_URL development

# Redesplegar
npx vercel --prod
```

### Solución 2: Verificar que el Frontend Use la URL Correcta

El frontend ya está configurado correctamente en `frontend/src/services/api.js`:
```javascript
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

Solo necesitas asegurarte de que `VITE_API_URL` esté configurada en Vercel.

### Solución 3: Probar la Ruta Correcta

#### Desde el Navegador (GET - Solo para verificar)
```
https://didi-sicuani.onrender.com/api/autenticacion/register
```
⚠️ Esto seguirá dando 404 porque la ruta solo acepta POST

#### Desde Postman/Thunder Client/curl (POST - Correcto)
```bash
curl -X POST https://didi-sicuani.onrender.com/api/autenticacion/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "contrasena": "password123",
    "tipoUsuario": "pasajero",
    "telefono": "+51987654321"
  }'
```

## 🔍 Verificación

### 1. Verificar Variables de Entorno en Vercel
```powershell
npx vercel env ls
```

### 2. Verificar que el Frontend Esté Usando la URL Correcta
1. Abre la consola del navegador (F12)
2. Ve a la pestaña Network
3. Intenta registrarte
4. Verifica que la petición vaya a: `https://didi-sicuani.onrender.com/api/autenticacion/register`

### 3. Verificar el Backend
```bash
# Verificar que el servidor esté corriendo
curl https://didi-sicuani.onrender.com/health

# Debería responder: {"estado":"OK",...}
```

## 📝 Resumen de Rutas Correctas

| Endpoint | Método | URL Completa |
|----------|--------|--------------|
| Registro | POST | `https://didi-sicuani.onrender.com/api/autenticacion/register` |
| Login | POST | `https://didi-sicuani.onrender.com/api/autenticacion/login` |
| Health Check | GET | `https://didi-sicuani.onrender.com/health` |

## 🚨 Nota Importante

**NO accedas directamente a las rutas de API desde el navegador** porque:
- El navegador hace peticiones GET por defecto
- Las rutas de autenticación solo aceptan POST
- Siempre usa el frontend o herramientas como Postman para probar las APIs

## ✅ Checklist de Solución

- [ ] Configurar `VITE_API_URL` en Vercel
- [ ] Configurar `VITE_SOCKET_URL` en Vercel
- [ ] Redesplegar el frontend en Vercel
- [ ] Verificar que las peticiones del frontend vayan a la URL correcta
- [ ] Probar el registro desde el frontend desplegado

