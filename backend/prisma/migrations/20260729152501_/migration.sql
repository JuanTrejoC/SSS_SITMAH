-- DropIndex
DROP INDEX `existencia_componente_nombre_key` ON `existencia_componente`;

-- AlterTable
ALTER TABLE `existencia_componente` ADD COLUMN `marca` VARCHAR(100) NULL,
    ADD COLUMN `modelo` VARCHAR(100) NULL,
    ADD COLUMN `numero_inventario` VARCHAR(100) NULL,
    ADD COLUMN `numero_serie` VARCHAR(100) NULL,
    ADD COLUMN `tipo_inventario` VARCHAR(50) NOT NULL DEFAULT 'semaforos';

-- AlterTable
ALTER TABLE `usuario` MODIFY `rol` ENUM('admin', 'infraestructura') NOT NULL DEFAULT 'admin';

-- CreateTable
CREATE TABLE `reporte_oficina_pieza` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporte_oficina_id` INTEGER NOT NULL,
    `componente_id` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reporte_oficina_pieza` ADD CONSTRAINT `reporte_oficina_pieza_reporte_oficina_id_fkey` FOREIGN KEY (`reporte_oficina_id`) REFERENCES `reporte_oficina`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte_oficina_pieza` ADD CONSTRAINT `reporte_oficina_pieza_componente_id_fkey` FOREIGN KEY (`componente_id`) REFERENCES `existencia_componente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
