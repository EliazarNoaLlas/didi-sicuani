# Script para configurar variables de entorno en Vercel
# Uso: .\configurar-env-vercel.ps1

Write-Host "🔧 Configurando variables de entorno en Vercel..." -ForegroundColor Cyan

$API_URL = "https://didi-sicuani.onrender.com/api"
$SOCKET_URL = "https://didi-sicuani.onrender.com"

Write-Host "`n📋 Variables a configurar:" -ForegroundColor Yellow
Write-Host "  VITE_API_URL = $API_URL" -ForegroundColor Green
Write-Host "  VITE_SOCKET_URL = $SOCKET_URL" -ForegroundColor Green

Write-Host "`n⚠️  NOTA: Este script requiere entrada manual." -ForegroundColor Yellow
Write-Host "   Cuando se te pida el valor, copia y pega la URL correspondiente." -ForegroundColor Yellow
Write-Host "   Cuando se te pregunte si es sensible, presiona 'N' (No)." -ForegroundColor Yellow

Write-Host "`n1️⃣ Configurando VITE_API_URL para Production..." -ForegroundColor Cyan
Write-Host "   Valor a ingresar: $API_URL" -ForegroundColor Gray
npx vercel env add VITE_API_URL production

Write-Host "`n2️⃣ Configurando VITE_API_URL para Preview..." -ForegroundColor Cyan
Write-Host "   Valor a ingresar: $API_URL" -ForegroundColor Gray
npx vercel env add VITE_API_URL preview

Write-Host "`n3️⃣ Configurando VITE_API_URL para Development..." -ForegroundColor Cyan
Write-Host "   Valor a ingresar: $API_URL" -ForegroundColor Gray
npx vercel env add VITE_API_URL development

Write-Host "`n4️⃣ Configurando VITE_SOCKET_URL para Production..." -ForegroundColor Cyan
Write-Host "   Valor a ingresar: $SOCKET_URL" -ForegroundColor Gray
npx vercel env add VITE_SOCKET_URL production

Write-Host "`n5️⃣ Configurando VITE_SOCKET_URL para Preview..." -ForegroundColor Cyan
Write-Host "   Valor a ingresar: $SOCKET_URL" -ForegroundColor Gray
npx vercel env add VITE_SOCKET_URL preview

Write-Host "`n6️⃣ Configurando VITE_SOCKET_URL para Development..." -ForegroundColor Cyan
Write-Host "   Valor a ingresar: $SOCKET_URL" -ForegroundColor Gray
npx vercel env add VITE_SOCKET_URL development

Write-Host "`n✅ Variables de entorno configuradas!" -ForegroundColor Green
Write-Host "`n🔄 Ahora necesitas redesplegar el proyecto:" -ForegroundColor Yellow
Write-Host "   npx vercel --prod" -ForegroundColor Cyan

