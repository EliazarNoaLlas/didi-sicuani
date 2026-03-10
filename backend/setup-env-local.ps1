# Script para configurar .env para desarrollo local
# Ejecutar: .\setup-env-local.ps1

$envFile = ".env"
$envTemplate = "env.local.txt"

Write-Host "🔧 Configurando variables de entorno para desarrollo local..." -ForegroundColor Cyan

if (-not (Test-Path $envTemplate)) {
    Write-Host "❌ Error: No se encuentra el archivo $envTemplate" -ForegroundColor Red
    exit 1
}

if (Test-Path $envFile) {
    Write-Host "⚠️  El archivo .env ya existe." -ForegroundColor Yellow
    $backup = Read-Host "¿Deseas hacer un backup antes de sobrescribirlo? (s/N)"
    if ($backup -eq "s" -or $backup -eq "S") {
        $backupFile = ".env.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $envFile $backupFile
        Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
    }
    
    $overwrite = Read-Host "¿Deseas sobrescribir el archivo .env? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "❌ Operación cancelada." -ForegroundColor Red
        exit
    }
}

Copy-Item $envTemplate $envFile
Write-Host "✅ Archivo .env creado desde $envTemplate" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Configuración aplicada:" -ForegroundColor Cyan
Write-Host "   - NODE_ENV=development" -ForegroundColor Gray
Write-Host "   - SOCKET_CORS_ORIGIN=http://localhost:5173" -ForegroundColor Gray
Write-Host "   - FRONTEND_URL=http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Ahora puedes ejecutar: npm start" -ForegroundColor Green

