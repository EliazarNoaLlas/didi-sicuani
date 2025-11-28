# Script para desplegar el frontend en Vercel desde la línea de comandos
# Uso: .\deploy-vercel.ps1

Write-Host "🚀 Iniciando despliegue del frontend en Vercel..." -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Asegúrate de estar en la carpeta frontend." -ForegroundColor Red
    exit 1
}

# Verificar que Vercel CLI está disponible
Write-Host "📋 Verificando Vercel CLI..." -ForegroundColor Cyan
$vercelVersion = npx vercel --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Vercel CLI disponible: $vercelVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Error al verificar Vercel CLI." -ForegroundColor Red
    exit 1
}

# Verificar si el usuario está logueado
Write-Host "`n📋 Verificando autenticación..." -ForegroundColor Cyan
$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No estás autenticado. Iniciando login..." -ForegroundColor Yellow
    npx vercel login
} else {
    Write-Host "✅ Autenticado como: $whoami" -ForegroundColor Green
}

# Construir el proyecto
Write-Host "`n🔨 Construyendo el proyecto..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir el proyecto." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Proyecto construido correctamente." -ForegroundColor Green

# Desplegar en Vercel
Write-Host "`n🌐 Desplegando en Vercel..." -ForegroundColor Cyan
Write-Host "💡 Presiona Enter para usar la configuración por defecto en cada pregunta." -ForegroundColor Yellow
npx vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Despliegue completado exitosamente!" -ForegroundColor Green
    Write-Host "💡 Tu aplicación está disponible en la URL que se mostró arriba." -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Error durante el despliegue." -ForegroundColor Red
    exit 1
}

