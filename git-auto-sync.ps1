# git-auto-sync.ps1
# Script para sincronización automática del repositorio de Git en Windows
# Compara la rama local actual con su equivalente en 'origin' y realiza pull si está atrasada.

$loopInterval = 60 # Tiempo de espera entre comprobaciones en segundos

# Función para enviar notificaciones en Windows
function Show-Notification {
    param (
        [string]$Title,
        [string]$Message,
        [string]$Icon = "Information"
    )
    Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] ${Title}: $Message" -ForegroundColor Cyan
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $global:notificationIcon = New-Object System.Windows.Forms.NotifyIcon
        $global:notificationIcon.Icon = [System.Drawing.SystemIcons]::Information
        $global:notificationIcon.BalloonTipIcon = $Icon
        $global:notificationIcon.BalloonTipTitle = $Title
        $global:notificationIcon.BalloonTipText = $Message
        $global:notificationIcon.Visible = $true
        $global:notificationIcon.ShowBalloonTip(5000)
    }
    catch {
        # Fallback si no está disponible la UI (por ejemplo, en SSH o contenedor)
        Write-Host "Notificación omitida (sin entorno gráfico disponible)." -ForegroundColor DarkGray
    }
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  SITMAH - Sincronizador Automático Git  " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Escaneando cambios del repositorio cada $loopInterval segundos..." -ForegroundColor Gray
Write-Host "Puedes detener este script con Ctrl + C." -ForegroundColor Gray
Write-Host ""

# Limpieza inicial de iconos de notificación
if ($global:notificationIcon) {
    $global:notificationIcon.Dispose()
}

while ($true) {
    try {
        # 1. Obtener actualizaciones del servidor silenciosamente
        $null = git fetch origin 2>$null

        # 2. Obtener rama actual y su rama de seguimiento remota
        $currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
        $trackingBranch = git rev-parse --abbrev-ref '@{u}' 2>$null

        if (-not $trackingBranch) {
            Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] La rama actual '$currentBranch' no tiene una rama de seguimiento remota configurada." -ForegroundColor Yellow
            Start-Sleep -Seconds $loopInterval
            continue
        }

        # 3. Comprobar si hay commits nuevos en la rama remota
        $behindCount = 0
        $behindCountRaw = git rev-list --count HEAD..$trackingBranch 2>$null
        if ($behindCountRaw) {
            $behindCount = [int]$behindCountRaw
        }

        if ($behindCount -gt 0) {
            Show-Notification "SITMAH - Nuevos cambios" "Se detectaron $behindCount commits en la rama remota. Descargando cambios..."

            # Almacenar el commit HEAD anterior para saber qué archivos cambiaron
            $oldHead = git rev-parse HEAD 2>$null

            # Verificar si el espacio de trabajo local está limpio (sin cambios sin confirmar)
            $statusPorcelain = git status --porcelain 2>$null
            $isClean = [string]::IsNullOrEmpty($statusPorcelain)
            $stashed = $false

            if (-not $isClean) {
                Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Espacio de trabajo sucio. Haciendo stash temporal..." -ForegroundColor Yellow
                $null = git stash 2>&1
                $stashed = $true
            }

            # Ejecutar el pull
            Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Ejecutando git pull..." -ForegroundColor Yellow
            $pullOutput = git pull origin $currentBranch 2>&1
            Write-Host $pullOutput

            # Si hicimos stash, restaurar los cambios locales del usuario
            if ($stashed) {
                Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Restaurando tus cambios locales..." -ForegroundColor Yellow
                $null = git stash pop 2>&1
            }

            # Obtener el nuevo HEAD
            $newHead = git rev-parse HEAD 2>$null

            if ($oldHead -and $newHead -and ($oldHead -ne $newHead)) {
                # Analizar qué archivos cambiaron para correr scripts post-pull
                $changedFiles = git diff --name-only $oldHead $newHead 2>$null

                $frontendPackageChanged = $false
                $backendPackageChanged = $false
                $prismaChanged = $false

                foreach ($file in $changedFiles) {
                    if ($file -like "frontend/package.json" -or $file -like "frontend/package-lock.json") {
                        $frontendPackageChanged = $true
                    }
                    if ($file -like "backend/package.json" -or $file -like "backend/package-lock.json") {
                        $backendPackageChanged = $true
                    }
                    if ($file -like "backend/prisma/schema.prisma" -or $file -like "backend/prisma/migrations/*") {
                        $prismaChanged = $true
                    }
                }

                $summaryMessage = "Proyecto actualizado con éxito."

                # Ejecutar npm install en frontend
                if ($frontendPackageChanged) {
                    Show-Notification "SITMAH - Dependencias Frontend" "Actualizando frontend/package.json. Instalando módulos..."
                    Push-Location frontend
                    $null = npm install 2>&1
                    Pop-Location
                    $summaryMessage += " Se actualizó Frontend (npm install)."
                }

                # Ejecutar npm install en backend
                if ($backendPackageChanged) {
                    Show-Notification "SITMAH - Dependencias Backend" "Actualizando backend/package.json. Instalando módulos..."
                    Push-Location backend
                    $null = npm install 2>&1
                    Pop-Location
                    $summaryMessage += " Se actualizó Backend (npm install)."
                }

                # Ejecutar migraciones de Prisma en backend
                if ($prismaChanged) {
                    Show-Notification "SITMAH - Base de datos" "Detectados cambios en Prisma. Aplicando migraciones pendientes..."
                    Push-Location backend
                    $null = npx prisma migrate deploy 2>&1
                    Pop-Location
                    $summaryMessage += " Se aplicaron migraciones a la Base de Datos."
                }

                Show-Notification "SITMAH - ¡Proyecto Sincronizado!" $summaryMessage
            }
        }
    }
    catch {
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Error durante el escaneo: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds $loopInterval
}
