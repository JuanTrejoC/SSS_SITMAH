-- AlterTable
ALTER TABLE `evidencia` ADD COLUMN `tipo` VARCHAR(50) NOT NULL DEFAULT 'inicial';

-- AlterTable
ALTER TABLE `existencia_componente` ADD COLUMN `estado_fisico` VARCHAR(50) NULL DEFAULT 'Buen Estado';

-- AlterTable
ALTER TABLE `reporte_oficina` ADD COLUMN `diagnostico_solucion` TEXT NULL,
    ADD COLUMN `firma_satisfaccion` LONGTEXT NULL,
    ADD COLUMN `tecnico_atendio` VARCHAR(150) NULL;

-- AlterTable
ALTER TABLE `reporte_oficina_pieza` ADD COLUMN `estado_pieza_reemplazada` VARCHAR(50) NULL DEFAULT 'reparacion',
    ADD COLUMN `pieza_reemplazada_existencia_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `reporte_semaforo` ADD COLUMN `diagnostico_solucion` TEXT NULL,
    ADD COLUMN `firma_satisfaccion` LONGTEXT NULL,
    ADD COLUMN `origen` VARCHAR(50) NULL,
    ADD COLUMN `tecnico_atendio` VARCHAR(150) NULL;

-- AlterTable
ALTER TABLE `reporte_semaforo_pieza` ADD COLUMN `estado_pieza_reemplazada` VARCHAR(50) NULL DEFAULT 'reparacion',
    ADD COLUMN `pieza_reemplazada_existencia_id` INTEGER NULL;
