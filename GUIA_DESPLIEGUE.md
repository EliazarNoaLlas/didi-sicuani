# 🚀 Guía de Despliegue - DiDi Sicuani

Esta guía te ayudará a desplegar tu aplicación completa (Base de Datos, Backend y Frontend) en servicios gratuitos.

---

## 📋 Tabla de Contenidos

1. [Base de Datos - MongoDB Atlas](#1-base-de-datos---mongodb-atlas)
2. [Base de Datos - Redis Cloud](#2-base-de-datos---redis-cloud)
3. [Backend - Render](#3-backend---render)
4. [Frontend - Vercel](#4-frontend---vercel)
5. [Configuración Final](#5-configuración-final)

---

## 1. Base de Datos - MongoDB Atlas

### Paso 1.1: Crear cuenta en MongoDB Atlas

1. Ve a [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Regístrate con tu email o cuenta de Google
3. Completa el formulario de registro

### Paso 1.2: Crear un Cluster Gratuito

1. Una vez registrado, haz clic en **"Build a Database"**
2. Selecciona el plan **FREE (M0)**
3. Elige un proveedor de nube (AWS, Google Cloud, o Azure)
4. Selecciona una región cercana a ti (ej: `us-east-1`)
5. Nombra tu cluster (ej: `Cluster0`)
6. Haz clic en **"Create"** (puede tardar 3-5 minutos)

### Paso 1.3: Configurar Usuario de Base de Datos

1. En la pantalla de seguridad, crea un usuario:
   - **Username**: `didi-sicuani-admin` (o el que prefieras)
   - **Password**: Genera una contraseña segura (guárdala bien)
   - Haz clic en **"Create User"**

### Paso 1.4: Configurar Acceso de Red

1. En la sección **"Network Access"**, haz clic en **"Add IP Address"**
2. Para desarrollo, selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ **Nota**: En producción, deberías restringir esto a las IPs de tus servidores
3. Haz clic en **"Confirm"**

### Paso 1.5: Obtener String de Conexión

1. Haz clic en **"Connect"** en tu cluster
2. Selecciona **"Connect your application"**
3. Elige **"Node.js"** como driver y la versión más reciente
4. Copia el string de conexión. Se verá así:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Reemplaza `<username>` y `<password>` con tus credenciales
6. Agrega el nombre de tu base de datos al final:
   ```
   mongodb+srv://didi-sicuani-admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority
   ```

### Paso 1.6: Verificar Conexión

1. Guarda el string de conexión, lo usarás en el backend
2. ⚠️ **Importante**: Asegúrate de que el formato sea correcto:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```
3. El código del backend está optimizado para MongoDB Atlas y detectará automáticamente la conexión cloud

---

## 2. Base de Datos - Redis Cloud

### Paso 2.1: Crear cuenta en Redis Cloud

1. Ve a [https://redis.com/try-free/](https://redis.com/try-free/)
2. Haz clic en **"Get Started for Free"**
3. Regístrate con tu email o cuenta de Google

### Paso 2.2: Crear Base de Datos Redis

1. Una vez registrado, haz clic en **"New Subscription"**
2. Selecciona el plan **FREE** (30MB)
3. Elige un proveedor de nube y región (misma que MongoDB si es posible)
4. Haz clic en **"Create Subscription"**

### Paso 2.3: Crear Base de Datos

1. En tu suscripción, haz clic en **"New Database"**
2. Configura:
   - **Name**: `didi-sicuani-redis`
   - **Region**: Misma que MongoDB
   - **Memory limit**: 30MB (máximo del plan gratuito)
3. Haz clic en **"Activate"**

### Paso 2.4: Obtener Credenciales

1. Una vez creada la base de datos, haz clic en ella
2. En la sección **"Security"**, copia:
   - **Endpoint**: `redis-xxxxx.c1.us-east-1-1.ec2.cloud.redislabs.com:12345`
   - **Password**: La contraseña generada (guárdala bien)

### Paso 2.5: Verificar Conexión

1. Guarda el endpoint y la contraseña, los usarás en el backend

---

## 3. Backend - Render

### Paso 3.1: Preparar el Backend para Producción

#### 3.1.1: Crear archivo `.env` de producción

Crea un archivo `.env.production` en la carpeta `backend/` con las siguientes variables:

```env
# MongoDB
MONGODB_URI=mongodb+srv://didi-sicuani-admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority

# Redis
REDIS_HOST=redis-xxxxx.c1.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=TU_PASSWORD_REDIS

# JWT
JWT_SECRET=tu_secret_key_super_segura_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# CORS y Socket.io
CORS_ORIGIN=https://tu-frontend.vercel.app
SOCKET_CORS_ORIGIN=https://tu-frontend.vercel.app

# Otros (ajusta según tu configuración)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 3.1.2: Verificar configuración de MongoDB Atlas

El código ya está optimizado para MongoDB Atlas. El archivo `backend/config/database.js` incluye:

- ✅ Configuración automática para MongoDB Atlas (detecta `mongodb+srv://`)
- ✅ Opciones de conexión optimizadas (timeouts, pool de conexiones, reintentos)
- ✅ Manejo robusto de errores con mensajes descriptivos
- ✅ Reconexión automática en caso de desconexión

**No necesitas modificar el código**, solo asegúrate de que la variable `MONGODB_URI` esté correctamente configurada en las variables de entorno de Render.

#### 3.1.3: Verificar `server.js` para producción

Verifica que `server.js` use variables de entorno correctamente:

```javascript
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
```

#### 3.1.4: Crear archivo `render.yaml` (opcional)

Crea `render.yaml` en la raíz del proyecto:

```yaml
services:
  - type: web
    name: didi-sicuani-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: MONGODB_URI
        sync: false
      - key: REDIS_HOST
        sync: false
      - key: REDIS_PORT
        sync: false
      - key: REDIS_PASSWORD
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CORS_ORIGIN
        sync: false
      - key: SOCKET_CORS_ORIGIN
        sync: false
```

### Paso 3.2: Subir Código a GitHub

1. Si no tienes un repositorio, crea uno en [GitHub](https://github.com)
2. Inicializa git en tu proyecto (si no lo has hecho):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Conecta con tu repositorio:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/didi-sicuani.git
   git push -u origin main
   ```

### Paso 3.3: Desplegar en Render

1. Ve a [https://render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub
3. Haz clic en **"New +"** → **"Web Service"**
4. Conecta tu repositorio de GitHub
5. Configura el servicio:
   - **Name**: `didi-sicuani-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free**
6. En **"Environment Variables"**, agrega todas las variables de tu `.env.production`:
   - `MONGODB_URI`
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `PORT=5000`
   - `CORS_ORIGIN` (lo actualizarás después con la URL del frontend)
   - `SOCKET_CORS_ORIGIN` (lo actualizarás después con la URL del frontend)
7. Haz clic en **"Create Web Service"**
8. Render comenzará a construir y desplegar tu backend (puede tardar 5-10 minutos)

### Paso 3.4: Obtener URL del Backend

1. Una vez desplegado, Render te dará una URL como:
   ```
   https://didi-sicuani-backend.onrender.com
   ```
2. ⚠️ **Nota**: En el plan gratuito, el servicio se "duerme" después de 15 minutos de inactividad. La primera petición puede tardar 30-60 segundos en despertar.

### Paso 3.5: Verificar Despliegue

1. Visita `https://tu-backend.onrender.com/api-docs` para ver la documentación Swagger
2. Si todo está bien, deberías ver la interfaz de Swagger

---

## 4. Frontend - Vercel

### Paso 4.1: Preparar el Frontend para Producción

#### 4.1.1: Actualizar variables de entorno

Crea un archivo `.env.production` en la carpeta `frontend/`:

```env
VITE_API_URL=https://tu-backend.onrender.com
VITE_SOCKET_URL=https://tu-backend.onrender.com
```

#### 4.1.2: Verificar configuración de API

Asegúrate de que `frontend/src/services/api.js` use la variable de entorno:

```javascript
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Y que `frontend/src/services/socket.js` también:

```javascript
const URL_SOCKET = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
```

### Paso 4.2: Desplegar en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Regístrate con tu cuenta de GitHub
3. Haz clic en **"Add New..."** → **"Project"**
4. Importa tu repositorio de GitHub
5. Configura el proyecto:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. En **"Environment Variables"**, agrega:
   - `VITE_API_URL`: `https://tu-backend.onrender.com`
   - `VITE_SOCKET_URL`: `https://tu-backend.onrender.com`
7. Haz clic en **"Deploy"**
8. Vercel construirá y desplegará tu frontend (2-5 minutos)

### Paso 4.3: Obtener URL del Frontend

1. Una vez desplegado, Vercel te dará una URL como:
   ```
   https://didi-sicuani.vercel.app
   ```
2. También puedes configurar un dominio personalizado si lo deseas

### Paso 4.4: Actualizar CORS en Backend

1. Vuelve a Render y edita las variables de entorno de tu backend:
   - `CORS_ORIGIN`: `https://tu-frontend.vercel.app`
   - `SOCKET_CORS_ORIGIN`: `https://tu-frontend.vercel.app`
2. Guarda los cambios (Render redeployará automáticamente)

---

## 5. Configuración Final

### Paso 5.1: Actualizar Variables de Entorno del Frontend

1. En Vercel, ve a tu proyecto → **Settings** → **Environment Variables**
2. Actualiza las URLs si es necesario
3. Haz un nuevo deploy si cambiaste algo

### Paso 5.2: Verificar Funcionamiento Completo

1. Visita tu frontend: `https://tu-frontend.vercel.app`
2. Prueba:
   - Registro de usuario
   - Inicio de sesión
   - Solicitud de viaje
   - Conexión de Socket.io (verifica en la consola del navegador)

### Paso 5.3: Monitoreo y Logs

#### Render (Backend)
- Ve a tu servicio en Render
- Haz clic en **"Logs"** para ver los logs en tiempo real
- **"Metrics"** muestra uso de CPU y memoria

#### Vercel (Frontend)
- Ve a tu proyecto en Vercel
- **"Deployments"** muestra todos los despliegues
- **"Analytics"** muestra estadísticas de uso (requiere plan superior)

### Paso 5.4: Optimizaciones Adicionales

#### Para evitar que Render se "duerma"
- Usa un servicio como [UptimeRobot](https://uptimerobot.com) (gratis)
- Configura un ping cada 5 minutos a tu backend
- Esto mantendrá el servicio activo

#### Para mejorar rendimiento
- Habilita compresión en el backend (ya está con `compression`)
- Usa CDN para assets estáticos (Vercel lo hace automáticamente)
- Considera usar variables de entorno para configuraciones

---

## 🔧 Solución de Problemas Comunes

### Error: "Cannot connect to MongoDB"
- Verifica que la IP de Render esté en la whitelist de MongoDB Atlas
- Agrega `0.0.0.0/0` temporalmente para pruebas (o la IP específica de Render)
- Verifica que el string de conexión sea correcto:
  - Formato: `mongodb+srv://usuario:password@cluster.mongodb.net/didi-sicuani?retryWrites=true&w=majority`
  - Reemplaza `<username>` y `<password>` con tus credenciales reales
  - Asegúrate de que no haya espacios en la URI
- Verifica que el usuario de MongoDB tenga permisos de lectura/escritura
- Revisa los logs del backend en Render para ver el error específico

### Error: "Redis connection failed"
- Verifica que el endpoint y la contraseña sean correctos
- Asegúrate de que Redis Cloud esté activo
- Verifica que el puerto sea correcto

### Error: "CORS error"
- Verifica que `CORS_ORIGIN` en el backend incluya la URL exacta del frontend
- Asegúrate de incluir `https://` en las URLs
- Verifica que no haya espacios en las variables de entorno

### El backend se "duerme" en Render
- Esto es normal en el plan gratuito
- Usa UptimeRobot para mantenerlo activo
- O considera actualizar a un plan de pago

### Socket.io no conecta
- Verifica que `SOCKET_CORS_ORIGIN` esté configurado correctamente
- Asegúrate de que el frontend use `https://` para el socket
- Verifica los logs del backend para errores de conexión

---

## 📝 Checklist de Despliegue

- [ ] MongoDB Atlas configurado y funcionando
- [ ] Redis Cloud configurado y funcionando
- [ ] Backend desplegado en Render
- [ ] Variables de entorno del backend configuradas
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno del frontend configuradas
- [ ] CORS actualizado con URL del frontend
- [ ] Pruebas de registro e inicio de sesión exitosas
- [ ] Socket.io conectando correctamente
- [ ] UptimeRobot configurado (opcional)

---

## 🎉 ¡Listo!

Tu aplicación debería estar completamente desplegada y funcionando. Si encuentras algún problema, revisa la sección de solución de problemas o los logs de los servicios.

---

## 📚 Recursos Adicionales

- [Documentación de MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Documentación de Redis Cloud](https://docs.redis.com/)
- [Documentación de Render](https://render.com/docs)
- [Documentación de Vercel](https://vercel.com/docs)

---

**Nota**: Los planes gratuitos tienen limitaciones. Si tu aplicación crece, considera actualizar a planes de pago para mejor rendimiento y disponibilidad.

