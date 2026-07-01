-- CreateTable
CREATE TABLE `estacion_crucero` (
    `estacion_id` INTEGER NOT NULL,
    `crucero_id` INTEGER NOT NULL,

    PRIMARY KEY (`estacion_id`, `crucero_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `estacion_crucero` ADD CONSTRAINT `estacion_crucero_estacion_id_fkey` FOREIGN KEY (`estacion_id`) REFERENCES `estacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estacion_crucero` ADD CONSTRAINT `estacion_crucero_crucero_id_fkey` FOREIGN KEY (`crucero_id`) REFERENCES `crucero`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
