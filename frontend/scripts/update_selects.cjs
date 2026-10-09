const fs = require('fs');
const path = require('path');

const mod1 = path.join('c:', 'Users', 'Juan Trejo', 'Documents', 'SistemaDeSolicitudDeServicioSITMAH', 'frontend', 'src', 'components', 'ModalAsignacionEquipo.jsx');
let c1 = fs.readFileSync(mod1, 'utf8');

c1 = c1.replace(
  `import { FaTimes, FaUser, FaBuilding, FaDesktop } from 'react-icons/fa';`,
  `import { FaTimes, FaUser, FaBuilding, FaDesktop } from 'react-icons/fa';\nimport SearchableSelect from './SearchableSelect';`
);

// Replace the first select
c1 = c1.replace(
  /<select[\s\S]*?value=\{form.equipoNuevoId\}[\s\S]*?onChange=\{e => setForm\(\{\.\.\.form, equipoNuevoId: e\.target\.value\}\)\}[\s\S]*?>[\s\S]*?<\/select>/,
  `<SearchableSelect 
                value={form.equipoNuevoId}
                onChange={(val) => setForm({...form, equipoNuevoId: val})}
                placeholder='-- Buscar Equipo en Stock --'
                options={equiposStock.map(eq => ({
                  value: eq.id,
                  label: eq.tipo.toUpperCase() + ' - ' + eq.marca + ' ' + eq.modelo + ' (Inv: ' + (eq.numeroInventario || 'S/N') + ')',
                  searchTerms: [eq.tipo, eq.marca, eq.modelo, eq.numeroInventario, eq.numeroSerie].filter(Boolean)
                }))}
              />`
);

// Replace the second select
c1 = c1.replace(
  /<select[\s\S]*?value=\{form.equipoPrincipalId\}[\s\S]*?onChange=\{e => setForm\(\{\.\.\.form, equipoPrincipalId: e\.target\.value\}\)\}[\s\S]*?>[\s\S]*?<\/select>/,
  `<SearchableSelect 
                  value={form.equipoPrincipalId}
                  onChange={(val) => setForm({...form, equipoPrincipalId: val})}
                  placeholder='-- Ninguno --'
                  options={[{ value: '', label: '-- Ninguno --' }, ...equiposActivos.map(eq => ({
                    value: eq.id,
                    label: eq.tipo.toUpperCase() + ' - ' + eq.marca + ' ' + eq.modelo + ' (Inv: ' + (eq.numeroInventario || 'S/N') + ') - Resp: ' + eq.responsable,
                    searchTerms: [eq.tipo, eq.marca, eq.modelo, eq.numeroInventario, eq.numeroSerie, eq.responsable].filter(Boolean)
                  }))]}
                />`
);
fs.writeFileSync(mod1, c1);


const mod2 = path.join('c:', 'Users', 'Juan Trejo', 'Documents', 'SistemaDeSolicitudDeServicioSITMAH', 'frontend', 'src', 'components', 'ModalReemplazoEquipo.jsx');
let c2 = fs.readFileSync(mod2, 'utf8');

c2 = c2.replace(
  `import { FaTimes, FaExchangeAlt } from 'react-icons/fa';`,
  `import { FaTimes, FaExchangeAlt } from 'react-icons/fa';\nimport SearchableSelect from './SearchableSelect';`
);

// Replace the first select
c2 = c2.replace(
  /<select[\s\S]*?value=\{form.equipoViejoId\}[\s\S]*?onChange=\{e => setForm\(\{\.\.\.form, equipoViejoId: e\.target\.value\}\)\}[\s\S]*?>[\s\S]*?<\/select>/,
  `<SearchableSelect 
                value={form.equipoViejoId}
                onChange={(val) => setForm({...form, equipoViejoId: val})}
                placeholder='-- Buscar Equipo Activo --'
                options={equiposActivos.map(eq => ({
                  value: eq.id,
                  label: eq.tipo.toUpperCase() + ' - ' + eq.marca + ' ' + eq.modelo + ' (Inv: ' + (eq.numeroInventario || 'S/N') + ') - Resp: ' + eq.responsable,
                  searchTerms: [eq.tipo, eq.marca, eq.modelo, eq.numeroInventario, eq.numeroSerie, eq.responsable].filter(Boolean)
                }))}
              />`
);

// Replace the second select
c2 = c2.replace(
  /<select[\s\S]*?value=\{form.equipoNuevoId\}[\s\S]*?onChange=\{e => setForm\(\{\.\.\.form, equipoNuevoId: e\.target\.value\}\)\}[\s\S]*?>[\s\S]*?<\/select>/,
  `<SearchableSelect 
                value={form.equipoNuevoId}
                onChange={(val) => setForm({...form, equipoNuevoId: val})}
                placeholder='-- Buscar Equipo en Stock --'
                options={equiposStock.map(eq => ({
                  value: eq.id,
                  label: eq.tipo.toUpperCase() + ' - ' + eq.marca + ' ' + eq.modelo + ' (Inv: ' + (eq.numeroInventario || 'S/N') + ')',
                  searchTerms: [eq.tipo, eq.marca, eq.modelo, eq.numeroInventario, eq.numeroSerie].filter(Boolean)
                }))}
              />`
);
fs.writeFileSync(mod2, c2);

console.log('done!');
