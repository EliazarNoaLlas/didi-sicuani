# Guía de Despliegue en Vercel - Frontend

## Opción 1: Usar el Script Automático (Recomendado)

```powershell
cd frontend
.\deploy-vercel.ps1
```

## Opción 2: Comandos Manuales

### 1. Instalar Vercel CLI (si no está instalado)
```powershell
npm install -g vercel
```

### 2. Navegar a la carpeta frontend
```powershell
cd frontend
```

### 3. Autenticarse en Vercel (solo la primera vez)
```powershell
vercel login
```

### 4. Construir el proyecto
```powershell
npm run build
```

### 5. Desplegar en producción
```powershell
vercel --prod
```

O para desplegar en preview (testing):
```powershell
vercel
```

## Configuración de Variables de Entorno

Si necesitas configurar variables de entorno en Vercel:

```powershell
# Configurar variable de entorno
vercel env add VITE_API_URL production
vercel env add VITE_SOCKET_URL production

# O desde el dashboard de Vercel:
# https://vercel.com/[tu-proyecto]/settings/environment-variables
```

## Comandos Útiles

- `vercel` - Desplegar en preview
- `vercel --prod` - Desplegar en producción
- `vercel ls` - Listar todos los despliegues
- `vercel inspect [url]` - Inspeccionar un despliegue
- `vercel logs [url]` - Ver logs de un despliegue
- `vercel remove` - Eliminar el proyecto de Vercel

## Notas

- El archivo `vercel.json` ya está configurado para tu proyecto
- El build se genera en la carpeta `dist/`
- Las rutas SPA están configuradas con rewrites para React Router

