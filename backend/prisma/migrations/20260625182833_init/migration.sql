/*
  Warnings:

  - You are about to drop the column `cargo` on the `reporte_oficina` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `reporte_oficina` DROP COLUMN `cargo`,
    ADD COLUMN `cargo_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reporte_oficina` ADD CONSTRAINT `reporte_oficina_cargo_id_fkey` FOREIGN KEY (`cargo_id`) REFERENCES `cargo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
