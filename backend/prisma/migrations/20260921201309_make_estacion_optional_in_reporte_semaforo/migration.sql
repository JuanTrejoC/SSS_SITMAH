-- DropForeignKey
ALTER TABLE `reporte_semaforo` DROP FOREIGN KEY `reporte_semaforo_estacion_id_fkey`;

-- AlterTable
ALTER TABLE `reporte_semaforo` MODIFY `estacion_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `reporte_semaforo` ADD CONSTRAINT `reporte_semaforo_estacion_id_fkey` FOREIGN KEY (`estacion_id`) REFERENCES `estacion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
