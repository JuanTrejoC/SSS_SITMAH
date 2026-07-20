/*
  Warnings:

  - You are about to drop the column `total_cabezales` on the `controlador_semaforo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `controlador_semaforo` DROP COLUMN `total_cabezales`,
    ADD COLUMN `semaforos_3_luces` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `semaforos_4_luces` INTEGER NOT NULL DEFAULT 0;
