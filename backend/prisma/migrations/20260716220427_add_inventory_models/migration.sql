-- CreateTable
CREATE TABLE `equipo_tecnologico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(50) NOT NULL,
    `numero_inventario` VARCHAR(100) NULL,
    `numero_serie` VARCHAR(100) NULL,
    `marca` VARCHAR(100) NULL,
    `modelo` VARCHAR(100) NULL,
    `responsable` VARCHAR(100) NULL,
    `cargo_responsable` VARCHAR(100) NULL,
    `area_ubicacion` VARCHAR(150) NULL,
    `detalles` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `equipo_tecnologico_numero_inventario_key`(`numero_inventario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `controlador_semaforo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modelo` VARCHAR(100) NOT NULL,
    `ubicacion` VARCHAR(255) NOT NULL,
    `total_cabezales` INTEGER NOT NULL DEFAULT 0,
    `total_leds_verdes` INTEGER NOT NULL DEFAULT 0,
    `total_leds_rojos` INTEGER NOT NULL DEFAULT 0,
    `total_leds_amarillos` INTEGER NOT NULL DEFAULT 0,
    `paso_peatonal` BOOLEAN NOT NULL DEFAULT false,
    `audible` BOOLEAN NOT NULL DEFAULT false,
    `pantalla_led` BOOLEAN NOT NULL DEFAULT false,
    `tarjeta_relevadora` BOOLEAN NOT NULL DEFAULT false,
    `fuente_poder` BOOLEAN NOT NULL DEFAULT false,
    `cpu` BOOLEAN NOT NULL DEFAULT false,
    `switch` BOOLEAN NOT NULL DEFAULT false,
    `fibra_optica` BOOLEAN NOT NULL DEFAULT false,
    `gps` BOOLEAN NOT NULL DEFAULT false,
    `botonera` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `existencia_componente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `categoria` VARCHAR(50) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `existencia_componente_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte_semaforo_pieza` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_semaforo_id` INTEGER NOT NULL,
    `componente_id` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reporte_semaforo_pieza` ADD CONSTRAINT `reporte_semaforo_pieza_reporte_semaforo_id_fkey` FOREIGN KEY (`reporte_semaforo_id`) REFERENCES `reporte_semaforo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_semaforo_pieza` ADD CONSTRAINT `reporte_semaforo_pieza_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `existencia_componente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
