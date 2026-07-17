/*
  Warnings:

  - You are about to drop the column `ubicacion` on the `controlador_semaforo` table. All the data in the column will be lost.
  - Added the required column `crucero_id` to the `controlador_semaforo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `controlador_semaforo` DROP COLUMN `ubicacion`,
    ADD COLUMN `crucero_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `controlador_semaforo` ADD CONSTRAINT `controlador_semaforo_crucero_id_fkey` FOREIGN KEY (`crucero_id`) REFERENCES `crucero`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
