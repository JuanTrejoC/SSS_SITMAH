-- AlterTable
ALTER TABLE `controlador_semaforo` ADD COLUMN `archivo_programacion` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `equipo_tecnologico` ADD COLUMN `direccion` VARCHAR(150) NULL,
    ADD COLUMN `estatus` VARCHAR(50) NULL DEFAULT 'Activo',
    ADD COLUMN `procedencia` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `reporte_oficina` ADD COLUMN `numero_serie` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `subdireccion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventario_mobiliario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_inventario` VARCHAR(100) NOT NULL,
    `bien` VARCHAR(100) NOT NULL,
    `marca` VARCHAR(100) NULL,
    `modelo` VARCHAR(100) NULL,
    `numero_serie` VARCHAR(100) NULL,
    `descripcion` TEXT NOT NULL,
    `direccion` VARCHAR(150) NOT NULL,
    `subdireccion` VARCHAR(150) NOT NULL,
    `area` VARCHAR(150) NOT NULL,
    `nombre_resguardante` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventario_mobiliario_numero_inventario_key`(`numero_inventario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resguardo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo_inventario` VARCHAR(50) NOT NULL,
    `mobiliario_id` INTEGER NULL,
    `equipo_tecnologico_id` INTEGER NULL,
    `existencia_id` INTEGER NULL,
    `controlador_semaforo_id` INTEGER NULL,
    `descripcion_pdf` TEXT NULL,
    `numero_serie_pdf` VARCHAR(100) NULL,
    `fecha_prestamo` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_devolucion` DATETIME(3) NULL,
    `nombre_resguardante` VARCHAR(150) NOT NULL,
    `area` VARCHAR(150) NOT NULL,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'Activo',
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resguardo` ADD CONSTRAINT `resguardo_mobiliario_id_fkey` FOREIGN KEY (`mobiliario_id`) REFERENCES `inventario_mobiliario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resguardo` ADD CONSTRAINT `resguardo_equipo_tecnologico_id_fkey` FOREIGN KEY (`equipo_tecnologico_id`) REFERENCES `equipo_tecnologico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resguardo` ADD CONSTRAINT `resguardo_existencia_id_fkey` FOREIGN KEY (`existencia_id`) REFERENCES `existencia_componente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resguardo` ADD CONSTRAINT `resguardo_controlador_semaforo_id_fkey` FOREIGN KEY (`controlador_semaforo_id`) REFERENCES `controlador_semaforo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
