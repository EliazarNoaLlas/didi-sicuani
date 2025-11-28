# ⚡ Referencia Rápida: Comandos MongoDB y MongoDB Compass

Guía rápida de comandos esenciales para trabajar con MongoDB en el proyecto DiDi-Sicuani.

---

## 🚀 Comandos Rápidos

### Verificar Estado de MongoDB

```powershell
# Verificar si MongoDB está corriendo
Get-Service -Name MongoDB

# Iniciar MongoDB si está detenido
Start-Service -Name MongoDB

# Detener MongoDB
Stop-Service -Name MongoDB

# Reiniciar MongoDB
Restart-Service -Name MongoDB
```

### Conexión con mongosh (MongoDB Shell)

```powershell
# Conectar a MongoDB
mongosh

# Dentro de mongosh:
show dbs                    # Listar bases de datos
use didi-sicuani           # Usar base de datos
show collections           # Listar colecciones
db.users.find()            # Ver documentos en colección users
db.users.countDocuments()  # Contar documentos
exit                       # Salir de mongosh
```

### Verificar Puerto de MongoDB

```powershell
# Verificar que el puerto 27017 está en uso
netstat -ano | findstr :27017

# Ver todos los puertos en uso
netstat -ano | findstr LISTENING
```

### Verificar Conexión desde Backend

```powershell
# Navegar al backend
cd backend

# Ejecutar test básico
node test-mongodb.js

# Ejecutar verificación completa
node verify-mongodb-setup.js

# Iniciar servidor
npm run dev
```

### Verificar Archivo .env

```powershell
# Verificar que existe
Test-Path backend\.env

# Ver contenido (sin mostrar contraseñas)
Get-Content backend\.env | Select-String "MONGODB_URI"

# Crear archivo .env si no existe
New-Item -Path backend\.env -ItemType File
```

### MongoDB Compass - Connection Strings

```
# Conexión local sin autenticación
mongodb://localhost:27017

# Conexión local con base de datos específica
mongodb://localhost:27017/didi-sicuani

# Conexión con autenticación
mongodb://usuario:password@localhost:27017/didi-sicuani?authSource=admin
```

---

## 📝 Configuración .env

**Para desarrollo local (sin autenticación):**
```env
MONGODB_URI=mongodb://localhost:27017/didi-sicuani
```

**Con autenticación:**
```env
MONGODB_URI=mongodb://usuario:password@localhost:27017/didi-sicuani?authSource=admin
```

**MongoDB Atlas (cloud):**
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/didi-sicuani?retryWrites=true&w=majority
```

---

## 🔧 Troubleshooting Rápido

### MongoDB no está corriendo

```powershell
Start-Service -Name MongoDB
Get-Service -Name MongoDB
```

### Error de conexión

```powershell
# 1. Verificar que MongoDB está corriendo
Get-Service -Name MongoDB

# 2. Probar conexión con mongosh
mongosh

# 3. Verificar .env
Get-Content backend\.env | Select-String "MONGODB_URI"

# 4. Verificar logs
Get-EventLog -LogName Application -Source MongoDB -Newest 10
```

### Puerto ocupado

```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr :27017

# Terminar proceso (usar PID de la salida anterior)
taskkill /PID <PID> /F
```

---

## 📚 Scripts Disponibles

### Test de Conexión Básico
```powershell
node backend/test-mongodb.js
```

### Verificación Completa
```powershell
node backend/verify-mongodb-setup.js
```

### Iniciar Servidor Backend
```powershell
cd backend
npm run dev
```

---

## 🎯 Checklist Rápido

- [ ] MongoDB instalado y corriendo: `Get-Service -Name MongoDB`
- [ ] Conexión con mongosh funciona: `mongosh`
- [ ] MongoDB Compass instalado y se conecta: `mongodb://localhost:27017`
- [ ] Archivo `.env` configurado: `MONGODB_URI=mongodb://localhost:27017/didi-sicuani`
- [ ] Test de conexión exitoso: `node backend/test-mongodb.js`
- [ ] Servidor backend inicia: `cd backend && npm run dev`

---

## 📖 Documentación Completa

Para la guía detallada completa, consulta:
- **GUIA_INSTALACION_MONGODB_COMPASS.md** - Guía completa paso a paso

---

## 🔗 Enlaces Útiles

- MongoDB Compass: https://www.mongodb.com/try/download/compass
- MongoDB Shell (mongosh): https://www.mongodb.com/docs/mongodb-shell/
- Documentación MongoDB: https://docs.mongodb.com/
- Mongoose (ODM de Node.js): https://mongoosejs.com/docs/

---

**Última actualización:** Generado automáticamente







