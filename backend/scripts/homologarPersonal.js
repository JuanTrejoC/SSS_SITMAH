/**
 * Script de Homologación de Personal Oficial SITMAH
 * 
 * Uso:
 *   Simulación (No modifica nada):
 *     node scripts/homologarPersonal.js
 *     o
 *     node scripts/homologarPersonal.js --dry-run
 * 
 *   Aplicar cambios reales:
 *     node scripts/homologarPersonal.js --apply
 */

const prisma = require('../src/config/db');
const path = require('path');

// Lista oficial de los 155 empleados homologados
let PERSONAL_OFICIAL = [];
try {
  PERSONAL_OFICIAL = require(path.join(__dirname, '../src/data/personalSitmah.json'));
} catch (e) {
  try {
    PERSONAL_OFICIAL = require(path.join(__dirname, '../../frontend/src/data/personalSitmah.js')).PERSONAL_SITMAH || [];
  } catch (err) {
    PERSONAL_OFICIAL = [];
  }
}

function limpiarTexto(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function buscarPersonal(query) {
  if (!query || query.trim().length < 3) return null;
  const q = limpiarTexto(query);

  // 1. Coincidencia exacta limpia
  const matchExacto = PERSONAL_OFICIAL.find(p => limpiarTexto(p.nombre) === q);
  if (matchExacto) return matchExacto;

  // 2. Coincidencia por tokens (ej. apellidos y nombre)
  const tokens = q.split(/\s+/).filter(t => t.length > 1);
  if (tokens.length >= 2) {
    const matchTokens = PERSONAL_OFICIAL.find(p => {
      const nombreLimpio = limpiarTexto(p.nombre);
      return tokens.every(tok => nombreLimpio.includes(tok));
    });
    if (matchTokens) return matchTokens;
  }

  // 3. Coincidencia parcial
  const matchParcial = PERSONAL_OFICIAL.find(p => limpiarTexto(p.nombre).includes(q) || q.includes(limpiarTexto(p.nombre)));
  if (matchParcial) return matchParcial;

  return null;
}

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log('====================================================');
  console.log(`=== HOMOLOGACIÓN DE PERSONAL SITMAH [${isApply ? 'APLICAR CAMBIOS' : 'MODO SIMULACIÓN (DRY-RUN)'}] ===`);
  console.log('====================================================\n');

  if (!isApply) {
    console.log('ℹ️  Modo seguro: Ningún dato será modificado. Ejecuta con --apply para guardar cambios.\n');
  }

  const equipos = await prisma.equipoTecnologico.findMany({
    select: {
      id: true,
      tipo: true,
      numeroInventario: true,
      numeroSerie: true,
      responsable: true,
      cargoResponsable: true,
      direccion: true
    }
  });

  console.log(`Total de equipos encontrados en la base de datos: ${equipos.length}\n`);

  let actualizados = 0;
  let yaCorrectos = 0;
  let sinResponsable = 0;
  let noEncontrados = 0;

  for (const eq of equipos) {
    if (!eq.responsable || !eq.responsable.trim()) {
      sinResponsable++;
      continue;
    }

    const match = buscarPersonal(eq.responsable);
    if (!match) {
      console.log(`⚠️  [ID ${eq.id}] Responsable "${eq.responsable}" no coincide con el organigrama oficial.`);
      noEncontrados++;
      continue;
    }

    const cambioCargo = eq.cargoResponsable !== match.cargo;
    const cambioDireccion = eq.direccion !== match.direccion;

    if (!cambioCargo && !cambioDireccion) {
      yaCorrectos++;
      continue;
    }

    console.log(`✅ [ID ${eq.id} - ${eq.tipo}] Responsable: "${eq.responsable}" -> Oficial: "${match.nombre}"`);
    if (cambioCargo) {
      console.log(`   Puesto:    "${eq.cargoResponsable || 'N/A'}"  ==>  "${match.cargo}"`);
    }
    if (cambioDireccion) {
      console.log(`   Dirección: "${eq.direccion || 'N/A'}"  ==>  "${match.direccion}"`);
    }

    if (isApply) {
      await prisma.equipoTecnologico.update({
        where: { id: eq.id },
        data: {
          cargoResponsable: match.cargo,
          direccion: match.direccion
        }
      });
    }

    actualizados++;
    console.log('');
  }

  console.log('\n---------------- RESUMEN FINAL ----------------');
  console.log(`- Equipos que requieren homologación: ${actualizados}`);
  console.log(`- Equipos con datos ya correctos:    ${yaCorrectos}`);
  console.log(`- Equipos sin responsable asignado:  ${sinResponsable}`);
  console.log(`- Responsables no encontrados:        ${noEncontrados}`);
  console.log('-----------------------------------------------');

  if (isApply) {
    console.log(`\n🎉 ¡Se actualizaron exitosamente ${actualizados} registros en la base de datos!`);
  } else {
    console.log(`\n💡 Para aplicar estos cambios en la base de datos, ejecuta:`);
    console.log(`   node scripts/homologarPersonal.js --apply\n`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error durante la ejecución:', err);
  process.exit(1);
});
