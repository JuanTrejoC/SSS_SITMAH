import { useState, useEffect } from 'react';
import { FaClipboardCheck, FaPlus, FaSearch, FaFilePdf, FaCheck } from 'react-icons/fa';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import headerLogos from '../assets/header_logos.png';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Resguardos() {
  const { user, logout } = useAuth();
  const [resguardos, setResguardos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  
  const [form, setForm] = useState({
    tipoOpcion: 'mobiliario',
    tipoInventario: 'mobiliario', // actual type for db
    itemId: '',
    nombreResguardante: '',
    area: '',
    observaciones: '',
    descripcionPdf: '',
    numeroSeriePdf: ''
  });

  const [itemsDisponibles, setItemsDisponibles] = useState([]);

  const cargarResguardos = async () => {
    if (!user?.token) return;
    setCargando(true);
    try {
      const token = user.token;
      const res = await fetch(`${API_BASE_URL}/api/resguardos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 401 || data.error === 'Token inválido o expirado') {
        Swal.fire('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'warning').then(() => logout());
        return;
      }
      if (data.ok) {
        setResguardos(data.data);
      }
    } catch (err) {
      console.error('Error al cargar resguardos:', err);
    }
    setCargando(false);
  };

  const cargarItemsDisponibles = async (tipoOpcion) => {
    if (!user?.token) return;
    try {
      const token = user.token;
      let items = [];
      let debugInfo = [];

      if (tipoOpcion === 'mobiliario') {
        const res = await fetch(`${API_BASE_URL}/api/inventario/mobiliario`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.ok && data.data) {
          const arr = Array.isArray(data.data) ? data.data : (data.data.items || []);
          items = arr.map(i => ({ ...i, __formTipo: 'mobiliario', label: `${i.bien} - ${i.numeroInventario || ''}`, desc: i.descripcion, sn: i.numeroSerie || 'S/S' }));
        } else { debugInfo.push('Mobiliario not ok: ' + JSON.stringify(data)); }
      } else if (tipoOpcion === 'ti') {
        const [resTec, resExis] = await Promise.all([
          fetch(`${API_BASE_URL}/api/inventario/tecnologico`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/inventario/existencias`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const dataTec = await resTec.json();
        const dataExis = await resExis.json();
        
        if (dataTec.ok && dataTec.data) {
          const arrTec = Array.isArray(dataTec.data) ? dataTec.data : (dataTec.data.items || []);
          items = [...items, ...arrTec.map(i => ({ ...i, __formTipo: 'tecnologico', label: `[Tecnológico] ${i.tipo} - ${i.numeroInventario || i.marca}`, desc: `${i.tipo} MARCA ${i.marca || 'S/M'}, MODELO ${i.modelo || 'S/M'}`, sn: i.numeroSerie || 'S/S' }))];
        } else { debugInfo.push('Tec not ok: ' + JSON.stringify(dataTec)); }
        
        if (dataExis.ok && dataExis.data) {
          const arrExis = Array.isArray(dataExis.data) ? dataExis.data : (dataExis.data.items || []);
          const exisTi = arrExis.filter(i => i.tipoInventario !== 'semaforos' && (i.categoria === 'herramienta' || i.categoria === 'equipo' || i.categoria === 'accesorio'));
          items = [...items, ...exisTi.map(i => ({ ...i, __formTipo: 'existencia', label: `[Existencia] ${i.nombre} - ${i.marca || ''}`, desc: `${i.nombre} MARCA ${i.marca || 'S/M'}`, sn: i.numeroSerie || 'S/S' }))];
        } else { debugInfo.push('Exis not ok: ' + JSON.stringify(dataExis)); }
      } else if (tipoOpcion === 'semaforos') {
        const res = await fetch(`${API_BASE_URL}/api/inventario/controladores`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.ok && data.data) {
          const arr = Array.isArray(data.data) ? data.data : (data.data.items || []);
          items = arr.map(i => ({ ...i, __formTipo: 'semaforos', label: `Controlador ${i.modelo} - Crucero ID ${i.cruceroId}`, desc: `CONTROLADOR SEMAFÓRICO MODELO ${i.modelo}`, sn: 'S/S' }));
        } else { debugInfo.push('Semaforos not ok: ' + JSON.stringify(data)); }
      }
      
      setItemsDisponibles(items);
      if (items.length > 0) {
        setForm(f => ({ ...f, itemId: items[0].id, tipoInventario: items[0].__formTipo, descripcionPdf: items[0].desc, numeroSeriePdf: items[0].sn }));
      } else {
        setForm(f => ({ ...f, itemId: '', tipoInventario: '', descripcionPdf: '', numeroSeriePdf: '' }));
        // Handle token expiration
        const tokenExpired = debugInfo.some(info => info.includes('Token inválido') || info.includes('expirado'));
        if (tokenExpired) {
          Swal.fire('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'warning').then(() => logout());
        } else if (debugInfo.length > 0) {
          console.warn('Debug Info:', debugInfo.join(' | '));
        }
      }
    } catch (err) {
      console.error('Error al cargar items:', err);
      Swal.fire('Error', 'Fallo al cargar ítems: ' + err.message, 'error');
    }
  };

  const cargarAreas = async () => {
    if (!user?.token) return;
    try {
      const token = user.token;
      const res = await fetch(`${API_BASE_URL}/api/catalogos/areas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setAreas(data.data);
      }
    } catch (err) {
      console.error('Error al cargar áreas:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarResguardos();
    cargarAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modalAbierto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarItemsDisponibles(form.tipoOpcion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalAbierto, form.tipoOpcion]);

  const handleOpcionChange = (e) => {
    const newVal = e.target.value;
    setForm({ ...form, tipoOpcion: newVal, itemId: '', tipoInventario: '', descripcionPdf: '', numeroSeriePdf: '' });
    cargarItemsDisponibles(newVal);
  };

  const handleItemChange = (e) => {
    const id = Number(e.target.value);
    const item = itemsDisponibles.find(i => i.id === id);
    if (item) {
      setForm({ ...form, itemId: id, tipoInventario: item.__formTipo, descripcionPdf: item.desc, numeroSeriePdf: item.sn });
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.itemId) return Swal.fire('Error', 'Seleccione un dispositivo o equipo', 'error');
    if (!user?.token) return;

    try {
      const token = user.token;
      const res = await fetch(`${API_BASE_URL}/api/resguardos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.ok) {
        Swal.fire('Guardado', 'Resguardo registrado exitosamente', 'success');
        setModalAbierto(false);
        setForm({ tipoOpcion: 'mobiliario', tipoInventario: 'mobiliario', itemId: '', nombreResguardante: '', area: '', observaciones: '', descripcionPdf: '', numeroSeriePdf: '' });
        cargarItemsDisponibles('mobiliario');
        cargarResguardos();
      } else {
        Swal.fire('Error', data.message || 'Error al guardar', 'error');
      }
    } catch {
      Swal.fire('Error', 'No se pudo registrar el resguardo', 'error');
    }
  };

  const marcarDevuelto = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Marcar como devuelto?',
      text: 'El equipo regresará a estar disponible y el resguardo pasará a historial.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, devuelto',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#691B31'
    });

    if (confirm.isConfirmed) {
      if (!user?.token) return;
      try {
        const token = user.token;
        const res = await fetch(`${API_BASE_URL}/api/resguardos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ estado: 'Devuelto', fechaDevolucion: new Date() })
        });
        const data = await res.json();
        if (data.ok) {
          Swal.fire('Actualizado', 'Resguardo marcado como devuelto', 'success');
          cargarResguardos();
        }
      } catch {
        Swal.fire('Error', 'Ocurrió un problema', 'error');
      }
    }
  };

  const getNombreItem = (r) => {
    if (r.tipoInventario === 'mobiliario' && r.mobiliario) return `${r.mobiliario.bien} - ${r.mobiliario.numeroInventario || ''}`;
    if (r.tipoInventario === 'tecnologico' && r.equipoTecnologico) return `${r.equipoTecnologico.tipo} - ${r.equipoTecnologico.numeroInventario || r.equipoTecnologico.marca}`;
    if (r.tipoInventario === 'existencia' && r.existencia) return `${r.existencia.nombre} - ${r.existencia.marca || ''}`;
    if (r.tipoInventario === 'semaforos' && r.controladorSemaforo) return `Controlador ${r.controladorSemaforo.modelo}`;
    return 'Desconocido';
  };

  const generarPdf = async (resguardo) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error('Failed to load image: ' + src));
        img.src = src;
      });

      try {
        const imgHeader = await loadImage(headerLogos);
        // Alinear totalmente a la derecha, con logos un poco más grandes
        doc.addImage(imgHeader, 'PNG', pageWidth - 160, 10, 150, 24);
      } catch (e) {
        console.warn('Header logo no cargado', e);
      }

      continuarPdf(doc, resguardo, pageWidth);
    } catch (error) {
      console.error('Error in generarPdf:', error);
      Swal.fire('Error PDF', error.message || 'Error al generar PDF', 'error');
    }
  };

  const continuarPdf = (doc, resguardo, pageWidth) => {
    try {
      const fechaBase = new Date(resguardo.fechaPrestamo);
      const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
      const fechaTexto = `PACHUCA DE SOTO, HIDALGO., A ${fechaBase.getDate().toString().padStart(2, '0')} DE ${meses[fechaBase.getMonth()]} DEL ${fechaBase.getFullYear()}.`;

      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(fechaTexto, pageWidth - 10, 38, { align: 'right' });

      doc.setFontSize(16);
      doc.setTextColor(178, 34, 34); // Red color for title
      doc.setFont('helvetica', 'bold');
      doc.text('RESGUARDO DE BIENES', pageWidth / 2, 60, { align: 'center' });

      // Organo / Dependencia box
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, 65, 170, 32, 3, 3);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('ÓRGANO SUPERIOR', 25, 74);
      doc.setFont('helvetica', 'normal');
      doc.text('SECRETARÍA DE MOVILIDAD Y TRANSPORTE', 75, 78);
      
      doc.setFont('helvetica', 'bold');
      doc.text('DEPENDENCIA', 25, 88);
      doc.setFont('helvetica', 'normal');
      doc.text('SISTEMA INTEGRADO DE TRANSPORTE MASIVO', 75, 92);

      // Table for Description and Serial Number
      autoTable(doc, {
        startY: 105,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: 0, lineColor: 0, lineWidth: 0.5, halign: 'center', fontStyle: 'bold' },
        bodyStyles: { textColor: 0, lineColor: 0, lineWidth: 0.5, valign: 'middle' },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' }
        },
        head: [['DESCRIPCIÓN', 'NÚMERO DE SERIE']],
        body: [
          [resguardo.descripcionPdf || '', resguardo.numeroSeriePdf || '']
        ],
        styles: { cellPadding: 8, fontSize: 12 }
      });

      // Disclaimer text
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 150;
      doc.setFontSize(11);
      doc.setTextColor(80);
      const disclaimer = 'ESTE DISPOSITIVO SE DESTINA EXCLUSIVAMENTE A ACTIVIDADES LABORALES DE ENCIERRO. EN CASO DE DAÑO, EL USUARIO SERÁ RESPONSABLE DE SU REPOSICIÓN TOTAL, CUBRIENDO EL 100% DEL COSTO.\nQUEDANDO PROHIBIDO CUALQUIER OTRO USO NO AUTORIZADO.';
      const lines = doc.splitTextToSize(disclaimer, 170);
      doc.text(lines, 20, finalY);

      // Signature line
      const signY = finalY + 70;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(60, signY, 150, signY);
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('NOMBRE Y FIRMA DEL RESGUARDANTE', pageWidth / 2, signY + 6, { align: 'center' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'normal');
      const footer = 'Blvd. Felipe Angeles Km 86 + 040\nCol. Venta Prieta\nPachuca de Soto, Hgo.,\nC. P. 42083.';
      doc.text(footer, pageWidth - 20, 270, { align: 'right' });

      // Extract the first word of the item name
      const nombreItemCompleto = getNombreItem(resguardo);
      const primeraPalabraItem = nombreItemCompleto.split(' ')[0] || 'Bien';
      
      doc.save(`Resguardo_${primeraPalabraItem}.pdf`);
    } catch (err) {
      console.error('Error in continuarPdf:', err);
      Swal.fire('Error PDF', err.message || 'Error al generar el contenido del PDF', 'error');
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FaClipboardCheck /> Resguardos
            </h1>
            <p style={{ color: '#6F7271', margin: '0.5rem 0 0', fontSize: '1rem' }}>
              Gestión de préstamos y asignaciones de dispositivos y mobiliario.
            </p>
          </div>
          <button 
            onClick={() => setModalAbierto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#BC955B', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FaPlus /> Nuevo Resguardo
          </button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o área..." 
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Dispositivo/Mueble</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Tipo</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Resguardante</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Área</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Fecha Préstamo</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resguardos.filter(r => 
                  r.nombreResguardante.toLowerCase().includes(busqueda.toLowerCase()) || 
                  r.area.toLowerCase().includes(busqueda.toLowerCase())
                ).map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem 1.5rem', color: '#1e293b' }}>{getNombreItem(r)}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#1e293b', textTransform: 'capitalize' }}>{r.tipoInventario}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#1e293b' }}>{r.nombreResguardante}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#1e293b' }}>{r.area}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#1e293b' }}>{new Date(r.fechaPrestamo).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: r.estado === 'Activo' ? '#dcfce7' : '#f1f5f9', color: r.estado === 'Activo' ? '#166534' : '#475569' }}>
                        {r.estado}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {r.estado === 'Activo' && (
                          <button onClick={() => marcarDevuelto(r.id)} title="Marcar como Devuelto" style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.5rem' }}>
                            <FaCheck size={18} />
                          </button>
                        )}
                        <button title="Generar PDF" onClick={() => generarPdf(r)} style={{ background: 'none', border: 'none', color: '#691B31', cursor: 'pointer', padding: '0.5rem' }}>
                          <FaFilePdf size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {resguardos.length === 0 && !cargando && (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay resguardos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Resguardo */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Nuevo Resguardo</h2>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleGuardar} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Categoría *</label>
                  <select required value={form.tipoOpcion} onChange={handleOpcionChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}>
                    <option value="ti">TI (Tecnologías y Existencias)</option>
                    <option value="semaforos">Semáforos</option>
                    <option value="mobiliario">Mobiliario</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Dispositivo/Equipo *</label>
                  <select required value={form.itemId} onChange={handleItemChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }}>
                    <option value="">Seleccione un ítem...</option>
                    {itemsDisponibles.map((item, idx) => (
                      <option key={`${item.__formTipo}-${item.id}-${idx}`} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Nombre del Resguardante *</label>
                  <input required type="text" value={form.nombreResguardante} onChange={e => setForm({...form, nombreResguardante: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} placeholder="Ej. Juan Pérez" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Área de Adscripción *</label>
                  <select required value={form.area} onChange={e => setForm({...form, area: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', backgroundColor: 'white' }}>
                    <option value="">Seleccione un área...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.nombre}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, color: '#475569', fontSize: '1rem', marginBottom: '1rem' }}>Datos para el PDF (Editables)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Descripción (Para el documento)</label>
                    <textarea value={form.descripcionPdf} onChange={e => setForm({...form, descripcionPdf: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', minHeight: '80px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Número de Serie (Para el documento)</label>
                    <input type="text" value={form.numeroSeriePdf} onChange={e => setForm({...form, numeroSeriePdf: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31' }} />
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Observaciones del préstamo</label>
                <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#691B31', minHeight: '60px' }} placeholder="Opcional. Ej. Pantalla rayada, incluye cables..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#691B31', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Guardar Resguardo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resguardos;
