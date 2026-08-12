const { z } = require('zod');

const equipoTecnologicoSchema = z.object({
  tipo: z.string().min(1),
  numeroInventario: z.string().nullable().optional(),
  numeroSerie: z.string().nullable().optional(),
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  responsable: z.string().nullable().optional(),
  cargoResponsable: z.string().nullable().optional(),
  areaUbicacion: z.string().nullable().optional(),
  procedencia: z.string().nullable().optional(),
  detalles: z.any().optional(),
});

const res = equipoTecnologicoSchema.safeParse({
  tipo: 'router',
  procedencia: 'Donacion',
  areaUbicacion: 'Centro de control'
});
console.log(res);
