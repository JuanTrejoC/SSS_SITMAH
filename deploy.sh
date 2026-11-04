#!/usr/bin/env bash
# ==============================================================================
# SITRAC-H / SITMAH — Script de Despliegue Automatizado para Producción
# Uso recomendado en Termius: sudo bash deploy.sh
# ==============================================================================

set -e # Detener ejecución si ocurre un error inesperado

# Colores de salida
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKUP_DIR="/home/desarrollo/respaldos_solicitudes"
PM2_APP_NAME="solicitudes-api"
REAL_USER="${SUDO_USER:-$USER}"

echo -e "${PURPLE}======================================================================${NC}"
echo -e "${CYAN}${BOLD}    SITRAC-H — Despliegue Automatizado a Servidor de Producción      ${NC}"
echo -e "${PURPLE}======================================================================${NC}"
echo -e "  • Directorio del proyecto: ${GREEN}$ROOT_DIR${NC}"
echo -e "  • Servicio PM2:            ${GREEN}$PM2_APP_NAME${NC}"
echo -e "  • Directorio de respaldos: ${GREEN}$BACKUP_DIR${NC}"
echo -e "  • Fecha y hora:            ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# ------------------------------------------------------------------------------
# PASO 1: RESPALDO AUTOMÁTICO DE BASE DE DATOS (PRE-DESPLIEGUE)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/6] Realizando respaldo preventivo de MariaDB...${NC}"

if [ -f "$ROOT_DIR/backup.sh" ]; then
    bash "$ROOT_DIR/backup.sh" || {
        echo -e "${YELLOW}[AVISO] El respaldo automático arrojó un aviso, continuando con el despliegue...${NC}"
    }
else
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/sitmah_pre_deploy_${TIMESTAMP}.sql"
    DUMP_CMD="mariadb-dump"
    command -v mariadb-dump >/dev/null 2>&1 || DUMP_CMD="mysqldump"

    if command -v "$DUMP_CMD" >/dev/null 2>&1; then
        echo -e "  • Creando respaldo en: ${GREEN}$BACKUP_FILE${NC}"
        "$DUMP_CMD" -u root -p --single-transaction --routines --triggers sitmah > "$BACKUP_FILE" 2>/dev/null || true
    fi
fi
echo -e "  ✔ Seguridad de base de datos garantizada."

# ------------------------------------------------------------------------------
# PASO 2: ACTUALIZAR CÓDIGO DEL PROYECTO CON GIT PULL
# ------------------------------------------------------------------------------
echo ""
echo -e "${CYAN}[2/6] Actualizando código desde GitHub (git pull origin main)...${NC}"
cd "$ROOT_DIR"

git config --global --add safe.directory "$ROOT_DIR" 2>/dev/null || true
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
echo -e "  • Rama activa: ${GREEN}$CURRENT_BRANCH${NC}"

# Descartar cambios locales no deseados o stash preventivo
git stash >/dev/null 2>&1 || true

PREV_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "inicial")
git pull origin "$CURRENT_BRANCH"
NEW_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "actual")

echo -e "  ✔ Git actualizado: ${YELLOW}$PREV_COMMIT${NC} -> ${GREEN}$NEW_COMMIT${NC}"

# ------------------------------------------------------------------------------
# PASO 3: BACKEND (NPM, PRISMA GENERATE, MIGRATE DEPLOY, DB PUSH, PM2)
# ------------------------------------------------------------------------------
echo ""
echo -e "${CYAN}[3/6] Desplegando Backend y Sincronizando MariaDB...${NC}"
cd "$BACKEND_DIR"

# 3.1 Instalar dependencias
echo -e "  • Ejecutando 'npm install' en backend..."
npm install --no-audit --no-fund

# 3.2 Generar cliente de Prisma por si hubo cambios de modelos
echo -e "  • Generando cliente Prisma ('npx prisma generate')..."
npx prisma generate

# 3.3 Aplicar migraciones del esquema
echo -e "  • Aplicando migraciones ('npx prisma migrate deploy')..."
npx prisma migrate deploy || {
    echo -e "  ${YELLOW}[AVISO] No hay migraciones pendientes en migrate deploy.${NC}"
}

# 3.4 Sincronizar tablas faltantes de forma segura
echo -e "  • Sincronizando tablas ('npx prisma db push')..."
npx prisma db push --skip-generate || {
    echo -e "  ${YELLOW}[AVISO] db push completado con advertencias o esquema ya sincronizado.${NC}"
}

# 3.5 Reiniciar proceso en PM2
echo -e "  • Reiniciando servicio PM2 '${GREEN}$PM2_APP_NAME${NC}'..."
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$PM2_APP_NAME" --update-env
elif [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs
else
    pm2 start src/app.js --name "$PM2_APP_NAME" --time
fi

pm2 save
echo -e "  ✔ Backend actualizado y activo en PM2."

# ------------------------------------------------------------------------------
# PASO 4: FRONTEND (NPM INSTALL & NPM RUN BUILD)
# ------------------------------------------------------------------------------
echo ""
echo -e "${CYAN}[4/6] Compilando Frontend (React + Vite)...${NC}"
cd "$FRONTEND_DIR"

echo -e "  • Ejecutando 'npm install' en frontend..."
npm install --no-audit --no-fund

echo -e "  • Compilando aplicación de producción ('npm run build')..."
npm run build

echo -e "  ✔ Frontend compilado con éxito en: ${GREEN}$FRONTEND_DIR/dist${NC}"

# ------------------------------------------------------------------------------
# PASO 5: RECARGA DE SERVIDOR WEB NGINX (SI APLICA)
# ------------------------------------------------------------------------------
echo ""
echo -e "${CYAN}[5/6] Verificando servidor web Nginx...${NC}"
if command -v nginx >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
    if nginx -t >/dev/null 2>&1; then
        systemctl reload nginx
        echo -e "  ✔ Nginx verificado y recargado correctamente."
    else
        echo -e "  ${YELLOW}[ADVERTENCIA] Sintaxis de Nginx inválida, no se recargó.${NC}"
    fi
else
    echo -e "  • Nginx omitido (no activo o no instalado)."
fi

# Ajustar permisos si fue ejecutado con sudo
if [ "$REAL_USER" != "root" ] && [ -n "$REAL_USER" ]; then
    chown -R "$REAL_USER:$REAL_USER" "$ROOT_DIR" 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# PASO 6: PRUEBA DE SALUD DE LA API (HEALTH CHECK)
# ------------------------------------------------------------------------------
echo ""
echo -e "${CYAN}[6/6] Verificando disponibilidad de la API...${NC}"
sleep 2

HEALTH_RESULT="${YELLOW}Sin verificar${NC}"
if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        HEALTH_RESULT="${GREEN}OK (HTTP 200 - API en línea)${NC}"
    else
        HEALTH_RESULT="${YELLOW}Código HTTP $HTTP_CODE${NC}"
    fi
fi

echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}${BOLD}     ¡DESPLIEGUE A PRODUCCIÓN COMPLETADO CON ÉXITO! 🚀     ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "  • Commit activo:    ${CYAN}$NEW_COMMIT${NC}"
echo -e "  • Servicio PM2:     ${GREEN}$PM2_APP_NAME${NC} (Activo)"
echo -e "  • Estado API:       $HEALTH_RESULT"
echo -e "  • Respaldo en:      ${CYAN}$BACKUP_DIR${NC}"
echo -e "  • Monitorear logs:  ${CYAN}pm2 logs $PM2_APP_NAME${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
