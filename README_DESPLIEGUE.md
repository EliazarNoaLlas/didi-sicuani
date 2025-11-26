# 🚀 Guía Rápida de Despliegue

Esta es una versión resumida. Para la guía completa, consulta [GUIA_DESPLIEGUE.md](./GUIA_DESPLIEGUE.md).

## Servicios Recomendados (Gratuitos)

| Componente | Servicio | Plan Gratuito |
|------------|----------|---------------|
| MongoDB | MongoDB Atlas | 512MB, Cluster compartido |
| Redis | Redis Cloud | 30MB |
| Backend | Render | 750 horas/mes, se duerme después de 15 min |
| Frontend | Vercel | Ilimitado, CDN global |

## Pasos Rápidos

### 1. MongoDB Atlas
1. Regístrate en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Crea un cluster gratuito (M0)
3. Crea usuario y configura acceso de red (0.0.0.0/0)
4. Obtén el string de conexión

### 2. Redis Cloud
1. Regístrate en [Redis Cloud](https://redis.com/try-free/)
2. Crea una suscripción gratuita
3. Crea una base de datos (30MB)
4. Obtén endpoint y contraseña

### 3. Backend (Render)
1. Sube tu código a GitHub
2. Conecta GitHub con [Render](https://render.com)
3. Crea un Web Service:
   - Build: `cd backend && npm install`
   - Start: `cd backend && npm start`
4. Configura variables de entorno (ver `.env.example`)
5. Obtén la URL: `https://tu-backend.onrender.com`

### 4. Frontend (Vercel)
1. Conecta GitHub con [Vercel](https://vercel.com)
2. Importa tu repositorio
3. Configura:
   - Root: `frontend`
   - Build: `npm run build`
   - Output: `dist`
4. Agrega variables de entorno:
   - `VITE_API_URL`: URL de tu backend
   - `VITE_SOCKET_URL`: URL de tu backend
5. Obtén la URL: `https://tu-app.vercel.app`

### 5. Actualizar CORS
1. En Render, actualiza `CORS_ORIGIN` y `SOCKET_CORS_ORIGIN` con la URL de Vercel
2. Render redeployará automáticamente

## Variables de Entorno Necesarias

### Backend (.env en Render)
```env
MONGODB_URI=mongodb+srv://...
REDIS_HOST=redis-xxxxx...
REDIS_PORT=12345
REDIS_PASSWORD=...
JWT_SECRET=...
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://tu-frontend.vercel.app
SOCKET_CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Frontend (en Vercel)
```env
VITE_API_URL=https://tu-backend.onrender.com
VITE_SOCKET_URL=https://tu-backend.onrender.com
```

## ⚠️ Limitaciones del Plan Gratuito

- **Render**: El servicio se "duerme" después de 15 min de inactividad. La primera petición puede tardar 30-60 segundos.
- **MongoDB Atlas**: 512MB de almacenamiento, cluster compartido.
- **Redis Cloud**: 30MB de memoria.

## 🔧 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| CORS Error | Verifica que `CORS_ORIGIN` tenga la URL exacta del frontend |
| MongoDB no conecta | Agrega IP de Render (0.0.0.0/0) en Network Access |
| Redis no conecta | Verifica endpoint, puerto y contraseña |
| Backend dormido | Usa [UptimeRobot](https://uptimerobot.com) para ping cada 5 min |
| Socket.io no conecta | Verifica `SOCKET_CORS_ORIGIN` y que uses `https://` |

## 📚 Documentación Completa

Para instrucciones detalladas paso a paso, consulta [GUIA_DESPLIEGUE.md](./GUIA_DESPLIEGUE.md).

