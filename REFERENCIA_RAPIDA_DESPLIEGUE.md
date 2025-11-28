# ⚡ Referencia Rápida: Despliegue Gratuito

Guía rápida de comandos y URLs esenciales para desplegar DiDi-Sicuani.

---

## 🚀 Stack Recomendado (100% Gratis)

| Componente | Servicio | URL |
|------------|----------|-----|
| **Backend** | Render | https://render.com |
| **Frontend** | Vercel | https://vercel.com |
| **MongoDB** | MongoDB Atlas | https://mongodb.com/cloud/atlas |
| **Redis** | Upstash | https://upstash.com |

---

## 📝 Variables de Entorno

### Backend (Render/Railway)

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority
REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=tu_password
JWT_SECRET=genera-una-clave-segura-de-64-caracteres
PORT=10000
NODE_ENV=production
SOCKET_CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Frontend (Vercel/Netlify)

```env
VITE_API_URL=https://tu-backend.onrender.com/api
VITE_SOCKET_URL=https://tu-backend.onrender.com
```

---

## 🔗 URLs de Ejemplo

Después del despliegue, tendrás URLs como:

- **Frontend**: `https://didi-sicuani.vercel.app`
- **Backend**: `https://didi-sicuani-backend.onrender.com`
- **API Docs**: `https://didi-sicuani-backend.onrender.com/api-docs`
- **Health Check**: `https://didi-sicuani-backend.onrender.com/health`

---

## ✅ Checklist de Despliegue

### MongoDB Atlas
- [ ] Cuenta creada
- [ ] Cluster M0 creado
- [ ] Usuario de BD creado
- [ ] IP whitelisted (0.0.0.0/0 para desarrollo)
- [ ] Connection String obtenida

### Redis (Opcional)
- [ ] Cuenta Upstash creada
- [ ] Base de datos creada
- [ ] Credenciales guardadas

### Backend
- [ ] Código en GitHub
- [ ] Servicio creado en Render/Railway
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Health check responde

### Frontend
- [ ] Proyecto importado en Vercel/Netlify
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] CORS actualizado en backend

---

## 🧪 Comandos de Verificación

### Verificar Backend Localmente

```bash
cd backend
node scripts/verify-deployment.js
```

### Probar Health Check

```bash
# Local
curl http://localhost:5000/health

# Producción
curl https://tu-backend.onrender.com/health
```

### Verificar MongoDB

```bash
# Conectar con mongosh
mongosh "mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/didi-sicuani"

# Dentro de mongosh
show dbs
use didi-sicuani
show collections
```

---

## 🔧 Troubleshooting Rápido

### Backend no responde
- Verifica logs en Render/Railway
- Verifica que MongoDB esté accesible
- Verifica variables de entorno

### CORS Error
- Verifica `SOCKET_CORS_ORIGIN` en backend
- Debe ser exactamente la URL del frontend
- Redespliega backend después de cambiar

### MongoDB Connection Failed
- Verifica Connection String
- Verifica que IP esté whitelisted
- Verifica credenciales de usuario

### Frontend no carga
- Verifica variables de entorno
- Verifica que backend esté corriendo
- Revisa consola del navegador (F12)

---

## 📚 Documentación Completa

Para la guía detallada, consulta:
- **GUIA_DESPLIEGUE_GRATUITO.md** - Guía completa paso a paso

---

## 💰 Costos

**Total: $0/mes** (100% gratis)

- MongoDB Atlas: 512 MB gratis
- Render: 750 horas/mes gratis
- Vercel: Ilimitado gratis
- Upstash: 10K comandos/día gratis

---

**Última actualización**: Generado automáticamente








