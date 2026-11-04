#!/usr/bin/env bash
# ==============================================================================
# SITRAC-H / SITMAH — Script de Respaldo Automatizado de Base de Datos
# Uso: sudo bash backup.sh
# ==============================================================================

set -e

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
BACKUP_DIR="/home/desarrollo/respaldos_solicitudes"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sitmah_backup_${TIMESTAMP}.sql"

echo -e "${CYAN}======================================================================${NC}"
echo -e "${GREEN}${BOLD}     Iniciando Respaldo de Base de Datos SITRAC-H / MariaDB          ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# 1. Asegurar que existe el directorio de respaldos
mkdir -p "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR" 2>/dev/null || true

# 2. Detectar comando de volcado (mariadb-dump o mysqldump)
DUMP_CMD=""
if command -v mariadb-dump >/dev/null 2>&1; then
    DUMP_CMD="mariadb-dump"
elif command -v mysqldump >/dev/null 2>&1; then
    DUMP_CMD="mysqldump"
else
    echo -e "${RED}[ERROR] No se encontró 'mariadb-dump' ni 'mysqldump' en el servidor.${NC}"
    exit 1
fi
echo -e "  • Herramienta de volcado: ${GREEN}$DUMP_CMD${NC}"

# 3. Extraer credenciales desde backend/.env si existe
DB_USER="root"
DB_PASS=""
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="sitmah"

if [ -f "$BACKEND_DIR/.env" ]; then
    DB_URL=$(grep -E '^DATABASE_URL=' "$BACKEND_DIR/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$DB_URL" ]; then
        # Formato: mysql://usuario:password@host:puerto/nombre_bd
        PROTO_REMOVED="${DB_URL#*://}"
        USER_PASS="${PROTO_REMOVED%%@*}"
        HOST_PORT_DB="${PROTO_REMOVED#*@}"

        DB_USER="${USER_PASS%%:*}"
        DB_PASS="${USER_PASS#*:}"

        HOST_PORT="${HOST_PORT_DB%%/*}"
        DB_NAME_RAW="${HOST_PORT_DB#*/}"
        DB_NAME="${DB_NAME_RAW%%\?*}"

        DB_HOST="${HOST_PORT%%:*}"
        DB_PORT="${HOST_PORT#*:}"
        [ "$DB_PORT" = "$HOST_PORT" ] && DB_PORT="3306"
    fi
fi

echo -e "  • Base de datos:          ${GREEN}$DB_NAME${NC}"
echo -e "  • Usuario de BD:          ${GREEN}$DB_USER${NC}"
echo -e "  • Destino:                ${GREEN}$BACKUP_FILE${NC}"
echo -e "  • Ejecutando volcado seguro con single-transaction, routines y triggers..."

# 4. Ejecutar el respaldo
if [ -n "$DB_PASS" ]; then
    "$DUMP_CMD" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
        --single-transaction --routines --triggers "$DB_NAME" > "$BACKUP_FILE"
else
    echo -e "${YELLOW}  Introduce la contraseña de MariaDB para el usuario '$DB_USER':${NC}"
    "$DUMP_CMD" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p \
        --single-transaction --routines --triggers "$DB_NAME" > "$BACKUP_FILE"
fi

# 5. Verificar que el archivo se haya generado correctamente
if [ -s "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}  ✔ Respaldo creado exitosamente (${FILE_SIZE}).${NC}"
else
    echo -e "${RED}[ERROR] El archivo de respaldo está vacío o falló la creación.${NC}"
    exit 1
fi

# 6. Limpieza automática de respaldos con más de 30 días
echo -e "  • Purgando respaldos antiguos (> 30 días)..."
find "$BACKUP_DIR" -type f -name "sitmah_*.sql*" -mtime +30 -exec rm -f {} \; 2>/dev/null || true

echo -e "${CYAN}======================================================================${NC}"
echo -e "${GREEN}${BOLD}     ¡Respaldo completado en: $BACKUP_FILE ! 💾     ${NC}"
echo -e "${CYAN}======================================================================${NC}"
