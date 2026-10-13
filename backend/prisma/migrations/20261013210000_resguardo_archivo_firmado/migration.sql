-- AlterTable
ALTER TABLE `resguardo` ADD COLUMN `archivo_firmado` VARCHAR(255) NULL,
    ADD COLUMN `archivo_firmado_mime` VARCHAR(100) NULL,
    ADD COLUMN `fecha_firmado` DATETIME(3) NULL;
