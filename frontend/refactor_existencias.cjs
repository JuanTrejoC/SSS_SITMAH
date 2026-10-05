const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/views/InventarioExistencias.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Replace cargarExistencias
const startCargar = code.indexOf('const cargarExistencias = async () => {');
const endCargar = code.indexOf('};', code.indexOf('setCargando(false);', startCargar)) + 2;
if (startCargar !== -1) {
  const oldCargar = code.substring(startCargar, endCargar);
  const newCargar = `const cargarExistencias = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      const resEq = await fetch(\`\${API_BASE_URL}/api/inventario-tecnologico?limit=2000&estatusNot=Activo\`, {
        headers: { 'Authorization': \`Bearer \${user.token}\` }
      });
      let eqItems = [];
      if (resEq.ok) {
        const jsonEq = await resEq.json();
        if (jsonEq.ok && Array.isArray(jsonEq.data)) {
          eqItems = jsonEq.data.map(item => {
            return {
              id: item.id,
              origen: 'equipo',
              nombre: item.detalles?.nombre || \`\${item.marca || ''} \${item.modelo || ''}\`.trim() || item.tipo,
              categoria: item.detalles?.categoria || item.tipo,
              cantidad: 1,
              estadoFisico: normalizarEstado(item.estatus || item.detalles?.estadoFisico),
              areaUbicacion: item.areaUbicacion || item.detalles?.areaUbicacion || 'Almacén de Sistemas',
              marca: item.marca || '',
              modelo: item.modelo || '',
              numeroSerie: item.numeroSerie || '',
              numeroInventario: item.numeroInventario || '',
              equipoOriginal: item
            };
          });
        }
      }
      setExistencias(eqItems);
    } catch (err) {
      console.error('Error al cargar existencias:', err);
    } finally {
      setCargando(false);
    }
  };`;
  code = code.replace(oldCargar, newCargar);
}

// 2. Replace handleGuardar
const startGuardar = code.indexOf('const handleGuardar = async (e) => {');
const endGuardar = code.indexOf('};', code.indexOf('Swal.fire(\'Error\', \'Ocurrió un error en el servidor.', startGuardar)) + 2;
if (startGuardar !== -1) {
  const oldGuardar = code.substring(startGuardar, endGuardar);
  const newGuardar = `const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      Swal.fire('Error', 'El nombre del componente/artículo es obligatorio.', 'error');
      return;
    }

    const cantidadFinal = form.cantidad === '' || isNaN(Number(form.cantidad)) ? 1 : Math.max(0, Number(form.cantidad));

    try {
      const payload = {
        tipo: form.categoria || 'Componentes',
        marca: form.marca || null,
        modelo: form.modelo || null,
        numeroSerie: form.numeroSerie || null,
        numeroInventario: form.numeroInventario || null,
        areaUbicacion: form.areaUbicacion || 'Almacén de Sistemas',
        estatus: form.estadoFisico,
        detalles: {
          nombre: form.nombre,
          categoria: form.categoria,
          cantidad: cantidadFinal,
          estadoFisico: form.estadoFisico,
          areaUbicacion: form.areaUbicacion
        }
      };

      const url = editandoId
        ? \`\${API_BASE_URL}/api/inventario-tecnologico/\${editandoId}\`
        : \`\${API_BASE_URL}/api/inventario-tecnologico\`;
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${user.token}\`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        Swal.fire({
          title: 'Éxito',
          text: editandoId ? 'Artículo actualizado correctamente.' : 'Artículo registrado correctamente.',
          icon: 'success',
          confirmButtonColor: '#691B31'
        });
        setModalAbierto(false);
        resetForm();
        cargarExistencias();
      } else {
        Swal.fire('Error', json.error || 'No se pudo guardar el artículo.', 'error');
      }
    } catch (err) {
      console.error('Error al guardar existencias:', err);
      Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
    }
  };`;
  code = code.replace(oldGuardar, newGuardar);
}

// 3. Replace handleEliminar
const startEliminar = code.indexOf('const handleEliminar = async (item) => {');
const endEliminar = code.indexOf('};', code.indexOf('Swal.fire(\'Error\', \'Error al conectar', startEliminar)) + 2;
if (startEliminar !== -1) {
  const oldEliminar = code.substring(startEliminar, endEliminar);
  const newEliminar = `const handleEliminar = async (item) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: \`Se eliminará "\${item.nombre}" del stock.\`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const url = \`\${API_BASE_URL}/api/inventario-tecnologico/\${item.id}\`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${user.token}\` }
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          Swal.fire('Eliminado', 'Artículo eliminado correctamente.', 'success');
          cargarExistencias();
        } else {
          Swal.fire('Error', json.error || 'No se pudo eliminar el artículo.', 'error');
        }
      } catch (err) {
        console.error('Error al eliminar:', err);
        Swal.fire('Error', 'Error al conectar con el servidor.', 'error');
      }
    }
  };`;
  code = code.replace(oldEliminar, newEliminar);
}

fs.writeFileSync(file, code, 'utf8');
console.log("Refactored to only use inventario-tecnologico");
