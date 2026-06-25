# SITMAH - Backend API

API REST para gestión de reportes de oficina y semáforos.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- [MySQL](https://www.mysql.com/) o MariaDB

## Instalación paso a paso

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar base de datos

Crea la base de datos en MySQL:

```sql
CREATE DATABASE sitmah CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copia el archivo de entorno y edita tus credenciales:

```bash
copy .env.example .env
```

En `.env`, ajusta `DATABASE_URL` con tu usuario y contraseña de MySQL:

```
DATABASE_URL="mysql://USUARIO:PASSWORD@localhost:3306/sitmah"
```

> **Nota:** Si la migración falla con "Authentication failed", verifica que MySQL esté corriendo y que usuario/contraseña sean correctos en `.env`.

### 3. Crear tablas y datos de prueba

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Iniciar el servidor

```bash
npm run dev
```

Abre en el navegador: `http://localhost:3000/api/health`

Deberías ver:

```json
{ "ok": true, "data": { "message": "SITMAH API funcionando" } }
```

### 5. Ver la base de datos (opcional)

```bash
npm run db:studio
```

## Usuario de prueba

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `admin123` |

## Probar con Postman / Thunder Client

### Login

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Guarda el `token` de la respuesta. En las rutas admin usa el header:

```
Authorization: Bearer TU_TOKEN_AQUI
```

### Catálogos públicos (sin token)

```
GET http://localhost:3000/api/catalogos/areas
GET http://localhost:3000/api/catalogos/sedes
GET http://localhost:3000/api/catalogos/categorias
GET http://localhost:3000/api/catalogos/estaciones
GET http://localhost:3000/api/catalogos/cruceros
GET http://localhost:3000/api/catalogos/tipos-falla
```

### Crear reporte de oficina (sin token)

```
POST http://localhost:3000/api/reportes/oficina
Content-Type: multipart/form-data

solicitante: María López
area_id: 1
cargo: Secretaria
email: maria@ejemplo.gob.mx
telefono: 5551234567
sede_id: 1
equipo: PC-CCO-02
categoria_id: 1
prioridad: media
descripcion: Necesito Office instalado
evidencia: (archivo imagen opcional)
```

### Crear reporte de semáforo (sin token)

```
POST http://localhost:3000/api/reportes/semaforo
Content-Type: multipart/form-data

jefe_turno: Juan Pérez
estacion_id: 1
crucero_id: 1
tipo_falla_id: 1
hora_dano: 2026-06-10T14:30:00
descripcion: Semáforo apagado en crucero principal
evidencia: (archivo imagen opcional)
```

### Dashboard admin - resumen oficinas

```
GET http://localhost:3000/api/admin/reportes/oficina/resumen
Authorization: Bearer TOKEN
```

### Listar reportes con filtros

```
GET http://localhost:3000/api/admin/reportes/oficina?estado=abierto&prioridad=alta&mes=6&anio=2026&keyword=office
Authorization: Bearer TOKEN
```

### Cambiar estado de un reporte

```
PATCH http://localhost:3000/api/admin/reportes/oficina/1/estado
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "estado": "en_proceso",
  "comentario": "Se asignó técnico"
}
```

Estados válidos: `abierto`, `en_proceso`, `resuelto`

### Exportar Excel

```
GET http://localhost:3000/api/admin/reportes/oficina/export?estado=resuelto&anio=2026
Authorization: Bearer TOKEN
```

### Estadísticas

```
GET http://localhost:3000/api/admin/estadisticas
Authorization: Bearer TOKEN
```

## Endpoints completos

### Públicos

| Método | Ruta |
|--------|------|
| GET | `/api/health` |
| GET | `/api/catalogos/:tipo` |
| POST | `/api/reportes/oficina` |
| POST | `/api/reportes/semaforo` |

Tipos de catálogo: `areas`, `sedes`, `categorias`, `estaciones`, `cruceros`, `tipos-falla`

### Auth

| Método | Ruta |
|--------|------|
| POST | `/api/auth/login` |

### Admin (requieren token)

| Método | Ruta |
|--------|------|
| GET/POST/PUT/DELETE | `/api/admin/catalogos/:tipo` |
| GET/POST/PUT/DELETE | `/api/admin/correos` |
| GET/POST/PUT/DELETE | `/api/admin/usuarios` |
| GET | `/api/admin/reportes/oficina/resumen` |
| GET | `/api/admin/reportes/oficina/export` |
| GET | `/api/admin/reportes/oficina` |
| GET | `/api/admin/reportes/oficina/:id` |
| PATCH | `/api/admin/reportes/oficina/:id/estado` |
| DELETE | `/api/admin/reportes/oficina/:id` |
| GET | `/api/admin/reportes/semaforo/resumen` |
| GET | `/api/admin/reportes/semaforo/export` |
| GET | `/api/admin/reportes/semaforo` |
| GET | `/api/admin/reportes/semaforo/:id` |
| PATCH | `/api/admin/reportes/semaforo/:id/estado` |
| DELETE | `/api/admin/reportes/semaforo/:id` |
| GET | `/api/admin/estadisticas` |
| GET | `/api/evidencias/:id` |

## Formato de respuestas

Éxito:

```json
{ "ok": true, "data": { ... } }
```

Error:

```json
{ "ok": false, "error": "Mensaje descriptivo" }
```

## Correos en desarrollo

Sin configurar SMTP, el sistema usa **Ethereal Email** (correo de prueba). Al crear un reporte, revisa la consola del servidor: aparecerá un link para ver el correo en el navegador.

## Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma    # Modelo de base de datos
│   └── seed.js          # Datos iniciales
├── src/
│   ├── app.js           # Punto de entrada
│   ├── config/          # Conexión a BD
│   ├── controllers/     # Lógica de cada ruta
│   ├── middleware/      # Auth, upload, errores
│   ├── routes/          # Definición de rutas
│   ├── services/        # Correo, Excel, folios, stats
│   └── utils/           # Helpers
└── uploads/             # Imágenes subidas
```

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con recarga automática |
| `npm start` | Servidor en producción |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Insertar datos de prueba |
| `npm run db:studio` | Ver BD en navegador |
