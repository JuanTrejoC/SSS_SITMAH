-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `rol` ENUM('admin') NOT NULL DEFAULT 'admin',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuario_username_key`(`username`),
    UNIQUE INDEX `usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `area` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sede` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crucero` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_falla` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `correo_notificacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_oficina` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `folio` VARCHAR(30) NULL,
    `solicitante` VARCHAR(100) NOT NULL,
    `area_id` INTEGER NOT NULL,
    `cargo` VARCHAR(100) NULL,
    `email` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `sede_id` INTEGER NOT NULL,
    `equipo` VARCHAR(100) NULL,
    `categoria_id` INTEGER NOT NULL,
    `prioridad` ENUM('baja', 'media', 'alta') NOT NULL,
    `descripcion` TEXT NULL,
    `estado` ENUM('abierto', 'en_proceso', 'resuelto') NOT NULL DEFAULT 'abierto',
    `atendido_por` INTEGER NULL,
    `fecha_resolucion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reporte_oficina_folio_key`(`folio`),
    INDEX `reporte_oficina_estado_idx`(`estado`),
    INDEX `reporte_oficina_sede_id_idx`(`sede_id`),
    INDEX `reporte_oficina_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_semaforo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `folio` VARCHAR(30) NULL,
    `jefe_turno` VARCHAR(100) NOT NULL,
    `estacion_id` INTEGER NOT NULL,
    `crucero_id` INTEGER NOT NULL,
    `tipo_falla_id` INTEGER NOT NULL,
    `descripcion` TEXT NULL,
    `hora_dano` DATETIME(3) NOT NULL,
    `prioridad` ENUM('alta') NOT NULL DEFAULT 'alta',
    `estado` ENUM('abierto', 'en_proceso', 'resuelto') NOT NULL DEFAULT 'abierto',
    `atendido_por` INTEGER NULL,
    `fecha_resolucion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reporte_semaforo_folio_key`(`folio`),
    INDEX `reporte_semaforo_estado_idx`(`estado`),
    INDEX `reporte_semaforo_crucero_id_idx`(`crucero_id`),
    INDEX `reporte_semaforo_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evidencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_oficina_id` INTEGER NULL,
    `reporte_semaforo_id` INTEGER NULL,
    `filename` VARCHAR(255) NOT NULL,
    `filepath` VARCHAR(500) NOT NULL,
    `mimetype` VARCHAR(100) NULL,
    `size_bytes` INTEGER NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_reporte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `tipo_reporte` ENUM('oficina', 'semaforo') NOT NULL,
    `reporte_id` INTEGER NOT NULL,
    `estado_anterior` VARCHAR(30) NULL,
    `estado_nuevo` VARCHAR(30) NULL,
    `comentario` TEXT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historial_reporte_reporte_id_tipo_reporte_idx`(`reporte_id`, `tipo_reporte`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comentario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `tipo_reporte` ENUM('oficina', 'semaforo') NOT NULL,
    `reporte_id` INTEGER NOT NULL,
    `comentario` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reporte_oficina` ADD CONSTRAINT `reporte_oficina_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_oficina` ADD CONSTRAINT `reporte_oficina_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sede`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_oficina` ADD CONSTRAINT `reporte_oficina_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `categoria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_oficina` ADD CONSTRAINT `reporte_oficina_atendido_por_fkey` FOREIGN KEY (`atendido_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_semaforo` ADD CONSTRAINT `reporte_semaforo_estacion_id_fkey` FOREIGN KEY (`estacion_id`) REFERENCES `estacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_semaforo` ADD CONSTRAINT `reporte_semaforo_crucero_id_fkey` FOREIGN KEY (`crucero_id`) REFERENCES `crucero`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_semaforo` ADD CONSTRAINT `reporte_semaforo_tipo_falla_id_fkey` FOREIGN KEY (`tipo_falla_id`) REFERENCES `tipo_falla`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_semaforo` ADD CONSTRAINT `reporte_semaforo_atendido_por_fkey` FOREIGN KEY (`atendido_por`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidencia` ADD CONSTRAINT `evidencia_reporte_oficina_id_fkey` FOREIGN KEY (`reporte_oficina_id`) REFERENCES `reporte_oficina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidencia` ADD CONSTRAINT `evidencia_reporte_semaforo_id_fkey` FOREIGN KEY (`reporte_semaforo_id`) REFERENCES `reporte_semaforo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_reporte` ADD CONSTRAINT `historial_reporte_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comentario` ADD CONSTRAINT `comentario_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
