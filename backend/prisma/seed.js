require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@sitmah.local',
      passwordHash,
      nombre: 'Administrador',
      rol: 'admin',
    },
  });

  const passwordHashInfra = await bcrypt.hash('infra123', 10);
  const infra = await prisma.usuario.upsert({
    where: { username: 'infra' },
    update: {},
    create: {
      username: 'infra',
      email: 'infra@sitmah.gob.mx',
      passwordHash: passwordHashInfra,
      nombre: 'Gestor Infraestructura',
      rol: 'infraestructura',
    },
  });

  const areas = [
    'Dirección de Operación y Supervisión',
    'Dirección General',
    'Dirección Jurídica',
    'Dirección de Administración y Finanzas',
    'Dirección de Planeación y Desarrollo',
    'Dirección de Logística e Ingeniería',
    'Dirección de Operación e Inspección',
    'Contraloría'
  ];
  const sedes = ['CCGO', 'CETRAM', 'Oficinas Téllez', 'Oficinas Patio Téllez'];
  const categorias = ['Hardware', 'Software', 'Redes', 'Infraestructura', 'Telefonía'];
  const estaciones = [
    'Terminal Téllez', 'Gabriel Mancera', 'Matilde', 'Efrén Rebolledo', 'Tercera Edad',
    'San Antonio', 'Ejército Mexicano', 'Felipe Ángeles', 'Centro de Justicia oriente',
    'Centro de Justicia poniente', 'Vicente Segura', 'Juan C. Doria', 'Hospitales',
    'SEPH', 'Tecnológico', 'Bicentenario oriente', 'Bicentenario poniente', 'Centro Minero',
    'Zona Plateada', 'Tecnológico de Monterrey', 'Estadio Hidalgo', 'Central de Autobuses',
    'Cuna de Fútbol', 'Santa Julia', 'Prepa 1', 'Revolución', 'Manuel Dublán',
    'Presidente Alemán', 'Niños Heroes oriente', 'Niños Heroes poniente', 'Centro Histórico',
    'Plaza Juárez', 'Parque del Maestro', 'Bioparque'
  const cruceros = [
    "BLVD. TÉLLEZ - SAN ALFONSO",
    "FELIPE ÁNGELES - VENTA PRIETA",
    "FELIPE ÁNGELES - GALERÍAS",
    "FELIPE ÁNGELES - PREPA SIGLO XXI",
    "CENTRAL AUTOBUSES",
    "F. ÁNGELES - ROJO GÓMEZ",
    "F. ÁNGELES - POLIFORUM",
    "F. ÁNGELES - RETORNO NISSAN",
    "F. ÁNGELES - 5 DE MAYO",
    "F. ÁNGELES - ARTICULO 3RO",
    "F. ÁNGELES - PREPA1",
    "FELIPE ÁNGELES - GYM PREPA",
    "B. JUÁREZ - INSURGENTES",
    "REVOLUCIÓN - 16 DE ENERO",
    "REVOLUCIÓN - JAIME NUNO",
    "REVOLUCIÓN - SAMUEL CARRO",
    "REVOLUCIÓN - MANUEL DÚBLAN",
    "REVOLUCIÓN - GABRIEL HERNÁNDEZ",
    "REVOLUCIÓN - 15 DE SEPTIEMBRE",
    "REVOLUCIÓN - 5 DE FEBRERO",
    "REVOLUCIÓN - MADERO",
    "REVOLUCIÓN - BELISARIO",
    "ARISPE - ALLENDE-MATAMOROS",
    "MATAMOROS - OCAMPO",
    "VILLAGRAN -ALLENDE-ZARAGOZA",
    "B. JUÁREZ - BELISARIO DOMINGUEZ",
    "B. JUÁREZ - GUERRERO",
    "B. JUÁREZ - MADERO",
    "B. JUÁREZ - DANIEL CERECEDO",
    "B. JUÁREZ - J M. IGLESIAS",
    "B. JUÁREZ - GRAL MEJIA",
    "B. JUÁREZ - MANUEL DÚBLAN",
    "B. JUÁREZ - SAMUEL CARRO",
    "B. JUÁREZ - 12 DE OCTUBRE",
    "B. JUÁREZ - BOCANEGRA",
    "B. JUÁREZ - 16 DE ENERO"
  ];
  const fallas = ['Falla Eléctrica', 'Luz Fundida', 'Controlador Apagado', 'Vandalismo', 'Cortocircuito'];

  const cargos = [
    { id: 1, nombre: "Técnico Especializado", activo: true },
    { id: 2, nombre: "Asesor Técnico/Gestor", activo: true },
    { id: 3, nombre: "Jefatura de Área", activo: false },
    { id: 4, nombre: "Subdirección de Área", activo: false },
    { id: 5, nombre: "Subdirector Adjunto", activo: true },
    { id: 6, nombre: "Director de Área", activo: true },
    { id: 7, nombre: "Jefatura de Departamento", activo: true },
    { id: 8, nombre: "Subdirector De Área", activo: true },
    { id: 9, nombre: "Asistente General", activo: true },
    { id: 10, nombre: "Director General", activo: true }
  ];

  const subdirecciones = [
    'Secretaría Técnica',
    'Subdirección de Planeación',
    'Subdirección de Desarrollo y Proyectos Estratégicos',
    'Subdirección de Vigilancia en Vías Exclusivas',
    'Subdirección Consultiva',
    'Subdirección de Procesos',
    'Subdirección de Finanzas',
    'Subdirección de Administración',
    'Subdirección de Verificación Operacional',
    'Subdirección de Monitoreo, Supervisión e Inspección',
    'Subdirección de Mantenimiento del Parque Vehicular',
    'Subdirección de Tecnología',
    'Subdirección de Logística y Operación',
    'Subdirección de Infraestructura y Abastos'
  ];

  for (const nombre of areas) await prisma.area.upsert({ where: { id: areas.indexOf(nombre) + 1 }, update: {}, create: { nombre } }).catch(() => prisma.area.create({ data: { nombre } }));
  for (const nombre of subdirecciones) await prisma.subdireccion.upsert({ where: { id: subdirecciones.indexOf(nombre) + 1 }, update: { nombre }, create: { id: subdirecciones.indexOf(nombre) + 1, nombre } }).catch(() => {});
  for (const nombre of sedes) await prisma.sede.upsert({ where: { id: sedes.indexOf(nombre) + 1 }, update: {}, create: { nombre } }).catch(() => prisma.sede.create({ data: { nombre } }));
  for (const nombre of categorias) await prisma.categoria.upsert({ where: { id: categorias.indexOf(nombre) + 1 }, update: {}, create: { nombre } }).catch(() => prisma.categoria.create({ data: { nombre } }));
  for (const c of cargos) await prisma.cargo.upsert({ where: { id: c.id }, update: { nombre: c.nombre, activo: c.activo }, create: { id: c.id, nombre: c.nombre, activo: c.activo } }).catch(() => {});
  for (const nombre of estaciones) await prisma.estacion.upsert({ where: { id: estaciones.indexOf(nombre) + 1 }, update: {}, create: { nombre } }).catch(() => prisma.estacion.create({ data: { nombre } }));
  for (const nombre of cruceros) await prisma.crucero.upsert({ where: { id: cruceros.indexOf(nombre) + 1 }, update: {}, create: { nombre } }).catch(() => prisma.crucero.create({ data: { nombre } }));
  for (const nombre of fallas) await prisma.tipoFalla.upsert({ where: { id: fallas.indexOf(nombre) + 1 }, update: {}, create: { nombre } }).catch(() => prisma.tipoFalla.create({ data: { nombre } }));

  // Obtener IDs
  const dbAreas = await prisma.area.findMany({ take: 5 });
  const dbSedes = await prisma.sede.findMany({ take: 5 });
  const dbCategorias = await prisma.categoria.findMany({ take: 5 });
  const dbCargos = await prisma.cargo.findMany({ take: 5 });
  const dbEstaciones = await prisma.estacion.findMany({ take: 5 });
  const dbCruceros = await prisma.crucero.findMany({ take: 5 });
  const dbFallas = await prisma.tipoFalla.findMany({ take: 5 });

  for (let i = 0; i < dbEstaciones.length; i++) {
    if (dbEstaciones[i] && dbCruceros[i]) {
      await prisma.estacionCrucero.upsert({
        where: { estacionId_cruceroId: { estacionId: dbEstaciones[i].id, cruceroId: dbCruceros[i].id } },
        update: {},
        create: { estacionId: dbEstaciones[i].id, cruceroId: dbCruceros[i].id }
      }).catch(() => {});
    }
  }

  // --- EXISTENCIAS ---
  const componentesSemaforos = [
    { nombre: 'controladores', categoria: 'equipo', cantidad: 10 },
    { nombre: 'cabezales', categoria: 'componente', cantidad: 10 },
    { nombre: 'led verdes', categoria: 'componente', cantidad: 50 },
    { nombre: 'led rojos', categoria: 'componente', cantidad: 50 },
    { nombre: 'led amarillos', categoria: 'componente', cantidad: 50 },
    { nombre: 'paso peatonal', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'audible', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'pantalla led', categoria: 'periferico', cantidad: 10 },
    { nombre: 'tarjeta relevadora', categoria: 'componente', cantidad: 10 },
    { nombre: 'fuente de poder', categoria: 'componente', cantidad: 10 },
    { nombre: 'cpu', categoria: 'componente', cantidad: 10 },
    { nombre: 'switch', categoria: 'equipo', cantidad: 10 },
    { nombre: 'fibra optica', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'gps', categoria: 'accesorio', cantidad: 10 },
    { nombre: 'botonera', categoria: 'accesorio', cantidad: 10 }
  ];

  for (const comp of componentesSemaforos) {
    const exist = await prisma.existenciaComponente.findFirst({ where: { nombre: comp.nombre } });
    if (!exist) await prisma.existenciaComponente.create({ data: comp });
  }

  // --- EQUIPOS TECNOLÓGICOS ---
  const equiposSemilla = [
    { tipo: 'lectora_tags', numeroInventario: 'INV-TAG-001', marca: 'ZKTeco', modelo: 'U1000', numeroSerie: 'ZK987654321', areaUbicacion: 'Peaje Acceso Norte', detalles: {} },
    { tipo: 'controladora', numeroInventario: 'INV-CTR-001', marca: 'Hikvision', modelo: 'DS-K2604', numeroSerie: 'HK11223344', areaUbicacion: 'Peaje Acceso Sur', detalles: {} },
    { tipo: 'herramienta_tec', numeroInventario: 'INV-HER-TEC-001', marca: 'Steren', modelo: 'Ponchadora RJ45', numeroSerie: 'ST998877', areaUbicacion: 'Sistemas', detalles: {} },
    { tipo: 'herramienta_infra', numeroInventario: 'INV-HER-INF-001', marca: 'Truper', modelo: 'Martillo de uña', numeroSerie: 'TR665544', areaUbicacion: 'Mantenimiento', detalles: {} },
    { tipo: 'computadora', numeroInventario: 'INV-PC-001', marca: 'Dell', modelo: 'Optiplex 7090', numeroSerie: 'DL12345', areaUbicacion: 'Sistemas', detalles: {} }
  ];

  for (const eq of equiposSemilla) {
    const exist = await prisma.equipoTecnologico.findUnique({ where: { numeroInventario: eq.numeroInventario } });
    if (!exist) await prisma.equipoTecnologico.create({ data: eq });
  }

  // --- REPORTES DE OFICINA ---
  for (let i = 1; i <= 5; i++) {
    const folio = `OF-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`;
    const exist = await prisma.reporteOficina.findUnique({ where: { folio } });
    if (!exist && dbAreas[i-1] && dbSedes[i-1] && dbCategorias[i-1] && dbCargos[i-1]) {
      await prisma.reporteOficina.create({
        data: {
          folio, solicitante: `Solicitante ${i}`, areaId: dbAreas[i-1].id, cargoId: dbCargos[i-1].id,
          email: `solicitante${i}@sitmah.local`, telefono: `555123456${i}`, sedeId: dbSedes[i-1].id,
          equipo: `Equipo Afectado ${i}`, categoriaId: dbCategorias[i-1].id, prioridad: i % 2 === 0 ? 'alta' : 'media',
          descripcion: `Descripción de prueba para falla en oficina número ${i}`, estado: i % 2 === 0 ? 'resuelto' : 'abierto',
          atendidoPorId: i % 2 === 0 ? admin.id : null,
          fechaResolucion: i % 2 === 0 ? new Date() : null
        }
      });
    }
  }

  // --- REPORTES DE SEMÁFORO ---
  for (let i = 1; i <= 5; i++) {
    const folio = `SM-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`;
    const exist = await prisma.reporteSemaforo.findUnique({ where: { folio } });
    if (!exist && dbEstaciones[i-1] && dbCruceros[i-1] && dbFallas[i-1]) {
      await prisma.reporteSemaforo.create({
        data: {
          folio, jefeTurno: `Jefe Turno ${i}`, estacionId: dbEstaciones[i-1].id, cruceroId: dbCruceros[i-1].id,
          tipoFallaId: dbFallas[i-1].id, descripcion: `Semáforo fallando en el crucero ${i}`, horaDano: new Date(),
          prioridad: 'alta', estado: i === 1 ? 'resuelto' : 'abierto', atendidoPorId: i === 1 ? admin.id : null,
          fechaResolucion: i === 1 ? new Date() : null
        }
      });
    }
  }

  // --- CONTROLADORES INSTALADOS ---
  for (let i = 1; i <= 5; i++) {
    const exist = await prisma.controladorSemaforo.findFirst({ where: { modelo: `Controlador Prueba ${i}` } });
    if (!exist && dbCruceros[i-1]) {
      await prisma.controladorSemaforo.create({
        data: {
          modelo: `Controlador Prueba ${i}`, cruceroId: dbCruceros[i-1].id,
          semaforos3Luces: 4, semaforos4Luces: 2, totalLedsVerdes: 12, totalLedsRojos: 12, totalLedsAmarillos: 12,
          pasoPeatonal: true, audible: false, pantallaLed: true, tarjetaRelevadora: true, fuentePoder: true,
          cpu: true, switch: false, fibraOptica: false, gps: true, botonera: false
        }
      });
    }
  }

  console.log('Seed completado exitosamente con 5 registros por apartado.');
  console.log('Usuario admin: username=admin, password=admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
