#!/usr/bin/env bash

# Directorio raíz del proyecto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Colores para la terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}       Iniciando Sistema SITMAH         ${NC}"
echo -e "${CYAN}========================================${NC}"

# Función para detener ambos servidores al salir (Ctrl+C)
cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo -e "\n${YELLOW}Deteniendo servidores...${NC}"
    kill $(jobs -p) 2>/dev/null
    wait 2>/dev/null
    echo -e "${GREEN}Servidores detenidos correctamente.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Verificar Node.js y npm
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js no está instalado o no se encuentra en el PATH.${NC}"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] npm no está instalado o no se encuentra en el PATH.${NC}"
    exit 1
fi

# Verificar archivos de entorno (.env)
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
    echo -e "${YELLOW}[BACKEND] Creando .env desde .env.example...${NC}"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

if [ ! -f "$FRONTEND_DIR/.env" ] && [ -f "$FRONTEND_DIR/.env.example" ]; then
    echo -e "${YELLOW}[FRONTEND] Creando .env desde .env.example...${NC}"
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
fi

# Verificar si MySQL / MariaDB responde en el puerto 3306
if ! (echo > /dev/tcp/localhost/3306) 2>/dev/null; then
    if [ -x "$HOME/.local/mariadb/run_mariadb.sh" ]; then
        echo -e "${YELLOW}[DATABASE] Iniciando servicio MariaDB local...${NC}"
        nohup "$HOME/.local/mariadb/run_mariadb.sh" > /dev/null 2>&1 &
        for i in {1..10}; do
            if (echo > /dev/tcp/localhost/3306) 2>/dev/null; then
                echo -e "${GREEN}[DATABASE] MariaDB iniciado correctamente.${NC}"
                break
            fi
            sleep 1
        done
    fi
fi

if ! (echo > /dev/tcp/localhost/3306) 2>/dev/null; then
    echo -e "${YELLOW}[AVISO] No se detecta conexión a MySQL en localhost:3306.${NC}"
    echo -e "${YELLOW}        Asegúrate de que el servicio de MySQL/MariaDB esté iniciado.${NC}"
fi

# Verificar dependencias básicas
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}[BACKEND] Instalando dependencias necesarias...${NC}"
    (cd "$BACKEND_DIR" && npm install)
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}[FRONTEND] Instalando dependencias necesarias...${NC}"
    (cd "$FRONTEND_DIR" && npm install)
fi

# Iniciar Backend
echo -e "${GREEN}[BACKEND]  Iniciando API en http://localhost:3000...${NC}"
(cd "$BACKEND_DIR" && npm run dev) &

# Iniciar Frontend
echo -e "${GREEN}[FRONTEND] Iniciando Vite en http://localhost:5173...${NC}"
(cd "$FRONTEND_DIR" && npm run dev) &

# Esperar a que los procesos se mantengan en ejecución
wait
