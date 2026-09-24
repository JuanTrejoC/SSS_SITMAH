@echo off
setlocal EnableDelayedExpansion

title SITMAH - Sistema de Gestion

echo ========================================
echo        Iniciando Sistema SITMAH
echo ========================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

rem Verificar que Node.js este instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    pause
    exit /b 1
)

rem Verificar que npm este instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta instalado o no se encuentra en el PATH.
    pause
    exit /b 1
)

rem Verificar y copiar archivos .env si no existen
if not exist "%BACKEND_DIR%\.env" (
    if exist "%BACKEND_DIR%\.env.example" (
        echo [BACKEND] Creando .env desde .env.example...
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
    )
)

if not exist "%FRONTEND_DIR%\.env" (
    if exist "%FRONTEND_DIR%\.env.example" (
        echo [FRONTEND] Creando .env desde .env.example...
        copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
    )
)

rem Instalar dependencias si faltan
if not exist "%BACKEND_DIR%\node_modules" (
    echo [BACKEND] Instalando dependencias necesarias...
    pushd "%BACKEND_DIR%"
    call npm install
    popd
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [FRONTEND] Instalando dependencias necesarias...
    pushd "%FRONTEND_DIR%"
    call npm install
    popd
)

rem Iniciar Backend en ventana independiente
echo [BACKEND]  Iniciando API en http://localhost:3000...
start "SITMAH - Backend" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

rem Iniciar Frontend en ventana independiente
echo [FRONTEND] Iniciando Vite en http://localhost:5173...
start "SITMAH - Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo ========================================
echo  Servidores iniciados en ventanas separadas.
echo  - Backend:  http://localhost:3000
echo  - Frontend: http://localhost:5173
echo ========================================
echo Puedes cerrar esta ventana o presionar una tecla para salir.
pause >nul
