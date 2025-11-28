# ✅ Checklist de Despliegue en cPanel - DiDi Sicuani

## Información del Servidor
- **Dominio**: vilcanotadsi.top
- **Usuario**: vilca
- **Home Directory**: /home/vilca
- **Backend URL**: https://api.vilcanotadsi.top
- **Frontend URL**: https://vilcanotadsi.top

---

## 📋 Checklist de Pasos

### ✅ Paso 1: Crear Subdominio
- [ ] Subdominio `api` creado
- [ ] Document Root anotado: `/home/vilca/api.vilcanotadsi.top`

### ✅ Paso 2: Configurar Node.js
- [ ] Node.js Selector encontrado en cPanel
- [ ] Aplicación Node.js creada
- [ ] Versión Node.js seleccionada (18.x o 20.x)
- [ ] Application Root configurado
- [ ] Application URL: `api.vilcanotadsi.top`
- [ ] Startup File: `server.js`

### ✅ Paso 3: Subir Backend
- [ ] Archivos del backend subidos (sin node_modules)
- [ ] Dependencias instaladas (npm install)

### ✅ Paso 4: Variables de Entorno
- [ ] MONGODB_URI configurada
- [ ] REDIS_URL configurada
- [ ] JWT_SECRET configurada
- [ ] PORT=10000 (o el asignado)
- [ ] NODE_ENV=production
- [ ] SOCKET_CORS_ORIGIN=https://vilcanotadsi.top
- [ ] CORS_ORIGIN=https://vilcanotadsi.top

### ✅ Paso 5: Iniciar Backend
- [ ] Aplicación iniciada
- [ ] Estado: Running
- [ ] Health check funcionando: https://api.vilcanotadsi.top/health

### ✅ Paso 6: Construir Frontend
- [ ] .env.production creado
- [ ] Frontend construido (npm run build)
- [ ] Carpeta dist creada

### ✅ Paso 7: Subir Frontend
- [ ] Archivos de dist subidos a public_html
- [ ] .htaccess configurado para SPA

### ✅ Paso 8: SSL/HTTPS
- [ ] SSL instalado para vilcanotadsi.top
- [ ] SSL instalado para api.vilcanotadsi.top

### ✅ Paso 9: Verificación Final
- [ ] Frontend carga correctamente
- [ ] Backend responde
- [ ] Socket.io conecta
- [ ] Registro/Login funciona

---

## 🔑 Variables de Entorno para cPanel

### MongoDB Atlas
```
MONGODB_URI=mongodb+srv://didi-sicuani:159753@cluster0.xywi7ah.mongodb.net/didi-sicuani?retryWrites=true&w=majority
```

### Redis Cloud
```
REDIS_URL=redis://default:ier0LZhCpHZ7kiYbMuiM9AiXAOA4bFew@redis-18779.crce216.sa-east-1-2.ec2.cloud.redislabs.com:18779
```

### JWT
```
JWT_SECRET=tu_jwt_secret_super_seguro_cambiar_en_produccion_123456789
JWT_EXPIRES_IN=7d
```

### Server
```
PORT=10000
NODE_ENV=production
```

### CORS
```
SOCKET_CORS_ORIGIN=https://vilcanotadsi.top
CORS_ORIGIN=https://vilcanotadsi.top
```

---

## 📝 Notas
- El puerto puede variar según cPanel (generalmente 10000)
- Verifica los logs si hay errores
- Asegúrate de que MongoDB Atlas tenga acceso desde la IP del servidor

