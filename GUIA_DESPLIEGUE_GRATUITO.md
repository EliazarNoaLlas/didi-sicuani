# 🚀 Guía Completa de Despliegue con cPanel - DiDi-Sicuani

Esta guía te mostrará cómo desplegar completamente la aplicación DiDi-Sicuani usando **cPanel** como servicio de hosting y dominio.

---

## 📋 Índice

1. [Requisitos Previos y Resumen](#1-requisitos-previos-y-resumen)
2. [Paso 1: Configurar MongoDB Atlas](#2-paso-1-configurar-mongodb-atlas)
3. [Paso 2: Configurar Redis (Opcional)](#3-paso-2-configurar-redis-opcional)
4. [Paso 3: Preparar el Proyecto para cPanel](#4-paso-3-preparar-el-proyecto-para-cpanel)
5. [Paso 4: Desplegar Backend en cPanel](#5-paso-4-desplegar-backend-en-cpanel)
6. [Paso 5: Desplegar Frontend en cPanel](#6-paso-5-desplegar-frontend-en-cpanel)
7. [Paso 6: Configurar Dominio y Subdominios](#7-paso-6-configurar-dominio-y-subdominios)
8. [Paso 7: Configurar Variables de Entorno](#8-paso-7-configurar-variables-de-entorno)
9. [Paso 8: Verificar Despliegue](#9-paso-8-verificar-despliegue)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Requisitos Previos y Resumen

### Stack de Despliegue con cPanel

| Componente | Servicio | Descripción |
|------------|----------|-------------|
| **Hosting** | cPanel Hosting | Hosting compartido o VPS con cPanel |
| **Dominio** | Tu dominio | Dominio propio o subdominio del hosting |
| **MongoDB** | MongoDB Atlas | Base de datos en la nube (gratis o pago) |
| **Backend** | cPanel Node.js | Aplicación Node.js en cPanel |
| **Frontend** | cPanel File Manager | Archivos estáticos en public_html |
| **Redis** | Upstash (Opcional) | Cache en la nube |

### Requisitos Previos

Antes de comenzar, necesitas:

1. ✅ **Cuenta de hosting con cPanel**
   - Hosting compartido con cPanel o VPS con cPanel instalado
   - Acceso FTP o SSH
   - Node.js Selector habilitado (para el backend)

2. ✅ **Dominio configurado**
   - Dominio apuntando a tu hosting
   - O subdominio del hosting (ej: `tudominio.com` o `subdominio.tudominio.com`)

3. ✅ **Credenciales de acceso**
   - Usuario y contraseña de cPanel
   - Usuario y contraseña de FTP (si aplica)
   - Acceso SSH (opcional pero recomendado)

### Estructura de Despliegue Recomendada

```
tu-dominio.com/              → Frontend (public_html)
api.tu-dominio.com/          → Backend (subdominio con Node.js)
```

O usando subdirectorios:

```
tu-dominio.com/              → Frontend (public_html)
tu-dominio.com/api/          → Backend (subdirectorio con Node.js)
```

---

## 2. Paso 1: Configurar MongoDB Atlas

### 2.1 Crear Cuenta en MongoDB Atlas

1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Completa el registro:
   - Email
   - Contraseña
   - Nombre de organización (puede ser personal)
   - Nombre del proyecto: `DiDi-Sicuani`

### 2.2 Crear Cluster Gratuito

1. Una vez registrado, verás la opción de crear un cluster
2. Selecciona:
   - **Provider**: AWS (recomendado) o Google Cloud
   - **Region**: Elige la más cercana a ti (ej: `us-east-1`)
   - **Cluster Tier**: **M0 Sandbox** (FREE)
   - **Cluster Name**: `didi-sicuani-cluster`
3. Haz clic en **Create Cluster**
4. Espera 3-5 minutos mientras se crea el cluster

### 2.3 Configurar Acceso a la Base de Datos

**Paso 1: Crear Usuario de Base de Datos**

1. En el menú lateral, ve a **Database Access**
2. Haz clic en **Add New Database User**
3. Configura:
   - **Authentication Method**: Password
   - **Username**: `didi-sicuani-user` (o el que prefieras)
   - **Password**: Genera una contraseña segura (guárdala, la necesitarás)
   - **Database User Privileges**: **Read and write to any database**
4. Haz clic en **Add User**

**Paso 2: Configurar Acceso de Red**

1. En el menú lateral, ve a **Network Access**
2. Haz clic en **Add IP Address**
3. Para desarrollo, puedes usar:
   - **Add Current IP Address** (tu IP actual) - MongoDB Atlas detectará automáticamente tu IP
   - O **Allow Access from Anywhere** (0.0.0.0/0) - ⚠️ Solo para desarrollo
4. Haz clic en **Confirm**

**💡 Cómo ver tu IP pública actual:**

Si necesitas ver tu IP pública antes de configurarla manualmente, usa estos comandos:

**Windows (PowerShell):**
```powershell
# Opción 1: Usando Invoke-WebRequest
(Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content

# Opción 2: Usando curl (si está disponible)
curl https://api.ipify.org

# Opción 3: Usando nslookup
nslookup myip.opendns.com resolver1.opendns.com
```

**Windows (CMD):**
```cmd
curl https://api.ipify.org
```

**Linux/Mac (Terminal):**
```bash
# Opción 1: Usando curl
curl https://api.ipify.org

# Opción 2: Usando wget
wget -qO- https://api.ipify.org

# Opción 3: Usando dig
dig +short myip.opendns.com @resolver1.opendns.com
```

**Navegador Web (Más fácil):**
Simplemente visita: https://api.ipify.org o https://whatismyipaddress.com/

**Nota**: MongoDB Atlas generalmente detecta automáticamente tu IP cuando haces clic en "Add Current IP Address", pero estos comandos son útiles si necesitas verificar tu IP o agregarla manualmente.

### 2.4 Obtener Connection String

1. En el menú lateral, ve a **Database**
2. Haz clic en **Connect** en tu cluster
3. Selecciona **Connect your application**
4. Selecciona:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. Copia la **Connection String**, se verá así:
   ```
   mongodb+srv://<username>:<password>@didi-sicuani-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Reemplaza `<username>` y `<password>` con tus credenciales:
   ```
   mongodb+srv://didi-sicuani-user:TU_PASSWORD@didi-sicuani-cluster.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority
   ```
   ⚠️ **Importante**: Agrega `/didi-sicuani` antes del `?` para especificar la base de datos

### 2.5 Verificar Conexión

Puedes probar la conexión desde tu máquina local:

```bash
# Instalar mongosh si no lo tienes
# Windows: choco install mongosh
# Mac: brew install mongosh

# Conectar
mongosh "mongodb+srv://didi-sicuani-user:TU_PASSWORD@didi-sicuani-cluster.xxxxx.mongodb.net/didi-sicuani"

# Dentro de mongosh:
show dbs
exit
```

**✅ Guarda tu Connection String**, la necesitarás para el backend.

---

## 3. Paso 2: Configurar Redis (Opcional)

> **Nota**: Redis es opcional. El backend funciona sin Redis, pero algunas funcionalidades de cache pueden estar limitadas.

### 3.1 Crear Cuenta en Upstash

1. Ve a: https://upstash.com/
2. Haz clic en **Sign Up** (puedes usar GitHub)
3. Completa el registro

### 3.2 Crear Base de Datos Redis

1. En el dashboard, haz clic en **Create Database**
2. Configura:
   - **Name**: `didi-sicuani-redis`
   - **Type**: Regional (más rápido) o Global (más caro)
   - **Region**: Elige la más cercana
   - **TLS**: Enabled (recomendado)
   - **Eviction**: No eviction (para desarrollo)
3. Haz clic en **Create**
4. Espera unos segundos

### 3.3 Obtener Credenciales

1. Una vez creada, haz clic en tu base de datos
2. En la pestaña **Details**, encontrarás:
   - **Endpoint**: `xxxxx.upstash.io:6379`
   - **Port**: `6379` (o el que aparezca)
   - **Password**: (haz clic en "Show" para verla)
3. **Guarda estas credenciales**

### 3.4 Probar Conexión (Opcional)

```bash
# Instalar redis-cli si no lo tienes
# Windows: choco install redis
# Mac: brew install redis

# Conectar (ajusta con tus credenciales)
redis-cli -h xxxxx.upstash.io -p 6379 -a TU_PASSWORD

# Dentro de redis-cli:
PING
# Debe responder: PONG
exit
```

**✅ Guarda tus credenciales de Redis**, las necesitarás para el backend.

---

## 4. Paso 3: Preparar el Proyecto para cPanel

### 4.1 Preparar el Backend

Antes de subir a cPanel, necesitas preparar el proyecto:

1. **Asegúrate de tener un archivo `.env.example`** en el backend:
   ```env
   MONGODB_URI=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority
   REDIS_HOST=xxxxx.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=tu_password
   JWT_SECRET=tu-secret-key-super-segura
   PORT=10000
   NODE_ENV=production
   SOCKET_CORS_ORIGIN=https://tu-dominio.com
   ```

2. **Verifica que `package.json` tenga el script `start`**:
   ```json
   {
     "scripts": {
       "start": "node server.js"
     }
   }
   ```

3. **Crea un archivo `.htaccess` para el backend** (si usas Apache):
   ```apache
   RewriteEngine On
   RewriteRule ^(.*)$ http://localhost:10000/$1 [P,L]
   ```

### 4.2 Preparar el Frontend

1. **Construye el frontend localmente**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   Esto creará la carpeta `dist` con los archivos estáticos.

2. **Verifica que el build se haya creado correctamente**:
   - Debe existir la carpeta `frontend/dist`
   - Debe contener `index.html` y los archivos estáticos

### 4.3 Comprimir Archivos (Opcional pero Recomendado)

Para facilitar la subida, puedes comprimir:

1. **Backend**: Comprime la carpeta `backend` (sin `node_modules`)
2. **Frontend**: Comprime la carpeta `frontend/dist`

**Nota**: No incluyas `node_modules` en el archivo comprimido, se instalarán en cPanel.

## 5. Paso 4: Desplegar Backend en cPanel

### 5.1 Acceder a cPanel

1. Accede a tu cPanel:
   - URL: `https://tu-dominio.com:2083` o `https://cpanel.tu-dominio.com`
   - O la URL proporcionada por tu proveedor de hosting
2. Inicia sesión con tus credenciales

### 5.2 Crear Subdominio para el Backend (Recomendado)

1. En cPanel, busca **Subdomains** o **Subdominios**
2. Crea un nuevo subdominio:
   - **Subdomain**: `api`
   - **Domain**: Tu dominio principal
   - **Document Root**: Se creará automáticamente (ej: `/home/usuario/api.tudominio.com`)
3. Haz clic en **Create**
4. **Guarda la ruta del Document Root**, la necesitarás

**Alternativa**: Si prefieres usar un subdirectorio, puedes usar `/home/usuario/public_html/api`

### 5.3 Subir Archivos del Backend

**Opción A: Usando File Manager (Recomendado para principiantes)**

1. En cPanel, busca **File Manager**
2. Navega a la carpeta del subdominio creado (ej: `api.tudominio.com`)
3. Haz clic en **Upload** en la barra superior
4. Sube todos los archivos del backend (o el archivo comprimido y extráelo)
5. **Importante**: No subas `node_modules`, se instalarán después

**Opción B: Usando FTP**

1. Usa un cliente FTP (FileZilla, WinSCP, etc.)
2. Conecta con tus credenciales FTP
3. Navega a la carpeta del subdominio
4. Sube todos los archivos del backend

**Opción C: Usando Git (Si tu hosting lo permite)**

1. En cPanel, busca **Git Version Control**
2. Crea un nuevo repositorio
3. Clona tu repositorio en la carpeta del subdominio

### 5.4 Instalar Node.js y Configurar la Aplicación

1. En cPanel, busca **Node.js Selector** o **Setup Node.js App**
2. Haz clic en **Create Application**
3. Configura:
   - **Node.js Version**: Selecciona la última versión LTS (ej: 18.x o 20.x)
   - **Application Mode**: Production
   - **Application Root**: La carpeta de tu subdominio (ej: `api.tudominio.com`)
   - **Application URL**: `api.tudominio.com` (o el subdominio que creaste)
   - **Application Startup File**: `server.js` (o el archivo principal de tu backend)
4. Haz clic en **Create**

### 5.5 Instalar Dependencias

1. En la aplicación Node.js creada, verás opciones como **Run NPM Install**
2. Haz clic en **Run NPM Install** para instalar las dependencias
3. Espera a que termine la instalación

**Alternativa**: Si no hay esta opción, puedes usar SSH:
```bash
cd ~/api.tudominio.com
npm install --production
```

### 5.6 Configurar Variables de Entorno

1. En la aplicación Node.js, busca **Environment Variables** o **Variables de Entorno**
2. Agrega las siguientes variables:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority
REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=tu_password
JWT_SECRET=tu-secret-key-super-segura-de-al-menos-32-caracteres
PORT=10000
NODE_ENV=production
SOCKET_CORS_ORIGIN=https://tu-dominio.com
```

3. **Importante**: Reemplaza `tu-dominio.com` con tu dominio real
4. Guarda los cambios

### 5.7 Iniciar la Aplicación

1. En la aplicación Node.js, busca **Restart App** o **Start Application**
2. Haz clic para iniciar la aplicación
3. Verifica que el estado sea **Running**

### 5.8 Verificar el Backend

1. Abre tu navegador y ve a: `https://api.tu-dominio.com/health`
2. Debe responder: `{"status":"OK",...}`
3. Si hay errores, revisa los logs en cPanel → **Node.js App** → **View Logs**

**✅ Guarda la URL de tu backend** (ej: `https://api.tu-dominio.com`)

---

## 6. Paso 5: Desplegar Frontend en cPanel

### 6.1 Configurar Variables de Entorno del Frontend

Antes de construir el frontend, configura las variables de entorno:

1. En tu máquina local, crea o edita `frontend/.env.production`:
   ```env
   VITE_API_URL=https://api.tu-dominio.com/api
   VITE_SOCKET_URL=https://api.tu-dominio.com
   ```

2. **Importante**: Reemplaza `tu-dominio.com` con tu dominio real

### 6.2 Construir el Frontend

1. En tu máquina local, navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias (si no lo has hecho):
   ```bash
   npm install
   ```

3. Construye el proyecto para producción:
   ```bash
   npm run build
   ```

4. Verifica que se haya creado la carpeta `dist` con todos los archivos

### 6.3 Subir Archivos del Frontend

**Opción A: Usando File Manager**

1. En cPanel, busca **File Manager**
2. Navega a `public_html` (esta es la carpeta raíz de tu dominio)
3. **Importante**: Si ya hay archivos, haz una copia de seguridad primero
4. Sube todos los archivos de la carpeta `frontend/dist`:
   - Selecciona todos los archivos de `dist`
   - Súbelos directamente a `public_html`
   - O comprime `dist` y súbelo, luego extráelo en `public_html`

**Opción B: Usando FTP**

1. Conecta con tu cliente FTP
2. Navega a `public_html`
3. Sube todos los archivos de `frontend/dist`

### 6.4 Configurar .htaccess para SPA (Single Page Application)

Como es una aplicación React (SPA), necesitas configurar el servidor para que todas las rutas apunten a `index.html`:

1. En cPanel → **File Manager** → `public_html`
2. Crea o edita el archivo `.htaccess`
3. Agrega el siguiente contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Habilitar compresión
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache para archivos estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

4. Guarda el archivo

### 6.5 Verificar el Frontend

1. Abre tu navegador y ve a: `https://tu-dominio.com`
2. Debe cargar la aplicación React
3. Abre la consola del navegador (F12) y verifica que no haya errores
4. Verifica que las peticiones al backend funcionen

### 6.6 Actualizar CORS en Backend

**Importante**: Ahora que tienes la URL del frontend, actualiza la variable de entorno en el backend:

1. En cPanel → **Node.js App** → Tu aplicación backend
2. Ve a **Environment Variables**
3. Actualiza `SOCKET_CORS_ORIGIN`:
   ```env
   SOCKET_CORS_ORIGIN=https://tu-dominio.com
   ```
4. Guarda y reinicia la aplicación Node.js

## 7. Paso 6: Configurar Dominio y Subdominios

### 7.1 Verificar Configuración DNS

Si usas un dominio externo, asegúrate de que los DNS estén configurados:

1. **Registro A**: Apunta tu dominio a la IP del servidor
2. **Registro CNAME**: Para el subdominio `api`, apunta a tu dominio principal

### 7.2 Configurar SSL/HTTPS

Es importante tener HTTPS habilitado:

1. En cPanel, busca **SSL/TLS Status** o **Let's Encrypt**
2. Selecciona tu dominio y subdominio
3. Haz clic en **Run AutoSSL** o **Install SSL Certificate**
4. Espera a que se instale el certificado (puede tardar unos minutos)

**Alternativa**: Si tu hosting tiene Let's Encrypt:
1. Busca **Let's Encrypt** en cPanel
2. Selecciona tu dominio y subdominio
3. Instala los certificados SSL

### 7.3 Forzar HTTPS (Opcional pero Recomendado)

1. En cPanel → **File Manager** → `public_html`
2. Edita el archivo `.htaccess`
3. Agrega al inicio:

```apache
# Forzar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 8. Paso 7: Configurar Variables de Entorno

### Resumen de Variables Necesarias

#### Backend (cPanel Node.js App)

Configura estas variables en **Node.js App** → **Environment Variables**:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority

# Redis (Opcional)
REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=tu_password

# JWT - Genera una clave segura
JWT_SECRET=genera-una-clave-super-segura-de-al-menos-32-caracteres-aleatorios

# Server
PORT=10000
NODE_ENV=production

# Socket.io CORS
SOCKET_CORS_ORIGIN=https://tu-dominio.com
```

#### Frontend (Archivo .env.production)

Crea `frontend/.env.production` antes de construir:

```env
VITE_API_URL=https://api.tu-dominio.com/api
VITE_SOCKET_URL=https://api.tu-dominio.com
```

**Importante**: Después de cambiar estas variables, debes reconstruir el frontend y volver a subirlo.

### Generar JWT_SECRET Seguro

```bash
# En PowerShell (Windows)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# En Bash (Linux/Mac)
openssl rand -base64 64
```

O usa un generador online: https://randomkeygen.com/

---

## 9. Paso 8: Verificar Despliegue

### 9.1 Verificar Backend

1. **Health Check**:
   ```
   https://api.tu-dominio.com/health
   ```
   Debe responder: `{"status":"OK",...}`

2. **API Documentation**:
   ```
   https://api.tu-dominio.com/api-docs
   ```
   Debe mostrar Swagger UI

3. **Probar conexión MongoDB**:
   - En cPanel → **Node.js App** → Tu aplicación → **View Logs**
   - Debe aparecer: `✅ MongoDB connected`

4. **Verificar que la aplicación esté corriendo**:
   - En cPanel → **Node.js App** → Tu aplicación
   - El estado debe ser **Running**

### 9.2 Verificar Frontend

1. Abre tu URL: `https://tu-dominio.com`
2. Debe cargar la aplicación React
3. Abre la consola del navegador (F12) y verifica que no haya errores
4. Intenta registrarte o iniciar sesión
5. Verifica que las peticiones al backend funcionen (en la pestaña Network)

### 9.3 Verificar Socket.io

1. Abre la consola del navegador (F12)
2. Debe aparecer: `✅ Socket connected: [socket-id]`
3. Si hay errores de CORS, verifica `SOCKET_CORS_ORIGIN` en el backend

### 9.4 Verificar SSL/HTTPS

1. Verifica que ambas URLs usen HTTPS:
   - Frontend: `https://tu-dominio.com`
   - Backend: `https://api.tu-dominio.com`
2. El navegador debe mostrar el candado de seguridad

### 9.5 Verificar MongoDB Atlas

1. Ve a MongoDB Atlas → **Database**
2. Haz clic en **Browse Collections**
3. Debe aparecer la base de datos `didi-sicuani`
4. Las colecciones se crearán automáticamente cuando uses la app

---

## 10. Troubleshooting

### Error: "MongoDB connection failed"

**Causa**: URI incorrecta o credenciales incorrectas

**Solución**:
1. Verifica la URI en MongoDB Atlas
2. Asegúrate de que el formato sea correcto:
   ```
   mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/didi-sicuani?retryWrites=true&w=majority
   ```
3. Verifica que el usuario tenga permisos de lectura/escritura
4. Verifica que tu IP esté en la whitelist de Network Access

### Error: "CORS policy"

**Causa**: El frontend no está en la lista de orígenes permitidos

**Solución**:
1. En cPanel → **Node.js App** → **Environment Variables**
2. Verifica `SOCKET_CORS_ORIGIN`
3. Debe ser exactamente la URL del frontend (con https://):
   ```
   SOCKET_CORS_ORIGIN=https://tu-dominio.com
   ```
4. Si tienes múltiples URLs, sepáralas por comas:
   ```
   SOCKET_CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com
   ```
5. Reinicia la aplicación después de cambiar las variables

### Error: "Node.js app not starting"

**Causa**: La aplicación Node.js no se inicia correctamente

**Solución**:
1. En cPanel → **Node.js App** → **View Logs**
2. Revisa los errores en los logs
3. Verifica que el archivo de inicio sea correcto (ej: `server.js`)
4. Verifica que todas las variables de entorno estén configuradas
5. Asegúrate de que el puerto sea el correcto (generalmente 10000 o el asignado por cPanel)
6. Reinicia la aplicación desde cPanel

### Error: "Cannot find module" o "Module not found"

**Causa**: Las dependencias no están instaladas

**Solución**:
1. En cPanel → **Node.js App** → **Run NPM Install**
2. O usa SSH:
   ```bash
   cd ~/api.tudominio.com
   npm install --production
   ```
3. Reinicia la aplicación

### Error: "Permission denied" al subir archivos

**Causa**: Permisos incorrectos en los archivos

**Solución**:
1. En cPanel → **File Manager**
2. Selecciona los archivos/carpetas
3. Haz clic en **Change Permissions**
4. Configura:
   - Archivos: `644`
   - Carpetas: `755`
   - Archivos ejecutables: `755`

### Error: "Port already in use"

**Causa**: El puerto está siendo usado por otra aplicación

**Solución**:
1. En cPanel → **Node.js App** → Edita la aplicación
2. Cambia el puerto a uno diferente
3. O detén otras aplicaciones que puedan estar usando el puerto

### Error: "Socket.io connection failed"

**Causa**: CORS o URL incorrecta

**Solución**:
1. Verifica `VITE_SOCKET_URL` en el frontend
2. Verifica `SOCKET_CORS_ORIGIN` en el backend
3. Verifica que el backend esté corriendo
4. Revisa la consola del navegador para más detalles

### Error: "Redis connection failed"

**Causa**: Credenciales incorrectas o Redis no disponible

**Solución**:
1. El backend funciona sin Redis (es opcional)
2. Si quieres usar Redis, verifica las credenciales de Upstash
3. Verifica que la base de datos esté activa en Upstash

### Error: "404 Not Found" en rutas del frontend

**Causa**: El servidor no está configurado para SPAs

**Solución**:
1. Verifica que el archivo `.htaccess` esté en `public_html`
2. Asegúrate de que contenga las reglas de rewrite para SPAs
3. Verifica que `mod_rewrite` esté habilitado en tu servidor (contacta a tu proveedor si no)

### Error: "SSL certificate error"

**Causa**: El certificado SSL no está instalado o configurado

**Solución**:
1. En cPanel → **SSL/TLS Status**
2. Verifica que el certificado esté instalado para tu dominio y subdominio
3. Ejecuta **Run AutoSSL** si está disponible
4. Espera unos minutos para que se propague

### Error: "Frontend no carga" o "Página en blanco"

**Causa**: Archivos no subidos correctamente o rutas incorrectas

**Solución**:
1. Verifica que todos los archivos de `dist` estén en `public_html`
2. Verifica que `index.html` esté en la raíz de `public_html`
3. Abre la consola del navegador (F12) y revisa los errores
4. Verifica que las rutas de los assets sean correctas (puede ser necesario reconstruir)

---

## ✅ Checklist Final

Usa este checklist para verificar que todo esté desplegado:

- [ ] Hosting con cPanel configurado y accesible
- [ ] Dominio configurado y apuntando al hosting
- [ ] Subdominio para API creado (ej: `api.tu-dominio.com`)
- [ ] MongoDB Atlas configurado y funcionando
- [ ] Redis configurado (opcional)
- [ ] Backend subido a cPanel
- [ ] Aplicación Node.js creada y configurada en cPanel
- [ ] Dependencias del backend instaladas
- [ ] Variables de entorno del backend configuradas
- [ ] Backend responde en `/health`
- [ ] Frontend construido y subido a `public_html`
- [ ] Archivo `.htaccess` configurado para SPA
- [ ] Variables de entorno del frontend configuradas (en `.env.production`)
- [ ] SSL/HTTPS configurado para dominio y subdominio
- [ ] CORS configurado correctamente
- [ ] Socket.io conecta desde el frontend
- [ ] Puedes registrarte e iniciar sesión
- [ ] Las solicitudes de viaje funcionan
- [ ] MongoDB Atlas muestra datos

---

## 📊 Costos y Consideraciones

### Costos Típicos

| Servicio | Costo Mensual | Notas |
|----------|---------------|-------|
| Hosting con cPanel | $3-15/mes | Depende del proveedor y plan |
| Dominio | $10-15/año | Si compras tu propio dominio |
| MongoDB Atlas | $0 (Free) | 512 MB gratis, suficiente para desarrollo |
| Upstash Redis | $0 (Free) | 10K comandos/día gratis |
| **TOTAL** | **$3-15/mes** | **Muy accesible para producción** |

### Ventajas de usar cPanel

- ✅ **Control total**: Tienes control completo sobre tu servidor
- ✅ **Dominio propio**: Puedes usar tu propio dominio
- ✅ **Sin límites de tiempo**: No hay "sleep" como en servicios gratuitos
- ✅ **Fácil gestión**: Interfaz gráfica intuitiva
- ✅ **Escalable**: Puedes actualizar tu plan cuando lo necesites

### Consideraciones

- ⚠️ **Costo**: Requiere un hosting con cPanel (generalmente de pago)
- ⚠️ **Mantenimiento**: Eres responsable de mantener el servidor actualizado
- ⚠️ **Recursos**: Los recursos dependen de tu plan de hosting
- ⚠️ **Backups**: Asegúrate de configurar backups regulares

---

## 🎉 ¡Despliegue Completado!

Tu aplicación DiDi-Sicuani está ahora desplegada y accesible desde cualquier lugar del mundo usando cPanel.

### URLs de tu Aplicación

- **Frontend**: `https://tu-dominio.com`
- **Backend API**: `https://api.tu-dominio.com`
- **API Docs**: `https://api.tu-dominio.com/api-docs`
- **MongoDB Atlas**: Dashboard en https://cloud.mongodb.com/

### Próximos Pasos

1. ✅ Comparte las URLs con tus usuarios
2. ✅ Configura backups regulares en cPanel
3. ✅ Monitorea los logs en cPanel → **Node.js App** → **View Logs**
4. ✅ Configura alertas en MongoDB Atlas
5. ✅ Considera configurar un sistema de monitoreo (UptimeRobot - gratis)
6. ✅ Actualiza regularmente las dependencias del proyecto
7. ✅ Configura un sistema de backups automáticos

---

## 📚 Recursos Adicionales

- **cPanel Documentation**: https://docs.cpanel.net/
- **Node.js Selector Guide**: Busca en la documentación de tu proveedor de hosting
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Upstash Docs**: https://docs.upstash.com/
- **Apache .htaccess Guide**: https://httpd.apache.org/docs/current/howto/htaccess.html
- **Let's Encrypt**: https://letsencrypt.org/

---

**¡Disfruta de tu aplicación desplegada! 🚀**



