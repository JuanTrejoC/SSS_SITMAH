
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function test() {
  // 1. Get or mock token
  const token = jwt.sign({ id: 1, usuario: 'admin', rol: 'admin' }, process.env.JWT_SECRET || 'sitmah_secret_jwt_key_segura_2026');
  
  // 2. Test create equipo with empty/generic numeroInventario via fetch
  const res = await fetch('http://localhost:3000/api/inventario-tecnologico', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': Bearer 
    },
    body: JSON.stringify({
      tipo: 'otro',
      numeroInventario: 'S/N',
      marca: 'TestMarca',
      modelo: 'TestModelo',
      areaUbicacion: 'Oficinas Téllez',
      direccion: 'Dirección de Logística e Ingeniería',
      procedencia: 'Recurso Propio',
      estatus: 'Activo',
      detalles: { nombre: 'Rack de mesa de control de prueba', descripcionOtro: 'Prueba de guardado' }
    })
  });

  const json = await res.json();
  console.log('Status 1 (S/N):', res.status, json.ok ? 'EXITOSO' : json);
  
  const createdId1 = json.data?.id;

  // 3. Test create SECOND equipo with S/N (which previously would crash on unique key)
  const res2 = await fetch('http://localhost:3000/api/inventario-tecnologico', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': Bearer 
    },
    body: JSON.stringify({
      tipo: 'otro',
      numeroInventario: 'S/N',
      marca: 'TestMarca2',
      modelo: 'TestModelo2',
      areaUbicacion: 'Oficinas Téllez',
      direccion: 'Dirección de Logística e Ingeniería',
      procedencia: 'Recurso Propio',
      estatus: 'Activo',
      detalles: { nombre: 'Segundo Rack', descripcionOtro: 'Prueba segundo guardado con S/N' }
    })
  });

  const json2 = await res2.json();
  console.log('Status 2 (segundo S/N):', res2.status, json2.ok ? 'EXITOSO' : json2);

  const createdId2 = json2.data?.id;

  // Cleanup test items
  if (createdId1) await prisma.equipoTecnologico.delete({ where: { id: createdId1 } });
  if (createdId2) await prisma.equipoTecnologico.delete({ where: { id: createdId2 } });

  console.log('Test completado y registros de prueba eliminados limpiamente.');
  process.exit(0);
}
test();
