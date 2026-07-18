const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando generación de datos simulados...');

  // 1. Crear Cruceros si no existen
  const crucerosSemilla = [
    { nombre: 'Av. Juárez y Calle 5 de Mayo', activo: true },
    { nombre: 'Blvd. Belisario Domínguez y Av. Central', activo: true },
    { nombre: 'Paseo de la Reforma y Av. Insurgentes', activo: true },
    { nombre: 'Av. Constituyentes y Av. Acueducto', activo: true },
    { nombre: 'Av. Universidad y Cerro de las Campanas', activo: true }
  ];

  const crucerosCreados = [];
  for (const c of crucerosSemilla) {
    const crucero = await prisma.crucero.upsert({
      where: { id: crucerosSemilla.indexOf(c) + 1 }, // temporary unique identifier strategy
      update: {},
      create: c
    });
    crucerosCreados.push(crucero);
  }
  console.log(`- ${crucerosCreados.length} Cruceros preparados.`);

  // 2. Controladores de Semáforos
  const controladoresSemilla = [
    { modelo: 'Econolite ASC/3', cruceroId: crucerosCreados[0].id, totalCabezales: 4, totalLedsVerdes: 12, totalLedsRojos: 12, totalLedsAmarillos: 12, pasoPeatonal: true, audible: true, pantallaLed: true, tarjetaRelevadora: true, fuentePoder: true, cpu: true, switch: true, fibraOptica: false, gps: true, botonera: true },
    { modelo: 'Peek Double D', cruceroId: crucerosCreados[1].id, totalCabezales: 6, totalLedsVerdes: 18, totalLedsRojos: 18, totalLedsAmarillos: 18, pasoPeatonal: true, audible: false, pantallaLed: false, tarjetaRelevadora: true, fuentePoder: true, cpu: true, switch: false, fibraOptica: false, gps: false, botonera: false },
    { modelo: 'Intelight MaxTime', cruceroId: crucerosCreados[2].id, totalCabezales: 8, totalLedsVerdes: 24, totalLedsRojos: 24, totalLedsAmarillos: 24, pasoPeatonal: true, audible: true, pantallaLed: true, tarjetaRelevadora: true, fuentePoder: true, cpu: true, switch: true, fibraOptica: true, gps: true, botonera: true },
    { modelo: 'Semaforos de Mexico S.A.', cruceroId: crucerosCreados[3].id, totalCabezales: 3, totalLedsVerdes: 9, totalLedsRojos: 9, totalLedsAmarillos: 9, pasoPeatonal: false, audible: false, pantallaLed: false, tarjetaRelevadora: false, fuentePoder: true, cpu: true, switch: false, fibraOptica: false, gps: false, botonera: false },
    { modelo: 'Siemens M60', cruceroId: crucerosCreados[4].id, totalCabezales: 5, totalLedsVerdes: 15, totalLedsRojos: 15, totalLedsAmarillos: 15, pasoPeatonal: true, audible: true, pantallaLed: false, tarjetaRelevadora: true, fuentePoder: true, cpu: true, switch: true, fibraOptica: true, gps: true, botonera: false }
  ];

  for (const c of controladoresSemilla) {
    await prisma.controladorSemaforo.create({
      data: c
    });
  }
  console.log(`- ${controladoresSemilla.length} Controladores de Semáforos creados.`);

  // 3. Inventario Tecnológico (no herramientas)
  const equiposTecnologicos = [
    { tipo: 'laptop', numeroInventario: 'INV-TEC-LAP-101', numeroSerie: 'SN-LAP-90987', marca: 'Dell', modelo: 'Latitude 5420', responsable: 'Juan Trejo', cargoResponsable: 'Coordinador de Sistemas', areaUbicacion: 'Sistemas', detalles: { ram: '16GB', almacenamiento: '512GB SSD', procesador: 'Intel Core i5', sistemaOperativo: 'Windows 11 Pro' } },
    { tipo: 'escritorio', numeroInventario: 'INV-TEC-ESC-102', numeroSerie: 'SN-PC-77263', marca: 'HP', modelo: 'ProDesk 400', responsable: 'María González', cargoResponsable: 'Auxiliar Administrativo', areaUbicacion: 'Administración', detalles: { ram: '8GB', almacenamiento: '1TB HDD', procesador: 'Intel Core i3', sistemaOperativo: 'Windows 10 Pro' } },
    { tipo: 'servidor', numeroInventario: 'INV-TEC-SRV-103', numeroSerie: 'SN-SRV-11223', marca: 'Lenovo', modelo: 'ThinkSystem ST250', responsable: 'Admin', cargoResponsable: 'Administrador General', areaUbicacion: 'Site Central', detalles: { ram: '64GB', almacenamiento: '4TB HDD RAID', procesador: 'Intel Xeon' } },
    { tipo: 'router', numeroInventario: 'INV-TEC-RTR-104', numeroSerie: 'SN-RTR-88472', marca: 'Cisco', modelo: 'ISR 4331', responsable: 'Ing. Carlos Pérez', cargoResponsable: 'Especialista de Redes', areaUbicacion: 'Site Central', detalles: { ipPredeterminada: '192.168.10.1', mac: '00:1A:2B:3C:4D:5E' } },
    { tipo: 'camara', numeroInventario: 'INV-TEC-CAM-105', numeroSerie: 'SN-CAM-33445', marca: 'Hikvision', modelo: 'Bullet IP 4MP', responsable: null, cargoResponsable: null, areaUbicacion: 'Acceso Principal Sede', detalles: { ipPredeterminada: '192.168.10.50', megapixeles: '4MP', mac: '00:1A:2B:3C:4D:9F' } },
    { tipo: 'switch', numeroInventario: 'INV-TEC-SWI-106', numeroSerie: 'SN-SWI-55667', marca: 'Ubiquiti', modelo: 'UniFi Switch 24 POE', responsable: null, cargoResponsable: null, areaUbicacion: 'Site Central', detalles: { ipPredeterminada: '192.168.10.2', mac: '00:1A:2B:3C:4D:AA' } },
    { tipo: 'celular', numeroInventario: 'INV-TEC-CEL-107', numeroSerie: 'SN-CEL-44556', marca: 'Samsung', modelo: 'Galaxy A34', responsable: 'Pedro Ramírez', cargoResponsable: 'Supervisor de Campo', areaUbicacion: 'Supervisión', detalles: { ram: '6GB', almacenamiento: '128GB', sistemaOperativo: 'Android 13' } }
  ];

  for (const eq of equiposTecnologicos) {
    await prisma.equipoTecnologico.upsert({
      where: { numeroInventario: eq.numeroInventario },
      update: {},
      create: eq
    });
  }
  console.log(`- ${equiposTecnologicos.length} Equipos Tecnológicos creados.`);

  // 4. Inventario de Herramientas (tipo: herramienta_tec o herramienta_infra)
  const herramientasSemilla = [
    { tipo: 'herramienta_tec', numeroInventario: 'INV-HER-TEC-101', numeroSerie: 'SN-HER-T101', marca: 'Fluke', modelo: 'Multímetro Digital 179', responsable: 'Ing. Carlos Pérez', cargoResponsable: 'Especialista de Redes', areaUbicacion: 'Sistemas', detalles: { calibrado: 'Sí', resolucion: '6000 cuentas' } },
    { tipo: 'herramienta_tec', numeroInventario: 'INV-HER-TEC-102', numeroSerie: 'SN-HER-T102', marca: 'Klein Tools', modelo: 'Ponchadora RJ45 Premium', responsable: 'Juan Trejo', cargoResponsable: 'Coordinador de Sistemas', areaUbicacion: 'Sistemas', detalles: { tipo: 'Trinquete' } },
    { tipo: 'herramienta_infra', numeroInventario: 'INV-HER-INF-102', numeroSerie: 'SN-HER-I102', marca: 'Truper', modelo: 'Taladro Rotomartillo 1/2', responsable: 'Pedro Ramírez', cargoResponsable: 'Supervisor de Campo', areaUbicacion: 'Mantenimiento', detalles: { potencia: '650W' } },
    { tipo: 'herramienta_infra', numeroInventario: 'INV-HER-INF-103', numeroSerie: 'SN-HER-I103', marca: 'Stanley', modelo: 'Juego de Destornilladores 20 piezas', responsable: 'Pedro Ramírez', cargoResponsable: 'Supervisor de Campo', areaUbicacion: 'Mantenimiento', detalles: {} },
    { tipo: 'herramienta_infra', numeroInventario: 'INV-HER-INF-104', numeroSerie: 'SN-HER-I104', marca: 'Dewalt', modelo: 'Generador Eléctrico Portátil', responsable: 'Pedro Ramírez', cargoResponsable: 'Supervisor de Campo', areaUbicacion: 'Mantenimiento', detalles: { combustible: 'Gasolina', potencia: '5000W' } }
  ];

  for (const h of herramientasSemilla) {
    await prisma.equipoTecnologico.upsert({
      where: { numeroInventario: h.numeroInventario },
      update: {},
      create: h
    });
  }
  console.log(`- ${herramientasSemilla.length} Herramientas creadas.`);

  // 5. Existencias (tipoInventario: tecnologico)
  const existenciasTecnologicas = [
    { nombre: 'Cable HDMI 2 metros', categoria: 'accesorio', cantidad: 25, marca: 'Steren', modelo: 'HDMI-002', numeroSerie: 'N/A', numeroInventario: 'N/A', tipoInventario: 'tecnologico' },
    { nombre: 'Conectores RJ45 Cat6', categoria: 'accesorio', cantidad: 350, marca: 'Panduit', modelo: 'RJ45-C6', numeroSerie: 'N/A', numeroInventario: 'N/A', tipoInventario: 'tecnologico' },
    { nombre: 'Memoria RAM DDR4 8GB', categoria: 'componente', cantidad: 12, marca: 'Kingston', modelo: 'Valueram DDR4', numeroSerie: 'N/A', numeroInventario: 'N/A', tipoInventario: 'tecnologico' },
    { nombre: 'Disco Estado Sólido SSD 480GB', categoria: 'componente', cantidad: 8, marca: 'Crucial', modelo: 'BX500', numeroSerie: 'N/A', numeroInventario: 'N/A', tipoInventario: 'tecnologico' },
    { nombre: 'Mouse USB', categoria: 'periferico', cantidad: 15, marca: 'Logitech', modelo: 'M90', numeroSerie: 'N/A', numeroInventario: 'N/A', tipoInventario: 'tecnologico' },
    { nombre: 'Teclado USB', categoria: 'periferico', cantidad: 14, marca: 'Logitech', modelo: 'K120', numeroSerie: 'N/A', numeroInventario: 'N/A', tipoInventario: 'tecnologico' },
    { nombre: 'Switch de 5 puertos', categoria: 'equipo', cantidad: 5, marca: 'TP-Link', modelo: 'LS1005G', numeroSerie: 'N/A', numeroInventario: 'N/A', tipoInventario: 'tecnologico' }
  ];

  for (const ex of existenciasTecnologicas) {
    const existing = await prisma.existenciaComponente.findFirst({
      where: { nombre: ex.nombre, tipoInventario: 'tecnologico' }
    });
    if (!existing) {
      await prisma.existenciaComponente.create({ data: ex });
    } else {
      await prisma.existenciaComponente.update({
        where: { id: existing.id },
        data: { cantidad: ex.cantidad }
      });
    }
  }
  console.log(`- ${existenciasTecnologicas.length} Existencias Tecnológicas (Componentes) preparadas.`);

  // 6. Existencias (tipoInventario: semaforos)
  const existenciasSemaforos = [
    { nombre: 'Tarjeta de Control Principal', categoria: 'componente', cantidad: 15, marca: 'Econolite', modelo: 'ASC-3-CPU', tipoInventario: 'semaforos' },
    { nombre: 'Fuente de Poder 24V', categoria: 'componente', cantidad: 20, marca: 'Mean Well', modelo: 'LRS-150-24', tipoInventario: 'semaforos' },
    { nombre: 'Lámpara LED Verde 12"', categoria: 'componente', cantidad: 45, marca: 'Dialight', modelo: 'G12-LED', tipoInventario: 'semaforos' },
    { nombre: 'Lámpara LED Roja 12"', categoria: 'componente', cantidad: 40, marca: 'Dialight', modelo: 'R12-LED', tipoInventario: 'semaforos' },
    { nombre: 'Tarjeta Relevadora de Canales', categoria: 'componente', cantidad: 12, marca: 'Intelight', modelo: 'RELAY-8CH', tipoInventario: 'semaforos' }
  ];

  for (const ex of existenciasSemaforos) {
    const existing = await prisma.existenciaComponente.findFirst({
      where: { nombre: ex.nombre, tipoInventario: 'semaforos' }
    });
    if (!existing) {
      await prisma.existenciaComponente.create({ data: ex });
    } else {
      await prisma.existenciaComponente.update({
        where: { id: existing.id },
        data: { cantidad: ex.cantidad }
      });
    }
  }
  console.log(`- ${existenciasSemaforos.length} Existencias de Semáforos preparadas.`);

  console.log('¡Generación de datos simulados completada con éxito!');
}

main()
  .catch((e) => {
    console.error('Error al generar datos simulados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
