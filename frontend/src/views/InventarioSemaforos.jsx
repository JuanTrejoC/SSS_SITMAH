import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoSitrachSrc from '../assets/logoSSS.png'
import escudoHidalgoSrc from '../assets/escudo_hidalgo.png'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { mostrarAlertaError, verificarConexion } from '../utils/conexionUtils'
import {
  FaRoad, FaPlus, FaEdit, FaTrashAlt, FaBoxes, FaEye,
  FaChevronLeft, FaChevronRight, FaTimes,
  FaCogs, FaWrench, FaHdd, FaTools,
  FaWalking, FaVolumeUp, FaDesktop, FaCreditCard,
  FaPowerOff, FaMicrochip, FaNetworkWired, FaProjectDiagram,
  FaMapMarkerAlt, FaMap, FaHandPointer, FaSign, FaCheckSquare,
  FaCalendarAlt, FaUpload, FaHistory, FaDownload, FaExclamationTriangle,
  FaListUl, FaSearch, FaBuilding, FaTrafficLight, FaVideo, FaLayerGroup,
  FaCircle, FaExternalLinkAlt, FaBroadcastTower, FaLightbulb, FaSave, FaArrowDown, FaSyncAlt, FaCube,
  FaUsers, FaBolt, FaFileArchive, FaFileExcel, FaFilePdf, FaExpand, FaCompress
} from 'react-icons/fa'

// ==================================================
// CONFIGURACIONES PREDEFINIDAS POR MODELO DE POSTE
// Ajusta los valores segun los postes de tu municipio
// ==================================================
const MODELOS_POSTE = {
  'PS-3C': {
    label: 'PS-3C — Poste Simple 3 Caras',
    semaforos3Luces: 3,
    semaforos4Luces: 0,
    totalLedsVerdes: 48,
    totalFlechasVerdes: 0,
    totalLedsRojos: 48,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 16
  },
  'PS-4C': {
    label: 'PS-4C — Poste Simple 4 Caras',
    semaforos3Luces: 0,
    semaforos4Luces: 4,
    totalLedsVerdes: 64,
    totalFlechasVerdes: 0,
    totalLedsRojos: 64,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 24
  },
  'PD-3C': {
    label: 'PD-3C — Poste Doble 3 Caras',
    semaforos3Luces: 6,
    semaforos4Luces: 0,
    totalLedsVerdes: 96,
    totalFlechasVerdes: 16,
    totalLedsRojos: 96,
    totalFlechasRojas: 16,
    totalLedsAmarillos: 32
  },
  'PD-4C': {
    label: 'PD-4C — Poste Doble 4 Caras',
    semaforos3Luces: 0,
    semaforos4Luces: 8,
    totalLedsVerdes: 128,
    totalFlechasVerdes: 24,
    totalLedsRojos: 128,
    totalFlechasRojas: 24,
    totalLedsAmarillos: 48
  }
}

const OPCIONES_COLORES_LED = [
  { valor: 'Rojo', label: 'Rojo', color: '#DC2626' },
  { valor: 'Amarillo', label: 'Amarillo', color: '#D97706' },
  { valor: 'Verde', label: 'Verde', color: '#16A34A' },
  { valor: 'Flecha Verde', label: 'Flecha Verde', color: '#059669' },
  { valor: 'Flecha Roja', label: 'Flecha Roja', color: '#B91C1C' },
  { valor: 'Ninguno', label: 'Ninguno', color: '#94A3B8' }
]

const MODELOS_POSTES_CATALOGO = [
  'PS-1',
  'PCC-1',
  'USB-2',
  'MG-10',
  'ST-100',
  'CTH-01',
  'LATIGO',
  'P300',
  'MP-01',
  'SRP',
  'M-48C',
  'CTI'
]

const normalizarNombreModeloPoste = (mod) => {
  if (!mod) return ''
  const str = String(mod).trim()
  if (str.toLowerCase().includes('pedestal') || str.toLowerCase().includes('mp-01') || str.toLowerCase() === 'poste peatonal' || str.toLowerCase() === 'peatonal') {
    return 'MP-01'
  }
  return str
}

const MODELOS_PEATONAL_CATALOGO = [
  'LVP con leyenda',
  'LVP LED con silueta',
  'LVP animado con cuenta regresiva',
  'LVP regresivo',
  'Sin cabezal luminoso (Solo audible)'
]

const MODELOS_CABEZAL_CATALOGO = [
  'LV-1',
  'LV-6',
  'LV-8',
  'LV-10',
  'Semáforo de pantalla LED'
]

const MODELOS_CAMARA_CATALOGO = [
  'Peek Traffic Unitized Camera Enclosure',
  'Peek Color Video Traffic Detection Camera'
]

const MODELOS_TARJETA_CONFLICTOS_PEEK = [
  'Model 2010E',
  'Double Diamond MMU'
]

const MODELOS_TARJETA_CONFLICTOS_C5000 = [
  'C5000 MMU Integrado'
]

const MODELOS_SWITCH_MOXA_CATALOGO = [
  { modelo: 'Moxa EDS-510E', puertos: '10' },
  { modelo: 'Moxa EDS-208 / 308', puertos: '8' }
]

const MODELOS_SWITCH_ORIUX_CATALOGO = [
  { modelo: 'C5000 ATC CPU Ports', puertos: '2' }
]

const MODELOS_RELEVADORES_PEEK = [
  'RC-308'
]

const MODELOS_RELEVADORES_SEMEX = [
  'SEMEX SG-16',
  'SEMEX SG-16E'
]

const MODELOS_RELEVADORES_C5000 = [
  'C5000 Card-Based Load Switch'
]

const DEFAULT_CABEZALES_DETALLE = [
  {
    id: 1,
    numLeds: 4,
    piezas: 0,
    leds: [
      { numero: 1, color: 'Rojo', estado: 'Funciona' },
      { numero: 2, color: 'Amarillo', estado: 'Funciona' },
      { numero: 3, color: 'Verde', estado: 'Funciona' },
      { numero: 4, color: 'Flecha Verde', estado: 'Funciona' }
    ]
  }
]

const ajustarLedsPorCantidad = (ledsExistentes, cantidad) => {
  const num = Math.max(0, parseInt(cantidad, 10) || 0)
  const coloresDefault = ['Rojo', 'Amarillo', 'Verde', 'Flecha Verde', 'Flecha Roja']
  const resultado = []

  for (let i = 0; i < num; i++) {
    if (ledsExistentes && ledsExistentes[i]) {
      resultado.push({
        ...ledsExistentes[i],
        numero: i + 1
      })
    } else {
      resultado.push({
        numero: i + 1,
        color: coloresDefault[i] || 'Verde',
        estado: 'Funciona'
      })
    }
  }
  return resultado
}

const normalizarCabezalesDetalle = (detalle, semaforos3 = 0, semaforos4 = 0) => {
  if (Array.isArray(detalle) && detalle.length > 0) {
    return detalle.map((g, idx) => ({
      ...g,
      id: g.id || idx + 1,
      numLeds: g.numLeds !== undefined ? Math.max(0, parseInt(g.numLeds, 10) || 0) : (g.leds ? g.leds.length : 4),
      piezas: g.piezas !== undefined ? Math.max(0, parseInt(g.piezas, 10) || 0) : 0,
      leds: g.leds || ajustarLedsPorCantidad([], g.numLeds || 4)
    }))
  }

  // Si viene en formato antiguo de objeto { luces4, luces3 }
  if (detalle && typeof detalle === 'object' && (detalle.luces4 || detalle.luces3)) {
    const list = []
    if (detalle.luces4 && (Number(detalle.luces4.piezas) > 0 || !detalle.luces3 || Number(detalle.luces3.piezas) === 0)) {
      list.push({
        id: 1,
        numLeds: 4,
        piezas: Number(detalle.luces4.piezas) || 0,
        leds: detalle.luces4.leds || ajustarLedsPorCantidad([], 4)
      })
    }
    if (detalle.luces3 && Number(detalle.luces3.piezas) > 0) {
      list.push({
        id: 2,
        numLeds: 3,
        piezas: Number(detalle.luces3.piezas) || 0,
        leds: detalle.luces3.leds || ajustarLedsPorCantidad([], 3)
      })
    }
    if (list.length > 0) return list
  }

  // Fallback desde columnas numéricas de la BD
  if (semaforos4 > 0 || semaforos3 > 0) {
    const list = []
    if (semaforos4 > 0 || semaforos3 === 0) {
      list.push({
        id: 1,
        numLeds: 4,
        piezas: semaforos4,
        leds: ajustarLedsPorCantidad([], 4)
      })
    }
    if (semaforos3 > 0) {
      list.push({
        id: 2,
        numLeds: 3,
        piezas: semaforos3,
        leds: ajustarLedsPorCantidad([], 3)
      })
    }
    return list
  }

  return DEFAULT_CABEZALES_DETALLE
}

const ajustarCoordenadasDanadas = (coordenadasActuales = [], cantidad = 0) => {
  const cant = Math.max(0, parseInt(cantidad, 10) || 0)
  const lista = Array.isArray(coordenadasActuales) ? [...coordenadasActuales] : []
  const resultado = []
  for (let i = 0; i < cant; i++) {
    const itemExistente = lista[i]
    if (typeof itemExistente === 'string') {
      resultado.push({ id: i + 1, coordenadas: itemExistente })
    } else if (itemExistente && typeof itemExistente === 'object') {
      resultado.push({
        id: itemExistente.id || i + 1,
        coordenadas: itemExistente.coordenadas || ''
      })
    } else {
      resultado.push({ id: i + 1, coordenadas: '' })
    }
  }
  return resultado
}

const recalcularTotalesDesdeCabezales = (grupos) => {
  const lista = normalizarCabezalesDetalle(grupos)

  let semaforos3 = 0
  let semaforos4 = 0
  let totalVerdes = 0
  let totalRojos = 0
  let totalAmarillos = 0
  let totalFlechasVerdes = 0
  let totalFlechasRojas = 0

  lista.forEach(grupo => {
    const numLeds = Math.max(0, parseInt(grupo.numLeds, 10) || 0)
    const leds = (grupo.leds || []).slice(0, numLeds)

    if (numLeds === 3) semaforos3 += 1
    if (numLeds === 4) semaforos4 += 1

    leds.forEach(led => {
      if (led.color === 'Verde') totalVerdes += 1
      else if (led.color === 'Rojo') totalRojos += 1
      else if (led.color === 'Amarillo') totalAmarillos += 1
      else if (led.color === 'Flecha Verde') totalFlechasVerdes += 1
      else if (led.color === 'Flecha Roja') totalFlechasRojas += 1
    })
  })

  return {
    semaforos4Luces: semaforos4,
    semaforos3Luces: semaforos3,
    totalLedsVerdes: totalVerdes,
    totalLedsRojos: totalRojos,
    totalLedsAmarillos: totalAmarillos,
    totalFlechasVerdes: totalFlechasVerdes,
    totalFlechasRojas: totalFlechasRojas
  }
}

const crearPeatonalInicial = (id = 1, sentido = '') => ({
  id,
  sentido: sentido || '',
  coordenadas: sentido || '',
  modelo: MODELOS_PEATONAL_CATALOGO[0] || 'LVP animado con cuenta regresiva',
  estado: 'Operando',
  observaciones: '',
  tieneAudible: false,
  audibleModelo: 'Novax DS-100 Audible',
  audibleEstado: 'Operando',
  audibleObservaciones: ''
})

const crearAudibleInicial = (id = 1, sentido = '') => ({
  id,
  sentido: sentido || '',
  modelo: 'Novax DS-100 Audible',
  estado: 'Operando',
  observaciones: ''
})

const extraerCoordenadasValidas = (input) => {
  if (!input) return null
  if (typeof input === 'object' && input !== null) {
    const lat = parseFloat(input.lat ?? input.latitude)
    const lng = parseFloat(input.lng ?? input.lon ?? input.longitude)
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }
  if (typeof input !== 'string') return null
  const str = input.trim()
  // Soporta separadores comunes como coma, espacio, pleca, punto y coma
  const regex = /(-?\d+(?:\.\d+)?)[,\s/|;]+(-?\d+(?:\.\d+)?)/
  const match = str.match(regex)
  if (match) {
    const lat = parseFloat(match[1])
    const lng = parseFloat(match[2])
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }
  return null
}

const generarPosteUid = () => `pst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`

const obtenerConfigColorLed = (color) => {
  const str = String(color || '').trim()
  const lower = str.toLowerCase()
  if (lower.includes('amarill')) {
    return { valor: 'Amarillo', label: 'Amarillo', color: '#D97706', bg: '#FEF3C7', border: '#F59E0B', isArrow: false, shadow: 'rgba(245, 158, 11, 0.4)' }
  }
  if (lower.includes('flecha verde')) {
    return { valor: 'Flecha Verde', label: 'Flecha Verde', color: '#059669', bg: '#D1FAE5', dotBg: '#4ADE80', border: '#10B981', isArrow: true, shadow: 'rgba(16, 185, 129, 0.4)' }
  }
  if (lower.includes('flecha roja')) {
    return { valor: 'Flecha Roja', label: 'Flecha Roja', color: '#B91C1C', bg: '#FEE2E2', dotBg: '#FCA5A5', border: '#DC2626', isArrow: true, shadow: 'rgba(185, 28, 28, 0.4)' }
  }
  if (lower.includes('verd')) {
    return { valor: 'Verde', label: 'Verde', color: '#16A34A', bg: '#DCFCE7', border: '#22C55E', isArrow: false, shadow: 'rgba(16, 185, 129, 0.4)' }
  }
  if (lower.includes('ningun')) {
    return { valor: 'Ninguno', label: 'Ninguno', color: '#94A3B8', bg: '#F1F5F9', border: '#CBD5E1', isArrow: false, shadow: 'transparent' }
  }
  // Por defecto 'Rojo' con configuración garantizada
  return { valor: 'Rojo', label: 'Rojo', color: '#DC2626', bg: '#FEE2E2', border: '#EF4444', isArrow: false, shadow: 'rgba(239, 68, 68, 0.4)' }
}

const extraerListaCabezales = (item) => {
  let list = []
  if (typeof item?.postesDetalle === 'string') {
    try { list = JSON.parse(item.postesDetalle) } catch (e) { list = [] }
  } else if (Array.isArray(item?.postesDetalle)) {
    list = item.postesDetalle
  }

  const cabezales = []

  // Filtrar estrictamente postes que soporten cabezales vehiculares LED
  const postesVehiculares = list.filter(p =>
    p.tipoPoste !== 'peatonal' && (p.tipoCabezal || 'LED') === 'LED'
  )

  postesVehiculares.forEach((poste, pIdx) => {
    const grupos = Array.isArray(poste.cabezalesGrupos) && poste.cabezalesGrupos.length > 0
      ? poste.cabezalesGrupos
      : []

    grupos.forEach((grupo, gIdx) => {
      const numLeds = Math.max(0, Number(grupo.numLeds) || 4)
      if (numLeds === 0) return
      const ledsRaw = Array.isArray(grupo.leds) ? grupo.leds.slice(0, numLeds) : []

      cabezales.push({
        id: `p${poste.id || pIdx + 1}-c${gIdx + 1}`,
        numero: cabezales.length + 1,
        posteIdx: poste.id || pIdx + 1,
        posteModelo: poste.modeloPoste || 'Poste',
        numLeds,
        leds: ledsRaw.map((l, i) => ({
          num: i + 1,
          color: l.color || (i === 0 ? 'Rojo' : (i === 1 ? 'Amarillo' : (i === 2 ? 'Verde' : 'Flecha Verde'))),
          estado: l.estado || 'Funciona'
        }))
      })
    })
  })

  // Fallback si no hay postes detallados pero sí semaforos3Luces / semaforos4Luces en BD
  if (cabezales.length === 0 && (Number(item?.semaforos3Luces) > 0 || Number(item?.semaforos4Luces) > 0)) {
    const s3 = Number(item.semaforos3Luces) || 0
    const s4 = Number(item.semaforos4Luces) || 0
    for (let i = 0; i < s3; i++) {
      cabezales.push({
        id: `fb-3-${i}`,
        numero: cabezales.length + 1,
        posteIdx: 1,
        posteModelo: 'Poste',
        numLeds: 3,
        leds: [
          { num: 1, color: 'Rojo', estado: 'Funciona' },
          { num: 2, color: 'Amarillo', estado: 'Funciona' },
          { num: 3, color: 'Verde', estado: 'Funciona' }
        ]
      })
    }
    for (let i = 0; i < s4; i++) {
      cabezales.push({
        id: `fb-4-${i}`,
        numero: cabezales.length + 1,
        posteIdx: 1,
        posteModelo: 'Poste',
        numLeds: 4,
        leds: [
          { num: 1, color: 'Rojo', estado: 'Funciona' },
          { num: 2, color: 'Amarillo', estado: 'Funciona' },
          { num: 3, color: 'Verde', estado: 'Funciona' },
          { num: 4, color: 'Flecha Verde', estado: 'Funciona' }
        ]
      })
    }
  }

  return cabezales
}

const crearPosteInicial = (id = 1, modelo = 'PCC-1', tipo = null, uid = null) => {
  const modeloNorm = normalizarNombreModeloPoste(modelo)
  const esPeatonal = tipo === 'peatonal' || modeloNorm === 'MP-01'
  const tipoPoste = esPeatonal ? 'peatonal' : (tipo || 'mixto')
  return {
    uid: (uid && typeof uid === 'string' && uid.length > 8 && !uid.match(/^pst_\d+$/)) ? uid : generarPosteUid(),
    id,
    guardadoEnServidor: false,
    tipoPoste, // 'mixto' (Vehicular / Mixto) | 'peatonal' (Exclusivo Peatonal / Pedestal)
    ubicacionPoste: '', // ej. 'Banqueta Poniente', 'Camellón Central / Isleta', etc.
    coordenadas: '',
    modeloPoste: esPeatonal ? 'MP-01' : (modeloNorm || 'PCC-1'),
    tapaRegistro: 'Buena',
    estadoTapaRegistro: 'Buena',
    observaciones: '',
    tipoCabezal: esPeatonal ? 'Ninguno' : 'LED',
    cabezalModelo: esPeatonal ? '' : 'LV-1',
    pantallaPiezas: '',
    pantallaEstado: 'Funciona',
    pantallasLista: [],
    cabezalesGrupos: esPeatonal ? [] : [
      {
        id: 1,
        numLeds: 4,
        leds: [
          { numero: 1, color: 'Rojo', estado: 'Funciona' },
          { numero: 2, color: 'Amarillo', estado: 'Funciona' },
          { numero: 3, color: 'Verde', estado: 'Funciona' },
          { numero: 4, color: 'Flecha Verde', estado: 'Funciona' }
        ]
      }
    ],
    tienePeatonal: esPeatonal,
    peatonalesLista: [crearPeatonalInicial(1, 'Sentido hacia Camellón')],
    peatonalModelo: esPeatonal ? MODELOS_PEATONAL_CATALOGO[0] : '',
    peatonalModuloEstado: 'Operando',
    peatonalObservaciones: '',
    tieneAudible: false,
    audiblesLista: [crearAudibleInicial(1, 'Sentido hacia Camellón')],
    audibleModelo: '',
    audibleModuloEstado: 'Operando',
    audibleObservaciones: '',
    tieneCamara: false,
    camaraModelo: '',
    camaraCantidad: '',
    camaraObservaciones: ''
  }
}

const normalizarPostesDetalle = (postesRaw, fallbackItem = null) => {
  let list = []
  if (typeof postesRaw === 'string') {
    try {
      list = JSON.parse(postesRaw)
    } catch (e) {
      list = []
    }
  } else if (Array.isArray(postesRaw)) {
    list = postesRaw
  }

  if (Array.isArray(list) && list.length > 0) {
    return list.map((p, idx) => {
      // Normalizar lista de semáforos peatonales y sus audibles integrados
      let peatonalesLista = []
      if (Array.isArray(p.peatonalesLista) && p.peatonalesLista.length > 0) {
        peatonalesLista = p.peatonalesLista.map((pt, ptIdx) => {
          const matchAud = (Array.isArray(p.audiblesLista) && p.audiblesLista[ptIdx]) || (ptIdx === 0 && p.audiblesLista?.[0])
          const tieneAud = pt.tieneAudible !== undefined
            ? Boolean(pt.tieneAudible)
            : Boolean(matchAud && (matchAud.modelo || p.tieneAudible))

          return {
            id: pt.id || ptIdx + 1,
            sentido: pt.sentido || (ptIdx === 0 ? 'Sentido hacia Camellón' : `Sentido ${ptIdx + 1}`),
            modelo: pt.modelo || p.peatonalModelo || MODELOS_PEATONAL_CATALOGO[0],
            estado: pt.estado || p.peatonalModuloEstado || 'Operando',
            observaciones: pt.observaciones || '',
            tieneAudible: tieneAud,
            audibleModelo: pt.audibleModelo || matchAud?.modelo || p.audibleModelo || 'Novax DS-100 Audible',
            audibleEstado: pt.audibleEstado || matchAud?.estado || p.audibleModuloEstado || 'Operando',
            audibleObservaciones: pt.audibleObservaciones || matchAud?.observaciones || p.audibleObservaciones || ''
          }
        })
      } else if (p.tienePeatonal || p.peatonalModelo) {
        const matchAud = (Array.isArray(p.audiblesLista) && p.audiblesLista[0]) || null
        const tieneAud = p.tieneAudible !== undefined ? !!p.tieneAudible : !!(matchAud?.modelo || p.audibleModelo)
        peatonalesLista = [{
          id: 1,
          sentido: p.peatonalSentido || 'Sentido Principal',
          modelo: p.peatonalModelo || MODELOS_PEATONAL_CATALOGO[0],
          estado: p.peatonalModuloEstado || 'Operando',
          observaciones: p.peatonalObservaciones || '',
          tieneAudible: tieneAud,
          audibleModelo: matchAud?.modelo || p.audibleModelo || 'Novax DS-100 Audible',
          audibleEstado: matchAud?.estado || p.audibleModuloEstado || 'Operando',
          audibleObservaciones: matchAud?.observaciones || p.audibleObservaciones || ''
        }]
      } else {
        peatonalesLista = [crearPeatonalInicial(1, 'Sentido hacia Camellón')]
      }

      // Sincronizar audiblesLista desde los peatonales que tengan audible activo
      let audiblesLista = peatonalesLista.filter(pt => pt.tieneAudible).map((pt, i) => ({
        id: i + 1,
        sentido: pt.sentido,
        modelo: pt.audibleModelo || 'Novax DS-100 Audible',
        estado: pt.audibleEstado || 'Operando',
        observaciones: pt.audibleObservaciones || ''
      }))

      // Si había audibles registrados previamente que no vinieran mapeados en peatonalesLista
      if (audiblesLista.length === 0 && (p.tieneAudible || p.audibleModelo)) {
        if (Array.isArray(p.audiblesLista) && p.audiblesLista.length > 0) {
          audiblesLista = p.audiblesLista.map((au, auIdx) => ({
            id: au.id || auIdx + 1,
            sentido: au.sentido || (auIdx === 0 ? 'Sentido hacia Camellón' : `Sentido ${auIdx + 1}`),
            modelo: au.modelo || p.audibleModelo || 'Novax DS-100 Audible',
            estado: au.estado || p.audibleModuloEstado || 'Operando',
            observaciones: au.observaciones || ''
          }))
        } else {
          audiblesLista = [{
            id: 1,
            sentido: p.audibleSentido || 'Sentido Principal',
            modelo: p.audibleModelo || 'Novax DS-100 Audible',
            estado: p.audibleModuloEstado || 'Operando',
            observaciones: p.audibleObservaciones || ''
          }]
        }
      }

      // Determinar tipoPoste de forma robusta
      const modeloNorm = normalizarNombreModeloPoste(p.modeloPoste)
      const esPeatonalPorModelo = modeloNorm === 'MP-01' || (p.modeloPoste && (
        p.modeloPoste.toLowerCase().includes('peatonal') ||
        p.modeloPoste.toLowerCase().includes('pedestal') ||
        p.modeloPoste.toLowerCase().includes('mp-01')
      ))
      const sinCabezalesVehiculares = p.tipoCabezal === 'Ninguno' || (!p.cabezalesGrupos || p.cabezalesGrupos.length === 0)

      let tipoPoste = p.tipoPoste
      if (tipoPoste !== 'peatonal' && tipoPoste !== 'mixto') {
        if (esPeatonalPorModelo || (sinCabezalesVehiculares && (p.tienePeatonal || p.peatonalModelo))) {
          tipoPoste = 'peatonal'
        } else {
          tipoPoste = 'mixto'
        }
      } else if (tipoPoste === 'mixto' && esPeatonalPorModelo && sinCabezalesVehiculares) {
        tipoPoste = 'peatonal'
      }

      let modeloPoste = modeloNorm || (tipoPoste === 'peatonal' ? 'MP-01' : 'PCC-1')

      const tienePeatonal = tipoPoste === 'peatonal'
        ? true
        : (p.tienePeatonal !== undefined
          ? !!p.tienePeatonal
          : !!(p.peatonalesLista?.length > 0 || p.peatonalModelo))

      const tieneAudible = audiblesLista.length > 0 || (p.tieneAudible !== undefined ? !!p.tieneAudible : !!p.audibleModelo)

      // Normalizar pantallasLista
      let pantallasLista = []
      const numPiezas = p.pantallaPiezas !== undefined && p.pantallaPiezas !== null && p.pantallaPiezas !== ''
        ? Number(p.pantallaPiezas)
        : 0

      if (Array.isArray(p.pantallasLista) && p.pantallasLista.length > 0) {
        pantallasLista = p.pantallasLista.map((pz, pzIdx) => ({
          numero: pz.numero || pzIdx + 1,
          estado: pz.estado || 'Funciona'
        }))
      } else if (numPiezas > 0) {
        const estadoGlobal = p.pantallaEstado || 'Funciona'
        pantallasLista = Array.from({ length: numPiezas }, (_, i) => ({
          numero: i + 1,
          estado: estadoGlobal
        }))
      }

      const rawUid = p.uid
      const esUidValido = rawUid && typeof rawUid === 'string' && rawUid.length > 8 && !rawUid.match(/^pst_\d+$/)
      const uid = esUidValido ? rawUid : (p.id ? `pst_db_${p.id}` : generarPosteUid())

      const rawCoords = p.ubicacionPoste || p.coordenadas || p.coordenada || p.gps || ''
      const tapaVal = p.tapaRegistro || p.estadoTapaRegistro || 'Buena'

      return {
        uid,
        id: p.id || idx + 1,
        guardadoEnServidor: p.guardadoEnServidor !== undefined ? Boolean(p.guardadoEnServidor) : true,
        tipoPoste,
        ubicacionPoste: rawCoords,
        coordenadas: rawCoords,
        modeloPoste,
        tapaRegistro: tapaVal,
        estadoTapaRegistro: tapaVal,
        observaciones: p.observaciones || '',
        tipoCabezal: tipoPoste === 'peatonal' ? 'Ninguno' : (p.tipoCabezal || 'LED'),
        cabezalModelo: tipoPoste === 'peatonal' ? '' : (p.cabezalModelo || 'LV-1'),
        pantallaPiezas: tipoPoste === 'peatonal' ? '' : (numPiezas > 0 ? numPiezas : (p.pantallaPiezas !== undefined ? p.pantallaPiezas : '')),
        pantallaEstado: tipoPoste === 'peatonal' ? 'Funciona' : (p.pantallaEstado || (pantallasLista.some(x => x.estado === 'No funciona') ? 'Parcial' : 'Funciona')),
        pantallasLista: tipoPoste === 'peatonal' ? [] : pantallasLista,
        cabezalesGrupos: tipoPoste === 'peatonal' ? [] : normalizarCabezalesDetalle(p.cabezalesGrupos || p.cabezalesDetalle || DEFAULT_CABEZALES_DETALLE),
        tienePeatonal,
        peatonalesLista,
        peatonalModelo: peatonalesLista[0]?.modelo || p.peatonalModelo || '',
        peatonalModuloEstado: peatonalesLista[0]?.estado || p.peatonalModuloEstado || 'Operando',
        peatonalObservaciones: peatonalesLista[0]?.observaciones || p.peatonalObservaciones || '',
        tieneAudible,
        audiblesLista,
        audibleModelo: audiblesLista[0]?.modelo || p.audibleModelo || '',
        audibleModuloEstado: audiblesLista[0]?.estado || p.audibleModuloEstado || 'Operando',
        audibleObservaciones: audiblesLista[0]?.observaciones || p.audibleObservaciones || '',
        tieneCamara: p.tieneCamara !== undefined ? !!p.tieneCamara : !!(p.camaraModelo || p.camaraCantidad),
        camaraModelo: p.camaraModelo || '',
        camaraCantidad: p.camaraCantidad || '',
        camaraObservaciones: p.camaraObservaciones || ''
      }
    })
  }

  if (fallbackItem && (fallbackItem.semaforos3Luces > 0 || fallbackItem.semaforos4Luces > 0 || fallbackItem.pasoPeatonal || fallbackItem.posteModeloTipo)) {
    let parsedDetalle = null
    if (fallbackItem.cabezalesDetalle) {
      try {
        parsedDetalle = typeof fallbackItem.cabezalesDetalle === 'string' ? JSON.parse(fallbackItem.cabezalesDetalle) : fallbackItem.cabezalesDetalle
      } catch (e) { }
    }
    const grupos = normalizarCabezalesDetalle(parsedDetalle, fallbackItem.semaforos3Luces, fallbackItem.semaforos4Luces)

    const tienePeatonal = !!(fallbackItem.pasoPeatonal || fallbackItem.peatonalModelo)
    const tieneAudible = !!(fallbackItem.audible || fallbackItem.audibleModelo)
    const esPeatonal = (fallbackItem.posteModeloTipo && normalizarNombreModeloPoste(fallbackItem.posteModeloTipo) === 'MP-01')
      || (!fallbackItem.semaforos3Luces && !fallbackItem.semaforos4Luces && tienePeatonal)

    return [{
      uid: fallbackItem?.id ? `pst_fb_${fallbackItem.id}_1` : generarPosteUid(),
      id: 1,
      guardadoEnServidor: true,
      tipoPoste: esPeatonal ? 'peatonal' : 'mixto',
      ubicacionPoste: fallbackItem.coordenadas || fallbackItem.ubicacionPoste || '',
      coordenadas: fallbackItem.coordenadas || fallbackItem.ubicacionPoste || '',
      modeloPoste: fallbackItem.posteModeloTipo || (esPeatonal ? 'MP-01' : (fallbackItem.modeloPoste || 'PCC-1')),
      tapaRegistro: fallbackItem.posteTapaRegistro || 'Buena',
      estadoTapaRegistro: fallbackItem.posteTapaRegistro || 'Buena',
      observaciones: fallbackItem.posteObservaciones || '',
      tipoCabezal: esPeatonal ? 'Ninguno' : (fallbackItem.tipoCabezal || 'LED'),
      cabezalModelo: esPeatonal ? '' : (fallbackItem.cabezalModelo || 'LV-1'),
      pantallaPiezas: fallbackItem.pantallaPiezas || 0,
      pantallaEstado: fallbackItem.pantallaEstado || 'Funciona',
      pantallasLista: Array.from({ length: Number(fallbackItem.pantallaPiezas) || 0 }, (_, i) => ({
        numero: i + 1,
        estado: fallbackItem.pantallaEstado || 'Funciona'
      })),
      cabezalesGrupos: grupos,
      tienePeatonal,
      peatonalesLista: tienePeatonal ? [{
        id: 1,
        sentido: 'Sentido Principal',
        modelo: fallbackItem.peatonalModelo || MODELOS_PEATONAL_CATALOGO[0],
        estado: fallbackItem.peatonalModuloEstado || 'Operando',
        observaciones: fallbackItem.peatonalObservaciones || ''
      }] : [crearPeatonalInicial(1)],
      peatonalModelo: fallbackItem.peatonalModelo || '',
      peatonalModuloEstado: fallbackItem.peatonalModuloEstado || 'Operando',
      peatonalObservaciones: fallbackItem.peatonalObservaciones || '',
      tieneAudible,
      audiblesLista: tieneAudible ? [{
        id: 1,
        sentido: 'Sentido Principal',
        modelo: fallbackItem.audibleModelo || 'Novax DS-100 Audible',
        estado: fallbackItem.audibleModuloEstado || 'Operando',
        observaciones: fallbackItem.audibleObservaciones || ''
      }] : [crearAudibleInicial(1)],
      audibleModelo: fallbackItem.audibleModelo || '',
      audibleModuloEstado: fallbackItem.audibleModuloEstado || 'Operando',
      audibleObservaciones: fallbackItem.audibleObservaciones || '',
      tieneCamara: !!(fallbackItem.camaraModelo || fallbackItem.camaraCantidad),
      camaraModelo: fallbackItem.camaraModelo || '',
      camaraCantidad: fallbackItem.camaraCantidad || '',
      camaraObservaciones: fallbackItem.camaraObservaciones || ''
    }]
  }

  return []
}

const recalcularTotalesDesdePostes = (postes) => {
  const listaPostes = Array.isArray(postes) ? postes : []

  // Los cabezales vehiculares se toman de postes que NO sean exclusivo peatonal
  const allCabezalesGrupos = listaPostes.flatMap(p =>
    p.tipoPoste !== 'peatonal' && (p.tipoCabezal || 'LED') === 'LED'
      ? normalizarCabezalesDetalle(p.cabezalesGrupos)
      : []
  )

  const ledsTotales = recalcularTotalesDesdeCabezales(allCabezalesGrupos)

  const tienePantalla = listaPostes.some(p => p.tipoPoste !== 'peatonal' && p.tipoCabezal === 'Pantalla')
  const totalPantallaPiezas = listaPostes.reduce((acc, p) => (p.tipoPoste !== 'peatonal' && p.tipoCabezal === 'Pantalla') ? acc + (Number(p.pantallaPiezas) || 0) : acc, 0)

  const pantallasPostes = listaPostes
    .filter(p => p.tipoPoste !== 'peatonal' && p.tipoCabezal === 'Pantalla')
    .flatMap(p => Array.isArray(p.pantallasLista) && p.pantallasLista.length > 0 ? p.pantallasLista : [{ estado: p.pantallaEstado || 'Funciona' }])

  let estadoPantallasConsolidado = 'Funciona'
  if (pantallasPostes.length > 0) {
    const hayFalla = pantallasPostes.some(x => x.estado === 'No funciona')
    const todasFallan = pantallasPostes.every(x => x.estado === 'No funciona')
    estadoPantallasConsolidado = todasFallan ? 'No funciona' : (hayFalla ? 'Parcial' : 'Funciona')
  }

  const peatonalesLuminosos = (p) => {
    if (!p.tienePeatonal) return []
    if (Array.isArray(p.peatonalesLista) && p.peatonalesLista.length > 0) {
      return p.peatonalesLista.filter(pt => pt.modelo && !pt.modelo.toLowerCase().includes('sin cabezal'))
    }
    if (p.peatonalModelo && !p.peatonalModelo.toLowerCase().includes('sin cabezal')) {
      return [{ modelo: p.peatonalModelo }]
    }
    return []
  }

  const tienePasoPeatonal = listaPostes.some(p => p.tienePeatonal && peatonalesLuminosos(p).length > 0)
  const totalPeatonales = listaPostes.reduce((acc, p) => p.tienePeatonal ? acc + peatonalesLuminosos(p).length : acc, 0)

  const audiblesTotalCount = listaPostes.reduce((acc, p) => {
    if (p.tienePeatonal && Array.isArray(p.peatonalesLista) && p.peatonalesLista.length > 0) {
      const dePeatonales = p.peatonalesLista.filter(pt => pt.tieneAudible).length
      if (dePeatonales > 0) return acc + dePeatonales
    }
    return p.tieneAudible ? acc + (p.audiblesLista?.length || 1) : acc
  }, 0)
  const tieneAudible = audiblesTotalCount > 0 || listaPostes.some(p => p.tieneAudible && (p.audiblesLista?.length > 0 || p.audibleModelo))
  const totalAudibles = audiblesTotalCount

  const tieneCamara = listaPostes.some(p => p.tieneCamara)
  const totalCamaras = listaPostes.reduce((acc, p) => p.tieneCamara ? acc + (parseInt(p.camaraCantidad, 10) || 0) : acc, 0)

  const modelosPostes = [...new Set(listaPostes.map(p => normalizarNombreModeloPoste(p.modeloPoste)).filter(Boolean))].join(', ')
  const primerPoste = listaPostes[0] || {}
  const primerPosteModelo = normalizarNombreModeloPoste(primerPoste.modeloPoste)

  const primerPeatonal = listaPostes.find(p => p.tienePeatonal && peatonalesLuminosos(p).length > 0)?.peatonalesLista?.[0]
  const primerAudible = listaPostes.flatMap(p => (p.tienePeatonal ? (p.peatonalesLista || []) : [])).find(pt => pt.tieneAudible)
    || listaPostes.find(p => p.tieneAudible && p.audiblesLista?.[0])?.audiblesLista?.[0]

  return {
    ...ledsTotales,
    pantallaLed: tienePantalla,
    pantallaPiezas: totalPantallaPiezas,
    pantallaEstado: estadoPantallasConsolidado,
    pasoPeatonal: tienePasoPeatonal,
    totalPeatonales,
    audible: tieneAudible,
    totalAudibles,
    poste: listaPostes.length > 0,
    modeloPoste: modelosPostes || primerPosteModelo || '',
    posteModeloTipo: primerPosteModelo || '',
    posteTapaRegistro: primerPoste.tapaRegistro || 'Buena',
    posteObservaciones: listaPostes.map((p, i) => {
      const ubi = p.ubicacionPoste ? ` (${p.ubicacionPoste})` : ''
      return p.observaciones ? `Poste ${i + 1}${ubi}: ${p.observaciones}` : ''
    }).filter(Boolean).join(' | '),
    peatonalModelo: primerPeatonal?.modelo || listaPostes.find(p => p.tienePeatonal && p.peatonalModelo)?.peatonalModelo || '',
    peatonalModuloEstado: primerPeatonal?.estado || listaPostes.find(p => p.tienePeatonal && p.peatonalModuloEstado)?.peatonalModuloEstado || '',
    audibleModelo: primerAudible?.audibleModelo || primerAudible?.modelo || listaPostes.find(p => p.tieneAudible && p.audibleModelo)?.audibleModelo || '',
    audibleModuloEstado: primerAudible?.audibleEstado || primerAudible?.estado || listaPostes.find(p => p.tieneAudible && p.audibleModuloEstado)?.audibleModuloEstado || '',
    camaraModelo: listaPostes.find(p => p.tieneCamara && p.camaraModelo)?.camaraModelo || '',
    camaraCantidad: totalCamaras > 0 ? String(totalCamaras) : (listaPostes.find(p => p.tieneCamara && p.camaraCantidad)?.camaraCantidad || ''),
    cabezalesDetalle: allCabezalesGrupos.length > 0 ? allCabezalesGrupos : DEFAULT_CABEZALES_DETALLE
  }
}

const getCategoriaLabel = (cat) => {
  const categories = {
    componente: 'Componente',
    accesorio: 'Accesorio',
    periferico: 'Periférico',
    equipo: 'Equipo',
    herramienta: 'Herramienta'
  };
  return categories[cat] || cat;
};

const getCategoriaIcon = (cat) => {
  switch (cat) {
    case 'componente': return <FaCogs style={{ color: '#4f46e5' }} />;
    case 'accesorio': return <FaWrench style={{ color: '#0d9488' }} />;
    case 'periferico': return <FaHdd style={{ color: '#ea580c' }} />;
    case 'equipo': return <FaTools style={{ color: '#eab308' }} />;
    default: return <FaBoxes style={{ color: '#64748b' }} />;
  }
};

export default function InventarioSemaforos() {
  const { user } = useAuth() || {}
  const [tabActiva, setTabActiva] = useState('existencias') // 'existencias' o 'controladores'

  // ==========================================
  // ESTADOS - CATALOGOS
  // ==========================================
  const [listaCruceros, setListaCruceros] = useState([])

  // ==========================================
  // ESTADOS - EXISTENCIAS / REFACCIONES
  // ==========================================
  const [existencias, setExistencias] = useState([])
  const [cargandoExistencias, setCargandoExistencias] = useState(false)
  const [modalStockAbierto, setModalStockAbierto] = useState(false)
  const [modoAjusteDirecto, setModoAjusteDirecto] = useState(false)
  const [editandoStockId, setEditandoStockId] = useState(null)
  const [busquedaExistencias, setBusquedaExistencias] = useState('')
  const [stockForm, setStockForm] = useState({
    nombre: '',
    categoria: 'componente',
    cantidad: 1,
    tipoInventario: 'semaforos'
  })

  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false)
  const [historialData, setHistorialData] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [componenteHistorialActual, setComponenteHistorialActual] = useState(null)
  const [filtroMesHistorial, setFiltroMesHistorial] = useState('')

  // Estados para consolidación y desglose de existencias de semáforos
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)
  const [busquedaDesglose, setBusquedaDesglose] = useState('')

  const getColoresParaComponente = () => {
    return { colorStripe: '#691B31', colorBadge: '#691B31', bgBadge: '#fdf2f4' };
  };

  const agruparExistenciasDisponibles = (items) => {
    const gruposMap = {};

    items.forEach(item => {
      const nombreRaw = (item.nombre || 'Componente').trim();
      const n = nombreRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      let claveBase = '';
      let nombreGrupo = nombreRaw;

      // Normalización inteligente para que variantes de leds u otros componentes se consoliden
      if (n.includes('led') && (n.includes('amarill') || n.includes('amarrill'))) {
        claveBase = 'led_amarillos';
        nombreGrupo = 'Led Amarillo';
      } else if (n.includes('led') && (n.includes('roj') || n.includes('rojp'))) {
        claveBase = 'led_rojos';
        nombreGrupo = 'Led Rojo';
      } else if (n.includes('led') && n.includes('verd')) {
        claveBase = 'led_verdes';
        nombreGrupo = 'Led Verde';
      } else {
        // Clave normalizada basada en el nombre
        claveBase = n.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (!claveBase) claveBase = 'componente_' + (item.id || 'general');
      }

      if (!gruposMap[claveBase]) {
        const colores = getColoresParaComponente(nombreGrupo, item.categoria);
        gruposMap[claveBase] = {
          id: `grupo-${claveBase}`,
          esGrupo: true,
          key: claveBase,
          nombre: nombreGrupo,
          categoria: item.categoria || 'componente',
          marca: item.marca || 'SEMEX',
          colorStripe: colores.colorStripe,
          colorBadge: colores.colorBadge,
          bgBadge: colores.bgBadge,
          cantidad: 0,
          subItems: []
        };
      }

      gruposMap[claveBase].cantidad += (Number(item.cantidad) || 0);
      gruposMap[claveBase].subItems.push(item);

      if ((!gruposMap[claveBase].marca || gruposMap[claveBase].marca === 'SEMEX') && item.marca) {
        gruposMap[claveBase].marca = item.marca;
      }
    });

    return Object.values(gruposMap);
  };

  const coincideBusquedaSemaforo = (item, busquedaTexto) => {
    if (!busquedaTexto || !busquedaTexto.trim()) return true;

    const normalizar = (txt) =>
      (txt || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const rawNorm = normalizar(busquedaTexto);
    const conectores = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'con', 'para', 'y', 'o', 'un', 'una']);
    const tokens = rawNorm
      .split(/\s+/)
      .filter(t => t.length > 0 && (rawNorm.split(/\s+/).length === 1 || !conectores.has(t)));

    const obtenerTextosDeItem = (target) => {
      return [
        target.nombre,
        target.marca,
        target.modelo,
        target.numeroSerie,
        target.numeroInventario,
        target.categoria,
        target.ubicacion,
        target.estadoFisico,
        target.cruceroOrigen,
        target.observaciones
      ]
        .filter(Boolean)
        .map(normalizar)
        .join(' ');
    };

    if (item.esGrupo) {
      const textosGrupo = [item.nombre, item.marca, item.categoria, item.key]
        .filter(Boolean)
        .map(normalizar)
        .join(' ');

      const coincideCabecera = tokens.every(token => textosGrupo.includes(token));
      if (coincideCabecera) return true;

      return item.subItems && item.subItems.some(sub => {
        const textosSub = obtenerTextosDeItem(sub) + ' ' + textosGrupo;
        return tokens.every(token => textosSub.includes(token));
      });
    }

    const pool = obtenerTextosDeItem(item);
    return tokens.every(token => pool.includes(token));
  };

  // ==========================================
  // ESTADOS - CONTROLADORES INSTALADOS
  // ==========================================
  const [controladores, setControladores] = useState([])
  const [todosLosControladores, setTodosLosControladores] = useState([])
  const [busquedaControlador, setBusquedaControlador] = useState('')
  const [filtroModeloControlador, setFiltroModeloControlador] = useState('')
  const [dbSemaforosTipo, setDbSemaforosTipo] = useState(null)
  const [dbSemaforosItem, setDbSemaforosItem] = useState(null)
  const [dbSemaforosExpandido, setDbSemaforosExpandido] = useState(false)
  const [cargandoControladores, setCargandoControladores] = useState(false)
  const [totalControladores, setTotalControladores] = useState(0)
  const [paginaControladores, setPaginaControladores] = useState(1)
  const [limiteControladores] = useState(10)
  const [modalControladorAbierto, setModalControladorAbierto] = useState(false)
  const [editandoControladorId, setEditandoControladorId] = useState(null)
  const [modoVisualizacion, setModoVisualizacion] = useState(false)
  const [formPantallaCompleta, setFormPantallaCompleta] = useState(false)
  const [mostrarProgramacion, setMostrarProgramacion] = useState(false)
  const [archivoProgramacion, setArchivoProgramacion] = useState(null)
  const archivoProgramacionInputRef = useRef(null)

  // Modelos únicos de controladores para el filtro select
  const modelosDisponibles = Array.from(
    new Set((todosLosControladores || []).map(c => c.modelo).filter(Boolean))
  ).sort()

  const hayFiltroControladorActivo = Boolean(
    (busquedaControlador && busquedaControlador.trim()) ||
    (filtroModeloControlador && filtroModeloControlador !== '') ||
    (dbSemaforosTipo && tabActiva === 'controladores')
  )

  const controladoresFiltrados = (todosLosControladores || []).filter((ctrl) => {
    if (filtroModeloControlador && filtroModeloControlador !== '') {
      if ((ctrl.modelo || '').trim().toLowerCase() !== filtroModeloControlador.trim().toLowerCase()) {
        return false
      }
    }
    if (dbSemaforosTipo && tabActiva === 'controladores') {
      if ((ctrl.modelo || '').trim().toLowerCase() !== dbSemaforosTipo.trim().toLowerCase()) {
        return false
      }
    }
    if (busquedaControlador && busquedaControlador.trim()) {
      const q = busquedaControlador.trim().toLowerCase()
      const cruceroNombre = (ctrl.crucero?.nombre || '').toLowerCase()
      const cruceroUbicacion = (ctrl.crucero?.ubicacion || '').toLowerCase()
      const modelo = (ctrl.modelo || '').toLowerCase()
      const gabinete = (ctrl.numeroGabinete || '').toLowerCase()
      const ip = (ctrl.ipLocal || '').toLowerCase()
      const fw = (ctrl.versionFirmware || '').toLowerCase()
      const obs = (ctrl.observacionesExterior || ctrl.posteObservaciones || '').toLowerCase()

      const coincide = cruceroNombre.includes(q) ||
        cruceroUbicacion.includes(q) ||
        modelo.includes(q) ||
        gabinete.includes(q) ||
        ip.includes(q) ||
        fw.includes(q) ||
        obs.includes(q)
      if (!coincide) return false
    }
    return true
  })

  const controladoresParaMostrar = hayFiltroControladorActivo
    ? controladoresFiltrados
    : controladores

  const [controladorForm, setControladorForm] = useState({
    modelo: '',
    cruceroId: '',
    semaforos3Luces: 0,
    semaforos4Luces: 0,
    totalLedsVerdes: 0,
    totalFlechasVerdes: 0,
    totalLedsRojos: 0,
    totalFlechasRojas: 0,
    totalLedsAmarillos: 0,
    pasoPeatonal: false,
    audible: false,
    pantallaLed: false,
    tarjetaRelevadora: false,
    tarjetaRelevadoraDetalle: '',
    fuentePoder: false,
    cpu: false,
    cpuDetalle: '',
    switch: false,
    fibraOptica: false,
    gps: false,
    gpsDetalle: '',
    botonera: false,
    poste: false,
    modeloPoste: '',
    // Inspección Exterior / Cimentación y Base
    cimientoCompleto: '',
    cimientoCuantosDados: '',
    tapaCableado: '',
    tornilleriaBaseCompleta: '',
    tornilleriaCuantosTornillos: '',
    observacionesExterior: '',
    // Electrónica Interna - Módulo GPS
    gpsModelo: '',
    gpsComponenteFisico: '',
    gpsAntenaExterior: '',
    // Electrónica Interna - Configuración y Red
    numeroGabinete: '',
    versionFirmware: '',
    ipLocal: '',
    ipSystem: '',
    mascaraRed: '',
    gateway: '',
    cicloCompleto: '',
    respaldoProgramacionUsb: '',
    // Electrónica Interna - Conflictos y Relevadores
    tarjetaConflictosMarcaModo: 'Peek Traffic',
    tarjetaConflictosMarca: 'Peek Traffic',
    tarjetaConflictosModelo: 'Model 2010E',
    tarjetaConflictosEstado: '',
    tarjetaRelevadoresMarcaModo: 'Peek Traffic',
    tarjetaRelevadoresMarca: 'Peek Traffic',
    tarjetaRelevadoresModelo: 'RC-308',
    tarjetaRelevadoresCantidad: '',
    // Sección C: Red, Conectividad y Energía
    switchFibraMarcaModo: 'Moxa',
    switchFibraMarca: 'Moxa',
    switchFibraModelo: 'Moxa EDS-208 / 308',
    switchFibraPuertosTotal: '8',
    switchFibraPuertosUso: '',
    switchFibraFuentePoder: '',
    receptorFibraDispositivo: '',
    receptorFibraCable: '',
    conexionesTarjetaMadre: '',
    fuentePoderSupresorPicos: '',
    // Sección D: Postes y Equipamiento Asociado
    postes: [],
    posteModeloTipo: '',
    posteTapaRegistro: 'Buena',
    posteObservaciones: '',
    // Cabezales Vehiculares
    tipoCabezal: 'LED',
    cabezalModelo: 'LV-1',
    pantallaPiezas: '',
    pantallaEstado: 'Funciona',
    cabezalesDetalle: DEFAULT_CABEZALES_DETALLE,
    // Semáforos Peatonales
    peatonalModelo: '',
    peatonalModuloEstado: '',
    peatonalObservaciones: '',
    audibleModelo: '',
    audibleModuloEstado: '',
    audibleObservaciones: '',
    // Cámaras Videodetectoras
    camaraModelo: '',
    camaraCantidad: '',
    camaraObservaciones: '',
    // Registros de Piso
    registrosPisoTapas: '',
    registrosPisoDanados: '',
    registrosPisoCoordenadas: []
  })

  const [controladorErrores, setControladorErrores] = useState({})
  const [capturandoGpsIndex, setCapturandoGpsIndex] = useState(null)
  const [capturandoGpsPosteIndex, setCapturandoGpsPosteIndex] = useState(null)
  const [mapasPostesVisibles, setMapasPostesVisibles] = useState({})
  const [mapasDanadasVisibles, setMapasDanadasVisibles] = useState({})
  const [guardandoModularSeccion, setGuardandoModularSeccion] = useState(null)
  const [guardandoIniciando, setGuardandoIniciando] = useState(false)
  const [modalVerControladorAbierto, setModalVerControladorAbierto] = useState(false)
  const [controladorParaVer, setControladorParaVer] = useState(null)
  const [tabFichaActiva, setTabFichaActiva] = useState('postes')

  // ==========================================
  // EFECTOS Y CARGA DE DATOS
  // ==========================================
  // ==========================================
  const cargarCatalogos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogos/cruceros`)
      if (res.ok) {
        const json = await res.json()
        if (json.ok) setListaCruceros(json.data)
      }
    } catch (err) {
      console.error('Error al cargar catálogo de cruceros:', err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCatalogos()
  }, [])

  const cargarExistencias = async (silencioso = false) => {
    if (!user?.token) return
    if (!silencioso) setCargandoExistencias(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/existencias?tipoInventario=semaforos`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.ok) setExistencias(json.data)
      }
    } catch (err) {
      console.error('Error al cargar existencias:', err)
    } finally {
      if (!silencioso) setCargandoExistencias(false)
    }
  }

  const cargarTodosLosControladores = async () => {
    if (!user?.token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores?page=1&limit=1000`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.ok) {
          setTodosLosControladores(json.data.items)
        }
      }
    } catch (err) {
      console.error('Error al cargar todos los controladores:', err)
    }
  }

  const cargarControladores = async (silencioso = false) => {
    if (!user?.token) return
    if (!silencioso) setCargandoControladores(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/inventario/controladores?page=${paginaControladores}&limit=${limiteControladores}`,
        { headers: { 'Authorization': `Bearer ${user.token}` } }
      )
      if (res.ok) {
        const json = await res.json()
        if (json.ok) {
          setControladores(json.data.items)
          setTotalControladores(json.data.total)
          cargarTodosLosControladores()
        }
      }
    } catch (err) {
      console.error('Error al cargar controladores:', err)
    } finally {
      if (!silencioso) setCargandoControladores(false)
    }
  }

  useEffect(() => {
    if (tabActiva === 'existencias') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarExistencias()
    } else {
      cargarControladores()
      cargarTodosLosControladores()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva, paginaControladores])

  // Sincronización automática en vivo (al enfocar la ventana y sondeo periódico silencioso sin parpadeos de UI)
  useEffect(() => {
    const sincronizarDatosEnVivo = () => {
      cargarCatalogos()
      if (tabActiva === 'controladores') {
        cargarControladores(true)
      } else {
        cargarExistencias(true)
      }
    }

    const handleFocus = () => {
      sincronizarDatosEnVivo()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sincronizarDatosEnVivo()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      // Refrescar en segundo plano de forma 100% silenciosa para que la UI no parpadee ni se mueva
      if (tabActiva === 'controladores' && !modalControladorAbierto) {
        cargarControladores(true)
      } else if (tabActiva === 'existencias' && !modalStockAbierto) {
        cargarExistencias(true)
      }
    }, 15000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva, modalControladorAbierto, modalStockAbierto, paginaControladores])

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (modalStockAbierto || modalHistorialAbierto || modalControladorAbierto || grupoSeleccionado) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalStockAbierto, modalHistorialAbierto, modalControladorAbierto, grupoSeleccionado])

  // Desactivar cambio de valores por scroll o rueda del mouse en inputs numéricos
  useEffect(() => {
    const handleWheelNumberInput = () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur()
      }
    }
    window.addEventListener('wheel', handleWheelNumberInput, { passive: true })
    return () => window.removeEventListener('wheel', handleWheelNumberInput)
  }, [])


  // ==========================================
  // ACCIONES - EXISTENCIAS / REFACCIONES
  // ==========================================
  const handleGuardarStock = async (e) => {
    e.preventDefault()
    if (!verificarConexion()) return
    if (!stockForm.nombre.trim()) {
      Swal.fire('Error', 'El nombre del componente es obligatorio.', 'error')
      return
    }

    const url = editandoStockId
      ? `${API_BASE_URL}/api/inventario/existencias/${editandoStockId}`
      : `${API_BASE_URL}/api/inventario/existencias`
    const method = editandoStockId ? 'PUT' : 'POST'

    const cantidadFinal = stockForm.cantidad === '' || isNaN(Number(stockForm.cantidad)) ? 1 : Math.max(0, Number(stockForm.cantidad))

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ ...stockForm, cantidad: cantidadFinal })
      })

      const json = await res.json().catch(() => ({}))

      if (res.ok && json.ok) {
        Swal.fire({
          title: 'Éxito',
          text: editandoStockId ? 'Existencias actualizadas correctamente.' : 'Existencias ingresadas correctamente.',
          icon: 'success',
          confirmButtonColor: '#691B31'
        })
        setModalStockAbierto(false)
        resetStockForm()
        cargarExistencias()
      } else {
        mostrarAlertaError(json.error || 'No se pudo guardar la refacción.', 'Error', 'No se pudo guardar la refacción.')
      }
    } catch (err) {
      console.error('Error al guardar existencias:', err)
      mostrarAlertaError(err, 'Error', 'Ocurrió un error al guardar existencias.')
    }
  }

  const handleEditarStock = (item) => {
    setEditandoStockId(item.id)
    setModoAjusteDirecto(false)
    setStockForm({
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad,
      marca: item.marca || '',
      modelo: item.modelo || '',
      numeroSerie: item.numeroSerie || '',
      numeroInventario: item.numeroInventario || '',
      tipoInventario: 'semaforos'
    })
    setModalStockAbierto(true)
  }

  // eslint-disable-next-line no-unused-vars
  const handleEliminarStock = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Se eliminará esta refacción por completo del stock.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/existencias/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        })

        const json = await res.json().catch(() => ({}))
        if (res.ok && json.ok) {
          Swal.fire('Eliminado', 'La refacción ha sido eliminada del inventario.', 'success')
          cargarExistencias()
        } else {
          mostrarAlertaError(json.error || 'No se pudo eliminar.', 'Error', 'No se pudo eliminar la refacción.')
        }
      } catch (err) {
        console.error('Error al eliminar existencia:', err)
        mostrarAlertaError(err, 'Error', 'No se pudo eliminar la refacción.')
      }
    }
  }

  const handleAjustarStockDirecto = (item) => {
    setEditandoStockId(item.id)
    setModoAjusteDirecto(true)
    setStockForm({
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad,
      marca: item.marca || '',
      modelo: item.modelo || '',
      numeroSerie: item.numeroSerie || '',
      numeroInventario: item.numeroInventario || '',
      tipoInventario: 'semaforos'
    })
    setModalStockAbierto(true)
  }

  const resetStockForm = () => {
    setEditandoStockId(null)
    setModoAjusteDirecto(false)
    setStockForm({
      nombre: '',
      categoria: 'componente',
      cantidad: '',
      marca: '',
      modelo: '',
      numeroSerie: '',
      numeroInventario: '',
      tipoInventario: 'semaforos'
    })
  }

  const abrirHistorial = async (item) => {
    setComponenteHistorialActual(item)
    setFiltroMesHistorial('')
    setModalHistorialAbierto(true)
    setCargandoHistorial(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/existencias/${item.id}/historial`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.ok) setHistorialData(json.data)
      }
    } catch (err) {
      console.error('Error al cargar historial:', err)
    } finally {
      setCargandoHistorial(false)
    }
  }

  const cerrarHistorial = () => {
    setModalHistorialAbierto(false)
    setHistorialData([])
    setComponenteHistorialActual(null)
  }

  // ==========================================
  // ACCIONES - CONTROLADORES INSTALADOS
  // ==========================================
  const validarControlador = (mostrarAlerta = true) => {
    const errores = {}

    // 1. Cabecera principal
    if (!controladorForm.modelo || !controladorForm.modelo.trim()) {
      errores.modelo = 'El modelo del controlador es obligatorio.'
    }
    if (!controladorForm.cruceroId) {
      errores.cruceroId = 'Debes seleccionar el crucero correspondiente.'
    }

    // 2. Sección 1: Cimentación y Tornillería
    if (controladorForm.cimientoCompleto === 'No') {
      const val = (controladorForm.cimientoCuantosDados || '').trim()
      if (!val) {
        errores.cimientoCuantosDados = 'Indique cuántos dados tiene.'
      } else {
        const num = parseInt(val, 10)
        if (isNaN(num) || num > 3 || num < 0) {
          errores.cimientoCuantosDados = 'Máximo 3 dados (0 a 3).'
        }
      }
    }
    if (controladorForm.tornilleriaBaseCompleta === 'No') {
      const val = (controladorForm.tornilleriaCuantosTornillos || '').trim()
      if (!val) {
        errores.tornilleriaCuantosTornillos = 'Indique cuántos tornillos tiene.'
      } else {
        const num = parseInt(val, 10)
        if (isNaN(num) || num > 3 || num < 0) {
          errores.tornilleriaCuantosTornillos = 'Máximo 3 tornillos (0 a 3).'
        }
      }
    }

    // 3. Sección 3: Gabinete, Red y Configuración
    const esIpValida = (ip) => !ip || ip.trim() === '' || /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip.trim())
    if (controladorForm.ipLocal && !esIpValida(controladorForm.ipLocal)) {
      errores.ipLocal = 'IP Local inválida (ej. 192.168.1.100).'
    }
    if (controladorForm.ipSystem && !esIpValida(controladorForm.ipSystem)) {
      errores.ipSystem = 'IP System inválida (ej. 10.0.0.1).'
    }
    if (controladorForm.mascaraRed && !esIpValida(controladorForm.mascaraRed)) {
      errores.mascaraRed = 'Máscara de red inválida (ej. 255.255.255.0).'
    }
    if (controladorForm.gateway && !esIpValida(controladorForm.gateway)) {
      errores.gateway = 'Gateway inválido (ej. 192.168.1.1).'
    }
    if (controladorForm.cicloCompleto && String(controladorForm.cicloCompleto).trim() !== '') {
      const ciclo = parseInt(controladorForm.cicloCompleto, 10)
      if (isNaN(ciclo) || ciclo <= 0 || ciclo > 600) {
        errores.cicloCompleto = 'El ciclo completo debe ser positivo (ej. 90 segundos).'
      }
    }
    if (controladorForm.tarjetaRelevadoresCantidad && String(controladorForm.tarjetaRelevadoresCantidad).trim() !== '') {
      const cantRel = parseInt(controladorForm.tarjetaRelevadoresCantidad, 10)
      if (isNaN(cantRel) || cantRel < 0 || cantRel > 64) {
        errores.tarjetaRelevadoresCantidad = 'La cantidad de relevadores debe ser entre 0 y 64.'
      }
    }

    // 4. Sección 4: Switch de Fibra (Validación Lógica de Puertos)
    const totalPuertos = parseInt(controladorForm.switchFibraPuertosTotal, 10)
    const puertosUso = parseInt(controladorForm.switchFibraPuertosUso, 10)
    if (controladorForm.switchFibraPuertosTotal !== '' && !isNaN(totalPuertos) && totalPuertos < 0) {
      errores.switchFibraPuertosTotal = 'El total de puertos no puede ser negativo.'
    }
    if (controladorForm.switchFibraPuertosUso !== '' && !isNaN(puertosUso)) {
      if (puertosUso < 0) {
        errores.switchFibraPuertosUso = 'Los puertos en uso no pueden ser negativos.'
      } else if (!isNaN(totalPuertos) && totalPuertos > 0 && puertosUso > totalPuertos) {
        errores.switchFibraPuertosUso = `Los puertos en uso (${puertosUso}) no pueden superar el total de puertos (${totalPuertos}).`
      }
    }

    // 5. Sección 6: Registros de Piso (Validación Lógica de Tapas y Dañadas)
    const totalTapas = parseInt(controladorForm.registrosPisoTapas, 10)
    const regDanados = parseInt(controladorForm.registrosPisoDanados, 10)
    if (controladorForm.registrosPisoTapas !== '' && !isNaN(totalTapas) && totalTapas < 0) {
      errores.registrosPisoTapas = 'La cantidad de tapas no puede ser negativa.'
    }
    if (controladorForm.registrosPisoDanados !== '' && !isNaN(regDanados)) {
      if (regDanados < 0) {
        errores.registrosPisoDanados = 'Los registros dañados no pueden ser negativos.'
      } else if (!isNaN(totalTapas) && totalTapas >= 0 && regDanados > totalTapas) {
        errores.registrosPisoDanados = `Los registros dañados (${regDanados}) no pueden superar el total de tapas (${totalTapas}).`
      }
    }

    // 6. Equipamiento: Cámaras videodetectoras
    if (controladorForm.camaraCantidad && String(controladorForm.camaraCantidad).trim() !== '') {
      const cantC = parseInt(controladorForm.camaraCantidad, 10)
      if (isNaN(cantC) || cantC < 0) {
        errores.camaraCantidad = 'La cantidad de cámaras no puede ser negativa.'
      }
    }
    if (Array.isArray(controladorForm.postes)) {
      controladorForm.postes.forEach((p, idx) => {
        if (p.tieneCamara) {
          const cantCam = parseInt(p.camaraCantidad, 10)
          if (p.camaraCantidad !== '' && !isNaN(cantCam) && cantCam < 1) {
            errores[`poste_${idx}_camara`] = `Poste ${idx + 1}: La cantidad de cámaras no puede ser menor a 1.`
          }
        }
      })
    }

    setControladorErrores(errores)

    const esValido = Object.keys(errores).length === 0
    if (!esValido && mostrarAlerta) {
      const listaHtml = Object.values(errores).map(e => `<li>${e}</li>`).join('')
      Swal.fire({
        icon: 'warning',
        title: 'Verifique los datos del controlador',
        html: `<p style="font-size: 0.9rem; margin-bottom: 0.5rem; text-align: left;">Se detectaron inconsistencias en el formulario:</p><ul style="text-align: left; font-size: 0.85rem; color: #DC2626; padding-left: 1.25rem;">${listaHtml}</ul>`,
        confirmButtonColor: '#691B31'
      })
    }

    return esValido
  }

  const handleGuardarControlador = async (e) => {
    e.preventDefault()
    if (!verificarConexion()) return
    if (!validarControlador()) return

    const url = editandoControladorId
      ? `${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}`
      : `${API_BASE_URL}/api/inventario/controladores`
    const metodo = editandoControladorId ? 'PUT' : 'POST'

    try {
      const formData = new FormData()
      Object.keys(controladorForm).forEach(key => {
        if (key === 'cabezalesDetalle') {
          formData.append('cabezalesDetalle', JSON.stringify(controladorForm.cabezalesDetalle || DEFAULT_CABEZALES_DETALLE))
        } else if (key === 'postes') {
          const postesConUid = (controladorForm.postes || []).map((p, idx) => ({
            ...p,
            uid: (p.uid && typeof p.uid === 'string' && p.uid.length > 8 && !p.uid.match(/^pst_\d+$/))
              ? p.uid
              : `pst_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`
          }))
          formData.append('postesDetalle', JSON.stringify(postesConUid))
        } else if (key === 'registrosPisoCoordenadas') {
          formData.append('registrosPisoCoordenadas', JSON.stringify(controladorForm.registrosPisoCoordenadas || []))
        } else if (key === 'tarjetaConflictosMarcaModo' || key === 'switchFibraMarcaModo' || key === 'tarjetaRelevadoresMarcaModo') {
          // Excluir modos de interfaz auxiliar
        } else {
          formData.append(key, controladorForm[key])
        }
      })

      if (archivoProgramacion) {
        if (archivoProgramacion instanceof File) {
          formData.append('archivoProgramacion', archivoProgramacion)
        }
      } else if (editandoControladorId) {
        formData.append('removerArchivo', 'true')
      }

      const res = await fetch(url, {
        method: metodo,
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      })

      const json = await res.json().catch(() => ({}))

      if (res.ok && json.ok) {
        const numPostesFinal = json.data?.postesDetalle?.length || (controladorForm.postes || []).length
        Swal.fire({
          title: '¡Sincronizado y Guardado!',
          text: editandoControladorId 
            ? `Controlador actualizado correctamente. Hay ${numPostesFinal} poste(s) consolidados en este crucero.` 
            : 'Controlador registrado.',
          icon: 'success',
          confirmButtonColor: '#691B31'
        })
        setModalControladorAbierto(false)
        resetControladorForm()
        cargarControladores()
        cargarTodosLosControladores()
        cargarCatalogos()
      } else {
        mostrarAlertaError(json.error || 'Ocurrió un problema al guardar el controlador.', 'Error', 'No se pudo guardar el controlador.')
      }
    } catch (err) {
      console.error('Error al guardar controlador:', err)
      mostrarAlertaError(err, 'Error', 'No se pudo guardar el controlador.')
    }
  }

  const handleCrearNuevoCruceroRapido = async () => {
    const { value: nombreCrucero } = await Swal.fire({
      title: 'Registrar Nuevo Crucero',
      input: 'text',
      inputLabel: 'Nombre o intersección del crucero',
      inputPlaceholder: 'Ej. Av. Juárez esq. Guerrero',
      showCancelButton: true,
      confirmButtonText: 'Guardar Crucero',
      confirmButtonColor: '#691B31',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#6F7271',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar un nombre para el crucero'
        }
      }
    })

    if (!nombreCrucero || !nombreCrucero.trim()) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogos/cruceros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ nombre: nombreCrucero.trim() })
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        await cargarCatalogos()
        const nuevoId = json.data?.id
        if (nuevoId) {
          setControladorForm(prev => ({ ...prev, cruceroId: String(nuevoId) }))
        }
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Crucero "${nombreCrucero.trim()}" registrado`,
          showConfirmButton: false,
          timer: 2500
        })
      } else {
        mostrarAlertaError(json.error || 'No se pudo crear el crucero.', 'Error', 'Error al registrar crucero.')
      }
    } catch (err) {
      console.error('Error al crear crucero:', err)
      mostrarAlertaError(err, 'Error', 'No se pudo registrar el crucero.')
    }
  }

  const handleIniciarLevantamiento = async () => {
    if (!verificarConexion()) return
    if (!controladorForm.modelo.trim()) {
      setControladorErrores(prev => ({ ...prev, modelo: 'El modelo es obligatorio para iniciar el crucero.' }))
      Swal.fire('Atención', 'Selecciona el modelo del controlador para iniciar.', 'info')
      return
    }
    if (!controladorForm.cruceroId) {
      setControladorErrores(prev => ({ ...prev, cruceroId: 'El crucero es obligatorio para iniciar.' }))
      Swal.fire('Atención', 'Selecciona el crucero para iniciar.', 'info')
      return
    }

    setGuardandoIniciando(true)
    try {
      const formData = new FormData()
      formData.append('modelo', controladorForm.modelo)
      formData.append('cruceroId', controladorForm.cruceroId)
      const postesConUid = (controladorForm.postes || []).map((p, idx) => ({
        ...p,
        uid: (p.uid && typeof p.uid === 'string' && p.uid.length > 8 && !p.uid.match(/^pst_\d+$/))
          ? p.uid
          : `pst_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`
      }))
      formData.append('postesDetalle', JSON.stringify(postesConUid))

      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        setEditandoControladorId(json.data.id)
        if (json.data.postesDetalle) {
          const postesNorm = normalizarPostesDetalle(json.data.postesDetalle)
          setControladorForm(prev => ({ ...prev, postes: postesNorm }))
        }
        cargarControladores()
        cargarTodosLosControladores()
        cargarCatalogos()
        Swal.fire({
          title: 'Crucero Iniciado',
          text: 'Se ha creado el expediente de este crucero en el servidor. Ahora tú y tus compañeros pueden registrar postes y gabinete simultáneamente.',
          icon: 'success',
          confirmButtonColor: '#691B31'
        })
      } else {
        mostrarAlertaError(json.error || 'No se pudo iniciar el crucero.', 'Error', 'Ocurrió un problema.')
      }
    } catch (err) {
      console.error('Error al iniciar crucero:', err)
      mostrarAlertaError(err, 'Error', 'No se pudo iniciar el crucero.')
    } finally {
      setGuardandoIniciando(false)
    }
  }

  const handleGuardarGabineteModular = async () => {
    if (!editandoControladorId) return
    if (!verificarConexion()) return
    if (!controladorForm.modelo.trim() || !controladorForm.cruceroId) {
      Swal.fire('Datos incompletos', 'Modelo y crucero son obligatorios.', 'warning')
      return
    }
    // Validar coherencia en switch de fibra
    const totalPuertos = parseInt(controladorForm.switchFibraPuertosTotal, 10)
    const puertosUso = parseInt(controladorForm.switchFibraPuertosUso, 10)
    if (!isNaN(totalPuertos) && !isNaN(puertosUso) && totalPuertos > 0 && puertosUso > totalPuertos) {
      setControladorErrores(prev => ({
        ...prev,
        switchFibraPuertosUso: `Los puertos en uso (${puertosUso}) no pueden superar el total (${totalPuertos}).`
      }))
      Swal.fire({
        icon: 'warning',
        title: 'Inconsistencia en Switch de Fibra',
        text: `Los puertos en uso (${puertosUso}) no pueden superar el total de puertos (${totalPuertos}).`,
        confirmButtonColor: '#691B31'
      })
      return
    }

    setGuardandoModularSeccion('gabinete')
    try {
      const formData = new FormData()
      const camposGabinete = [
        'modelo', 'cruceroId',
        'tarjetaConflictosMarca', 'tarjetaConflictosModelo', 'tarjetaConflictosEstado',
        'tarjetaRelevadoresMarca', 'tarjetaRelevadoresModelo', 'tarjetaRelevadoresCantidad',
        'tarjetaRelevadora', 'fuentePoder', 'cpu', 'switch', 'fibraOptica', 'gps', 'botonera',
        'cimientoCompleto', 'cimientoCuantosDados', 'tapaCableado', 'tornilleriaBaseCompleta', 'tornilleriaCuantosTornillos',
        'observacionesExterior', 'gpsModelo', 'gpsComponenteFisico', 'gpsAntenaExterior',
        'numeroGabinete', 'versionFirmware', 'ipLocal', 'ipSystem', 'mascaraRed', 'gateway',
        'cicloCompleto', 'respaldoProgramacionUsb',
        'switchFibraMarca', 'switchFibraModelo', 'switchFibraPuertosTotal', 'switchFibraPuertosUso', 'switchFibraFuentePoder',
        'receptorFibraDispositivo', 'receptorFibraCable', 'conexionesTarjetaMadre', 'fuentePoderSupresorPicos'
      ]

      camposGabinete.forEach(key => {
        if (controladorForm[key] !== undefined && controladorForm[key] !== null) {
          formData.append(key, controladorForm[key])
        }
      })

      if (archivoProgramacion instanceof File) {
        formData.append('archivoProgramacion', archivoProgramacion)
      } else if (!archivoProgramacion) {
        formData.append('removerArchivo', 'true')
      }

      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/gabinete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Gabinete guardado exitosamente',
          showConfirmButton: false,
          timer: 2500
        })
        cargarControladores()
        cargarTodosLosControladores()
      } else {
        mostrarAlertaError(json.error || 'No se pudo guardar el gabinete.', 'Error', 'Ocurrió un error al guardar.')
      }
    } catch (err) {
      console.error('Error guardando gabinete:', err)
      mostrarAlertaError(err, 'Error', 'No se pudo guardar el gabinete.')
    } finally {
      setGuardandoModularSeccion(null)
    }
  }

  const handleRefrescarPostes = async () => {
    if (!editandoControladorId) return
    setGuardandoModularSeccion('refrescandoPostes')
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/postes`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        const rawPostes = json.data?.postes || json.postes || []
        const postesServidor = normalizarPostesDetalle(rawPostes)
        const uidsServidor = new Set(postesServidor.map(p => p.uid).filter(Boolean))
        // Preservar borradores locales que el técnico esté capturando actualmente y aún no haya guardado
        const localesNuevos = (controladorForm.postes || [])
          .filter(p => p.uid && !uidsServidor.has(p.uid) && !p.guardadoEnServidor)
        const listaFinal = [...postesServidor, ...localesNuevos]
        const totales = recalcularTotalesDesdePostes(listaFinal)
        setControladorForm(prev => ({
          ...prev,
          ...totales,
          postes: listaFinal
        }))
        cargarControladores()
        cargarTodosLosControladores()
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Sincronizado: ${postesServidor.length} poste(s) en servidor`,
          showConfirmButton: false,
          timer: 2000
        })
      } else {
        mostrarAlertaError(json.error || 'No se pudieron obtener los postes.', 'Error', 'Error al sincronizar.')
      }
    } catch (err) {
      console.error('Error sincronizando postes:', err)
      mostrarAlertaError(err, 'Error', 'No se pudieron sincronizar los postes.')
    } finally {
      setGuardandoModularSeccion(null)
    }
  }

  const handleGuardarPosteModular = async (pIdx) => {
    if (!editandoControladorId) return
    const listaActual = controladorForm.postes || []
    const posteAGuardar = listaActual[pIdx]
    if (!posteAGuardar) return

    setGuardandoModularSeccion(`poste-${pIdx}`)
    try {
      const yaEnServidor = Boolean(posteAGuardar.guardadoEnServidor)
      const ident = posteAGuardar.uid || posteAGuardar.id
      const url = yaEnServidor && ident
        ? `${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/postes/${ident}`
        : `${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/postes`
      const metodo = yaEnServidor && ident ? 'PUT' : 'POST'

      let res = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ poste: posteAGuardar })
      })

      // Fallback: Si el servidor responde 404 porque el poste aún no existía en BD, crearlo con POST
      if (metodo === 'PUT' && res.status === 404) {
        const postUrl = `${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/postes`
        res = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ poste: posteAGuardar })
        })
      }

      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        const rawPostes = json.data?.postes || json.postes || []
        const postesServidor = normalizarPostesDetalle(rawPostes)
        // Preservar postes locales que aún no se hayan guardado en el servidor usando UID (NUNCA por id numérico)
        const uidsServidor = new Set(postesServidor.map(p => p.uid).filter(Boolean))
        const localesNoGuardados = listaActual.filter(p => {
          if (!p.uid) return false
          if (p.uid === posteAGuardar.uid) return false // el recién guardado ya está en postesServidor
          return !uidsServidor.has(p.uid) && !p.guardadoEnServidor
        })
        const listaFinal = [...postesServidor, ...localesNoGuardados]
        const totales = recalcularTotalesDesdePostes(listaFinal)
        setControladorForm(prev => ({
          ...prev,
          ...totales,
          postes: listaFinal
        }))
        cargarControladores()
        cargarTodosLosControladores()
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Poste guardado en el servidor (${postesServidor.length} en el crucero)`,
          showConfirmButton: false,
          timer: 2500
        })
      } else {
        mostrarAlertaError(json.error || 'No se pudo guardar el poste.', 'Error', 'Error al guardar el poste.')
      }
    } catch (err) {
      console.error('Error guardando poste modular:', err)
      mostrarAlertaError(err, 'Error', 'No se pudo guardar el poste.')
    } finally {
      setGuardandoModularSeccion(null)
    }
  }

  const handleEliminarPosteModular = async (pIdx) => {
    const listaActual = controladorForm.postes || []
    const poste = listaActual[pIdx]
    if (!poste) return

    const confirmacion = await Swal.fire({
      title: `¿Eliminar Poste #${pIdx + 1}?`,
      text: poste.ubicacionPoste ? `Ubicación: ${poste.ubicacionPoste}` : 'Se quitará este poste del crucero.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmacion.isConfirmed) return

    // Lista resultante local sin el poste eliminado
    const restantesLocales = listaActual.filter((_, idx) => idx !== pIdx)
    const ident = poste.uid || poste.id

    if (editandoControladorId && poste && poste.guardadoEnServidor && ident) {
      setGuardandoModularSeccion(`poste-del-${pIdx}`)
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/postes/${ident}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json.ok) {
          const rawPostes = json.data?.postes || json.postes || []
          const postesServidor = normalizarPostesDetalle(rawPostes)
          const uidsServidor = new Set(postesServidor.map(p => p.uid).filter(Boolean))
          const localesNoGuardados = restantesLocales.filter(p => p.uid && !uidsServidor.has(p.uid) && !p.guardadoEnServidor)
          const listaFinal = [...postesServidor, ...localesNoGuardados]
          const totales = recalcularTotalesDesdePostes(listaFinal)
          setControladorForm(prev => ({
            ...prev,
            ...totales,
            postes: listaFinal
          }))
          cargarControladores()
          cargarTodosLosControladores()
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Poste eliminado',
            showConfirmButton: false,
            timer: 2000
          })
        } else {
          // Si el servidor dio 404 (porque el poste era nuevo y nunca se guardó en BD), aplicar la eliminación local
          const totales = recalcularTotalesDesdePostes(restantesLocales)
          setControladorForm(prev => ({
            ...prev,
            ...totales,
            postes: restantesLocales
          }))
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Poste eliminado localmente',
            showConfirmButton: false,
            timer: 2000
          })
        }
      } catch (err) {
        console.error('Error eliminando poste:', err)
        const totales = recalcularTotalesDesdePostes(restantesLocales)
        setControladorForm(prev => ({
          ...prev,
          ...totales,
          postes: restantesLocales
        }))
      } finally {
        setGuardandoModularSeccion(null)
      }
    } else {
      // Poste solo existía localmente en borrador
      const totales = recalcularTotalesDesdePostes(restantesLocales)
      setControladorForm(prev => ({
        ...prev,
        ...totales,
        postes: restantesLocales
      }))
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Poste eliminado',
        showConfirmButton: false,
        timer: 1800
      })
    }
  }

  const handleGuardarRegistrosPisoModular = async () => {
    if (!editandoControladorId) return
    if (!verificarConexion()) return

    const totalTapas = parseInt(controladorForm.registrosPisoTapas, 10)
    const regDanados = parseInt(controladorForm.registrosPisoDanados, 10)
    if (!isNaN(totalTapas) && !isNaN(regDanados) && regDanados > totalTapas) {
      setControladorErrores(prev => ({
        ...prev,
        registrosPisoDanados: `Los registros dañados (${regDanados}) no pueden superar el total de tapas (${totalTapas}).`
      }))
      Swal.fire({
        icon: 'warning',
        title: 'Inconsistencia en Registros de Piso',
        text: `No puede haber más registros dañados (${regDanados}) que el total de tapas (${totalTapas}).`,
        confirmButtonColor: '#691B31'
      })
      return
    }

    setGuardandoModularSeccion('registros')
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/registros-piso`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          registrosPisoTapas: controladorForm.registrosPisoTapas,
          registrosPisoDanados: controladorForm.registrosPisoDanados,
          registrosPisoCoordenadas: controladorForm.registrosPisoCoordenadas
        })
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Registros de piso guardados exitosamente',
          showConfirmButton: false,
          timer: 2500
        })
        cargarControladores()
        cargarTodosLosControladores()
      } else {
        mostrarAlertaError(json.error || 'No se pudieron guardar los registros de piso.', 'Error', 'Error al guardar.')
      }
    } catch (err) {
      console.error('Error guardando registros de piso:', err)
      mostrarAlertaError(err, 'Error', 'No se pudieron guardar los registros de piso.')
    } finally {
      setGuardandoModularSeccion(null)
    }
  }

  const mapearDatosControladorAForm = (item) => {
    let parsedDetalle = null
    if (item.cabezalesDetalle) {
      try {
        parsedDetalle = typeof item.cabezalesDetalle === 'string' ? JSON.parse(item.cabezalesDetalle) : item.cabezalesDetalle
      } catch (e) {
        console.error('Error parseando cabezalesDetalle:', e)
      }
    }
    const detalle = normalizarCabezalesDetalle(parsedDetalle, item.semaforos3Luces, item.semaforos4Luces)
    const postesCargados = normalizarPostesDetalle(item.postesDetalle, item)
    const totalesPostes = recalcularTotalesDesdePostes(postesCargados)

    let parsedCoords = []
    if (item.registrosPisoCoordenadas) {
      try {
        parsedCoords = typeof item.registrosPisoCoordenadas === 'string'
          ? JSON.parse(item.registrosPisoCoordenadas)
          : item.registrosPisoCoordenadas
      } catch (e) {
        console.error('Error parseando registrosPisoCoordenadas:', e)
      }
    }
    const coordsAjustadas = ajustarCoordenadasDanadas(parsedCoords, item.registrosPisoDanados || 0)

    const initConflictosMarca = item.tarjetaConflictosMarca || (item.tarjetaConflictosModelo?.includes('C5000') || item.modelo === 'C-5000' ? 'Oriux (Peek Traffic)' : (item.tarjetaConflictosModelo?.includes('2010E') || item.tarjetaConflictosModelo?.includes('Diamond') ? 'Peek Traffic' : (item.tarjetaConflictosModelo ? 'Otro' : '')))
    const modoConflictos = (initConflictosMarca === 'Peek Traffic' || initConflictosMarca === 'Oriux (Peek Traffic)') ? initConflictosMarca : (initConflictosMarca ? 'Otro' : '')

    const initSwitchMarca = item.switchFibraMarca || (item.switchFibraModelo?.includes('C5000') || item.switchFibraModelo?.includes('ATC') || item.modelo === 'C-5000' ? 'Oriux' : (item.switchFibraModelo?.includes('Moxa') ? 'Moxa' : (item.switchFibraModelo ? 'Otro' : '')))
    const modoSwitch = (initSwitchMarca === 'Moxa' || initSwitchMarca === 'Oriux') ? initSwitchMarca : (initSwitchMarca ? 'Otro' : '')

    const initRelevadoresMarca = item.tarjetaRelevadoresMarca || (item.tarjetaRelevadoresModelo?.includes('RC-308') || item.tarjetaRelevadoresModelo?.includes('Peek') ? 'Peek Traffic' : (item.tarjetaRelevadoresModelo?.includes('C5000') || item.modelo === 'C-5000' ? 'Oriux' : (item.tarjetaRelevadoresModelo && item.tarjetaRelevadoresModelo.includes('SEMEX') ? 'SEMEX' : (item.tarjetaRelevadoresModelo ? 'Otro' : 'Peek Traffic'))))
    const modoRelevadores = (initRelevadoresMarca === 'Peek Traffic' || initRelevadoresMarca === 'SEMEX' || initRelevadoresMarca === 'Oriux') ? initRelevadoresMarca : (initRelevadoresMarca ? 'Otro' : '')

    return {
      modelo: item.modelo || '',
      cruceroId: item.cruceroId || '',
      ...totalesPostes,
      postes: postesCargados,
      tarjetaRelevadora: item.tarjetaRelevadora || false,
      tarjetaRelevadoraDetalle: item.tarjetaRelevadoraDetalle || '',
      fuentePoder: item.fuentePoder || false,
      cpu: item.cpu || false,
      cpuDetalle: item.cpuDetalle || '',
      switch: item.switch || false,
      fibraOptica: item.fibraOptica || false,
      gps: item.gps || false,
      gpsDetalle: item.gpsDetalle || '',
      botonera: item.botonera || false,
      // Inspección Exterior / Cimentación y Base
      cimientoCompleto: item.cimientoCompleto || '',
      cimientoCuantosDados: item.cimientoCuantosDados || '',
      tapaCableado: item.tapaCableado || '',
      tornilleriaBaseCompleta: item.tornilleriaBaseCompleta || '',
      tornilleriaCuantosTornillos: item.tornilleriaCuantosTornillos || '',
      observacionesExterior: item.observacionesExterior || '',
      // Electrónica Interna - Módulo GPS
      gpsModelo: item.gpsModelo || '',
      gpsComponenteFisico: item.gpsComponenteFisico || '',
      gpsAntenaExterior: item.gpsAntenaExterior || '',
      // Electrónica Interna - Configuración y Red
      numeroGabinete: item.numeroGabinete || '',
      versionFirmware: item.versionFirmware || '',
      ipLocal: item.ipLocal || '',
      ipSystem: item.ipSystem || '',
      mascaraRed: item.mascaraRed || '',
      gateway: item.gateway || '',
      cicloCompleto: item.cicloCompleto || '',
      respaldoProgramacionUsb: item.respaldoProgramacionUsb || '',
      // Electrónica Interna - Conflictos y Relevadores
      tarjetaConflictosMarcaModo: modoConflictos,
      tarjetaConflictosMarca: initConflictosMarca,
      tarjetaConflictosModelo: item.tarjetaConflictosModelo ? item.tarjetaConflictosModelo.replace(/^Peek\s+/i, '') : '',
      tarjetaConflictosEstado: item.tarjetaConflictosEstado || '',
      tarjetaRelevadoresMarcaModo: modoRelevadores,
      tarjetaRelevadoresMarca: initRelevadoresMarca,
      tarjetaRelevadoresModelo: item.tarjetaRelevadoresModelo || '',
      tarjetaRelevadoresCantidad: item.tarjetaRelevadoresCantidad || '',
      // Sección C: Red, Conectividad y Energía
      switchFibraMarcaModo: modoSwitch,
      switchFibraMarca: initSwitchMarca,
      switchFibraModelo: item.switchFibraModelo ? item.switchFibraModelo.replace(/\s*\((No )?administrable\)/i, '') : '',
      switchFibraPuertosTotal: item.switchFibraPuertosTotal || '',
      switchFibraPuertosUso: item.switchFibraPuertosUso || '',
      switchFibraFuentePoder: item.switchFibraFuentePoder || '',
      receptorFibraDispositivo: item.receptorFibraDispositivo || '',
      receptorFibraCable: item.receptorFibraCable || '',
      conexionesTarjetaMadre: item.conexionesTarjetaMadre || '',
      fuentePoderSupresorPicos: item.fuentePoderSupresorPicos || '',
      // Registros de Piso
      registrosPisoTapas: item.registrosPisoTapas !== undefined && item.registrosPisoTapas !== null ? String(item.registrosPisoTapas) : '',
      registrosPisoDanados: item.registrosPisoDanados !== undefined && item.registrosPisoDanados !== null ? item.registrosPisoDanados : '',
      registrosPisoCoordenadas: coordsAjustadas
    }
  }

  const handleVerControlador = async (item) => {
    setEditandoControladorId(item.id)
    setControladorParaVer(item)
    setModoVisualizacion(true)
    setFormPantallaCompleta(true)
    setControladorForm(mapearDatosControladorAForm(item))
    setArchivoProgramacion(item.archivoProgramacion || null)
    setControladorErrores({})
    cargarCatalogos()

    // Abrir automáticamente todos los mapas de postes con coordenadas válidas
    const postesNorm = normalizarPostesDetalle(item.postesDetalle, item)
    const mapasVis = {}
    postesNorm.forEach((p, idx) => {
      if (extraerCoordenadasValidas(p.ubicacionPoste || p.coordenadas)) {
        mapasVis[idx] = true
      }
    })
    setMapasPostesVisibles(mapasVis)

    setModalControladorAbierto(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${item.id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.data) {
        setControladorParaVer(json.data)
        setControladorForm(mapearDatosControladorAForm(json.data))
        if (json.data.archivoProgramacion) {
          setArchivoProgramacion(json.data.archivoProgramacion)
        }
        const freshPostes = normalizarPostesDetalle(json.data.postesDetalle, json.data)
        const freshMapas = {}
        freshPostes.forEach((p, idx) => {
          if (extraerCoordenadasValidas(p.ubicacionPoste || p.coordenadas)) {
            freshMapas[idx] = true
          }
        })
        setMapasPostesVisibles(freshMapas)
      }
    } catch (err) {
      console.warn('No se pudo refrescar controlador en segundo plano para vista:', err)
    }
  }

  const handleEditarControlador = async (item) => {
    setEditandoControladorId(item.id)
    setModoVisualizacion(false)
    setFormPantallaCompleta(false)
    setControladorForm(mapearDatosControladorAForm(item))
    setArchivoProgramacion(item.archivoProgramacion || null)
    setControladorErrores({})
    setModalControladorAbierto(true)
    cargarCatalogos()

    // Consultar el servidor para asegurar que tenemos la información más fresca (en vivo) por si otro técnico guardó
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${item.id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.data) {
        setControladorForm(mapearDatosControladorAForm(json.data))
        if (json.data.archivoProgramacion) {
          setArchivoProgramacion(json.data.archivoProgramacion)
        }
      }
    } catch (err) {
      console.warn('No se pudo refrescar controlador en segundo plano:', err)
    }
  }

  const handleEliminarControlador = async (id) => {
    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'No podrá deshacer esta acción. El controlador se eliminará del inventario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A02142',
      cancelButtonColor: '#6F7271',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        })

        const json = await res.json().catch(() => ({}))
        if (res.ok && json.ok) {
          Swal.fire('Eliminado', 'El controlador ha sido eliminado del inventario.', 'success')
          cargarControladores()
          cargarTodosLosControladores()
          cargarCatalogos()
        } else {
          mostrarAlertaError(json.error || 'No se pudo eliminar el controlador.', 'Error', 'No se pudo eliminar el controlador.')
        }
      } catch (err) {
        console.error('Error al eliminar controlador:', err)
        mostrarAlertaError(err, 'Error', 'No se pudo eliminar el controlador.')
      }
    }
  }

  // ==========================================
  // EXPORTACIÓN A EXCEL Y PDF (CONTROLADORES)
  // ==========================================
  const loadImgBase64 = (src) => new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })

  const exportarControladoresExcel = async () => {
    try {
      Swal.fire({
        title: 'Generando Reporte Excel...',
        text: 'Por favor espere un momento.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      const params = new URLSearchParams()
      if (hayFiltroControladorActivo) {
        if (controladoresFiltrados && controladoresFiltrados.length > 0) {
          params.append('ids', controladoresFiltrados.map(c => c.id).join(','))
        }
        if (busquedaControlador && busquedaControlador.trim()) {
          params.append('search', busquedaControlador.trim())
        }
        if (filtroModeloControlador && filtroModeloControlador !== '') {
          params.append('modelo', filtroModeloControlador)
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/inventario/controladores/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const sufijo = hayFiltroControladorActivo ? '_filtrado' : '_completo'
        const fechaStr = new Date().toISOString().slice(0, 10)
        a.download = `Controladores_Semaforicos_SITRAC-H${sufijo}_${fechaStr}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        Swal.close()
        Swal.fire({
          icon: 'success',
          title: 'Reporte Excel generado',
          text: 'El archivo Excel se descargó con el diseño ejecutivo oficial.',
          timer: 2000,
          showConfirmButton: false
        })
        return
      }

      throw new Error('Respuesta no exitosa del servidor')
    } catch (err) {
      console.warn('Generando con fallback local de Excel:', err)
      // Fallback local mejorado y limpio (13 columnas estructuradas)
      try {
        const lista = hayFiltroControladorActivo
          ? controladoresFiltrados
          : (todosLosControladores && todosLosControladores.length > 0 ? todosLosControladores : controladores)

        if (!lista || lista.length === 0) {
          Swal.close()
          Swal.fire('Atención', 'No hay controladores para exportar.', 'warning')
          return
        }

        const dataToExport = lista.map((ctrl, index) => {
          const postesNorm = normalizarPostesDetalle(ctrl.postesDetalle, ctrl)
          const resumenPostes = postesNorm.length > 0
            ? `${postesNorm.length} poste(s): ` + postesNorm.map((p, i) => {
                const mod = p.modeloPoste || p.modelo || p.posteModeloTipo || 'S/M'
                const tipo = p.tipoPoste === 'peatonal' ? 'Peatonal' : 'Vehicular'
                return `[Poste ${i + 1}: ${mod} (${tipo})]`
              }).join(', ')
            : '0 postes'

          const sem3L = Number(ctrl.semaforos3Luces) || 0
          const sem4L = Number(ctrl.semaforos4Luces) || 0
          const totalCab = sem3L + sem4L

          const ledsV = Number(ctrl.totalLedsVerdes) || 0
          const ledsR = Number(ctrl.totalLedsRojos) || 0
          const ledsA = Number(ctrl.totalLedsAmarillos) || 0
          const flechasV = Number(ctrl.totalFlechasVerdes) || 0
          const flechasR = Number(ctrl.totalFlechasRojas) || 0
          const totalLeds = ledsV + ledsR + ledsA + flechasV + flechasR

          const peatPartes = []
          if (ctrl.pasoPeatonal) peatPartes.push('Paso Peatonal')
          if (ctrl.audible) peatPartes.push('Audible')
          if (ctrl.pantallaLed) peatPartes.push('Pantalla LED')
          if (ctrl.botonera) peatPartes.push('Botonera')
          const peatStr = peatPartes.length > 0 ? peatPartes.join(', ') : 'Sin dispositivos'

          const elecPartes = []
          if (ctrl.cpu) elecPartes.push('CPU')
          if (ctrl.tarjetaRelevadora) elecPartes.push('Relés')
          if (ctrl.fuentePoder) elecPartes.push('Fuente')
          if (ctrl.gps) elecPartes.push(`GPS (${ctrl.gpsModelo || 'Sí'})`)
          const elecStr = elecPartes.length > 0 ? elecPartes.join(', ') : 'Básica'

          const redPartes = []
          if (ctrl.ipLocal) redPartes.push(`IP: ${ctrl.ipLocal}`)
          if (ctrl.switch) redPartes.push('Switch')
          if (ctrl.fibraOptica) redPartes.push('Fibra')
          const redStr = redPartes.length > 0 ? redPartes.join(' | ') : 'Sin red'

          return {
            'No.': index + 1,
            'Modelo': ctrl.modelo || '—',
            'Crucero / Intersección': ctrl.crucero?.nombre || (ctrl.cruceroId ? `Crucero #${ctrl.cruceroId}` : 'Sin Asignar'),
            'No. Gabinete': ctrl.numeroGabinete || '—',
            'Cabezales (3L / 4L)': `3L: ${sem3L} | 4L: ${sem4L} (Total: ${totalCab})`,
            'Desglose de LEDs': `V: ${ledsV} | R: ${ledsR} | A: ${ledsA} (Total: ${totalLeds})`,
            'Accesibilidad Peatonal': peatStr,
            'Electrónica Interna': elecStr,
            'Red y Conectividad': redStr,
            'Postes del Crucero': resumenPostes,
            'Cámaras': ctrl.camaraCantidad ? `${ctrl.camaraCantidad} (${ctrl.camaraModelo || 'Cámaras'})` : (ctrl.camaraModelo || 'Ninguna'),
            'Estado Base / Reg. Dañados': Number(ctrl.registrosPisoDanados) > 0 ? `⚠️ ${ctrl.registrosPisoDanados} Dañados` : 'Normal',
            'Observaciones': ctrl.observacionesExterior || ctrl.posteObservaciones || 'Sin observaciones'
          }
        })

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        ws['!cols'] = [
          { wch: 6 },
          { wch: 16 },
          { wch: 34 },
          { wch: 16 },
          { wch: 22 },
          { wch: 26 },
          { wch: 28 },
          { wch: 26 },
          { wch: 26 },
          { wch: 34 },
          { wch: 18 },
          { wch: 22 },
          { wch: 34 }
        ]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Controladores')
        const fechaStr = new Date().toISOString().slice(0, 10)
        const sufijo = hayFiltroControladorActivo ? '_filtrado' : '_completo'
        XLSX.writeFile(wb, `Controladores_Semaforicos_SITRAC-H${sufijo}_${fechaStr}.xlsx`)

        Swal.close()
        Swal.fire({
          icon: 'success',
          title: 'Reporte Excel generado',
          text: `Se descargó el reporte con ${lista.length} controlador(es).`,
          timer: 2000,
          showConfirmButton: false
        })
      } catch (e2) {
        console.error('Error definitivo al exportar a Excel:', e2)
        Swal.close()
        Swal.fire('Error', 'No se pudo generar el reporte en Excel.', 'error')
      }
    }
  }

  const exportarFichaIndividualControladorPdf = async (ctrl) => {
    if (!ctrl) return
    try {
      Swal.fire({
        title: 'Generando Ficha Técnica PDF...',
        text: 'Por favor espere un momento.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      const doc = new jsPDF('portrait', 'mm', 'letter')
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height

      const [logoSitrach, logoHidalgo] = await Promise.all([
        loadImgBase64(logoSitrachSrc),
        loadImgBase64(escudoHidalgoSrc)
      ])

      // Franja superior guinda
      doc.setFillColor(105, 27, 49) // #691B31
      doc.rect(0, 0, pageWidth, 5, 'F')

      // Franja inferior guinda
      doc.setFillColor(105, 27, 49)
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text('SISTEMA INTEGRAL DE CONTROL SITRAC-H — DIRECCIÓN DE SEMÁFOROS Y CONTROL VIAL', 14, pageHeight - 3)
      doc.text(`Página 1 de 1`, pageWidth - 14, pageHeight - 3, { align: 'right' })

      // Logos
      if (logoSitrach) doc.addImage(logoSitrach, 'PNG', 14, 7, 14, 14)
      if (logoHidalgo) doc.addImage(logoHidalgo, 'PNG', pageWidth - 26, 7, 12, 14)

      // Títulos
      doc.setTextColor(105, 27, 49)
      doc.setFontSize(15)
      doc.setFont(undefined, 'bold')
      doc.text('FICHA TÉCNICA DE CONTROLADOR SEMAFÓRICO', pageWidth / 2, 14, { align: 'center' })

      doc.setTextColor(188, 149, 91)
      doc.setFontSize(8.5)
      doc.setFont(undefined, 'normal')
      doc.text('SITRAC-H — SISTEMA INTELIGENTE DE TRÁNSITO, RESGUARDO Y AUTOMATIZACIÓN DE CONTROL', pageWidth / 2, 19, { align: 'center' })

      // Recuadro del crucero / encabezado principal
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(203, 213, 225)
      doc.roundedRect(14, 23, pageWidth - 28, 16, 2, 2, 'FD')

      doc.setTextColor(105, 27, 49)
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text(`CRUCERO: ${ctrl.crucero?.nombre || 'SIN ASIGNAR'}`, 18, 30)

      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105)
      doc.setFont(undefined, 'normal')
      doc.text(`Modelo: ${ctrl.modelo || '—'}   |   No. Gabinete: ${ctrl.numeroGabinete || '—'}   |   Fecha de consulta: ${new Date().toLocaleDateString('es-MX')}`, 18, 35)

      // Tablas de contenido organizadas
      const postesNorm = normalizarPostesDetalle(ctrl.postesDetalle, ctrl)
      const totalCabezales = (Number(ctrl.semaforos3Luces) || 0) + (Number(ctrl.semaforos4Luces) || 0)
      const totalLeds = (Number(ctrl.totalLedsVerdes) || 0) + (Number(ctrl.totalLedsRojos) || 0) + (Number(ctrl.totalLedsAmarillos) || 0) + (Number(ctrl.totalFlechasVerdes) || 0) + (Number(ctrl.totalFlechasRojas) || 0)

      const resumenGeneral = [
        ['Semáforos 3 Luces', `${ctrl.semaforos3Luces || 0}`, 'LEDs Verdes', `${ctrl.totalLedsVerdes || 0} (Flechas: ${ctrl.totalFlechasVerdes || 0})`],
        ['Semáforos 4 Luces', `${ctrl.semaforos4Luces || 0}`, 'LEDs Rojos', `${ctrl.totalLedsRojos || 0} (Flechas: ${ctrl.totalFlechasRojas || 0})`],
        ['Total Cabezales', `${totalCabezales}`, 'LEDs Amarillos', `${ctrl.totalLedsAmarillos || 0}`],
        ['Tipo / Modelo Cabezal', `${ctrl.tipoCabezal || 'LED'} — ${ctrl.cabezalModelo || 'N/A'}`, 'Total LEDs en Crucero', `${totalLeds}`]
      ]

      autoTable(doc, {
        startY: 42,
        margin: { left: 14, right: 14 },
        head: [['1. CABEZALES SEMAFÓRICOS', 'CANTIDAD', '2. DESGLOSE DE LEDS', 'CANTIDAD']],
        body: resumenGeneral,
        theme: 'grid',
        headStyles: { fillColor: [105, 27, 49], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        styles: { cellPadding: 2 }
      })

      const accesibilidad = [
        ['Paso Peatonal', ctrl.pasoPeatonal ? 'ACTIVO / SÍ' : 'NO DISPONIBLE', 'Dispositivo Audible', ctrl.audible ? 'ACTIVO / SÍ' : 'NO DISPONIBLE'],
        ['Pantalla LED', ctrl.pantallaLed ? 'INSTALADA / SÍ' : 'NO DISPONIBLE', 'Botonera Peatonal', ctrl.botonera ? 'INSTALADA / SÍ' : 'NO DISPONIBLE']
      ]

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 4,
        margin: { left: 14, right: 14 },
        head: [['3. ACCESIBILIDAD Y EQUIPAMIENTO PEATONAL', 'ESTADO', 'COMPONENTE', 'ESTADO']],
        body: accesibilidad,
        theme: 'grid',
        headStyles: { fillColor: [188, 149, 91], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        styles: { cellPadding: 2 }
      })

      const redElectronica = [
        ['Dirección IP Local', ctrl.ipLocal || '—', 'Dirección IP Sistema', ctrl.ipSystem || '—'],
        ['Máscara de Red', ctrl.mascaraRed || '—', 'Puerta de Enlace (Gateway)', ctrl.gateway || '—'],
        ['Versión de Firmware', ctrl.versionFirmware || '—', 'Ciclo Completo', ctrl.cicloCompleto || '—'],
        ['Módulo GPS', ctrl.gps ? `SÍ (${ctrl.gpsModelo || 'Modelo N/A'})` : 'NO', 'Antena GPS', ctrl.gpsAntenaExterior || '—'],
        ['Switch de Fibra', ctrl.switch ? `SÍ (${ctrl.switchFibraMarca || ''} ${ctrl.switchFibraModelo || ''})` : 'NO', 'Fibra Óptica / Receptor', ctrl.fibraOptica ? `SÍ (${ctrl.receptorFibraDispositivo || 'Receptor N/A'})` : 'NO'],
        ['CPU / Relevadores / Fuente', `CPU: ${ctrl.cpu ? 'Sí' : 'No'} | Relés: ${ctrl.tarjetaRelevadora ? 'Sí' : 'No'} | Fuente: ${ctrl.fuentePoder ? 'Sí' : 'No'}`, 'Cámaras de Detección', ctrl.camaraCantidad ? `${ctrl.camaraCantidad} (${ctrl.camaraModelo || 'Cámaras'})` : (ctrl.camaraModelo || 'Ninguna')]
      ]

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 4,
        margin: { left: 14, right: 14 },
        head: [['4. RED, CONECTIVIDAD Y ELECTRÓNICA INTERNA', 'VALOR', 'PARÁMETRO', 'VALOR']],
        body: redElectronica,
        theme: 'grid',
        headStyles: { fillColor: [105, 27, 49], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        styles: { cellPadding: 2 }
      })

      // Detalle de postes
      const postesBody = postesNorm.length > 0
        ? postesNorm.map((p, idx) => [
            `Poste #${idx + 1}`,
            p.tipoPoste === 'peatonal' ? 'Peatonal' : 'Vehicular / Mixto',
            p.modeloPoste || p.modelo || p.posteModeloTipo || '—',
            p.tapaRegistro || '—',
            p.ubicacionPoste || p.coordenadas || '—',
            p.observaciones || '—'
          ])
        : [['Sin postes', '—', '—', '—', '—', 'No se detallaron postes individuales']]

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 4,
        margin: { left: 14, right: 14 },
        head: [['# POSTE', 'FUNCIÓN', 'MODELO', 'ESTADO TAPA', 'COORDENADAS', 'OBSERVACIONES']],
        body: postesBody,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        styles: { cellPadding: 2 }
      })

      // Cimentación y Observaciones
      const infraestructura = [
        ['Cimiento Completo', ctrl.cimientoCompleto || '—', 'Dados de Cimentación', ctrl.cimientoCuantosDados || '—'],
        ['Tapa de Cableado', ctrl.tapaCableado || '—', 'Tornillería Base', `${ctrl.tornilleriaBaseCompleta || '—'} (${ctrl.tornilleriaCuantosTornillos || '—'})`],
        ['Registros de Piso Dañados', `${ctrl.registrosPisoDanados || 0} registro(s)`, 'Observaciones Generales', ctrl.observacionesExterior || ctrl.posteObservaciones || 'Sin observaciones registradas']
      ]

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 4,
        margin: { left: 14, right: 14 },
        head: [['5. BASE, CIMENTACIÓN Y ESTADO FÍSICO', 'ESTADO', 'PARÁMETRO', 'OBSERVACIONES']],
        body: infraestructura,
        theme: 'grid',
        headStyles: { fillColor: [188, 149, 91], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        styles: { cellPadding: 2 }
      })

      const nomCrucero = (ctrl.crucero?.nombre || 'controlador').replace(/[^a-zA-Z0-9_-]/g, '_')
      doc.save(`Ficha_Tecnica_${nomCrucero}_${new Date().toISOString().slice(0, 10)}.pdf`)

      Swal.close()
      Swal.fire({
        icon: 'success',
        title: 'Ficha Técnica descargada',
        text: 'El documento PDF se generó exitosamente.',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      console.error('Error al generar ficha técnica individual PDF:', err)
      Swal.close()
      Swal.fire('Error', 'No se pudo generar la ficha técnica en PDF.', 'error')
    }
  }

  const exportarControladoresPdf = async () => {
    let lista = hayFiltroControladorActivo
      ? controladoresFiltrados
      : (todosLosControladores && todosLosControladores.length > 0 ? todosLosControladores : controladores)

    // Si aún no se cargaron todos los controladores, consultarlos al servidor
    if (!hayFiltroControladorActivo && (!lista || lista.length <= 10)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventario/controladores?page=1&limit=1000`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json.data?.items?.length) {
          lista = json.data.items
          setTodosLosControladores(lista)
        }
      } catch (e) {
        console.warn('Fallback a controladores locales para exportación PDF:', e)
      }
    }

    if (!lista || lista.length === 0) {
      Swal.fire('Atención', 'No hay controladores para exportar.', 'warning')
      return
    }

    // Si hay exactamente 1 controlador filtrado, exportar su ficha técnica completa
    if (lista.length === 1) {
      return exportarFichaIndividualControladorPdf(lista[0])
    }

    try {
      Swal.fire({
        title: 'Generando Reporte PDF...',
        text: 'Por favor espere un momento.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      const doc = new jsPDF('landscape', 'mm', 'letter')
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height

      const [logoSitrach, logoHidalgo] = await Promise.all([
        loadImgBase64(logoSitrachSrc),
        loadImgBase64(escudoHidalgoSrc)
      ])

      const drawHeaderFooter = (data) => {
        // Franja superior guinda
        doc.setFillColor(105, 27, 49)
        doc.rect(0, 0, pageWidth, 5, 'F')

        // Franja inferior guinda
        doc.setFillColor(105, 27, 49)
        doc.rect(0, pageHeight - 8, pageWidth, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont(undefined, 'normal')
        doc.text('SISTEMA INTEGRAL DE CONTROL SITRAC-H — INVENTARIO DE CONTROLADORES SEMAFÓRICOS', 14, pageHeight - 3)
        doc.text(`Página ${data.pageNumber}`, pageWidth - 14, pageHeight - 3, { align: 'right' })

        if (data.pageNumber === 1) {
          if (logoSitrach) doc.addImage(logoSitrach, 'PNG', 14, 7, 14, 14)
          if (logoHidalgo) doc.addImage(logoHidalgo, 'PNG', pageWidth - 26, 7, 12, 14)

          doc.setTextColor(105, 27, 49)
          doc.setFontSize(14)
          doc.setFont(undefined, 'bold')
          doc.text('REPORTE GENERAL DE CONTROLADORES SEMAFÓRICOS', pageWidth / 2, 12, { align: 'center' })

          doc.setTextColor(188, 149, 91)
          doc.setFontSize(8.5)
          doc.setFont(undefined, 'normal')
          doc.text('SITRAC-H — SISTEMA INTELIGENTE DE TRÁNSITO, RESGUARDO Y AUTOMATIZACIÓN DE CONTROL', pageWidth / 2, 16.5, { align: 'center' })

          // Texto de filtros y fecha
          const filtroTexto = hayFiltroControladorActivo
            ? `Filtro aplicado: ${filtroModeloControlador ? `Modelo "${filtroModeloControlador}" ` : ''}${busquedaControlador ? `Búsqueda "${busquedaControlador}"` : ''} (${lista.length} controladores)`
            : `Inventario Completo — Total: ${lista.length} controladores instalados`
          const fechaGenerado = `Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`

          doc.setTextColor(105, 27, 49)
          doc.setFontSize(7.5)
          doc.setFont(undefined, 'bold')
          doc.text(filtroTexto, 32, 21.5)

          doc.setTextColor(100, 116, 139)
          doc.setFont(undefined, 'normal')
          doc.text(fechaGenerado, pageWidth - 28, 21.5, { align: 'right' })

          // Tarjetas KPI de resumen
          const totalCabezales = lista.reduce((acc, c) => acc + (Number(c.semaforos3Luces) || 0) + (Number(c.semaforos4Luces) || 0), 0)
          const totalLeds = lista.reduce((acc, c) => acc + (Number(c.totalLedsVerdes) || 0) + (Number(c.totalLedsRojos) || 0) + (Number(c.totalLedsAmarillos) || 0) + (Number(c.totalFlechasVerdes) || 0) + (Number(c.totalFlechasRojas) || 0), 0)
          const conPeatonal = lista.filter(c => c.pasoPeatonal).length
          const conAudible = lista.filter(c => c.audible).length

          const cardW = 56
          const cardH = 14
          const gap = 8
          const startX = (pageWidth - (4 * cardW + 3 * gap)) / 2

          const drawKpiCard = (x, y, titulo, valor, subtitulo) => {
            doc.setFillColor(248, 250, 252)
            doc.setDrawColor(203, 213, 225)
            doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD')

            doc.setFontSize(6.5)
            doc.setTextColor(100, 116, 139)
            doc.setFont(undefined, 'bold')
            doc.text(titulo, x + cardW / 2, y + 4.5, { align: 'center' })

            doc.setFontSize(11)
            doc.setTextColor(105, 27, 49)
            doc.text(String(valor), x + cardW / 2, y + 9.5, { align: 'center' })

            if (subtitulo) {
              doc.setFontSize(5.5)
              doc.setTextColor(148, 163, 184)
              doc.setFont(undefined, 'normal')
              doc.text(subtitulo, x + cardW / 2, y + 12.5, { align: 'center' })
            }
          }

          drawKpiCard(startX, 26, 'TOTAL CONTROLADORES', lista.length, 'Registrados en el reporte')
          drawKpiCard(startX + (cardW + gap), 26, 'TOTAL CABEZALES', totalCabezales, 'Semáforos 3 y 4 luces')
          drawKpiCard(startX + 2 * (cardW + gap), 26, 'TOTAL DE LEDS', totalLeds, 'Verdes, Rojos y Amarillos')
          drawKpiCard(startX + 3 * (cardW + gap), 26, 'ACCESIBILIDAD', `${conPeatonal} Peat / ${conAudible} Aud`, 'Cruceros con paso o sonido')
        } else {
          // Encabezado páginas siguientes
          if (logoSitrach) doc.addImage(logoSitrach, 'PNG', 14, 6.5, 9, 9)
          if (logoHidalgo) doc.addImage(logoHidalgo, 'PNG', pageWidth - 22, 6.5, 8, 9)
          doc.setTextColor(105, 27, 49)
          doc.setFontSize(10)
          doc.setFont(undefined, 'bold')
          doc.text('REPORTE GENERAL DE CONTROLADORES SEMAFÓRICOS (Continuación)', pageWidth / 2, 10, { align: 'center' })
          doc.setTextColor(188, 149, 91)
          doc.setFontSize(7.5)
          doc.setFont(undefined, 'normal')
          doc.text('SITRAC-H — SISTEMA INTELIGENTE DE TRÁNSITO, RESGUARDO Y AUTOMATIZACIÓN DE CONTROL', pageWidth / 2, 14, { align: 'center' })
        }
      }

      const tableColumn = [
        '#',
        'MODELO',
        'CRUCERO / UBICACIÓN',
        'GABINETE / IP',
        'CABEZALES\n(3L / 4L)',
        'LEDS\n(V / R / A)',
        'COMPONENTES ACTIVOS',
        'POSTES',
        'REG. PISO / OBS.'
      ]

      const tableRows = lista.map((ctrl, idx) => {
        const crucero = ctrl.crucero?.nombre || (ctrl.cruceroId ? `Crucero #${ctrl.cruceroId}` : 'Sin asignar')
        const gabineteIp = [
          ctrl.numeroGabinete ? `Gab: ${ctrl.numeroGabinete}` : null,
          ctrl.ipLocal ? `IP: ${ctrl.ipLocal}` : null
        ].filter(Boolean).join('\n') || '—'

        const cabezales = `3L: ${ctrl.semaforos3Luces || 0}\n4L: ${ctrl.semaforos4Luces || 0}`
        const fCount = Number(ctrl.totalFlechasVerdes) || (Number(ctrl.semaforos4Luces) > 0 ? Number(ctrl.semaforos4Luces) : 0)
        const leds = fCount > 0
          ? `V: ${ctrl.totalLedsVerdes || 0} | R: ${ctrl.totalLedsRojos || 0}\nA: ${ctrl.totalLedsAmarillos || 0} | 4L: ${fCount}`
          : `V: ${ctrl.totalLedsVerdes || 0} | R: ${ctrl.totalLedsRojos || 0}\nA: ${ctrl.totalLedsAmarillos || 0}`

        const componentes = []
        if (ctrl.pasoPeatonal) componentes.push('Peatonal')
        if (ctrl.audible) componentes.push('Audible')
        if (ctrl.pantallaLed) componentes.push('Pantalla LED')
        if (ctrl.gps) componentes.push('GPS')
        if (ctrl.switch) componentes.push('Switch')
        if (ctrl.fibraOptica) componentes.push('Fibra')
        const compStr = componentes.length > 0 ? componentes.join(', ') : 'Ninguno'

        const postesNorm = normalizarPostesDetalle(ctrl.postesDetalle, ctrl)
        const postesStr = postesNorm.length > 0
          ? `${postesNorm.length} poste(s):\n` + postesNorm.slice(0, 3).map((p, i) => `• P${i + 1}: ${p.modeloPoste || p.modelo || 'Poste'}`).join('\n') + (postesNorm.length > 3 ? `\n(+${postesNorm.length - 3} más)` : '')
          : '0 postes'

        const obs = []
        if (Number(ctrl.registrosPisoDanados) > 0) obs.push(`Reg. Dañados: ${ctrl.registrosPisoDanados}`)
        if (ctrl.observacionesExterior) obs.push(ctrl.observacionesExterior.slice(0, 45) + (ctrl.observacionesExterior.length > 45 ? '...' : ''))
        const obsStr = obs.length > 0 ? obs.join('\n') : 'Normal'

        return [
          idx + 1,
          ctrl.modelo || '—',
          crucero,
          gabineteIp,
          cabezales,
          leds,
          compStr,
          postesStr,
          obsStr
        ]
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 44,
        margin: { top: 18, bottom: 14, left: 14, right: 14 },
        showHead: 'everyPage',
        pageBreak: 'auto',
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2, halign: 'center', valign: 'middle', overflow: 'linebreak' },
        headStyles: { fillColor: [105, 27, 49], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [255, 251, 240] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 20, fontStyle: 'bold', halign: 'left' },
          2: { cellWidth: 50, halign: 'left' },
          3: { cellWidth: 30, halign: 'left' },
          4: { cellWidth: 22 },
          5: { cellWidth: 24 },
          6: { cellWidth: 40, halign: 'left' },
          7: { cellWidth: 28, halign: 'left' },
          8: { cellWidth: 'auto', halign: 'left' }
        },
        didDrawPage: drawHeaderFooter
      })

      const fechaStr = new Date().toISOString().slice(0, 10)
      const sufijo = hayFiltroControladorActivo ? '_filtrado' : '_completo'
      doc.save(`Reporte_Controladores_SITRAC-H${sufijo}_${fechaStr}.pdf`)

      Swal.close()
      Swal.fire({
        icon: 'success',
        title: 'Reporte PDF descargado',
        text: `Se descargó el reporte con ${lista.length} controlador(es).`,
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      console.error('Error al generar PDF de controladores:', err)
      Swal.close()
      Swal.fire('Error', 'No se pudo generar el reporte en PDF.', 'error')
    }
  }

  const exportarExistenciasPdf = async (tipo = 'disponibles') => {
    try {
      const esDanada = tipo === 'danadas' || tabActiva === 'danadas'

      let lista = existencias.filter(item => {
        const nombre = (item.nombre || '').toLowerCase()
        const estado = (item.estadoFisico || '').toLowerCase()
        const esPiezaDanada = nombre.includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes(estado)
        return esDanada ? esPiezaDanada : !esPiezaDanada
      })

      if (busquedaExistencias && busquedaExistencias.trim()) {
        lista = lista.filter(item => coincideBusquedaSemaforo(item, busquedaExistencias))
      }

      if (!lista || lista.length === 0) {
        Swal.fire({
          title: 'Sin refacciones',
          text: `No hay refacciones ${esDanada ? 'dañadas' : 'disponibles'} para exportar en este momento.`,
          icon: 'warning',
          confirmButtonColor: '#691B31'
        })
        return
      }

      Swal.fire({
        title: 'Generando Reporte PDF...',
        text: 'Por favor espere un momento.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      const doc = new jsPDF('landscape', 'mm', 'letter')
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height

      const [logoSitrach, logoHidalgo] = await Promise.all([
        loadImgBase64(logoSitrachSrc),
        loadImgBase64(escudoHidalgoSrc)
      ])

      const totalPiezas = lista.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0)
      const totalItems = lista.length
      const tituloDoc = esDanada
        ? 'REPORTE DE PIEZAS DAÑADAS Y REEMPLAZADAS'
        : 'REPORTE GENERAL DE EXISTENCIAS Y REFACCIONES EN STOCK'
      const subtituloDoc = esDanada
        ? 'COMPONENTES RETIRADOS O EN PROCESO DE EVALUACIÓN / REPARACIÓN'
        : 'REFACCIONES EN BUEN ESTADO DISPONIBLES PARA INSTALACIÓN EN CRUCEROS'

      const drawHeaderFooter = (data) => {
        // Franja superior institucional guinda y dorada
        doc.setFillColor(105, 27, 49)
        doc.rect(0, 0, pageWidth, 5, 'F')
        doc.setFillColor(188, 149, 91)
        doc.rect(0, 5, pageWidth, 1, 'F')

        // Franja inferior institucional
        doc.setFillColor(105, 27, 49)
        doc.rect(0, pageHeight - 8, pageWidth, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont(undefined, 'normal')
        doc.text('SISTEMA INTEGRAL DE CONTROL SITRAC-H — INVENTARIO DE SEMÁFOROS Y REFACCIONES', 14, pageHeight - 3)
        doc.text(`Página ${data.pageNumber}`, pageWidth - 14, pageHeight - 3, { align: 'right' })

        if (data.pageNumber === 1) {
          if (logoSitrach) doc.addImage(logoSitrach, 'PNG', 14, 7.5, 14, 14)
          if (logoHidalgo) doc.addImage(logoHidalgo, 'PNG', pageWidth - 26, 7.5, 12, 14)

          doc.setTextColor(105, 27, 49)
          doc.setFontSize(13.5)
          doc.setFont(undefined, 'bold')
          doc.text(tituloDoc, pageWidth / 2, 12, { align: 'center' })

          doc.setTextColor(188, 149, 91)
          doc.setFontSize(8.5)
          doc.setFont(undefined, 'normal')
          doc.text('SITRAC-H — SISTEMA INTELIGENTE DE TRÁNSITO, RESGUARDO Y AUTOMATIZACIÓN DE CONTROL', pageWidth / 2, 16.5, { align: 'center' })

          const filtroTexto = busquedaExistencias && busquedaExistencias.trim()
            ? `Filtro: Búsqueda "${busquedaExistencias.trim()}" (${lista.length} refacciones / ${totalPiezas} piezas en stock)`
            : `${subtituloDoc} — Total: ${totalPiezas} unidades registradas`
          const fechaGenerado = `Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`

          doc.setTextColor(105, 27, 49)
          doc.setFontSize(7.5)
          doc.setFont(undefined, 'bold')
          doc.text(filtroTexto, 32, 21.5)

          doc.setTextColor(100, 116, 139)
          doc.setFont(undefined, 'normal')
          doc.text(fechaGenerado, pageWidth - 28, 21.5, { align: 'right' })

          // Tarjetas KPI
          const cardW = 60
          const cardH = 14
          const gap = 10
          const startX = (pageWidth - (3 * cardW + 2 * gap)) / 2

          const drawKpiCard = (x, y, titulo, valor, subtitulo) => {
            doc.setFillColor(248, 250, 252)
            doc.setDrawColor(203, 213, 225)
            doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD')

            doc.setFontSize(6.5)
            doc.setTextColor(100, 116, 139)
            doc.setFont(undefined, 'bold')
            doc.text(titulo, x + cardW / 2, y + 4.5, { align: 'center' })

            doc.setFontSize(11)
            doc.setTextColor(105, 27, 49)
            doc.text(String(valor), x + cardW / 2, y + 9.5, { align: 'center' })

            if (subtitulo) {
              doc.setFontSize(5.5)
              doc.setTextColor(148, 163, 184)
              doc.setFont(undefined, 'normal')
              doc.text(subtitulo, x + cardW / 2, y + 12.5, { align: 'center' })
            }
          }

          drawKpiCard(startX, 26, 'TOTAL DE PIEZAS EN STOCK', `${totalPiezas} Unidades`, esDanada ? 'Piezas retiradas / dañadas' : 'Piezas en existencia')
          drawKpiCard(startX + (cardW + gap), 26, 'LÍNEAS DE REFACCIÓN', `${totalItems} Registros`, 'Componentes clasificados')
          drawKpiCard(startX + 2 * (cardW + gap), 26, 'ESTADO FÍSICO', esDanada ? 'Dañadas / Por Reparar' : '100% Buen Estado', esDanada ? 'Inventario de bajas' : 'Listas para instalación')
        } else {
          if (logoSitrach) doc.addImage(logoSitrach, 'PNG', 14, 6.5, 9, 9)
          if (logoHidalgo) doc.addImage(logoHidalgo, 'PNG', pageWidth - 22, 6.5, 8, 9)
          doc.setTextColor(105, 27, 49)
          doc.setFontSize(10)
          doc.setFont(undefined, 'bold')
          doc.text(`${tituloDoc} (Continuación)`, pageWidth / 2, 10, { align: 'center' })
          doc.setTextColor(188, 149, 91)
          doc.setFontSize(7.5)
          doc.setFont(undefined, 'normal')
          doc.text('SITRAC-H — SISTEMA INTELIGENTE DE TRÁNSITO, RESGUARDO Y AUTOMATIZACIÓN DE CONTROL', pageWidth / 2, 14, { align: 'center' })
        }
      }

      const tableColumn = [
        '#',
        'COMPONENTE / REFACCIÓN',
        'CATEGORÍA',
        'MARCA',
        'MODELO',
        'CANTIDAD',
        'NO. SERIE',
        'NO. INVENTARIO',
        'ESTADO FÍSICO'
      ]

      const tableRows = lista.map((item, idx) => [
        String(idx + 1),
        item.nombre || 'Componente',
        (item.categoria || 'Componente').toUpperCase(),
        item.marca || 'SEMEX',
        item.modelo || '-',
        `${item.cantidad || 0} pza(s)`,
        item.numeroSerie || '-',
        item.numeroInventario || '-',
        item.estadoFisico || (esDanada ? 'Dañada' : 'Buen Estado')
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 44,
        margin: { top: 20, right: 14, bottom: 12, left: 14 },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.2,
          valign: 'middle',
          overflow: 'linebreak',
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [105, 27, 49],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 7.5
        },
        alternateRowStyles: {
          fillColor: [253, 251, 247]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 50, fontStyle: 'bold' },
          2: { halign: 'center', cellWidth: 26 },
          3: { halign: 'center', cellWidth: 24 },
          4: { halign: 'center', cellWidth: 26 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
          6: { halign: 'center', cellWidth: 32 },
          7: { halign: 'center', cellWidth: 32 },
          8: { halign: 'center', cellWidth: 26 }
        },
        didDrawPage: drawHeaderFooter
      })

      const dateStr = new Date().toISOString().split('T')[0]
      const fileNombre = esDanada
        ? `Refacciones_Danadas_SITRAC-H_${dateStr}.pdf`
        : `Existencias_Refacciones_SITRAC-H_${dateStr}.pdf`

      doc.save(fileNombre)
      Swal.close()
      Swal.fire({
        icon: 'success',
        title: 'Reporte PDF descargado',
        text: `Se descargó el reporte con ${lista.length} refacciones.`,
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      console.error('Error al exportar existencias a PDF:', err)
      Swal.close()
      Swal.fire('Error', 'No se pudo generar el reporte PDF de existencias.', 'error')
    }
  }

  const resetControladorForm = () => {
    setEditandoControladorId(null)
    setModoVisualizacion(false)
    setFormPantallaCompleta(false)
    const posteInit = []
    const totalesInit = recalcularTotalesDesdePostes(posteInit)
    setControladorForm({
      modelo: '',
      cruceroId: '',
      ...totalesInit,
      postes: [],
      tarjetaRelevadora: false,
      tarjetaRelevadoraDetalle: '',
      fuentePoder: false,
      cpu: false,
      cpuDetalle: '',
      switch: false,
      fibraOptica: false,
      gps: false,
      gpsDetalle: '',
      botonera: false,
      // Inspección Exterior / Cimentación y Base
      cimientoCompleto: '',
      cimientoCuantosDados: '',
      tapaCableado: '',
      tornilleriaBaseCompleta: '',
      tornilleriaCuantosTornillos: '',
      observacionesExterior: '',
      // Electrónica Interna - Módulo GPS
      gpsModelo: '',
      gpsComponenteFisico: '',
      gpsAntenaExterior: '',
      // Electrónica Interna - Configuración y Red
      numeroGabinete: '',
      versionFirmware: '',
      ipLocal: '',
      ipSystem: '',
      mascaraRed: '',
      gateway: '',
      cicloCompleto: '',
      respaldoProgramacionUsb: '',
      // Electrónica Interna - Conflictos y Relevadores
      tarjetaConflictosMarcaModo: 'Peek Traffic',
      tarjetaConflictosMarca: 'Peek Traffic',
      tarjetaConflictosModelo: 'Model 2010E',
      tarjetaConflictosEstado: '',
      tarjetaRelevadoresMarcaModo: 'Peek Traffic',
      tarjetaRelevadoresMarca: 'Peek Traffic',
      tarjetaRelevadoresModelo: 'RC-308',
      tarjetaRelevadoresCantidad: '',
      // Sección C: Red, Conectividad y Energía
      switchFibraMarcaModo: 'Moxa',
      switchFibraMarca: 'Moxa',
      switchFibraModelo: 'Moxa EDS-208 / 308',
      switchFibraPuertosTotal: '8',
      switchFibraPuertosUso: '',
      switchFibraFuentePoder: '',
      receptorFibraDispositivo: '',
      receptorFibraCable: '',
      conexionesTarjetaMadre: '',
      fuentePoderSupresorPicos: '',
      // Registros de Piso
      registrosPisoTapas: '',
      registrosPisoDanados: '',
      registrosPisoCoordenadas: []
    })
    setArchivoProgramacion(null)
    setControladorErrores({})
  }

  const handleCambiarRegistrosTapas = (valor) => {
    if (valor === '') {
      setControladorForm(prev => ({ ...prev, registrosPisoTapas: '' }))
      setControladorErrores(prev => ({ ...prev, registrosPisoTapas: undefined }))
      return
    }
    const total = Math.max(0, parseInt(valor, 10) || 0)
    setControladorForm(prev => {
      const prevDanados = parseInt(prev.registrosPisoDanados, 10)
      let nuevoDanados = prev.registrosPisoDanados
      let coords = prev.registrosPisoCoordenadas
      if (!isNaN(prevDanados) && prevDanados > total) {
        nuevoDanados = total
        coords = ajustarCoordenadasDanadas(prev.registrosPisoCoordenadas, total)
      }
      return {
        ...prev,
        registrosPisoTapas: total,
        registrosPisoDanados: nuevoDanados,
        registrosPisoCoordenadas: coords
      }
    })
    setControladorErrores(prev => ({
      ...prev,
      registrosPisoTapas: undefined,
      registrosPisoDanados: undefined
    }))
  }

  const handleCambiarRegistrosDanados = (valor) => {
    if (valor === '') {
      setControladorForm(prev => ({
        ...prev,
        registrosPisoDanados: '',
        registrosPisoCoordenadas: []
      }))
      setControladorErrores(prev => ({ ...prev, registrosPisoDanados: undefined }))
      return
    }

    let cant = Math.max(0, parseInt(valor, 10) || 0)
    const totalTapas = parseInt(controladorForm.registrosPisoTapas, 10)

    if (!isNaN(totalTapas) && totalTapas >= 0) {
      if (cant > totalTapas) {
        cant = totalTapas
        setControladorErrores(prev => ({
          ...prev,
          registrosPisoDanados: `No puede haber más registros dañados que el total de tapas (${totalTapas}). Se ajustó al máximo posible.`
        }))
      } else {
        setControladorErrores(prev => ({ ...prev, registrosPisoDanados: undefined }))
      }
    } else {
      setControladorErrores(prev => ({ ...prev, registrosPisoDanados: undefined }))
    }

    setControladorForm(prev => ({
      ...prev,
      registrosPisoDanados: cant,
      registrosPisoCoordenadas: ajustarCoordenadasDanadas(prev.registrosPisoCoordenadas, cant)
    }))
  }

  const handleCambiarSwitchPuertosTotal = (valor) => {
    if (valor === '') {
      setControladorForm(prev => ({ ...prev, switchFibraPuertosTotal: '', switch: true }))
      setControladorErrores(prev => ({ ...prev, switchFibraPuertosTotal: undefined }))
      return
    }
    const total = Math.max(0, parseInt(valor, 10) || 0)
    setControladorForm(prev => {
      const prevUso = parseInt(prev.switchFibraPuertosUso, 10)
      let nuevoUso = prev.switchFibraPuertosUso
      if (!isNaN(prevUso) && prevUso > total) {
        nuevoUso = String(total)
      }
      return {
        ...prev,
        switchFibraPuertosTotal: String(total),
        switchFibraPuertosUso: nuevoUso,
        switch: true
      }
    })
    setControladorErrores(prev => ({
      ...prev,
      switchFibraPuertosTotal: undefined,
      switchFibraPuertosUso: undefined
    }))
  }

  const handleCambiarSwitchPuertosUso = (valor) => {
    if (valor === '') {
      setControladorForm(prev => ({ ...prev, switchFibraPuertosUso: '', switch: true }))
      setControladorErrores(prev => ({ ...prev, switchFibraPuertosUso: undefined }))
      return
    }

    let uso = Math.max(0, parseInt(valor, 10) || 0)
    const total = parseInt(controladorForm.switchFibraPuertosTotal, 10)

    if (!isNaN(total) && total > 0) {
      if (uso > total) {
        uso = total
        setControladorErrores(prev => ({
          ...prev,
          switchFibraPuertosUso: `Los puertos en uso no pueden superar el total de puertos (${total}). Se ajustó al máximo posible.`
        }))
      } else {
        setControladorErrores(prev => ({ ...prev, switchFibraPuertosUso: undefined }))
      }
    } else {
      setControladorErrores(prev => ({ ...prev, switchFibraPuertosUso: undefined }))
    }

    setControladorForm(prev => ({
      ...prev,
      switchFibraPuertosUso: String(uso),
      switch: true
    }))
  }

  const handleCambiarCoordenada = (index, valor) => {
    setControladorForm(prev => {
      const lista = ajustarCoordenadasDanadas(prev.registrosPisoCoordenadas, prev.registrosPisoDanados)
      if (lista[index]) {
        lista[index].coordenadas = valor
      }
      return {
        ...prev,
        registrosPisoCoordenadas: lista
      }
    })
  }

  const handleObtenerGpsRegistro = (index) => {
    if (!navigator.geolocation) {
      Swal.fire('Geolocalización no soportada', 'Tu navegador o dispositivo no soporta geolocalización.', 'warning')
      return
    }
    setCapturandoGpsIndex(index)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordsStr = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        handleCambiarCoordenada(index, coordsStr)
        setMapasDanadasVisibles(prev => ({ ...prev, [index]: true }))
        setCapturandoGpsIndex(null)
      },
      (err) => {
        setCapturandoGpsIndex(null)
        console.warn('Error geolocalización:', err)
        Swal.fire('Aviso', 'No se pudo obtener la ubicación actual: ' + (err.message || 'Permiso denegado'), 'info')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleObtenerGpsPoste = (pIdx) => {
    if (!navigator.geolocation) {
      Swal.fire('Geolocalización no soportada', 'Tu navegador o dispositivo no soporta geolocalización.', 'warning')
      return
    }
    setCapturandoGpsPosteIndex(pIdx)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordsStr = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        handleActualizarPoste(pIdx, 'ubicacionPoste', coordsStr)
        setMapasPostesVisibles(prev => ({ ...prev, [pIdx]: true }))
        setCapturandoGpsPosteIndex(null)
      },
      (err) => {
        setCapturandoGpsPosteIndex(null)
        console.warn('Error geolocalización poste:', err)
        Swal.fire('Aviso', 'No se pudo obtener la ubicación actual: ' + (err.message || 'Permiso denegado'), 'info')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleAgregarPoste = () => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const maxId = listaActual.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0)
      const nuevoPoste = crearPosteInicial(maxId + 1, 'PCC-1')
      const nuevosPostes = [...listaActual, nuevoPoste]
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const handleEliminarPoste = (pIdx) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.filter((_, idx) => idx !== pIdx)
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const handleActualizarPoste = (pIdx, campo, valor) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const updated = { ...p, [campo]: valor }
        if ((campo === 'ubicacionPoste' || campo === 'coordenadas') && Array.isArray(p.peatonalesLista)) {
          updated.coordenadas = valor
          updated.ubicacionPoste = valor
          updated.peatonalesLista = p.peatonalesLista.map(pt => ({
            ...pt,
            coordenadas: valor,
            sentido: valor
          }))
        } else if (campo === 'ubicacionPoste') {
          updated.coordenadas = valor
        } else if (campo === 'coordenadas') {
          updated.ubicacionPoste = valor
        }
        if (campo === 'audibleModelo' || campo === 'audibleModuloEstado' || campo === 'audibleObservaciones') {
          const mod = campo === 'audibleModelo' ? valor : (updated.audibleModelo || 'Novax DS-100 Audible')
          const est = campo === 'audibleModuloEstado' ? valor : (updated.audibleModuloEstado || 'Operando')
          const obs = campo === 'audibleObservaciones' ? valor : (updated.audibleObservaciones || '')
          updated.audiblesLista = [{ id: 1, modelo: mod, estado: est, observaciones: obs }]
        }
        return updated
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const handleActualizarPosteMultiple = (pIdx, cambios) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const updated = { ...p, ...cambios }
        if (cambios.tieneAudible !== undefined) {
          if (cambios.tieneAudible) {
            updated.audiblesLista = [{
              id: 1,
              modelo: updated.audibleModelo || 'Novax DS-100 Audible',
              estado: updated.audibleModuloEstado || 'Operando',
              observaciones: updated.audibleObservaciones || ''
            }]
          } else {
            updated.audiblesLista = []
          }
        }
        return updated
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const handleCambiarPantallaPiezasEnPoste = (pIdx, valor) => {
    const limpio = valor.replace(/\D/g, '').replace(/^0+/, '')
    const cant = parseInt(limpio, 10) || 0
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const actuales = Array.isArray(p.pantallasLista) ? p.pantallasLista : []
        const nuevaLista = []
        for (let i = 1; i <= cant; i++) {
          const existente = actuales.find(item => item.numero === i) || actuales[i - 1]
          nuevaLista.push({
            numero: i,
            estado: existente?.estado || 'Funciona'
          })
        }
        const algunNoFunciona = nuevaLista.some(item => item.estado === 'No funciona')
        const todosNoFunciona = nuevaLista.length > 0 && nuevaLista.every(item => item.estado === 'No funciona')
        const estadoConsolidado = nuevaLista.length === 0 ? 'Funciona' : (todosNoFunciona ? 'No funciona' : (algunNoFunciona ? 'Parcial' : 'Funciona'))

        return {
          ...p,
          pantallaPiezas: limpio,
          pantallasLista: nuevaLista,
          pantallaEstado: estadoConsolidado
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleCambiarEstadoPiezaPantalla = (pIdx, piezaNumero, nuevoEstado) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const numPiezas = Number(p.pantallaPiezas) || (Array.isArray(p.pantallasLista) ? p.pantallasLista.length : 1)
        const actuales = Array.isArray(p.pantallasLista) && p.pantallasLista.length > 0
          ? p.pantallasLista
          : Array.from({ length: numPiezas }, (_, i) => ({ numero: i + 1, estado: p.pantallaEstado || 'Funciona' }))

        const nuevaLista = actuales.map(item => {
          if (item.numero === piezaNumero) {
            return { ...item, estado: nuevoEstado }
          }
          return item
        })

        const algunNoFunciona = nuevaLista.some(item => item.estado === 'No funciona')
        const todosNoFunciona = nuevaLista.length > 0 && nuevaLista.every(item => item.estado === 'No funciona')
        const estadoConsolidado = todosNoFunciona ? 'No funciona' : (algunNoFunciona ? 'Parcial' : 'Funciona')

        return {
          ...p,
          pantallasLista: nuevaLista,
          pantallaEstado: estadoConsolidado
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleAgregarPeatonalEnPoste = (pIdx) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const peatonales = p.peatonalesLista || []
        const sigId = peatonales.length > 0 ? Math.max(...peatonales.map(pt => pt.id || 0)) + 1 : 1
        const nuevoPeatonal = crearPeatonalInicial(sigId, peatonales.length === 1 ? 'Sentido hacia Banqueta' : `Sentido ${peatonales.length + 1}`)
        const nuevaLista = [...peatonales, nuevoPeatonal]
        return {
          ...p,
          tienePeatonal: true,
          peatonalesLista: nuevaLista,
          peatonalModelo: nuevaLista[0]?.modelo || p.peatonalModelo,
          peatonalModuloEstado: nuevaLista[0]?.estado || p.peatonalModuloEstado
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleEliminarPeatonalEnPoste = (pIdx, ptIdx) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const peatonales = p.peatonalesLista || []
        if (peatonales.length <= 1) return p
        const filtrados = peatonales.filter((_, i) => i !== ptIdx).map((pt, i) => ({ ...pt, id: i + 1 }))
        const audibles = filtrados.filter(pt => pt.tieneAudible).map((pt, i) => ({
          id: i + 1,
          sentido: pt.sentido,
          modelo: pt.audibleModelo || 'Novax DS-100 Audible',
          estado: pt.audibleEstado || 'Operando',
          observaciones: pt.audibleObservaciones || ''
        }))
        const tieneAudible = audibles.length > 0
        return {
          ...p,
          peatonalesLista: filtrados,
          peatonalModelo: filtrados[0]?.modelo || p.peatonalModelo,
          peatonalModuloEstado: filtrados[0]?.estado || p.peatonalModuloEstado,
          audiblesLista: audibles,
          tieneAudible,
          audibleModelo: audibles[0]?.modelo || '',
          audibleModuloEstado: audibles[0]?.estado || ''
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleActualizarPeatonalEnPoste = (pIdx, ptIdx, campo, valor) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const peatonales = (p.peatonalesLista || []).map((pt, i) => {
          if (i !== ptIdx) return pt
          const actualizado = { ...pt, [campo]: valor }
          if (campo === 'modelo' && typeof valor === 'string' && valor.toLowerCase().includes('sin cabezal')) {
            actualizado.tieneAudible = true
          }
          return actualizado
        })
        const audibles = peatonales.filter(pt => pt.tieneAudible).map((pt, i) => ({
          id: i + 1,
          sentido: pt.sentido,
          modelo: pt.audibleModelo || 'Novax DS-100 Audible',
          estado: pt.audibleEstado || 'Operando',
          observaciones: pt.audibleObservaciones || ''
        }))
        const tieneAudible = audibles.length > 0
        return {
          ...p,
          peatonalesLista: peatonales,
          peatonalModelo: peatonales[0]?.modelo || p.peatonalModelo,
          peatonalModuloEstado: peatonales[0]?.estado || p.peatonalModuloEstado,
          audiblesLista: audibles,
          tieneAudible,
          audibleModelo: audibles[0]?.modelo || '',
          audibleModuloEstado: audibles[0]?.estado || ''
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleAgregarAudibleEnPoste = (pIdx) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const audibles = p.audiblesLista || []
        const sigId = audibles.length > 0 ? Math.max(...audibles.map(a => a.id || 0)) + 1 : 1
        const nuevoAudible = crearAudibleInicial(sigId, audibles.length === 1 ? 'Sentido hacia Banqueta' : `Sentido ${audibles.length + 1}`)
        const nuevaLista = [...audibles, nuevoAudible]
        return {
          ...p,
          tieneAudible: true,
          audiblesLista: nuevaLista,
          audibleModelo: nuevaLista[0]?.modelo || p.audibleModelo,
          audibleModuloEstado: nuevaLista[0]?.estado || p.audibleModuloEstado
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleEliminarAudibleEnPoste = (pIdx, auIdx) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const audibles = p.audiblesLista || []
        if (audibles.length <= 1) return p
        const filtrados = audibles.filter((_, i) => i !== auIdx).map((a, i) => ({ ...a, id: i + 1 }))
        return {
          ...p,
          audiblesLista: filtrados,
          audibleModelo: filtrados[0]?.modelo || p.audibleModelo,
          audibleModuloEstado: filtrados[0]?.estado || p.audibleModuloEstado
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleActualizarAudibleEnPoste = (pIdx, auIdx, campo, valor) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const audibles = (p.audiblesLista || []).map((a, i) => {
          if (i !== auIdx) return a
          return { ...a, [campo]: valor }
        })
        return {
          ...p,
          audiblesLista: audibles,
          audibleModelo: audibles[0]?.modelo || p.audibleModelo,
          audibleModuloEstado: audibles[0]?.estado || p.audibleModuloEstado
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return { ...prev, ...totales, postes: nuevosPostes }
    })
  }

  const handleAgregarGrupoCabezalEnPoste = (pIdx) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const grupos = normalizarCabezalesDetalle(p.cabezalesGrupos)
        const siguienteId = grupos.length > 0 ? Math.max(...grupos.map(g => g.id || 0)) + 1 : 1
        const nuevoGrupo = {
          id: siguienteId,
          numLeds: 3,
          piezas: 0,
          leds: ajustarLedsPorCantidad([], 3)
        }
        return {
          ...p,
          cabezalesGrupos: [...grupos, nuevoGrupo]
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const handleEliminarGrupoCabezalEnPoste = (pIdx, gIdx) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const grupos = normalizarCabezalesDetalle(p.cabezalesGrupos)
        if (grupos.length <= 1) return p
        return {
          ...p,
          cabezalesGrupos: grupos.filter((_, i) => i !== gIdx)
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const handleCambiarNumLedsEnPoste = (pIdx, gIdx, nuevaCantidad) => {
    const cant = Math.max(0, parseInt(nuevaCantidad, 10) || 0)
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const grupos = normalizarCabezalesDetalle(p.cabezalesGrupos)
        const nuevoGrupos = [...grupos]
        const grupoActual = nuevoGrupos[gIdx] || { id: gIdx + 1, piezas: 0, leds: [] }
        const nuevosLeds = ajustarLedsPorCantidad(grupoActual.leds, cant)
        nuevoGrupos[gIdx] = {
          ...grupoActual,
          numLeds: cant,
          leds: nuevosLeds
        }
        return {
          ...p,
          cabezalesGrupos: nuevoGrupos
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const handleCambiarLedEnPoste = (pIdx, gIdx, ledIndex, campo, valor) => {
    setControladorForm(prev => {
      const listaActual = prev.postes || []
      const nuevosPostes = listaActual.map((p, idx) => {
        if (idx !== pIdx) return p
        const grupos = normalizarCabezalesDetalle(p.cabezalesGrupos)
        const nuevoGrupos = [...grupos]
        const grupoActual = { ...nuevoGrupos[gIdx] }
        const leds = [...(grupoActual.leds || [])]

        if (leds[ledIndex]) {
          const update = { [campo]: valor }
          if (campo === 'color' && valor === 'Ninguno') {
            update.estado = 'No funciona'
          } else if (campo === 'estado' && valor === 'Funciona' && leds[ledIndex].color === 'Ninguno') {
            update.color = 'Rojo'
          }
          leds[ledIndex] = {
            ...leds[ledIndex],
            ...update
          }
        }

        nuevoGrupos[gIdx] = {
          ...grupoActual,
          leds
        }
        return {
          ...p,
          cabezalesGrupos: nuevoGrupos
        }
      })
      const totales = recalcularTotalesDesdePostes(nuevosPostes)
      return {
        ...prev,
        ...totales,
        postes: nuevosPostes
      }
    })
  }

  const renderDatoConsulta = (valor, fallback = 'Sin registrar', isMono = false) => {
    if (valor === undefined || valor === null || String(valor).trim() === '') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.2rem', minHeight: '26px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic', fontWeight: '400' }}>
            {fallback}
          </span>
        </div>
      )
    }
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: '0.2rem',
        minHeight: '26px',
        fontWeight: '600',
        color: '#0F172A',
        fontSize: '0.88rem',
        fontFamily: isMono ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'inherit'
      }}>
        {String(valor)}
      </div>
    )
  }

  const renderBadgeConsulta = (valor, label = null) => {
    if (!valor || valor === '') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.2rem', minHeight: '26px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic', fontWeight: '400' }}>
            Sin registrar
          </span>
        </div>
      )
    }
    const str = String(valor).trim()
    const strLower = str.toLowerCase()
    const esPositivo = ['sí', 'si', 'operando', 'operativo', 'operativa', 'instalada', 'instalado', 'buena', 'bueno', 'presente', 'conectado', 'correcto'].includes(strLower)
    const esNegativo = ['no', 'dañado', 'dañada', 'faltante', 'fuera de servicio', 'inoperativo', 'sin operar', 'falla', 'desconectado', 'no tiene'].includes(strLower)

    if (esPositivo) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem', minHeight: '26px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', flexShrink: 0 }}></span>
          <span style={{ color: '#0F172A', fontSize: '0.88rem', fontWeight: '600' }}>
            {label || str}
          </span>
        </div>
      )
    } else if (esNegativo) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.2rem', minHeight: '26px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.15rem 0.55rem',
            borderRadius: '4px',
            fontSize: '0.82rem',
            fontWeight: '700',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FECACA'
          }}>
            ● {label || str}
          </span>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.2rem', minHeight: '26px' }}>
        <span style={{ color: '#1E293B', fontSize: '0.88rem', fontWeight: '600' }}>
          {label || str}
        </span>
      </div>
    )
  }

  const renderObservacionesConsulta = (valor, placeholder = 'Sin observaciones registradas') => {
    if (!valor || String(valor).trim() === '') {
      return (
        <div style={{
          marginTop: '0.2rem',
          minHeight: '26px',
          display: 'flex',
          alignItems: 'center',
          color: '#94A3B8',
          fontSize: '0.85rem',
          fontStyle: 'italic'
        }}>
          {placeholder}
        </div>
      )
    }
    return (
      <div style={{
        marginTop: '0.25rem',
        padding: '0.45rem 0.65rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #E2E8F0',
        fontSize: '0.85rem',
        color: '#1E293B',
        lineHeight: 1.45
      }}>
        {valor}
      </div>
    )
  }

  return (
    <main style={{ padding: '2rem', flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>

      {/* HEADER DE LA SECCIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaRoad /> Inventario de Semáforos
          </h1>
          <p style={{ color: '#6F7271', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Gestione controladores semafóricos instalados y existencias de refacciones en stock.
          </p>
        </div>

        {/* BOTONES DE CREACIÓN SEGÚN TAB */}
        {tabActiva === 'existencias' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => exportarExistenciasPdf('disponibles')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e11d48', color: 'white',
                border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(225,29,72,0.2)', transition: 'background-color 0.2s', fontSize: '0.95rem'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#be123c'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#e11d48'}
              title={busquedaExistencias.trim() ? `Exportar refacciones filtradas a PDF` : 'Exportar todas las existencias disponibles a PDF'}
            >
              <FaFilePdf /> Exportar a PDF
            </button>

            <button
              onClick={() => { resetStockForm(); setModalStockAbierto(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
                border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(105,27,49,0.15)', fontSize: '0.95rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A02142'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#691B31'}
            >
              <FaPlus /> Ingresar Existencias
            </button>
          </div>
        ) : tabActiva === 'danadas' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => exportarExistenciasPdf('danadas')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e11d48', color: 'white',
                border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(225,29,72,0.2)', transition: 'background-color 0.2s', fontSize: '0.95rem'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#be123c'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#e11d48'}
              title="Descargar Reporte PDF de Piezas Dañadas / Reemplazadas"
            >
              <FaFilePdf /> Exportar a PDF
            </button>

            <button
              onClick={() => { resetStockForm(); setModalStockAbierto(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
                border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(105,27,49,0.15)', fontSize: '0.95rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A02142'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#691B31'}
            >
              <FaPlus /> Ingresar Existencias
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={exportarControladoresExcel}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10b981', color: 'white',
                border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(16,185,129,0.2)', transition: 'background-color 0.2s', fontSize: '0.95rem'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#10b981'}
              title={hayFiltroControladorActivo ? `Exportar ${controladoresFiltrados.length} controlador(es) filtrado(s) a Excel` : 'Exportar todos los controladores a Excel'}
            >
              <FaFileExcel /> Exportar a Excel {hayFiltroControladorActivo ? `(${controladoresFiltrados.length})` : ''}
            </button>

            <button
              onClick={exportarControladoresPdf}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e11d48', color: 'white',
                border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(225,29,72,0.2)', transition: 'background-color 0.2s', fontSize: '0.95rem'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#be123c'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#e11d48'}
              title={hayFiltroControladorActivo ? `Exportar ${controladoresFiltrados.length} controlador(es) filtrado(s) a PDF` : 'Exportar todos los controladores a PDF'}
            >
              <FaFilePdf /> Exportar a PDF {hayFiltroControladorActivo ? `(${controladoresFiltrados.length})` : ''}
            </button>

            <button
              onClick={() => { resetControladorForm(); cargarCatalogos(); setModalControladorAbierto(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#691B31', color: 'white',
                border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(105,27,49,0.15)', fontSize: '0.95rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A02142'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#691B31'}
            >
              <FaPlus /> Registrar Controlador
            </button>
          </div>
        )}
      </div>

      {/* ================= SEMÁFOROS DASHBOARD INTERACTIVO DRILL-DOWN ================= */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setDbSemaforosExpandido(!dbSemaforosExpandido)}>
          <h2 style={{ fontSize: '1.15rem', color: '#1E293B', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#691B31' }}></span> Dashboard Rápido e Interactivo de {tabActiva === 'existencias' ? 'Existencias' : 'Controladores'}
          </h2>
          <button style={{ background: 'none', border: 'none', color: '#691B31', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
            {dbSemaforosExpandido ? '▲ Ocultar' : '▼ Mostrar'}
          </button>
        </div>

        {dbSemaforosExpandido && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
            {/* BREADCRUMBS Y VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B', fontWeight: '500' }}>
                <span style={{ cursor: 'pointer', color: '#691B31' }} onClick={() => { setDbSemaforosTipo(null); setDbSemaforosItem(null); }}>Inicio</span>
                {dbSemaforosTipo && (
                  <>
                    <span>/</span>
                    <span
                      style={{ cursor: dbSemaforosItem ? 'pointer' : 'default', color: dbSemaforosItem ? '#691B31' : '#475569', fontWeight: !dbSemaforosItem ? 'bold' : '500' }}
                      onClick={() => { setDbSemaforosItem(null); }}
                    >
                      {tabActiva === 'existencias' ? getCategoriaLabel(dbSemaforosTipo) : dbSemaforosTipo}
                    </span>
                  </>
                )}
                {dbSemaforosItem && (
                  <>
                    <span>/</span>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>{dbSemaforosItem}</span>
                  </>
                )}
              </div>

              {(dbSemaforosTipo || dbSemaforosItem) && (
                <button
                  onClick={() => {
                    if (dbSemaforosItem) {
                      setDbSemaforosItem(null);
                    } else if (dbSemaforosTipo) {
                      setDbSemaforosTipo(null);
                    }
                  }}
                  style={{
                    backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px',
                    padding: '0.35rem 0.75rem', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer',
                    color: '#475569', transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                >
                  Volver Atrás
                </button>
              )}
            </div>

            {/* TAB: EXISTENCIAS (REFACCIONES) */}
            {tabActiva === 'existencias' && (
              <>
                {/* NIVEL 1: POR CATEGORIA */}
                {!dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>Selecciona una categoría de componentes para ver las piezas disponibles en stock:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                      {Object.entries(
                        existencias
                          .filter(item => !((item.nombre || '').toLowerCase().includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes((item.estadoFisico || '').toLowerCase())))
                          .reduce((acc, curr) => {
                            const c = curr.categoria || 'componente';
                            acc[c] = (acc[c] || 0) + curr.cantidad;
                            return acc;
                          }, {})
                      ).map(([cat, totalStock]) => (
                        <div
                          key={cat}
                          onClick={() => setDbSemaforosTipo(cat)}
                          style={{
                            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                            padding: '1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{ fontSize: '1.5rem' }}>{getCategoriaIcon(cat)}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{getCategoriaLabel(cat)}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{totalStock} unidades</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NIVEL 2: LISTADO DE PIEZAS */}
                {dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>
                      Listado de existencias disponibles de la categoría <strong>{getCategoriaLabel(dbSemaforosTipo)}</strong>:
                    </p>
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Artículo</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Marca / Modelo</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Detalles</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {existencias
                            .filter(item => !((item.nombre || '').toLowerCase().includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes((item.estadoFisico || '').toLowerCase())))
                            .filter(item => item.categoria === dbSemaforosTipo)
                            .map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#1E293B', textTransform: 'capitalize' }}>
                                  {item.nombre}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                  {item.marca || '—'} {item.modelo || '—'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.8rem' }}>
                                  {item.numeroSerie && <div>S/N: {item.numeroSerie}</div>}
                                  {item.numeroInventario && <div>Inv: {item.numeroInventario}</div>}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', color: item.cantidad > 5 ? '#0f766e' : '#b45309', fontSize: '1.1rem' }}>
                                  {item.cantidad}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB: CONTROLADORES INSTALADOS */}
            {tabActiva === 'controladores' && (
              <>
                {/* NIVEL 1: POR MODELO */}
                {!dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>Selecciona un modelo de controlador para ver sus cruceros instalados:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                      {Object.entries(
                        todosLosControladores.reduce((acc, curr) => {
                          const m = curr.modelo || 'Otro';
                          acc[m] = (acc[m] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([modelo, count]) => (
                        <div
                          key={modelo}
                          onClick={() => setDbSemaforosTipo(modelo)}
                          style={{
                            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                            padding: '1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{ color: '#691B31', fontSize: '1.5rem' }}><FaRoad /></div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>{modelo}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{count} instalados</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NIVEL 2: CRUCEROS CON EL MODELO */}
                {dbSemaforosTipo && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem', marginTop: 0 }}>
                      Desglose de controladores modelo <strong>{dbSemaforosTipo}</strong> instalados en cruceros:
                    </p>
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Crucero / Ubicación</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Semáforos (3 L / 4 L)</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>LEDs (V / R / A)</th>
                            <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: '600' }}>Accesorios Activos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todosLosControladores
                            .filter(ctrl => ctrl.modelo === dbSemaforosTipo)
                            .map(ctrl => (
                              <tr key={ctrl.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#1E293B' }}>
                                  {ctrl.crucero?.nombre || `Crucero #${ctrl.cruceroId}`}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                  3 luces: {ctrl.semaforos3Luces} | 4 luces: {ctrl.semaforos4Luces}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155', fontSize: '0.85rem' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FaCircle size={9} style={{ color: '#16A34A' }} /> {ctrl.totalLedsVerdes}</span>
                                    <span style={{ color: '#CBD5E1' }}>|</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FaCircle size={9} style={{ color: '#DC2626' }} /> {ctrl.totalLedsRojos}</span>
                                    <span style={{ color: '#CBD5E1' }}>|</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FaCircle size={9} style={{ color: '#D97706' }} /> {ctrl.totalLedsAmarillos}</span>
                                  </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {ctrl.pasoPeatonal && <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Paso Peatonal</span>}
                                    {ctrl.audible && <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Audible</span>}
                                    {ctrl.pantallaLed && <span style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Pantalla LED</span>}
                                    {ctrl.gps && <span style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>GPS</span>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* CONTROLES DE PESTAÑA (TABS) */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #E2E8F0', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTabActiva('existencias')}
          style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', fontSize: '1rem', fontWeight: '700',
            color: tabActiva === 'existencias' ? '#691B31' : '#9B9B9A', cursor: 'pointer',
            borderBottom: tabActiva === 'existencias' ? '3px solid #BC955B' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaBoxes /> Existencias Disponibles ({existencias.filter(item => !((item.nombre || '').toLowerCase().includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes((item.estadoFisico || '').toLowerCase()))).length})
          </div>
        </button>

        <button
          onClick={() => setTabActiva('danadas')}
          style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', fontSize: '1rem', fontWeight: '700',
            color: tabActiva === 'danadas' ? '#DC2626' : '#9B9B9A', cursor: 'pointer',
            borderBottom: tabActiva === 'danadas' ? '3px solid #DC2626' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaExclamationTriangle style={{ color: tabActiva === 'danadas' ? '#DC2626' : '#9B9B9A' }} /> Piezas Dañadas / Reemplazadas ({existencias.filter(item => (item.nombre || '').toLowerCase().includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes((item.estadoFisico || '').toLowerCase())).length})
          </div>
        </button>

        <button
          onClick={() => setTabActiva('controladores')}
          style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', fontSize: '1rem', fontWeight: '700',
            color: tabActiva === 'controladores' ? '#691B31' : '#9B9B9A', cursor: 'pointer',
            borderBottom: tabActiva === 'controladores' ? '3px solid #BC955B' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaRoad /> Controladores Instalados
          </div>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB A: EXISTENCIAS / STOCK DISPONIBLE (BUEN ESTADO)           */}
      {/* ============================================================ */}
      {tabActiva === 'existencias' && (
        <div>
          {/* BUSCADOR DE REFACCIONES DISPONIBLES */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '600' }}>
              Mostrando refacciones en buen estado listas para instalación en cruceros:
            </div>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Buscar por refacción, marca, modelo, no. serie..."
                value={busquedaExistencias}
                onChange={(e) => setBusquedaExistencias(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1.5rem',
                  border: '2px solid #E2E8F0',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1E293B',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#BC955B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(188,149,91,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#BC955B', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                </svg>
              </span>
            </div>
          </div>

          {cargandoExistencias ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando existencias de componentes...</div>
          ) : (() => {
            const gruposDisponibles = agruparExistenciasDisponibles(
              existencias.filter(item => !((item.nombre || '').toLowerCase().includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes((item.estadoFisico || '').toLowerCase())))
            );
            const filtrados = gruposDisponibles.filter(item => coincideBusquedaSemaforo(item, busquedaExistencias));

            if (filtrados.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#6F7271' }}>
                  {busquedaExistencias.trim()
                    ? `No se encontraron refacciones disponibles para "${busquedaExistencias}".`
                    : 'No se han encontrado refacciones disponibles en el stock.'}
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filtrados.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.06)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: item.colorStripe || '#691B31' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#475569',
                          textTransform: 'uppercase',
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px'
                        }}>
                          {getCategoriaIcon(item.categoria)}
                          {getCategoriaLabel(item.categoria)}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', margin: '0.75rem 0 0.25rem', fontWeight: '800', color: '#1e293b', textTransform: 'capitalize' }}>
                          {item.nombre}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {item.marca && <span style={{ fontWeight: '600' }}>{item.marca}</span>}
                          {item.subItems?.length > 1
                            ? ` — ${item.subItems.length} registros individuales`
                            : item.subItems?.[0]?.modelo
                              ? ` — ${item.subItems[0].modelo}`
                              : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => abrirHistorial(item.subItems?.[0] || item)}
                          title="Ver historial de asignación"
                          style={{
                            backgroundColor: '#e0f2fe', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#bae6fd'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                        >
                          <FaHistory size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setGrupoSeleccionado(item.key);
                            setBusquedaDesglose('');
                          }}
                          title="Editar existencias y números de serie"
                          style={{
                            backgroundColor: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                        >
                          <FaEdit size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setGrupoSeleccionado(item.key);
                          setBusquedaDesglose('');
                        }}
                        style={{
                          backgroundColor: '#f1f5f9', color: '#691B31', border: 'none', borderRadius: '6px',
                          padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#691B31'; e.currentTarget.style.color = 'white' }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#691B31' }}
                      >
                        Ajustar Stock
                      </button>
                      <span style={{
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: '#0f766e',
                        backgroundColor: '#f0fdf4',
                        padding: '0.2rem 0.85rem',
                        borderRadius: '8px'
                      }}>
                        {item.cantidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB B: PIEZAS DAÑADAS / REEMPLAZADAS                         */}
      {/* ============================================================ */}
      {tabActiva === 'danadas' && (
        <div>
          {/* BUSCADOR DE PIEZAS DAÑADAS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#B91C1C', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaExclamationTriangle /> Apartado de piezas reemplazadas en cruceros, en reparación o para baja:
            </div>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Buscar pieza, marca, modelo, serie o crucero..."
                value={busquedaExistencias}
                onChange={(e) => setBusquedaExistencias(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1.5rem',
                  border: '2px solid #FECACA',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#1E293B',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(220,38,38,0.05)',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#FECACA';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#DC2626', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                </svg>
              </span>
            </div>
          </div>

          {cargandoExistencias ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando piezas dañadas...</div>
          ) : (() => {
            const piezasDanadas = existencias.filter(item => (item.nombre || '').toLowerCase().includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes((item.estadoFisico || '').toLowerCase()));
            const filtrados = piezasDanadas.filter(item => coincideBusquedaSemaforo(item, busquedaExistencias));

            if (filtrados.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#6F7271' }}>
                  {busquedaExistencias.trim()
                    ? `No se encontraron piezas dañadas que coincidan con "${busquedaExistencias}".`
                    : 'No hay piezas dañadas o reemplazadas registradas actualmente.'}
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filtrados.map((item) => {
                  const esDanadaDefinitiva = ['dañada', 'danada'].includes((item.estadoFisico || '').toLowerCase());
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
                        border: '1.5px solid #FECACA',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 20px rgba(220,38,38,0.1)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: esDanadaDefinitiva ? '#DC2626' : '#D97706' }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              color: '#475569',
                              textTransform: 'uppercase',
                              backgroundColor: '#f1f5f9',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px'
                            }}>
                              {getCategoriaIcon(item.categoria)}
                              {getCategoriaLabel(item.categoria)}
                            </span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              color: esDanadaDefinitiva ? '#991B1B' : '#92400E',
                              backgroundColor: esDanadaDefinitiva ? '#FEE2E2' : '#FEF3C7',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              border: esDanadaDefinitiva ? '1px solid #FCA5A5' : '1px solid #FCD34D'
                            }}>
                              {esDanadaDefinitiva ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <FaExclamationTriangle size={11} /> Dañada / Baja
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <FaWrench size={11} /> En Reparación
                                </span>
                              )}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.2rem', margin: '0.75rem 0 0.25rem', fontWeight: '800', color: '#1e293b', textTransform: 'capitalize' }}>
                            {item.nombre}
                          </h3>
                          {(item.marca || item.modelo) && (
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {item.marca && <span style={{ fontWeight: '600' }}>{item.marca}</span>}
                              {item.marca && item.modelo && ' - '}
                              {item.modelo && <span>{item.modelo}</span>}
                            </div>
                          )}
                          {(item.numeroSerie || item.numeroInventario) && (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              {item.numeroSerie && <span>S/N: {item.numeroSerie}</span>}
                              {item.numeroInventario && <span>Inv: {item.numeroInventario}</span>}
                            </div>
                          )}

                          {item.origenCrucero && (
                            <div style={{
                              marginTop: '0.6rem',
                              padding: '0.45rem 0.65rem',
                              backgroundColor: '#FEF2F2',
                              borderRadius: '8px',
                              border: '1px solid #FECACA',
                              fontSize: '0.82rem',
                              color: '#991B1B'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FaMapMarkerAlt size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                                <div>
                                  <strong style={{ color: '#7F1D1D' }}>Retirada del Crucero:</strong>{' '}
                                  <span style={{ fontWeight: '700' }}>{item.origenCrucero.crucero || item.origenCrucero.estacion || 'No registrado'}</span>
                                </div>
                              </div>
                              {item.origenCrucero.folio && (
                                <div style={{ marginTop: '0.2rem', paddingLeft: '1.35rem', fontSize: '0.75rem', color: '#B91C1C' }}>
                                  Folio de Reporte: <strong>{item.origenCrucero.folio}</strong>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={() => abrirHistorial(item)}
                            title="Ver historial de origen y asignación"
                            style={{
                              backgroundColor: '#e0f2fe', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#bae6fd'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                          >
                            <FaHistory size={14} />
                          </button>
                          <button
                            onClick={() => handleEditarStock(item)}
                            title="Editar pieza dañada"
                            style={{
                              backgroundColor: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                          >
                            <FaEdit size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fee2e2', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleAjustarStockDirecto(item)}
                          style={{
                            backgroundColor: '#fee2e2', color: '#991B1B', border: '1px solid #fecaca', borderRadius: '6px',
                            padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = 'white' }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#991B1B' }}
                        >
                          Ajustar Cantidad
                        </button>
                        <span style={{
                          fontSize: '1.5rem',
                          fontWeight: '800',
                          color: '#b91c1c',
                          backgroundColor: '#fef2f2',
                          padding: '0.1rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #fecaca'
                        }}>
                          {item.cantidad}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB C: CONTROLADORES INSTALADOS                              */}
      {/* ============================================================ */}
      {tabActiva === 'controladores' && (
        <div>
          {/* BARRA DE BÚSQUEDA Y FILTRADO DE CONTROLADORES */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* SELECTOR DE MODELO */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#691B31' }}>Modelo:</span>
                <select
                  value={filtroModeloControlador}
                  onChange={(e) => setFiltroModeloControlador(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    border: '2px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#334155',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="">Todos los modelos</option>
                  {modelosDisponibles.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* CONTADOR / BADGE */}
              <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>
                Mostrando {controladoresParaMostrar.length} de {todosLosControladores.length || totalControladores} controlador(es)
                {hayFiltroControladorActivo && ' (filtrados)'}
              </span>

              {/* BOTÓN LIMPIAR FILTROS */}
              {hayFiltroControladorActivo && (
                <button
                  onClick={() => {
                    setBusquedaControlador('')
                    setFiltroModeloControlador('')
                    setDbSemaforosTipo(null)
                  }}
                  style={{
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Restablecer filtros"
                >
                  <FaTimes size={11} /> Limpiar filtro
                </button>
              )}
            </div>

            {/* DERECHA: BÚSQUEDA */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="Buscar por crucero, modelo, no. gabinete, IP..."
                value={busquedaControlador}
                onChange={(e) => setBusquedaControlador(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.75rem 0.65rem 1.25rem',
                  border: '2px solid #E2E8F0',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#1E293B',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#BC955B'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(188,149,91,0.15)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#BC955B', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <FaSearch size={14} />
              </span>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {cargandoControladores ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>Cargando controladores...</div>
            ) : controladoresParaMostrar.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6F7271' }}>
                {hayFiltroControladorActivo
                  ? 'No se encontraron controladores que coincidan con la búsqueda o filtro aplicado.'
                  : 'No se han registrado controladores en el sistema.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#691B31' }}>Modelo</th>
                      <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271' }}>Ubicación (Crucero)</th>
                      <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271', textAlign: 'center' }}>Cabezales</th>
                      <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271', textAlign: 'center' }}>Leds (V / R / A)</th>
                      <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271' }}>Componentes</th>
                      <th style={{ padding: '1.25rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.75px', color: '#6F7271', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controladoresParaMostrar.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #E2E8F0',
                          backgroundColor: index % 2 === 0 ? 'white' : '#fcfbf9',
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fcfbf9'}
                      >
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#691B31' }}>{item.modelo}</td>
                        <td style={{ padding: '1rem', color: '#6F7271', fontWeight: '500' }}>{item.crucero?.nombre || 'Sin Crucero'}</td>
                        {(() => {
                          const cabezales = extraerListaCabezales(item)
                          let s3 = Number(item.semaforos3Luces) || 0
                          let s4 = Number(item.semaforos4Luces) || 0

                          // Sincronizar conteo de cabezales si provienen de postesDetalle
                          if (s3 === 0 && s4 === 0 && cabezales.length > 0) {
                            cabezales.forEach(c => {
                              if (c.numLeds === 3) s3++
                              else if (c.numLeds === 4) s4++
                            })
                          }

                          let s3_v = 0, s3_r = 0, s3_a = 0
                          let s4_v = 0, s4_r = 0, s4_a = 0, s4_fl = 0
                          let color4to = 'Flecha Verde'

                          if (cabezales.length > 0) {
                            cabezales.forEach(c => {
                              if (c.numLeds === 3) {
                                c.leds.forEach(l => {
                                  if (l.color === 'Verde') s3_v++
                                  else if (l.color === 'Rojo') s3_r++
                                  else if (l.color === 'Amarillo') s3_a++
                                })
                              } else if (c.numLeds === 4) {
                                c.leds.forEach((l, idx) => {
                                  if (idx === 3) {
                                    s4_fl++
                                    if (l.color) color4to = l.color
                                  } else if (l.color === 'Verde') s4_v++
                                  else if (l.color === 'Rojo') s4_r++
                                  else if (l.color === 'Amarillo') s4_a++
                                })
                              }
                            })
                          }

                          // Fallbacks si no vinieron LEDs detallados en postesDetalle pero sí semaforos3Luces / semaforos4Luces
                          if (s3_v === 0 && s3_r === 0 && s3_a === 0 && s3 > 0) {
                            s3_v = s3
                            s3_r = s3
                            s3_a = s3
                          }
                          if (s4_v === 0 && s4_r === 0 && s4_a === 0 && s4 > 0) {
                            s4_v = s4
                            s4_r = s4
                            s4_a = s4
                            s4_fl = Number(item.totalFlechasVerdes) || Number(item.totalFlechasRojas) || s4
                            if (Number(item.totalFlechasRojas) > 0 && Number(item.totalFlechasVerdes) === 0) {
                              color4to = 'Flecha Roja'
                            }
                          }

                          const cfg4 = obtenerConfigColorLed(color4to)

                          return (
                            <>
                              <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', justifyContent: 'center' }}>
                                  <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: '#16a34a' }}>3 leds: {s3}</span>
                                  </div>
                                  <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: '#0284c7' }}>4 leds: {s4}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', justifyContent: 'center' }}>
                                  {/* FILA 1: A LA ALTURA DE 3 LEDS */}
                                  <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                    {s3 > 0 || (s3 === 0 && s4 === 0) ? (
                                      <>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="3L - Verdes">
                                          <span style={{ display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 3px rgba(16,185,129,0.4)' }}></span>
                                          <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{s3_v}</span>
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="3L - Rojos">
                                          <span style={{ display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 3px rgba(239,68,68,0.4)' }}></span>
                                          <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{s3_r}</span>
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="3L - Amarillos">
                                          <span style={{ display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 3px rgba(245,158,11,0.4)' }}></span>
                                          <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{s3_a}</span>
                                        </span>
                                      </>
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                                    )}
                                  </div>

                                  {/* FILA 2: A LA ALTURA DE 4 LEDS */}
                                  <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                    {s4 > 0 ? (
                                      <>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="4L - Verdes">
                                          <span style={{ display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 3px rgba(16,185,129,0.4)' }}></span>
                                          <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{s4_v}</span>
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="4L - Rojos">
                                          <span style={{ display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 3px rgba(239,68,68,0.4)' }}></span>
                                          <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{s4_r}</span>
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title="4L - Amarillos">
                                          <span style={{ display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 3px rgba(245,158,11,0.4)' }}></span>
                                          <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{s4_a}</span>
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} title={`${color4to} (4L - Flecha)`}>
                                          <span
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '11px',
                                              height: '11px',
                                              borderRadius: '50%',
                                              backgroundColor: cfg4.dotBg || (cfg4.isArrow ? '#4ADE80' : cfg4.bg),
                                              color: '#000000',
                                              fontSize: '7px',
                                              lineHeight: 1,
                                              fontWeight: '900',
                                              boxShadow: `0 0 3px ${cfg4.shadow}`
                                            }}
                                          >
                                            {cfg4.isArrow ? '↗' : ''}
                                          </span>
                                          <span style={{ fontWeight: '700', color: '#334155', fontSize: '0.88rem' }}>{s4_fl}</span>
                                        </span>
                                      </>
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </>
                          )
                        })()}
                        {/* COMPONENTES: EXCLUSIVAMENTE VIDEODETECTORAS, PASO PEATONAL Y AUDIBLE */}
                        <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                          {(() => {
                            const postesNorm = normalizarPostesDetalle(item?.postesDetalle, item)
                            const tienePeatonal = Boolean(
                              item.pasoPeatonal ||
                              (Array.isArray(postesNorm) && postesNorm.some(p => p.tienePeatonal)) ||
                              (typeof item.postesDetalle === 'string' && item.postesDetalle.toLowerCase().includes('"tienepeatonal":true'))
                            )
                            const tieneAudible = Boolean(
                              item.audible ||
                              (Array.isArray(postesNorm) && postesNorm.some(p => p.tieneAudible)) ||
                              (typeof item.postesDetalle === 'string' && item.postesDetalle.toLowerCase().includes('"tieneaudible":true'))
                            )
                            const tieneCamara = Boolean(
                              item.camaraModelo ||
                              Number(item.camaraCantidad) > 0 ||
                              (Array.isArray(postesNorm) && postesNorm.some(p => p.tieneCamara)) ||
                              (typeof item.postesDetalle === 'string' && item.postesDetalle.toLowerCase().includes('"tienecamara":true'))
                            )
                            const cantCamaras = (Array.isArray(postesNorm) && postesNorm.some(p => p.tieneCamara))
                              ? postesNorm.reduce((acc, p) => p.tieneCamara ? acc + (parseInt(p.camaraCantidad, 10) || 1) : acc, 0)
                              : (parseInt(item.camaraCantidad, 10) || (item.camaraModelo ? 1 : 0))

                            const ninguno = !tienePeatonal && !tieneAudible && !tieneCamara

                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                                {tienePeatonal && (
                                  <span style={{ backgroundColor: '#DDC9A3', color: '#691B31', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>
                                    Paso Peatonal
                                  </span>
                                )}
                                {tieneAudible && (
                                  <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>
                                    Audible
                                  </span>
                                )}
                                {tieneCamara && (
                                  <span style={{ backgroundColor: '#E2E8F0', color: '#6F7271', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>
                                    Videodetectoras{cantCamaras > 1 ? ` (${cantCamaras})` : ''}
                                  </span>
                                )}
                                {ninguno && (
                                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                    Sin equipamiento
                                  </span>
                                )}
                              </div>
                            )
                          })()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleVerControlador(item)}
                              title="Visualizar detalles e infraestructura del controlador"
                              style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              onClick={() => exportarFichaIndividualControladorPdf(item)}
                              title="Descargar Ficha Técnica en PDF"
                              style={{ backgroundColor: '#e11d48', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#be123c'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e11d48'}
                            >
                              <FaFilePdf size={14} />
                            </button>
                            <button
                              onClick={() => handleEditarControlador(item)}
                              title="Editar"
                              style={{ backgroundColor: '#BC955B', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d4ae73'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#BC955B'}
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleEliminarControlador(item.id)}
                              title="Eliminar"
                              style={{ backgroundColor: '#A02142', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#691B31'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#A02142'}
                            >
                              <FaTrashAlt size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINACIÓN */}
                {!hayFiltroControladorActivo && totalControladores > limiteControladores && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6F7271' }}>
                      Mostrando controladores {((paginaControladores - 1) * limiteControladores) + 1} a {Math.min(paginaControladores * limiteControladores, totalControladores)} de {totalControladores}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        disabled={paginaControladores === 1}
                        onClick={() => setPaginaControladores(p => Math.max(1, p - 1))}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '0.4rem 0.8rem', border: '1px solid #CBD5E1',
                          borderRadius: '6px', backgroundColor: paginaControladores === 1 ? '#F1F5F9' : 'white',
                          cursor: paginaControladores === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <FaChevronLeft size={10} />
                      </button>
                      <button
                        disabled={paginaControladores * limiteControladores >= totalControladores}
                        onClick={() => setPaginaControladores(p => p + 1)}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '0.4rem 0.8rem', border: '1px solid #CBD5E1',
                          borderRadius: '6px', backgroundColor: paginaControladores * limiteControladores >= totalControladores ? '#F1F5F9' : 'white',
                          cursor: paginaControladores * limiteControladores >= totalControladores ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <FaChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                )}
                {hayFiltroControladorActivo && (
                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '0.825rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Mostrando {controladoresParaMostrar.length} controlador(es) coincidentes con el filtro actual.</span>
                    <button
                      onClick={() => {
                        setBusquedaControlador('')
                        setFiltroModeloControlador('')
                        setDbSemaforosTipo(null)
                      }}
                      style={{ background: 'none', border: 'none', color: '#691B31', fontWeight: '700', cursor: 'pointer', fontSize: '0.825rem' }}
                    >
                      Mostrar todos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL - INGRESAR / EDITAR EXISTENCIAS                        */}
      {/* ============================================================ */}
      {modalStockAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 10050, padding: '1rem', backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '2rem', width: '100%',
            maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            <button
              onClick={() => setModalStockAbierto(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', color: '#9B9B9A' }}
            >
              <FaTimes size={18} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#691B31', marginBottom: '1.5rem' }}>
              {editandoStockId ? 'Editar Refacción / Componente' : 'Ingresar Existencias de Refacción'}
            </h2>

            <form onSubmit={handleGuardarStock}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                  Nombre del componente/pieza
                </label>
                <input
                  type="text"
                  placeholder="Ej. cabezales, led verdes..."
                  value={stockForm.nombre}
                  onChange={(e) => setStockForm({ ...stockForm, nombre: e.target.value })}
                  disabled={modoAjusteDirecto}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: modoAjusteDirecto ? '#f1f5f9' : 'white', color: modoAjusteDirecto ? '#94a3b8' : 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                  Categoría
                </label>
                <select
                  value={stockForm.categoria}
                  onChange={(e) => setStockForm({ ...stockForm, categoria: e.target.value })}
                  disabled={modoAjusteDirecto}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: modoAjusteDirecto ? '#f1f5f9' : 'white', color: modoAjusteDirecto ? '#94a3b8' : 'inherit' }}
                >
                  <option value="componente">Componente</option>
                  <option value="accesorio">Accesorio</option>
                  <option value="periferico">Periférico</option>
                  <option value="equipo">Equipo</option>
                  <option value="herramienta">Herramienta</option>
                </select>
              </div>

              {!modoAjusteDirecto && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                        Marca
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. SEMEX"
                        value={stockForm.marca}
                        onChange={(e) => setStockForm({ ...stockForm, marca: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                        Modelo
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. TSL-12R-LX-IL6-A1-P3"
                        value={stockForm.modelo}
                        onChange={(e) => setStockForm({ ...stockForm, modelo: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                        No. Inventario
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 13711043"
                        value={stockForm.numeroInventario}
                        onChange={(e) => setStockForm({ ...stockForm, numeroInventario: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.25rem' }}>
                        No. Serie
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. A2304029767"
                        value={stockForm.numeroSerie}
                        onChange={(e) => setStockForm({ ...stockForm, numeroSerie: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#6F7271', marginBottom: '0.35rem' }}>
                  Cantidad disponible
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="1"
                  value={stockForm.cantidad ?? ''}
                  onFocus={e => e.target.select()}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setStockForm(prev => ({ ...prev, cantidad: '' }));
                    } else {
                      const num = parseInt(val, 10);
                      setStockForm(prev => ({ ...prev, cantidad: isNaN(num) ? '' : Math.max(0, num) }));
                    }
                  }}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalStockAbierto(false)}
                  style={{
                    padding: '0.6rem 1.2rem', border: '1px solid #CBD5E1', borderRadius: '8px',
                    backgroundColor: 'white', color: '#6F7271', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.2rem', border: 'none', borderRadius: '8px',
                    backgroundColor: '#691B31', color: 'white', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL - REGISTRAR / EDITAR CONTROLADOR                       */}
      {/* ============================================================ */}
      {modalControladorAbierto && (
        <div className={`modal-controlador-overlay ${formPantallaCompleta ? 'fullscreen' : ''}`}>
          <div className={`modal-controlador-card ${formPantallaCompleta ? 'fullscreen' : ''} ${modoVisualizacion ? 'modo-consulta' : ''}`}>
            <div style={{ maxWidth: formPantallaCompleta ? '1020px' : '100%', margin: '0 auto', width: '100%' }}>
              {/* ENCABEZADO DEL MODAL */}
              {modoVisualizacion ? (
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid #E2E8F0',
                  paddingBottom: '0.85rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingRight: '48px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', maxWidth: 'calc(100% - 150px)' }}>
                    <div style={{
                      backgroundColor: '#691B31',
                      color: 'white',
                      borderRadius: '8px',
                      width: '42px',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(105,27,49,0.2)',
                      flexShrink: 0
                    }}>
                      <FaTrafficLight size={22} style={{ color: '#FDE68A' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
                          Controlador Semafórico
                        </h2>
                        <span style={{
                          backgroundColor: '#691B31',
                          color: '#FFFFFF',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          letterSpacing: '0.5px'
                        }}>
                          {controladorForm.modelo || 'Sin modelo'}
                        </span>
                        <span style={{
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                          border: '1px solid #CBD5E1',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.74rem',
                          fontWeight: '600'
                        }}>
                          Activo Semafórico
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: '500', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaMapMarkerAlt size={12} style={{ color: '#691B31' }} />
                        <span style={{ fontWeight: '700', color: '#334155' }}>Crucero:</span> {listaCruceros.find(c => String(c.id) === String(controladorForm.cruceroId))?.nombre || controladorParaVer?.crucero?.nombre || controladorParaVer?.cruceroNombre || 'Sin crucero especificado'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setFormPantallaCompleta(!formPantallaCompleta)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '0.45rem 0.85rem',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                      title={formPantallaCompleta ? "Salir de pantalla completa (Pantalla normal)" : "Pantalla completa"}
                    >
                      {formPantallaCompleta ? <FaCompress size={13} /> : <FaExpand size={13} />}
                      <span>{formPantallaCompleta ? 'Pantalla normal' : 'Pantalla Completa'}</span>
                    </button>
                  </div>

                  {/* Botón de cerrar fijo siempre en la esquina superior derecha */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalControladorAbierto(false)
                      setModoVisualizacion(false)
                    }}
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                    title="Cerrar vista"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid #E2E8F0',
                  paddingBottom: '0.85rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingRight: '48px'
                }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#691B31', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaTrafficLight size={20} style={{ color: '#BC955B', flexShrink: 0 }} />
                    <span>{editandoControladorId ? 'Actualizar Controlador Semafórico' : 'Registrar Nuevo Controlador Semafórico'}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setModalControladorAbierto(false)}
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                    title="Cerrar"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              )}

              <form onSubmit={modoVisualizacion ? (e) => e.preventDefault() : handleGuardarControlador}>
                <div style={{ pointerEvents: modoVisualizacion ? 'none' : 'auto', userSelect: 'text' }}>
              {!modoVisualizacion && (
              <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    <FaMicrochip size={13} style={{ color: '#691B31' }} /> Modelo {!modoVisualizacion && <span className="req-star" style={{ color: '#DC2626' }}>*</span>}
                  </label>
                  {modoVisualizacion ? (
                    <div style={{
                      padding: '0.6rem 0.85rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      fontWeight: '700',
                      color: '#691B31',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minHeight: '40px',
                      boxSizing: 'border-box'
                    }}>
                      <FaTrafficLight size={15} style={{ color: '#BC955B' }} />
                      <span>{controladorForm.modelo || 'Sin modelo asignado'}</span>
                    </div>
                  ) : (
                    <select
                      value={controladorForm.modelo}
                      onChange={(e) => {
                        const nuevoModelo = e.target.value
                        if (nuevoModelo === 'C-3000') {
                          setControladorForm(prev => {
                            const switchMod = prev.switchFibraModelo && MODELOS_SWITCH_MOXA_CATALOGO.some(m => m.modelo === prev.switchFibraModelo) ? prev.switchFibraModelo : 'Moxa EDS-208 / 308'
                            const switchObj = MODELOS_SWITCH_MOXA_CATALOGO.find(m => m.modelo === switchMod)
                            return {
                              ...prev,
                              modelo: 'C-3000',
                              // Tarjeta de Conflictos para C-3000 (Solo marca y modelo)
                              tarjetaConflictosMarcaModo: 'Peek Traffic',
                              tarjetaConflictosMarca: 'Peek Traffic',
                              tarjetaConflictosModelo: prev.tarjetaConflictosModelo && MODELOS_TARJETA_CONFLICTOS_PEEK.includes(prev.tarjetaConflictosModelo) ? prev.tarjetaConflictosModelo : 'Model 2010E',
                              // Switch de Fibra para C-3000 (Marca, modelo y total de puertos según modelo)
                              switchFibraMarcaModo: 'Moxa',
                              switchFibraMarca: 'Moxa',
                              switchFibraModelo: switchMod,
                              switchFibraPuertosTotal: switchObj ? switchObj.puertos : '8',
                              switch: true,
                              // Relevadores para C-3000 (Solo marca y modelo)
                              tarjetaRelevadoresMarcaModo: 'Peek Traffic',
                              tarjetaRelevadoresMarca: 'Peek Traffic',
                              tarjetaRelevadoresModelo: prev.tarjetaRelevadoresModelo && MODELOS_RELEVADORES_PEEK.includes(prev.tarjetaRelevadoresModelo) ? prev.tarjetaRelevadoresModelo : 'RC-308',
                              tarjetaRelevadora: true
                            }
                          })
                        } else if (nuevoModelo === 'C-5000') {
                          setControladorForm(prev => ({
                            ...prev,
                            modelo: 'C-5000',
                            // Tarjeta de Conflictos para C-5000 (Solo marca y modelo)
                            tarjetaConflictosMarcaModo: 'Oriux (Peek Traffic)',
                            tarjetaConflictosMarca: 'Oriux (Peek Traffic)',
                            tarjetaConflictosModelo: 'C5000 MMU Integrado',
                            // Switch de Fibra para C-5000 (Marca, modelo y total de puertos según modelo)
                            switchFibraMarcaModo: 'Oriux',
                            switchFibraMarca: 'Oriux',
                            switchFibraModelo: 'C5000 ATC CPU Ports',
                            switchFibraPuertosTotal: '2',
                            switch: true,
                            // Relevadores para C-5000 (Solo marca y modelo)
                            tarjetaRelevadoresMarcaModo: 'Oriux',
                            tarjetaRelevadoresMarca: 'Oriux',
                            tarjetaRelevadoresModelo: 'C5000 Card-Based Load Switch',
                            tarjetaRelevadora: true
                          }))
                        } else {
                          setControladorForm(prev => ({
                            ...prev,
                            modelo: nuevoModelo
                          }))
                        }
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#BC955B'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(188,149,91,0.15)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = controladorErrores.modelo ? '#A02142' : '#CBD5E1'; e.currentTarget.style.boxShadow = 'none' }}
                      style={{
                        width: '100%', padding: '0.6rem 0.75rem',
                        border: `1px solid ${controladorErrores.modelo ? '#A02142' : '#CBD5E1'}`,
                        borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', color: '#1E293B',
                        backgroundColor: '#fff', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box', cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Seleccionar Modelo --</option>
                      <option value="C-3000">C-3000</option>
                      <option value="C-5000">C-5000</option>
                    </select>
                  )}
                  {controladorErrores.modelo && <span style={{ fontSize: '0.75rem', color: '#A02142' }}>{controladorErrores.modelo}</span>}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                      <FaMapMarkerAlt size={13} style={{ color: '#691B31' }} /> Crucero {!modoVisualizacion && <span className="req-star" style={{ color: '#DC2626' }}>*</span>}
                    </label>
                    {!modoVisualizacion && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={handleCrearNuevoCruceroRapido}
                          title="Registrar un nuevo crucero si no aparece en la lista"
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#691B31',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                        >
                          <FaPlus size={9} style={{ color: '#BC955B' }} /> Nuevo crucero
                        </button>
                      </div>
                    )}
                  </div>
                  {modoVisualizacion ? (
                    <div style={{
                      padding: '0.6rem 0.85rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      fontWeight: '700',
                      color: '#1E293B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minHeight: '40px',
                      boxSizing: 'border-box'
                    }}>
                      <FaMapMarkerAlt size={14} style={{ color: '#691B31' }} />
                      <span>{listaCruceros.find(c => String(c.id) === String(controladorForm.cruceroId))?.nombre || controladorParaVer?.crucero?.nombre || controladorParaVer?.cruceroNombre || 'Sin crucero especificado'}</span>
                    </div>
                  ) : (
                    <select
                      value={controladorForm.cruceroId}
                      onChange={(e) => setControladorForm({ ...controladorForm, cruceroId: e.target.value })}
                      onFocus={() => cargarCatalogos()}
                      style={{
                        width: '100%', padding: '0.6rem', border: `1px solid ${controladorErrores.cruceroId ? '#A02142' : '#CBD5E1'}`,
                        borderRadius: '8px', fontSize: '0.9rem'
                      }}
                    >
                      <option value="">-- Seleccionar Crucero --</option>
                      {listaCruceros.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  )}
                  {controladorErrores.cruceroId && <span style={{ fontSize: '0.75rem', color: '#A02142' }}>{controladorErrores.cruceroId}</span>}
                </div>
              </div>
              )}

              {!editandoControladorId && !modoVisualizacion && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '1rem'
                }}>
                  <button
                    type="button"
                    onClick={handleIniciarLevantamiento}
                    disabled={guardandoIniciando}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #691B31',
                      color: '#691B31',
                      borderRadius: '6px',
                      padding: '0.35rem 0.8rem',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FCFBF9'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                    title="Guarda la ubicación inicial del crucero para habilitar la captura simultánea"
                  >
                    {guardandoIniciando ? <FaSyncAlt className="fa-spin" size={11} /> : <FaSave size={11} />}
                    <span>{guardandoIniciando ? 'Guardando...' : 'Iniciar Crucero'}</span>
                  </button>
                </div>
              )}

              {/* SECCIÓN 1: INSPECCIÓN EXTERIOR, CIMENTACIÓN Y BASE */}
              <div style={{
                marginBottom: '1.5rem',
                backgroundColor: '#F8FAFC',
                padding: 'clamp(0.65rem, 2.5vw, 1.15rem)',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.2rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: '#691B31',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}>
                      <FaBuilding size={14} style={{ color: '#BC955B' }} /> Sección 1: Inspección Exterior, Cimentación y Base
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>
                      Revisión física del poste / crucero
                    </span>
                  </div>
                  {editandoControladorId && !modoVisualizacion && (
                    <button
                      type="button"
                      onClick={handleGuardarGabineteModular}
                      disabled={guardandoModularSeccion === 'gabinete'}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #691B31',
                        color: '#691B31',
                        borderRadius: '6px',
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                      }}
                      title="Guarda los datos del gabinete en el servidor sin afectar los postes"
                    >
                      {guardandoModularSeccion === 'gabinete' ? <FaSyncAlt className="fa-spin" size={11} /> : <FaSave size={11} />}
                      <span>{guardandoModularSeccion === 'gabinete' ? 'Guardando...' : 'Guardar solo Gabinete'}</span>
                    </button>
                  )}
                </div>

                <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem', alignItems: 'start' }}>
                  {/* Pregunta 1: Cimiento 4 dados */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaCube size={13} style={{ color: '#691B31', marginTop: '2px', flexShrink: 0 }} />
                      <span>{modoVisualizacion ? 'Cimentación de Base' : 'Cimiento: ¿4 dados completos y en buen estado?'} <span style={{ color: '#DC2626' }}>*</span></span>
                    </label>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '0.35rem', minHeight: '32px' }}>
                      {modoVisualizacion ? (
                        renderBadgeConsulta(
                          controladorForm.cimientoCompleto,
                          controladorForm.cimientoCompleto === 'Sí'
                            ? '4 dados completos · Concreto firme'
                            : (controladorForm.cimientoCuantosDados ? `Incompleto (${controladorForm.cimientoCuantosDados} dados presentes)` : 'Incompleto')
                        )
                      ) : (
                        ['Sí', 'No'].map((opcion) => (
                          <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: controladorForm.cimientoCompleto === opcion ? '700' : '500', color: '#1E293B' }}>
                            <input
                              type="radio"
                              name="cimientoCompleto"
                              value={opcion}
                              checked={controladorForm.cimientoCompleto === opcion}
                              onChange={(e) => {
                                const val = e.target.value
                                setControladorForm({
                                  ...controladorForm,
                                  cimientoCompleto: val,
                                  cimientoCuantosDados: val === 'Sí' ? '' : controladorForm.cimientoCuantosDados
                                })
                              }}
                              style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            {opcion}
                          </label>
                        ))
                      )}
                    </div>

                    {/* Subcampo condicional: solo si respondió No y no está en modo visualización */}
                    {!modoVisualizacion && controladorForm.cimientoCompleto === 'No' && (
                      <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed #CBD5E1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.35rem' }}>
                          <FaCube size={11} style={{ color: '#691B31' }} /> <span>¿Cuántos dados tiene? <span style={{ color: '#DC2626' }}>*</span></span>
                        </label>
                        <input
                          type="text"
                          placeholder="ej. 1, 2 o 3"
                          value={controladorForm.cimientoCuantosDados}
                          onChange={(e) => {
                            const val = e.target.value
                            setControladorForm(prev => ({ ...prev, cimientoCuantosDados: val }))
                            const num = parseInt(val, 10)
                            if (val.trim() && (!isNaN(num) && (num > 3 || num < 0))) {
                              setControladorErrores(prev => ({
                                ...prev,
                                cimientoCuantosDados: 'Máximo 3 dados (0 a 3).'
                              }))
                            } else if (controladorErrores.cimientoCuantosDados) {
                              setControladorErrores(prev => ({ ...prev, cimientoCuantosDados: undefined }))
                            }
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            border: `1px solid ${controladorErrores.cimientoCuantosDados ? '#DC2626' : '#CBD5E1'}`,
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            backgroundColor: controladorErrores.cimientoCuantosDados ? '#FEF2F2' : '#FFFFFF',
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'border-color 0.2s, background-color 0.2s'
                          }}
                        />
                        {controladorErrores.cimientoCuantosDados && (
                          <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.cimientoCuantosDados}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pregunta 3: Tapa de cableado */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: 'start'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                      <FaCheckSquare size={13} style={{ color: '#691B31', marginTop: '2px', flexShrink: 0 }} />
                      <span>{modoVisualizacion ? 'Tapa de Cableado' : 'Tapa de cableado: ¿Presente y en buen estado?'} <span style={{ color: '#DC2626' }}>*</span></span>
                    </label>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '0.35rem', minHeight: '32px' }}>
                      {modoVisualizacion ? (
                        renderBadgeConsulta(
                          controladorForm.tapaCableado,
                          controladorForm.tapaCableado === 'Sí' ? 'Presente y asegurada' : 'Faltante / Dañada'
                        )
                      ) : (
                        ['Sí', 'No'].map((opcion) => (
                          <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: controladorForm.tapaCableado === opcion ? '700' : '500', color: '#1E293B' }}>
                            <input
                              type="radio"
                              name="tapaCableado"
                              value={opcion}
                              checked={controladorForm.tapaCableado === opcion}
                              onChange={(e) => setControladorForm({ ...controladorForm, tapaCableado: e.target.value })}
                              style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            {opcion}
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pregunta 4: Tornillería base */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaWrench size={13} style={{ color: '#691B31', marginTop: '2px', flexShrink: 0 }} />
                      <span>{modoVisualizacion ? 'Tornillería de Base' : 'Tornillería: ¿4 tornillos de base completos?'} <span style={{ color: '#DC2626' }}>*</span></span>
                    </label>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '0.35rem', minHeight: '32px' }}>
                      {modoVisualizacion ? (
                        renderBadgeConsulta(
                          controladorForm.tornilleriaBaseCompleta,
                          controladorForm.tornilleriaBaseCompleta === 'Sí'
                            ? '4 tornillos de anclaje completos'
                            : (controladorForm.tornilleriaCuantosTornillos ? `Incompleta (${controladorForm.tornilleriaCuantosTornillos} tornillos presentes)` : 'Incompleta')
                        )
                      ) : (
                        ['Sí', 'No'].map((opcion) => (
                          <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: controladorForm.tornilleriaBaseCompleta === opcion ? '700' : '500', color: '#1E293B' }}>
                            <input
                              type="radio"
                              name="tornilleriaBaseCompleta"
                              value={opcion}
                              checked={controladorForm.tornilleriaBaseCompleta === opcion}
                              onChange={(e) => {
                                const val = e.target.value
                                setControladorForm({
                                  ...controladorForm,
                                  tornilleriaBaseCompleta: val,
                                  tornilleriaCuantosTornillos: val === 'Sí' ? '' : controladorForm.tornilleriaCuantosTornillos
                                })
                              }}
                              style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            {opcion}
                          </label>
                        ))
                      )}
                    </div>

                    {/* Subcampo condicional: solo si respondió No y no está en modo visualización */}
                    {!modoVisualizacion && controladorForm.tornilleriaBaseCompleta === 'No' && (
                      <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed #CBD5E1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.35rem' }}>
                          <FaWrench size={11} style={{ color: '#691B31' }} /> <span>¿Cuántos tornillos tiene? <span style={{ color: '#DC2626' }}>*</span></span>
                        </label>
                        <input
                          type="text"
                          placeholder="ej. 1, 2 o 3"
                          value={controladorForm.tornilleriaCuantosTornillos}
                          onChange={(e) => {
                            const val = e.target.value
                            setControladorForm(prev => ({ ...prev, tornilleriaCuantosTornillos: val }))
                            const num = parseInt(val, 10)
                            if (val.trim() && (!isNaN(num) && (num > 3 || num < 0))) {
                              setControladorErrores(prev => ({
                                ...prev,
                                tornilleriaCuantosTornillos: 'Máximo 3 tornillos (0 a 3).'
                              }))
                            } else if (controladorErrores.tornilleriaCuantosTornillos) {
                              setControladorErrores(prev => ({ ...prev, tornilleriaCuantosTornillos: undefined }))
                            }
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            border: `1px solid ${controladorErrores.tornilleriaCuantosTornillos ? '#DC2626' : '#CBD5E1'}`,
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            backgroundColor: controladorErrores.tornilleriaCuantosTornillos ? '#FEF2F2' : '#FFFFFF',
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'border-color 0.2s, background-color 0.2s'
                          }}
                        />
                        {controladorErrores.tornilleriaCuantosTornillos && (
                          <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.tornilleriaCuantosTornillos}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pregunta 6: Observaciones exterior */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaListUl size={13} style={{ color: '#691B31', flexShrink: 0 }} />
                      <span>Observaciones exterior</span>
                    </label>
                    {modoVisualizacion ? (
                      renderObservacionesConsulta(controladorForm.observacionesExterior)
                    ) : (
                      <textarea
                        rows={3}
                        placeholder="Detalles de pintura, golpes, corrosión o estado general..."
                        value={controladorForm.observacionesExterior}
                        onChange={(e) => setControladorForm({ ...controladorForm, observacionesExterior: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          marginTop: '0.35rem'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: ELECTRÓNICA INTERNA — MÓDULO GPS */}
              <div style={{
                marginBottom: '1.5rem',
                backgroundColor: '#F8FAFC',
                padding: 'clamp(0.65rem, 2.5vw, 1.15rem)',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.2rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '0.92rem',
                    fontWeight: '800',
                    color: '#691B31',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}>
                    <FaMapMarkerAlt size={14} style={{ color: '#BC955B' }} /> Sección 2: Electrónica Interna — Módulo GPS
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>
                    Sincronización y comunicación
                  </span>
                </div>

                {/* Pregunta Principal: GPS Receptor Satelital RC-308 / Sincronizador ATC-3000 */}
                <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                    <FaMapMarkerAlt size={13} style={{ color: '#691B31' }} />
                    <span>{modoVisualizacion ? 'Módulo Receptor GPS' : 'GPS:'} <span style={{ color: '#DC2626' }}>*</span></span>
                  </label>
                  {modoVisualizacion ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem', minHeight: '26px' }}>
                      {controladorForm.gpsModelo ? (
                        <>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'inline-block', flexShrink: 0 }}></span>
                          <span style={{ color: '#0F172A', fontSize: '0.9rem', fontWeight: '600' }}>
                            {controladorForm.gpsModelo}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic', fontWeight: '400' }}>Sin GPS registrado</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: (controladorForm.gpsModelo === 'Receptor Satelital GPS RC-308' || controladorForm.gpsModelo === 'Modelo A') ? '700' : '500',
                        color: '#1E293B'
                      }}>
                        <input
                          type="radio"
                          name="gpsModelo"
                          value="Receptor Satelital GPS RC-308"
                          checked={controladorForm.gpsModelo === 'Receptor Satelital GPS RC-308' || controladorForm.gpsModelo === 'Modelo A'}
                          onChange={() => setControladorForm({ ...controladorForm, gpsModelo: 'Receptor Satelital GPS RC-308', gps: true })}
                          style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        Receptor Satelital GPS RC-308
                      </label>

                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: (controladorForm.gpsModelo === 'Sincronizador Satelital Integrado ATC-3000' || controladorForm.gpsModelo === 'Modelo B') ? '700' : '500',
                        color: '#1E293B'
                      }}>
                        <input
                          type="radio"
                          name="gpsModelo"
                          value="Sincronizador Satelital Integrado ATC-3000"
                          checked={controladorForm.gpsModelo === 'Sincronizador Satelital Integrado ATC-3000' || controladorForm.gpsModelo === 'Modelo B'}
                          onChange={() => setControladorForm({ ...controladorForm, gpsModelo: 'Sincronizador Satelital Integrado ATC-3000', gpsComponenteFisico: '', gps: true })}
                          style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        Sincronizador Satelital Integrado ATC-3000
                      </label>
                    </div>
                  )}
                </div>

                {/* Subcampos condicionales según modelo GPS */}
                {controladorForm.gpsModelo && (
                  <div className={(controladorForm.gpsModelo === 'Receptor Satelital GPS RC-308' || controladorForm.gpsModelo === 'Modelo A') ? "form-responsive-grid grid-2" : ""} style={{ gap: '0.85rem 1rem' }}>
                    {/* Componente Físico: SOLO se muestra si es Receptor Satelital GPS RC-308 */}
                    {(controladorForm.gpsModelo === 'Receptor Satelital GPS RC-308' || controladorForm.gpsModelo === 'Modelo A') && (
                      <div style={{
                        backgroundColor: 'white',
                        padding: '0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                          <FaMicrochip size={13} style={{ color: '#691B31' }} />
                          <span>Componente físico: <span style={{ color: '#DC2626' }}>*</span></span>
                        </label>
                        {modoVisualizacion ? (
                          renderBadgeConsulta(controladorForm.gpsComponenteFisico)
                        ) : (
                          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {['Operativo', 'Dañado'].map((opcion) => (
                              <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: controladorForm.gpsComponenteFisico === opcion ? '700' : '500', color: '#1E293B' }}>
                                <input
                                  type="radio"
                                  name="gpsComponenteFisico"
                                  value={opcion}
                                  checked={controladorForm.gpsComponenteFisico === opcion}
                                  onChange={(e) => setControladorForm({ ...controladorForm, gpsComponenteFisico: e.target.value })}
                                  style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                {opcion}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Antena Exterior: Se muestra en ambos modelos */}
                    <div style={{
                      backgroundColor: 'white',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                        <FaBroadcastTower size={13} style={{ color: '#691B31' }} />
                        <span>Antena exterior: <span style={{ color: '#DC2626' }}>*</span></span>
                      </label>
                      {modoVisualizacion ? (
                        renderBadgeConsulta(controladorForm.gpsAntenaExterior)
                      ) : (
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {['Instalada', 'Dañada'].map((opcion) => (
                            <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: controladorForm.gpsAntenaExterior === opcion ? '700' : '500', color: '#1E293B' }}>
                              <input
                                type="radio"
                                name="gpsAntenaExterior"
                                value={opcion}
                                checked={controladorForm.gpsAntenaExterior === opcion}
                                onChange={(e) => setControladorForm({ ...controladorForm, gpsAntenaExterior: e.target.value })}
                                style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              {opcion}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 3: ELECTRÓNICA INTERNA (CPU) — RED Y CONFIGURACIÓN */}
              <div style={{
                marginBottom: '1.5rem',
                backgroundColor: '#F8FAFC',
                padding: 'clamp(0.65rem, 2.5vw, 1.15rem)',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.2rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '0.92rem',
                    fontWeight: '800',
                    color: '#691B31',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}>
                    <FaNetworkWired size={14} style={{ color: '#BC955B' }} /> Sección 3: Gabinete, Red y Configuración
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>
                    Parámetros de CPU y conectividad
                  </span>
                </div>

                <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem' }}>
                  {/* Número de Gabinete */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaHdd size={13} style={{ color: '#691B31' }} />
                      <span>Número de Gabinete (#): {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.numeroGabinete)
                    ) : (
                      <input
                        type="text"
                        placeholder="ej. GAB-01"
                        value={controladorForm.numeroGabinete}
                        onChange={(e) => setControladorForm({ ...controladorForm, numeroGabinete: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box',
                          marginTop: 'auto'
                        }}
                      />
                    )}
                  </div>

                  {/* Versión de Firmware */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaMicrochip size={13} style={{ color: '#691B31' }} />
                      <span>Versión de Firmware: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.versionFirmware)
                    ) : (
                      <input
                        type="text"
                        placeholder="ej. v2.4.1"
                        value={controladorForm.versionFirmware}
                        onChange={(e) => setControladorForm({ ...controladorForm, versionFirmware: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box',
                          marginTop: 'auto'
                        }}
                      />
                    )}
                  </div>

                  {/* IP Local */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaNetworkWired size={13} style={{ color: '#691B31' }} />
                      <span>IP Local: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.ipLocal, 'Sin registrar', true)
                    ) : (
                      <div>
                        <input
                          type="text"
                          placeholder="ej. 192.168.1.100"
                          value={controladorForm.ipLocal}
                          onChange={(e) => {
                            const val = e.target.value
                            setControladorForm(prev => ({ ...prev, ipLocal: val }))
                            if (controladorErrores.ipLocal) {
                              setControladorErrores(prev => ({ ...prev, ipLocal: undefined }))
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: `1px solid ${controladorErrores.ipLocal ? '#DC2626' : '#CBD5E1'}`,
                            backgroundColor: controladorErrores.ipLocal ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                        />
                        {controladorErrores.ipLocal && (
                          <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.ipLocal}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* IP System */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaNetworkWired size={13} style={{ color: '#691B31' }} />
                      <span>IP System: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.ipSystem, 'Sin registrar', true)
                    ) : (
                      <div>
                        <input
                          type="text"
                          placeholder="ej. 10.0.0.1"
                          value={controladorForm.ipSystem}
                          onChange={(e) => {
                            const val = e.target.value
                            setControladorForm(prev => ({ ...prev, ipSystem: val }))
                            if (controladorErrores.ipSystem) {
                              setControladorErrores(prev => ({ ...prev, ipSystem: undefined }))
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: `1px solid ${controladorErrores.ipSystem ? '#DC2626' : '#CBD5E1'}`,
                            backgroundColor: controladorErrores.ipSystem ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                        />
                        {controladorErrores.ipSystem && (
                          <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.ipSystem}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Máscara de Red */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaNetworkWired size={13} style={{ color: '#691B31' }} />
                      <span>Máscara de Red: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.mascaraRed, 'Sin registrar', true)
                    ) : (
                      <div>
                        <input
                          type="text"
                          placeholder="ej. 255.255.255.0"
                          value={controladorForm.mascaraRed}
                          onChange={(e) => {
                            const val = e.target.value
                            setControladorForm(prev => ({ ...prev, mascaraRed: val }))
                            if (controladorErrores.mascaraRed) {
                              setControladorErrores(prev => ({ ...prev, mascaraRed: undefined }))
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: `1px solid ${controladorErrores.mascaraRed ? '#DC2626' : '#CBD5E1'}`,
                            backgroundColor: controladorErrores.mascaraRed ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                        />
                        {controladorErrores.mascaraRed && (
                          <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.mascaraRed}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Gateway */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaNetworkWired size={13} style={{ color: '#691B31' }} />
                      <span>Gateway: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.gateway, 'Sin registrar', true)
                    ) : (
                      <div>
                        <input
                          type="text"
                          placeholder="ej. 192.168.1.1"
                          value={controladorForm.gateway}
                          onChange={(e) => {
                            const val = e.target.value
                            setControladorForm(prev => ({ ...prev, gateway: val }))
                            if (controladorErrores.gateway) {
                              setControladorErrores(prev => ({ ...prev, gateway: undefined }))
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: `1px solid ${controladorErrores.gateway ? '#DC2626' : '#CBD5E1'}`,
                            backgroundColor: controladorErrores.gateway ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                        />
                        {controladorErrores.gateway && (
                          <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.gateway}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ciclo completo */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaHistory size={13} style={{ color: '#691B31' }} />
                      <span>Ciclo completo: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.cicloCompleto)
                    ) : (
                      <div>
                        <input
                          type="text"
                          placeholder="ej. 90 segundos"
                          value={controladorForm.cicloCompleto}
                          onChange={(e) => {
                            const val = e.target.value
                            setControladorForm(prev => ({ ...prev, cicloCompleto: val }))
                            if (controladorErrores.cicloCompleto) {
                              setControladorErrores(prev => ({ ...prev, cicloCompleto: undefined }))
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: `1px solid ${controladorErrores.cicloCompleto ? '#DC2626' : '#CBD5E1'}`,
                            backgroundColor: controladorErrores.cicloCompleto ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                        />
                        {controladorErrores.cicloCompleto && (
                          <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.cicloCompleto}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Respaldo de programación descargado (USB) */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaUpload size={13} style={{ color: '#691B31' }} />
                      <span>Respaldo de programación descargado (USB / .zip): {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>

                    {modoVisualizacion ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', marginTop: 'auto', minHeight: '38px' }}>
                        {archivoProgramacion ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <FaFileArchive size={16} color="#059669" />
                              <span style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: '700' }}>
                                {typeof archivoProgramacion === 'string' ? archivoProgramacion.split('/').pop() : archivoProgramacion.name}
                              </span>
                            </div>
                            {typeof archivoProgramacion === 'string' && editandoControladorId && (
                              <button
                                type="button"
                                onClick={() => window.open(`${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/descargar-programacion`, '_blank')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700' }}
                              >
                                <FaDownload size={11} /> Descargar
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.82rem', fontStyle: 'italic', fontWeight: '500' }}>
                            Sin respaldo cargado
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <div
                          title="Haz clic o arrastra un archivo de respaldo (.zip, .cfg, .bin, .dat, .rar)"
                          onClick={() => archivoProgramacionInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0]
                              setArchivoProgramacion(file)
                              setControladorForm(prev => ({ ...prev, respaldoProgramacionUsb: file.name }))
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            minHeight: '38px',
                            border: archivoProgramacion ? '1px solid #10B981' : '1px dashed #CBD5E1',
                            borderRadius: '6px',
                            backgroundColor: archivoProgramacion ? '#F0FDF4' : '#F8FAFC',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            padding: '0.35rem 0.75rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                          onMouseOver={(e) => { if (!archivoProgramacion) e.currentTarget.style.borderColor = '#BC955B' }}
                          onMouseOut={(e) => { if (!archivoProgramacion) e.currentTarget.style.borderColor = '#CBD5E1' }}
                        >
                          {archivoProgramacion ? (
                            <>
                              {String(typeof archivoProgramacion === 'string' ? archivoProgramacion : archivoProgramacion.name).toLowerCase().endsWith('.zip') ? (
                                <FaFileArchive size={18} color="#059669" />
                              ) : (
                                <FaUpload size={18} color="#10B981" />
                              )}
                              <span style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: '600', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {typeof archivoProgramacion === 'string' ? archivoProgramacion.split('/').pop() : archivoProgramacion.name}
                              </span>
                              {archivoProgramacion instanceof File && (
                                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '500' }}>
                                  ({archivoProgramacion.size > 1024 * 1024 ? `${(archivoProgramacion.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(archivoProgramacion.size / 1024)} KB`})
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <FaUpload size={18} color="#BC955B" />
                              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Subir archivo (.zip, .cfg, .bin, .dat)</span>
                            </>
                          )}
                          <input
                            ref={archivoProgramacionInputRef}
                            type="file"
                            accept=".zip,.rar,.7z,.cfg,.bin,.dat,.txt,.tar,.gz,application/zip,application/x-zip-compressed,multipart/x-zip"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0]
                                setArchivoProgramacion(file)
                                setControladorForm(prev => ({ ...prev, respaldoProgramacionUsb: file.name }))
                              }
                            }}
                          />
                        </div>

                        {archivoProgramacion && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.35rem' }}>
                            {typeof archivoProgramacion === 'string' && editandoControladorId && (
                              <button
                                type="button"
                                onClick={() => {
                                  window.open(`${API_BASE_URL}/api/inventario/controladores/${editandoControladorId}/descargar-programacion`, '_blank')
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#0284C7', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', pointerEvents: 'auto' }}
                              >
                                <FaDownload size={11} /> Descargar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setArchivoProgramacion(null)
                                setControladorForm(prev => ({ ...prev, respaldoProgramacionUsb: '' }))
                                if (archivoProgramacionInputRef.current) archivoProgramacionInputRef.current.value = ''
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                            >
                              <FaTimes size={11} /> Quitar
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Tarjeta de Conflictos */}
                  <div style={{
                    gridColumn: '1 / -1',
                    backgroundColor: 'white',
                    padding: '0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#691B31', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FaExclamationTriangle size={13} style={{ color: '#BC955B' }} /> Tarjeta de Conflictos
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                      {/* 1. Marca */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                          <FaExclamationTriangle size={12} style={{ color: '#691B31' }} />
                          <span>Marca: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                        </label>
                        {modoVisualizacion ? (
                          renderDatoConsulta(controladorForm.tarjetaConflictosMarca || (controladorForm.modelo === 'C-5000' ? 'Oriux (Peek Traffic)' : 'Peek Traffic'))
                        ) : (
                          <>
                            <select
                              value={controladorForm.tarjetaConflictosMarcaModo || (controladorForm.modelo === 'C-5000' ? 'Oriux (Peek Traffic)' : 'Peek Traffic')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === 'Peek Traffic') {
                                  setControladorForm(prev => ({
                                    ...prev,
                                    tarjetaConflictosMarcaModo: 'Peek Traffic',
                                    tarjetaConflictosMarca: 'Peek Traffic',
                                    tarjetaConflictosModelo: prev.tarjetaConflictosModelo && MODELOS_TARJETA_CONFLICTOS_PEEK.includes(prev.tarjetaConflictosModelo) ? prev.tarjetaConflictosModelo : 'Model 2010E'
                                  }))
                                } else if (val === 'Oriux (Peek Traffic)') {
                                  setControladorForm(prev => ({
                                    ...prev,
                                    tarjetaConflictosMarcaModo: 'Oriux (Peek Traffic)',
                                    tarjetaConflictosMarca: 'Oriux (Peek Traffic)',
                                    tarjetaConflictosModelo: 'C5000 MMU Integrado'
                                  }))
                                } else if (val === 'Otro') {
                                  setControladorForm(prev => ({
                                    ...prev,
                                    tarjetaConflictosMarcaModo: 'Otro',
                                    tarjetaConflictosMarca: prev.tarjetaConflictosMarca && prev.tarjetaConflictosMarca !== 'Peek Traffic' && prev.tarjetaConflictosMarca !== 'Oriux (Peek Traffic)' ? prev.tarjetaConflictosMarca : '',
                                    tarjetaConflictosModelo: ''
                                  }))
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.65rem',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                boxSizing: 'border-box',
                                backgroundColor: 'white',
                                color: '#1E293B',
                                cursor: 'pointer',
                                marginTop: 'auto'
                              }}
                            >
                              {controladorForm.modelo === 'C-5000' || controladorForm.tarjetaConflictosMarcaModo === 'Oriux (Peek Traffic)' ? (
                                <option value="Oriux (Peek Traffic)">Oriux (Peek Traffic)</option>
                              ) : (
                                <option value="Peek Traffic">Peek Traffic</option>
                              )}
                              <option value="Otro">Otro (especificar)</option>
                            </select>
                            {controladorForm.tarjetaConflictosMarcaModo === 'Otro' && (
                              <input
                                type="text"
                                placeholder="Especificar otra marca..."
                                value={controladorForm.tarjetaConflictosMarca || ''}
                                onChange={(e) => setControladorForm({ ...controladorForm, tarjetaConflictosMarca: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  boxSizing: 'border-box',
                                  marginTop: '0.4rem'
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>

                      {/* 2. Modelo */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                          <FaExclamationTriangle size={12} style={{ color: '#691B31' }} />
                          <span>Modelo: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                        </label>
                        {modoVisualizacion ? (
                          renderDatoConsulta(controladorForm.tarjetaConflictosModelo, 'Sin modelo especificado')
                        ) : controladorForm.tarjetaConflictosMarcaModo === 'Otro' ? (
                          <input
                            type="text"
                            placeholder="Especificar modelo de tarjeta..."
                            value={controladorForm.tarjetaConflictosModelo || ''}
                            onChange={(e) => setControladorForm({ ...controladorForm, tarjetaConflictosModelo: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                              marginTop: 'auto'
                            }}
                          />
                        ) : (
                          <select
                            value={controladorForm.tarjetaConflictosModelo || ''}
                            onChange={(e) => setControladorForm({ ...controladorForm, tarjetaConflictosModelo: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                              backgroundColor: 'white',
                              color: '#1E293B',
                              cursor: 'pointer',
                              marginTop: 'auto'
                            }}
                          >
                            <option value="">-- Seleccionar modelo --</option>
                            {(controladorForm.modelo === 'C-5000' || controladorForm.tarjetaConflictosMarcaModo === 'Oriux (Peek Traffic)'
                              ? MODELOS_TARJETA_CONFLICTOS_C5000
                              : MODELOS_TARJETA_CONFLICTOS_PEEK
                            ).map((modelo) => (
                              <option key={modelo} value={modelo}>{modelo}</option>
                            ))}
                            {controladorForm.tarjetaConflictosModelo &&
                              !MODELOS_TARJETA_CONFLICTOS_PEEK.includes(controladorForm.tarjetaConflictosModelo) &&
                              !MODELOS_TARJETA_CONFLICTOS_C5000.includes(controladorForm.tarjetaConflictosModelo) && (
                                <option value={controladorForm.tarjetaConflictosModelo}>{controladorForm.tarjetaConflictosModelo}</option>
                              )}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Estado de operación */}
                    <div style={{ paddingTop: '0.4rem', borderTop: '1px solid #F1F5F9' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaExclamationTriangle size={12} style={{ color: '#691B31' }} />
                        <span>Estado de operación: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                      {modoVisualizacion ? (
                        renderBadgeConsulta(controladorForm.tarjetaConflictosEstado)
                      ) : (
                        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
                          {['Correcto', 'Falla'].map((opcion) => (
                            <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: controladorForm.tarjetaConflictosEstado === opcion ? '700' : '500', color: '#1E293B' }}>
                              <input
                                type="radio"
                                name="tarjetaConflictosEstado"
                                value={opcion}
                                checked={controladorForm.tarjetaConflictosEstado === opcion}
                                onChange={(e) => setControladorForm({ ...controladorForm, tarjetaConflictosEstado: e.target.value })}
                                style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              {opcion}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarjetas de Relevadores */}
                  <div style={{
                    gridColumn: '1 / -1',
                    backgroundColor: 'white',
                    padding: '0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#691B31', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FaCreditCard size={13} style={{ color: '#BC955B' }} /> Tarjetas de Relevadores
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                      {/* 1. Marca */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                          <FaCreditCard size={12} style={{ color: '#691B31' }} />
                          <span>Marca: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                        </label>
                        {modoVisualizacion ? (
                          renderDatoConsulta(controladorForm.tarjetaRelevadoresMarca || (controladorForm.modelo === 'C-5000' ? 'Oriux' : 'Peek Traffic'))
                        ) : (
                          <>
                            <select
                              value={controladorForm.tarjetaRelevadoresMarcaModo || (controladorForm.modelo === 'C-5000' ? 'Oriux' : 'Peek Traffic')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === 'Peek Traffic') {
                                  setControladorForm(prev => ({
                                    ...prev,
                                    tarjetaRelevadoresMarcaModo: 'Peek Traffic',
                                    tarjetaRelevadoresMarca: 'Peek Traffic',
                                    tarjetaRelevadoresModelo: MODELOS_RELEVADORES_PEEK.includes(prev.tarjetaRelevadoresModelo) ? prev.tarjetaRelevadoresModelo : 'RC-308',
                                    tarjetaRelevadora: true
                                  }))
                                } else if (val === 'SEMEX') {
                                  setControladorForm(prev => ({
                                    ...prev,
                                    tarjetaRelevadoresMarcaModo: 'SEMEX',
                                    tarjetaRelevadoresMarca: 'SEMEX',
                                    tarjetaRelevadoresModelo: MODELOS_RELEVADORES_SEMEX.includes(prev.tarjetaRelevadoresModelo) ? prev.tarjetaRelevadoresModelo : 'SEMEX SG-16',
                                    tarjetaRelevadora: true
                                  }))
                                } else if (val === 'Oriux') {
                                  setControladorForm(prev => ({
                                    ...prev,
                                    tarjetaRelevadoresMarcaModo: 'Oriux',
                                    tarjetaRelevadoresMarca: 'Oriux',
                                    tarjetaRelevadoresModelo: 'C5000 Card-Based Load Switch',
                                    tarjetaRelevadora: true
                                  }))
                                } else if (val === 'Otro') {
                                  setControladorForm(prev => ({
                                    ...prev,
                                    tarjetaRelevadoresMarcaModo: 'Otro',
                                    tarjetaRelevadoresMarca: (prev.tarjetaRelevadoresMarca && !['Peek Traffic', 'SEMEX', 'Oriux'].includes(prev.tarjetaRelevadoresMarca)) ? prev.tarjetaRelevadoresMarca : '',
                                    tarjetaRelevadoresModelo: '',
                                    tarjetaRelevadora: true
                                  }))
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.65rem',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                boxSizing: 'border-box',
                                backgroundColor: 'white',
                                color: '#1E293B',
                                cursor: 'pointer',
                                marginTop: 'auto'
                              }}
                            >
                              <option value="Peek Traffic">Peek Traffic</option>
                              <option value="SEMEX">SEMEX</option>
                              <option value="Oriux">Oriux</option>
                              <option value="Otro">Otro (especificar)</option>
                            </select>
                            {controladorForm.tarjetaRelevadoresMarcaModo === 'Otro' && (
                              <input
                                type="text"
                                placeholder="Especificar otra marca..."
                                value={controladorForm.tarjetaRelevadoresMarca || ''}
                                onChange={(e) => setControladorForm(prev => ({ ...prev, tarjetaRelevadoresMarca: e.target.value, tarjetaRelevadora: true }))}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  boxSizing: 'border-box',
                                  marginTop: '0.4rem'
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>

                      {/* 2. Modelo */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                          <FaCreditCard size={12} style={{ color: '#691B31' }} />
                          <span>Modelo: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                        </label>
                        {modoVisualizacion ? (
                          renderDatoConsulta(controladorForm.tarjetaRelevadoresModelo, 'Sin modelo especificado')
                        ) : controladorForm.tarjetaRelevadoresMarcaModo === 'Otro' ? (
                          <input
                            type="text"
                            placeholder="Especificar modelo de relevador..."
                            value={controladorForm.tarjetaRelevadoresModelo || ''}
                            onChange={(e) => setControladorForm(prev => ({ ...prev, tarjetaRelevadoresModelo: e.target.value, tarjetaRelevadora: true }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                              marginTop: 'auto'
                            }}
                          />
                        ) : (
                          <select
                            value={controladorForm.tarjetaRelevadoresModelo || ''}
                            onChange={(e) => setControladorForm(prev => ({ ...prev, tarjetaRelevadoresModelo: e.target.value, tarjetaRelevadora: true }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                              backgroundColor: 'white',
                              color: '#1E293B',
                              cursor: 'pointer',
                              marginTop: 'auto'
                            }}
                          >
                            <option value="">-- Seleccionar modelo --</option>
                            {(controladorForm.tarjetaRelevadoresMarcaModo === 'Peek Traffic'
                              ? MODELOS_RELEVADORES_PEEK
                              : (controladorForm.modelo === 'C-5000' || controladorForm.tarjetaRelevadoresMarcaModo === 'Oriux')
                                ? MODELOS_RELEVADORES_C5000
                                : MODELOS_RELEVADORES_SEMEX
                            ).map((modelo) => (
                              <option key={modelo} value={modelo}>{modelo}</option>
                            ))}
                            {controladorForm.tarjetaRelevadoresModelo &&
                              !MODELOS_RELEVADORES_PEEK.includes(controladorForm.tarjetaRelevadoresModelo) &&
                              !MODELOS_RELEVADORES_SEMEX.includes(controladorForm.tarjetaRelevadoresModelo) &&
                              !MODELOS_RELEVADORES_C5000.includes(controladorForm.tarjetaRelevadoresModelo) && (
                                <option value={controladorForm.tarjetaRelevadoresModelo}>{controladorForm.tarjetaRelevadoresModelo}</option>
                              )}
                          </select>
                        )}
                      </div>

                      {/* 3. Cantidad instalada */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                          <FaBoxes size={12} style={{ color: '#691B31' }} />
                          <span>Cantidad instalada: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                        </label>
                        {modoVisualizacion ? (
                          renderDatoConsulta(controladorForm.tarjetaRelevadoresCantidad, 'Sin registrar')
                        ) : (
                          <div>
                            <input
                              type="number"
                              min="0"
                              placeholder="ej. 8 o 16 piezas"
                              value={controladorForm.tarjetaRelevadoresCantidad || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                setControladorForm(prev => ({ ...prev, tarjetaRelevadoresCantidad: val, tarjetaRelevadora: true }))
                                if (controladorErrores.tarjetaRelevadoresCantidad) {
                                  setControladorErrores(prev => ({ ...prev, tarjetaRelevadoresCantidad: undefined }))
                                }
                              }}
                              onWheel={(e) => e.target.blur()}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.65rem',
                                border: `1px solid ${controladorErrores.tarjetaRelevadoresCantidad ? '#DC2626' : '#CBD5E1'}`,
                                backgroundColor: controladorErrores.tarjetaRelevadoresCantidad ? '#FEF2F2' : '#FFFFFF',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                boxSizing: 'border-box',
                                marginTop: 'auto'
                              }}
                            />
                            {controladorErrores.tarjetaRelevadoresCantidad && (
                              <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                                <FaExclamationTriangle size={10} /> {controladorErrores.tarjetaRelevadoresCantidad}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN C: RED, CONECTIVIDAD Y ENERGÍA */}
              <div style={{
                marginBottom: '1.5rem',
                backgroundColor: '#F8FAFC',
                padding: 'clamp(0.65rem, 2.5vw, 1.15rem)',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.2rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '0.92rem',
                    fontWeight: '800',
                    color: '#691B31',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}>
                    <FaProjectDiagram size={14} style={{ color: '#BC955B' }} /> Sección 4: Red, Conectividad y Energía
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>
                    Switch de fibra, conexiones y alimentación
                  </span>
                </div>

                {/* 1. Switch de Fibra */}
                <div style={{ backgroundColor: 'white', padding: '0.9rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#691B31', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaProjectDiagram size={13} style={{ color: '#BC955B' }} /> Switch de Fibra
                  </span>

                  {/* Fila 1 y 2: Marca, Modelo, Total de puertos y Puertos en uso */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    {/* 1. Marca */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaProjectDiagram size={12} style={{ color: '#691B31' }} />
                        <span>Marca: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                      {modoVisualizacion ? (
                        renderDatoConsulta(controladorForm.switchFibraMarca || (controladorForm.modelo === 'C-5000' ? 'Oriux' : 'Moxa'))
                      ) : (
                        <>
                          <select
                            value={controladorForm.switchFibraMarcaModo || (controladorForm.modelo === 'C-5000' ? 'Oriux' : 'Moxa')}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === 'Moxa') {
                                setControladorForm(prev => {
                                  const switchMod = prev.switchFibraModelo && MODELOS_SWITCH_MOXA_CATALOGO.some(m => m.modelo === prev.switchFibraModelo) ? prev.switchFibraModelo : 'Moxa EDS-208 / 308'
                                  const switchObj = MODELOS_SWITCH_MOXA_CATALOGO.find(m => m.modelo === switchMod)
                                  const newTotal = switchObj ? parseInt(switchObj.puertos, 10) : 8
                                  const prevUso = parseInt(prev.switchFibraPuertosUso, 10)
                                  const nuevoUso = (!isNaN(prevUso) && prevUso > newTotal) ? String(newTotal) : prev.switchFibraPuertosUso
                                  return {
                                    ...prev,
                                    switchFibraMarcaModo: 'Moxa',
                                    switchFibraMarca: 'Moxa',
                                    switchFibraModelo: switchMod,
                                    switchFibraPuertosTotal: switchObj ? switchObj.puertos : '8',
                                    switchFibraPuertosUso: nuevoUso,
                                    switch: true
                                  }
                                })
                                setControladorErrores(prev => ({ ...prev, switchFibraPuertosTotal: undefined, switchFibraPuertosUso: undefined }))
                              } else if (val === 'Oriux') {
                                setControladorForm(prev => {
                                  const newTotal = 2
                                  const prevUso = parseInt(prev.switchFibraPuertosUso, 10)
                                  const nuevoUso = (!isNaN(prevUso) && prevUso > newTotal) ? String(newTotal) : prev.switchFibraPuertosUso
                                  return {
                                    ...prev,
                                    switchFibraMarcaModo: 'Oriux',
                                    switchFibraMarca: 'Oriux',
                                    switchFibraModelo: 'C5000 ATC CPU Ports',
                                    switchFibraPuertosTotal: '2',
                                    switchFibraPuertosUso: nuevoUso,
                                    switch: true
                                  }
                                })
                                setControladorErrores(prev => ({ ...prev, switchFibraPuertosTotal: undefined, switchFibraPuertosUso: undefined }))
                              } else if (val === 'Otro') {
                                setControladorForm(prev => ({
                                  ...prev,
                                  switchFibraMarcaModo: 'Otro',
                                  switchFibraMarca: (prev.switchFibraMarca && prev.switchFibraMarca !== 'Moxa' && prev.switchFibraMarca !== 'Oriux') ? prev.switchFibraMarca : '',
                                  switchFibraModelo: '',
                                  switchFibraPuertosTotal: '',
                                  switch: true
                                }))
                                setControladorErrores(prev => ({ ...prev, switchFibraPuertosTotal: undefined, switchFibraPuertosUso: undefined }))
                              }
                            }}
                            style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box', backgroundColor: 'white', color: '#1E293B', cursor: 'pointer', marginTop: 'auto' }}
                          >
                            {controladorForm.modelo === 'C-5000' || controladorForm.switchFibraMarcaModo === 'Oriux' ? (
                              <option value="Oriux">Oriux</option>
                            ) : (
                              <option value="Moxa">Moxa</option>
                            )}
                            <option value="Otro">Otro (especificar)</option>
                          </select>
                          {controladorForm.switchFibraMarcaModo === 'Otro' && (
                            <input
                              type="text"
                              placeholder="Especificar marca (ej. Cisco, RuggedCom)..."
                              value={controladorForm.switchFibraMarca || ''}
                              onChange={(e) => setControladorForm({ ...controladorForm, switchFibraMarca: e.target.value, switch: true })}
                              style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.82rem', boxSizing: 'border-box', marginTop: '0.4rem' }}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* 2. Modelo */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaHdd size={12} style={{ color: '#691B31' }} />
                        <span>Modelo: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                      {modoVisualizacion ? (
                        renderDatoConsulta(controladorForm.switchFibraModelo, 'Sin modelo especificado')
                      ) : controladorForm.switchFibraMarcaModo === 'Otro' ? (
                        <input
                          type="text"
                          placeholder="Especificar modelo de switch..."
                          value={controladorForm.switchFibraModelo || ''}
                          onChange={(e) => setControladorForm({ ...controladorForm, switchFibraModelo: e.target.value, switch: true })}
                          style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box', marginTop: 'auto' }}
                        />
                      ) : (
                        <select
                          value={controladorForm.switchFibraModelo || ''}
                          onChange={(e) => {
                            const mod = e.target.value
                            const catalogo = (controladorForm.modelo === 'C-5000' || controladorForm.switchFibraMarcaModo === 'Oriux')
                              ? MODELOS_SWITCH_ORIUX_CATALOGO
                              : MODELOS_SWITCH_MOXA_CATALOGO
                            const found = catalogo.find(m => m.modelo === mod)
                            const newTotal = found ? parseInt(found.puertos, 10) : undefined
                            setControladorForm(prev => {
                              const prevUso = parseInt(prev.switchFibraPuertosUso, 10)
                              let nuevoUso = prev.switchFibraPuertosUso
                              if (newTotal !== undefined && !isNaN(prevUso) && prevUso > newTotal) {
                                nuevoUso = String(newTotal)
                              }
                              return {
                                ...prev,
                                switchFibraModelo: mod,
                                switchFibraPuertosTotal: found ? found.puertos : prev.switchFibraPuertosTotal,
                                switchFibraPuertosUso: nuevoUso,
                                switch: true
                              }
                            })
                            setControladorErrores(prev => ({ ...prev, switchFibraPuertosTotal: undefined, switchFibraPuertosUso: undefined }))
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box', backgroundColor: 'white', color: '#1E293B', cursor: 'pointer', marginTop: 'auto' }}
                        >
                          <option value="">-- Seleccionar modelo --</option>
                          {(controladorForm.modelo === 'C-5000' || controladorForm.switchFibraMarcaModo === 'Oriux'
                            ? MODELOS_SWITCH_ORIUX_CATALOGO
                            : MODELOS_SWITCH_MOXA_CATALOGO
                          ).map((item) => (
                            <option key={item.modelo} value={item.modelo}>{item.modelo}</option>
                          ))}
                          {controladorForm.switchFibraModelo &&
                            !MODELOS_SWITCH_MOXA_CATALOGO.some(m => m.modelo === controladorForm.switchFibraModelo) &&
                            !MODELOS_SWITCH_ORIUX_CATALOGO.some(m => m.modelo === controladorForm.switchFibraModelo) && (
                              <option value={controladorForm.switchFibraModelo}>{controladorForm.switchFibraModelo}</option>
                            )}
                        </select>
                      )}
                    </div>

                    {/* 3. Total de puertos */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaNetworkWired size={12} style={{ color: '#691B31' }} />
                        <span>Total de puertos: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                      {modoVisualizacion ? (
                        renderDatoConsulta(controladorForm.switchFibraPuertosTotal ? `${controladorForm.switchFibraPuertosTotal} puertos` : '', 'Sin registrar')
                      ) : (
                        <div>
                          <input
                            type="number"
                            min="0"
                            placeholder="ej. 2, 8 o 10 puertos"
                            value={controladorForm.switchFibraPuertosTotal || ''}
                            onChange={(e) => handleCambiarSwitchPuertosTotal(e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              border: `1px solid ${controladorErrores.switchFibraPuertosTotal ? '#DC2626' : '#CBD5E1'}`,
                              backgroundColor: controladorErrores.switchFibraPuertosTotal ? '#FEF2F2' : '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                              marginTop: 'auto'
                            }}
                          />
                          {controladorErrores.switchFibraPuertosTotal && (
                            <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                              <FaExclamationTriangle size={10} /> {controladorErrores.switchFibraPuertosTotal}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 4. Puertos en uso */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaNetworkWired size={12} style={{ color: '#691B31' }} />
                        <span>Puertos en uso: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                      {modoVisualizacion ? (
                        renderDatoConsulta(controladorForm.switchFibraPuertosUso ? `${controladorForm.switchFibraPuertosUso} puertos` : '', 'Sin registrar')
                      ) : (
                        <div>
                          <input
                            type="number"
                            min="0"
                            max={controladorForm.switchFibraPuertosTotal !== '' && !isNaN(parseInt(controladorForm.switchFibraPuertosTotal, 10)) ? parseInt(controladorForm.switchFibraPuertosTotal, 10) : undefined}
                            placeholder="ej. 4 puertos"
                            value={controladorForm.switchFibraPuertosUso || ''}
                            onChange={(e) => handleCambiarSwitchPuertosUso(e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              border: `1px solid ${controladorErrores.switchFibraPuertosUso ? '#DC2626' : '#CBD5E1'}`,
                              backgroundColor: controladorErrores.switchFibraPuertosUso ? '#FEF2F2' : '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                              marginTop: 'auto'
                            }}
                          />
                          {controladorErrores.switchFibraPuertosUso && (
                            <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                              <FaExclamationTriangle size={10} /> {controladorErrores.switchFibraPuertosUso}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Fuentes de poder del switch */}
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                      <FaPowerOff size={12} style={{ color: '#691B31' }} />
                      <span>Fuentes de poder del switch: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderBadgeConsulta(controladorForm.switchFibraFuentePoder)
                    ) : (
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {['Operativa', 'Sin operar'].map((opcion) => (
                          <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: controladorForm.switchFibraFuentePoder === opcion ? '700' : '500', color: '#1E293B' }}>
                            <input
                              type="radio"
                              name="switchFibraFuentePoder"
                              value={opcion}
                              checked={controladorForm.switchFibraFuentePoder === opcion}
                              onChange={(e) => setControladorForm({ ...controladorForm, switchFibraFuentePoder: e.target.value, switch: true })}
                              style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            {opcion}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Receptor de Fibra */}
                <div style={{ backgroundColor: 'white', padding: '0.9rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#691B31', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaProjectDiagram size={13} style={{ color: '#BC955B' }} /> Receptor de Fibra
                  </span>

                  <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1.25rem' }}>
                    {/* Dispositivo receptor */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaHdd size={12} style={{ color: '#691B31' }} />
                        <span>Dispositivo receptor: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                      {modoVisualizacion ? (
                        renderBadgeConsulta(controladorForm.receptorFibraDispositivo)
                      ) : (
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', minHeight: '34px' }}>
                          {['Presente', 'No tiene'].map((opcion) => (
                            <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: controladorForm.receptorFibraDispositivo === opcion ? '700' : '500', color: '#1E293B' }}>
                              <input
                                type="radio"
                                name="receptorFibraDispositivo"
                                value={opcion}
                                checked={controladorForm.receptorFibraDispositivo === opcion}
                                onChange={(e) => setControladorForm({ ...controladorForm, receptorFibraDispositivo: e.target.value, fibraOptica: opcion === 'Presente' })}
                                style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              {opcion}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cable de fibra óptica */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaProjectDiagram size={12} style={{ color: '#691B31' }} />
                        <span>Cable de fibra óptica: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                      {modoVisualizacion ? (
                        renderBadgeConsulta(controladorForm.receptorFibraCable)
                      ) : (
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', minHeight: '34px' }}>
                          {['Conectado', 'Desconectado', 'No tiene'].map((opcion) => (
                            <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: controladorForm.receptorFibraCable === opcion ? '700' : '500', color: '#1E293B' }}>
                              <input
                                type="radio"
                                name="receptorFibraCable"
                                value={opcion}
                                checked={controladorForm.receptorFibraCable === opcion}
                                onChange={(e) => setControladorForm({ ...controladorForm, receptorFibraCable: e.target.value })}
                                style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              {opcion}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3 & 4: Conexiones a la tarjeta madre & Alimentación Eléctrica / Fuente de poder */}
                <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem' }}>
                  {/* Conexiones a la tarjeta madre */}
                  <div style={{ backgroundColor: 'white', padding: '0.9rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.35rem' }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#691B31', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaMicrochip size={13} style={{ color: '#BC955B' }} /> Conexiones a la tarjeta madre
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaMicrochip size={12} style={{ color: '#691B31' }} />
                        <span>Total de conexiones ocupadas: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                    </div>
                    {modoVisualizacion ? (
                      renderDatoConsulta(controladorForm.conexionesTarjetaMadre, 'Sin registrar')
                    ) : (
                      <input
                        type="text"
                        placeholder="ej. 12 conexiones"
                        value={controladorForm.conexionesTarjetaMadre}
                        onChange={(e) => setControladorForm({ ...controladorForm, conexionesTarjetaMadre: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box', marginTop: 'auto' }}
                      />
                    )}
                  </div>

                  {/* Alimentación Eléctrica / Fuente de poder */}
                  <div style={{ backgroundColor: 'white', padding: '0.9rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.35rem' }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#691B31', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaPowerOff size={13} style={{ color: '#BC955B' }} /> Alimentación Eléctrica / Fuente
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                        <FaPowerOff size={12} style={{ color: '#691B31' }} />
                        <span>Supresor de picos: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                      </label>
                    </div>
                    {modoVisualizacion ? (
                      renderBadgeConsulta(controladorForm.fuentePoderSupresorPicos)
                    ) : (
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', minHeight: '38px', marginTop: 'auto' }}>
                        {['Operando', 'Dañado'].map((opcion) => (
                          <label key={opcion} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: controladorForm.fuentePoderSupresorPicos === opcion ? '700' : '500', color: '#1E293B' }}>
                            <input
                              type="radio"
                              name="fuentePoderSupresorPicos"
                              value={opcion}
                              checked={controladorForm.fuentePoderSupresorPicos === opcion}
                              onChange={(e) => setControladorForm({ ...controladorForm, fuentePoderSupresorPicos: e.target.value, fuentePoder: true })}
                              style={{ accentColor: '#691B31', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            {opcion}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN D: POSTES Y EQUIPAMIENTO VINCULADO */}
              <div style={{
                marginBottom: '1.5rem',
                backgroundColor: '#fcfbf9',
                padding: 'clamp(0.65rem, 2.5vw, 1.15rem)',
                borderRadius: '10px',
                border: '1px solid #DDC9A3',
                boxSizing: 'border-box'
              }}>
                {/* Header General de Postes */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '0.6rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: '#691B31',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}>
                      <FaSign size={14} style={{ color: '#BC955B' }} /> Sección 5: Postes y Equipamiento del Crucero
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '500' }}>
                      Detalle de postes, cabezales vehiculares, paso peatonal y detección
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FaBoxes size={11} style={{ color: '#691B31' }} />
                      {(controladorForm.postes || []).length} poste{((controladorForm.postes || []).length !== 1) ? 's' : ''} en crucero
                    </span>
                    {!modoVisualizacion && (
                      <button
                        type="button"
                        onClick={handleAgregarPoste}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: '#691B31',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#691B31'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                      >
                        <FaPlus size={10} style={{ color: '#BC955B' }} /> Agregar poste
                      </button>
                    )}
                  </div>
                </div>

                {/* Listado de Postes */}
                {(controladorForm.postes || []).length === 0 && modoVisualizacion && (
                  <div style={{ padding: '1.25rem', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                    No hay postes registrados en la infraestructura de este controlador.
                  </div>
                )}
                {(controladorForm.postes || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.85rem' }}>
                    {(controladorForm.postes || []).map((poste, pIdx) => (
                      <div
                        key={poste.uid || poste.id || pIdx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        padding: 'clamp(0.65rem, 2.5vw, 1.15rem)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Encabezado del poste */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '0.65rem',
                        borderBottom: '1px solid #F1F5F9',
                        marginBottom: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            backgroundColor: '#691B31',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <FaSign size={10} style={{ color: '#BC955B' }} /> Poste #{pIdx + 1}
                          </span>
                          <span style={{
                            backgroundColor: poste.tipoPoste === 'peatonal' ? '#E0F2FE' : '#F1F5F9',
                            color: poste.tipoPoste === 'peatonal' ? '#0369A1' : '#475569',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            border: poste.tipoPoste === 'peatonal' ? '1px solid #BAE6FD' : '1px solid #CBD5E1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            {poste.tipoPoste === 'peatonal' ? <FaWalking size={10} /> : <FaTrafficLight size={10} />}
                            {poste.tipoPoste === 'peatonal' ? 'Peatonal' : 'Vehicular / Mixto'}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1E293B' }}>
                            {normalizarNombreModeloPoste(poste.modeloPoste) || 'Sin modelo asignado'}
                          </span>
                          {poste.ubicacionPoste && (
                            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                              • {poste.ubicacionPoste}
                            </span>
                          )}
                        </div>

                        {!modoVisualizacion && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
                            <button
                              type="button"
                              onClick={() => handleEliminarPosteModular(pIdx)}
                              disabled={guardandoModularSeccion === `poste-del-${pIdx}`}
                              title="Eliminar este poste"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: 'none',
                                border: 'none',
                                color: '#DC2626',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              <FaTrashAlt size={11} /> {guardandoModularSeccion === `poste-del-${pIdx}` ? 'Borrando...' : 'Eliminar este poste'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Datos del Poste */}
                      {(() => {
                        const coordsPoste = extraerCoordenadasValidas(poste.ubicacionPoste)
                        const mapaVisible = mapasPostesVisibles[pIdx] !== false && Boolean(coordsPoste)

                        return (
                          <>
                            <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem', marginBottom: coordsPoste && mapaVisible ? '0.65rem' : '0.85rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                                  <span>Tipo / Función de poste: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                </label>
                                {modoVisualizacion ? (
                                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '34px' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                      padding: '0.35rem 0.8rem',
                                      borderRadius: '6px',
                                      fontSize: '0.85rem',
                                      fontWeight: '700',
                                      backgroundColor: (poste.tipoPoste || 'mixto') === 'peatonal' ? '#EFF6FF' : '#FDF2F8',
                                      color: (poste.tipoPoste || 'mixto') === 'peatonal' ? '#1D4ED8' : '#691B31',
                                      border: (poste.tipoPoste || 'mixto') === 'peatonal' ? '1px solid #BFDBFE' : '1px solid #FBCFE8'
                                    }}>
                                      {(poste.tipoPoste || 'mixto') === 'peatonal' ? <FaWalking size={12} /> : <FaTrafficLight size={12} />}
                                      {(poste.tipoPoste || 'mixto') === 'peatonal' ? 'Peatonal' : 'Vehicular / Mixto'}
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '3px',
                                    backgroundColor: '#F1F5F9',
                                    padding: '3px',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    boxSizing: 'border-box'
                                  }}>
                                    {[
                                      { val: 'mixto', label: 'Vehicular / Mixto', icon: <FaTrafficLight size={11} /> },
                                      { val: 'peatonal', label: 'Peatonal', icon: <FaWalking size={11} /> }
                                    ].map(({ val, label, icon }) => {
                                      const isSel = (poste.tipoPoste || 'mixto') === val
                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() => {
                                            if (val === 'peatonal') {
                                              handleActualizarPosteMultiple(pIdx, {
                                                tipoPoste: 'peatonal',
                                                modeloPoste: (!poste.modeloPoste || poste.modeloPoste === 'PCC-1' || normalizarNombreModeloPoste(poste.modeloPoste) === 'MP-01') ? 'MP-01' : normalizarNombreModeloPoste(poste.modeloPoste),
                                                tienePeatonal: true,
                                                tipoCabezal: 'Ninguno',
                                                pantallaPiezas: '',
                                                cabezalesGrupos: [],
                                                peatonalModelo: poste.peatonalModelo || MODELOS_PEATONAL_CATALOGO[0],
                                                peatonalModuloEstado: poste.peatonalModuloEstado || 'Operando',
                                                peatonalesLista: (poste.peatonalesLista && poste.peatonalesLista.length > 0) ? poste.peatonalesLista : [crearPeatonalInicial(1)]
                                              })
                                            } else {
                                              handleActualizarPosteMultiple(pIdx, {
                                                tipoPoste: 'mixto',
                                                modeloPoste: (normalizarNombreModeloPoste(poste.modeloPoste) === 'MP-01') ? 'PCC-1' : (poste.modeloPoste || 'PCC-1'),
                                                tipoCabezal: 'LED',
                                                cabezalesGrupos: (poste.cabezalesGrupos && poste.cabezalesGrupos.length > 0) ? poste.cabezalesGrupos : [
                                                  {
                                                    id: 1,
                                                    numLeds: 4,
                                                    leds: [
                                                      { numero: 1, color: 'Rojo', estado: 'Funciona' },
                                                      { numero: 2, color: 'Amarillo', estado: 'Funciona' },
                                                      { numero: 3, color: 'Verde', estado: 'Funciona' },
                                                      { numero: 4, color: 'Flecha Verde', estado: 'Funciona' }
                                                    ]
                                                  }
                                                ]
                                              })
                                            }
                                          }}
                                          style={{
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '0.45rem 0.5rem',
                                            fontSize: '0.78rem',
                                            fontWeight: isSel ? '700' : '500',
                                            backgroundColor: isSel ? '#691B31' : 'transparent',
                                            color: isSel ? '#FFFFFF' : '#475569',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            boxShadow: isSel ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.15s',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {icon}
                                          <span>{label}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', margin: 0 }}>
                                    <span>Coordenadas del poste:</span>
                                  </label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {coordsPoste && (
                                      <button
                                        type="button"
                                        onClick={() => setMapasPostesVisibles(prev => ({
                                          ...prev,
                                          [pIdx]: mapaVisible ? false : true
                                        }))}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          padding: '0.15rem 0.45rem',
                                          backgroundColor: mapaVisible ? '#EFF6FF' : '#F1F5F9',
                                          color: mapaVisible ? '#1D4ED8' : '#475569',
                                          border: mapaVisible ? '1px solid #BFDBFE' : '1px solid #CBD5E1',
                                          borderRadius: '4px',
                                          fontSize: '0.72rem',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          whiteSpace: 'nowrap',
                                          transition: 'all 0.15s',
                                          pointerEvents: 'auto'
                                        }}
                                        title={mapaVisible ? 'Ocultar mapa interactivo' : 'Mostrar mapa interactivo'}
                                      >
                                        <FaMap size={10} />
                                        <span>{mapaVisible ? 'Ocultar mapa' : 'Ver mapa'}</span>
                                      </button>
                                    )}
                                    {!modoVisualizacion && (
                                      <button
                                        type="button"
                                        onClick={() => handleObtenerGpsPoste(pIdx)}
                                        disabled={capturandoGpsPosteIndex === pIdx}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          backgroundColor: capturandoGpsPosteIndex === pIdx ? '#E2E8F0' : '#FEF3C7',
                                          color: '#92400E',
                                          border: '1px solid #FCD34D',
                                          borderRadius: '4px',
                                          padding: '0.15rem 0.45rem',
                                          fontSize: '0.72rem',
                                          fontWeight: '700',
                                          cursor: capturandoGpsPosteIndex === pIdx ? 'wait' : 'pointer'
                                        }}
                                        title="Capturar ubicación GPS actual del poste"
                                      >
                                        <FaMapMarkerAlt size={10} />
                                        {capturandoGpsPosteIndex === pIdx ? 'Obteniendo GPS...' : 'GPS actual'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {modoVisualizacion ? (
                                  renderDatoConsulta(poste.ubicacionPoste, 'Sin coordenadas registradas')
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      list={`sugerencias-ubicacion-postes-${pIdx}`}
                                      placeholder="ej. 20.123456, -98.765432"
                                      value={poste.ubicacionPoste || ''}
                                      onChange={(e) => {
                                        handleActualizarPoste(pIdx, 'ubicacionPoste', e.target.value)
                                        if (extraerCoordenadasValidas(e.target.value)) {
                                          setMapasPostesVisibles(prev => ({ ...prev, [pIdx]: true }))
                                        }
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '0.45rem 0.65rem',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                    <datalist id={`sugerencias-ubicacion-postes-${pIdx}`}>
                                      <option value="Camellón Central (Isleta)" />
                                      <option value="Banqueta Poniente" />
                                      <option value="Banqueta Oriente" />
                                      <option value="Banqueta Norte" />
                                      <option value="Banqueta Sur" />
                                      <option value="Esquina Norponiente" />
                                      <option value="Esquina Surponiente" />
                                      <option value="Esquina Nororiente" />
                                      <option value="Esquina Suroriente" />
                                    </datalist>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* MAPA DEL POSTE A TODO LO ANCHO DE LA TARJETA */}
                            {coordsPoste && mapaVisible && (
                              <div style={{
                                marginBottom: '0.85rem',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #CBD5E1',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                backgroundColor: '#ffffff',
                                pointerEvents: 'auto'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.35rem 0.65rem',
                                  backgroundColor: '#F8FAFC',
                                  borderBottom: '1px solid #E2E8F0',
                                  fontSize: '0.74rem',
                                  color: '#475569'
                                }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FaMapMarkerAlt size={11} style={{ color: '#DC2626' }} />
                                    <span>Ubicación GPS del poste #{pIdx + 1}: <strong style={{ color: '#1E293B' }}>{coordsPoste.lat.toFixed(6)}, {coordsPoste.lng.toFixed(6)}</strong></span>
                                  </span>
                                  <a
                                    href={`https://www.google.com/maps?q=${coordsPoste.lat},${coordsPoste.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: '#2563EB',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.72rem',
                                      fontWeight: '600'
                                    }}
                                    title="Abrir en Google Maps externo"
                                  >
                                    <FaExternalLinkAlt size={9} /> Abrir en Google Maps
                                  </a>
                                </div>
                                <iframe
                                  title={`Mapa del poste #${pIdx + 1}`}
                                  src={`https://maps.google.com/maps?q=${coordsPoste.lat},${coordsPoste.lng}&hl=es&z=17&output=embed`}
                                  style={{
                                    width: '100%',
                                    height: '210px',
                                    border: 'none',
                                    display: 'block'
                                  }}
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </>
                        )
                      })()}

                      <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem', marginBottom: '0.85rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                            <span>Modelo de poste: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                          </label>
                          {modoVisualizacion ? (
                            renderDatoConsulta(normalizarNombreModeloPoste(poste.modeloPoste) || 'Sin modelo')
                          ) : (
                            <select
                              value={normalizarNombreModeloPoste(poste.modeloPoste)}
                              onChange={(e) => handleActualizarPoste(pIdx, 'modeloPoste', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                backgroundColor: 'white',
                                color: '#1E293B',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="">-- Seleccionar modelo de poste --</option>
                              {MODELOS_POSTES_CATALOGO.map((modelo) => (
                                <option key={modelo} value={modelo}>{modelo}</option>
                              ))}
                              {poste.modeloPoste && !MODELOS_POSTES_CATALOGO.includes(normalizarNombreModeloPoste(poste.modeloPoste)) && (
                                <option value={poste.modeloPoste}>{poste.modeloPoste}</option>
                              )}
                            </select>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                            <span>Estado de tapa de registro: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                          </label>
                          {modoVisualizacion ? (
                            renderBadgeConsulta(poste.tapaRegistro || 'Buena')
                          ) : (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)',
                              gap: '3px',
                              backgroundColor: '#F1F5F9',
                              padding: '3px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              boxSizing: 'border-box'
                            }}>
                              {['Buena', 'Dañada', 'Faltante', 'No aplica'].map((opcion) => {
                                const isSel = (poste.tapaRegistro || 'Buena') === opcion
                                return (
                                  <button
                                    key={opcion}
                                    type="button"
                                    onClick={() => handleActualizarPoste(pIdx, 'tapaRegistro', opcion)}
                                    style={{
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '0.45rem 0.2rem',
                                      fontSize: '0.78rem',
                                      fontWeight: isSel ? '700' : '500',
                                      backgroundColor: isSel ? '#691B31' : 'transparent',
                                      color: isSel ? '#FFFFFF' : '#475569',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s',
                                      whiteSpace: 'nowrap',
                                      boxShadow: isSel ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {opcion}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                          <span>Observaciones del poste:</span>
                        </label>
                        {modoVisualizacion ? (
                          renderObservacionesConsulta(poste.observaciones, 'Sin observaciones registradas')
                        ) : (
                          <input
                            type="text"
                            placeholder="Detalles de golpes, corrosión, cableado expuesto o estado general..."
                            value={poste.observaciones || ''}
                            onChange={(e) => handleActualizarPoste(pIdx, 'observaciones', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.65rem',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        )}
                      </div>

                      {/* Cabezales Vehiculares (Solo si no es exclusivo peatonal) */}
                      {poste.tipoPoste !== 'peatonal' && (
                        <div style={{
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginTop: '1rem',
                          marginBottom: '1.25rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#691B31', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <FaTrafficLight size={13} style={{ color: '#BC955B' }} /> Cabezales Vehiculares
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Tipo y desglose de luces</span>
                          </div>

                          <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem', marginBottom: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                                <span>Tipo de cabezal: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                              </label>
                              {modoVisualizacion ? (
                                <div style={{ display: 'flex', alignItems: 'center', minHeight: '34px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                    backgroundColor: (poste.tipoCabezal || 'LED') === 'Pantalla' ? '#EFF6FF' : '#F1F5F9',
                                    color: (poste.tipoCabezal || 'LED') === 'Pantalla' ? '#1D4ED8' : '#334155',
                                    border: (poste.tipoCabezal || 'LED') === 'Pantalla' ? '1px solid #BFDBFE' : '1px solid #CBD5E1'
                                  }}>
                                    {(poste.tipoCabezal || 'LED') === 'Pantalla' ? <FaDesktop size={12} /> : <FaTrafficLight size={12} />}
                                    {(poste.tipoCabezal || 'LED') === 'Pantalla' ? 'Pantalla LED' : 'LED'}
                                  </span>
                                </div>
                              ) : (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '3px',
                                  backgroundColor: '#F1F5F9',
                                  padding: '3px',
                                  borderRadius: '6px',
                                  border: '1px solid #CBD5E1',
                                  boxSizing: 'border-box'
                                }}>
                                  {[
                                    { val: 'LED', label: 'LED', icon: <FaTrafficLight size={11} /> },
                                    { val: 'Pantalla', label: 'Pantalla LED', icon: <FaDesktop size={11} /> }
                                  ].map(({ val, label, icon }) => {
                                    const isSel = (poste.tipoCabezal || 'LED') === val
                                    return (
                                      <button
                                        key={val}
                                        type="button"
                                        onClick={() => {
                                          const nuevoTipo = val
                                          const piezasVal = nuevoTipo === 'Pantalla' ? (poste.pantallaPiezas || '1') : ''
                                          const cantNum = parseInt(piezasVal, 10) || 0
                                          const pantallasInit = cantNum > 0
                                            ? Array.from({ length: cantNum }, (_, i) => ({ numero: i + 1, estado: 'Funciona' }))
                                            : []
                                          handleActualizarPosteMultiple(pIdx, {
                                            tipoCabezal: nuevoTipo,
                                            cabezalModelo: nuevoTipo === 'Pantalla' ? 'Semáforo de pantalla LED' : (poste.cabezalModelo === 'Semáforo de pantalla LED' ? 'LV-1' : (poste.cabezalModelo || 'LV-1')),
                                            pantallaPiezas: piezasVal,
                                            pantallasLista: nuevoTipo === 'Pantalla' ? (poste.pantallasLista?.length ? poste.pantallasLista : pantallasInit) : [],
                                            pantallaEstado: 'Funciona'
                                          })
                                        }}
                                        style={{
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '0.45rem 0.5rem',
                                          fontSize: '0.78rem',
                                          fontWeight: isSel ? '700' : '500',
                                          backgroundColor: isSel ? '#691B31' : 'transparent',
                                          color: isSel ? '#FFFFFF' : '#475569',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '0.35rem',
                                          boxShadow: isSel ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                          transition: 'all 0.15s',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {icon}
                                        <span>{label}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                                <span>Modelo de cabezal: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                              </label>
                              {modoVisualizacion ? (
                                renderDatoConsulta(poste.cabezalModelo, 'Sin modelo especificado')
                              ) : (
                                <select
                                  value={poste.cabezalModelo || ''}
                                  onChange={(e) => handleActualizarPoste(pIdx, 'cabezalModelo', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.45rem 0.65rem',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    backgroundColor: 'white',
                                    color: '#1E293B',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  <option value="">-- Seleccionar modelo de cabezal --</option>
                                  {MODELOS_CABEZAL_CATALOGO.map((modelo) => (
                                    <option key={modelo} value={modelo}>{modelo}</option>
                                  ))}
                                  {poste.cabezalModelo && !MODELOS_CABEZAL_CATALOGO.includes(poste.cabezalModelo) && (
                                    <option value={poste.cabezalModelo}>{poste.cabezalModelo}</option>
                                  )}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* Pantalla LED */}
                          {poste.tipoCabezal === 'Pantalla' && (() => {
                            const cantPiezas = Number(poste.pantallaPiezas) || 0
                            const piezasList = (Array.isArray(poste.pantallasLista) && poste.pantallasLista.length > 0)
                              ? poste.pantallasLista
                              : (cantPiezas > 0
                                ? Array.from({ length: cantPiezas }, (_, i) => ({ numero: i + 1, estado: poste.pantallaEstado || 'Funciona' }))
                                : [])

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '0.85rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                                    <span>Cantidad de piezas: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                  </label>
                                  {modoVisualizacion ? (
                                    renderDatoConsulta(`${poste.pantallaPiezas || 0} piezas`)
                                  ) : (
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="ej. 1, 2, 3..."
                                      value={poste.pantallaPiezas === 0 || poste.pantallaPiezas === '0' ? '' : (poste.pantallaPiezas ?? '')}
                                      onChange={(e) => handleCambiarPantallaPiezasEnPoste(pIdx, e.target.value)}
                                      style={{ width: '100%', maxWidth: '240px', padding: '0.45rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                    />
                                  )}
                                </div>

                                {piezasList.length > 0 ? (
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                                      <span>Estado de operación de cada pieza: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '0.5rem' }}>
                                      {piezasList.map((pieza) => (
                                        <div
                                          key={`p-${pIdx}-pieza-${pieza.numero}`}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backgroundColor: '#FFFFFF',
                                            padding: '0.45rem 0.75rem',
                                            borderRadius: '6px',
                                            border: '1px solid #CBD5E1',
                                            gap: '0.5rem'
                                          }}
                                        >
                                          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <FaDesktop size={11} style={{ color: '#691B31' }} />
                                            Pieza #{pieza.numero}
                                          </span>
                                          {modoVisualizacion ? (
                                            <span style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.35rem',
                                              fontSize: '0.78rem',
                                              fontWeight: '700',
                                              padding: '0.2rem 0.55rem',
                                              borderRadius: '5px',
                                              backgroundColor: (pieza.estado || 'Funciona') === 'Funciona' ? '#DCFCE7' : '#FEE2E2',
                                              color: (pieza.estado || 'Funciona') === 'Funciona' ? '#15803D' : '#B91C1C',
                                              border: (pieza.estado || 'Funciona') === 'Funciona' ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                                            }}>
                                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: (pieza.estado || 'Funciona') === 'Funciona' ? '#16A34A' : '#DC2626' }} />
                                              {(pieza.estado || 'Funciona') === 'Funciona' ? 'Funciona' : 'No funciona'}
                                            </span>
                                          ) : (
                                            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                              {['Funciona', 'No funciona'].map((estado) => (
                                                <label
                                                  key={estado}
                                                  style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontWeight: (pieza.estado || 'Funciona') === estado ? '700' : '500',
                                                    color: (pieza.estado || 'Funciona') === estado ? (estado === 'Funciona' ? '#16A34A' : '#DC2626') : '#64748B'
                                                  }}
                                                >
                                                  <input
                                                    type="radio"
                                                    name={`poste-${pIdx}-pieza-${pieza.numero}-estado`}
                                                    value={estado}
                                                    checked={(pieza.estado || 'Funciona') === estado}
                                                    onChange={() => handleCambiarEstadoPiezaPantalla(pIdx, pieza.numero, estado)}
                                                    style={{ accentColor: '#691B31', width: '13px', height: '13px', cursor: 'pointer' }}
                                                  />
                                                  <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: estado === 'Funciona' ? '#16A34A' : '#DC2626' }} />
                                                  {estado}
                                                </label>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>
                                    Ingrese la cantidad de piezas para definir el estado de operación de cada una.
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                          {/* Desglose LED */}
                          {(poste.tipoCabezal || 'LED') === 'LED' && (() => {
                            const cabezalesGrupos = normalizarCabezalesDetalle(poste.cabezalesGrupos)
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    Desglose de Cabezales LED:
                                  </span>
                                  {!modoVisualizacion && (
                                    <button
                                      type="button"
                                      onClick={() => handleAgregarGrupoCabezalEnPoste(pIdx)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '5px',
                                        padding: '0.25rem 0.6rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: '#691B31',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FaPlus size={10} style={{ color: '#BC955B' }} /> + Otro cabezal
                                    </button>
                                  )}
                                </div>

                                {cabezalesGrupos.map((grupo, gIdx) => {
                                  const numLeds = grupo.numLeds !== undefined ? Number(grupo.numLeds) : 4
                                  const leds = (grupo.leds || []).slice(0, numLeds)

                                  return (
                                    <div
                                      key={grupo.id || gIdx}
                                      style={{
                                        backgroundColor: '#F8FAFC',
                                        padding: '0.75rem 0.85rem',
                                        borderRadius: '8px',
                                        border: '1px solid #E2E8F0'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                          <FaTrafficLight size={11} style={{ color: '#691B31' }} />
                                          Cabezal {cabezalesGrupos.length > 1 ? `#${gIdx + 1}` : ''}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                          {modoVisualizacion ? (
                                            <span style={{
                                              fontSize: '0.78rem',
                                              fontWeight: '700',
                                              color: '#334155',
                                              backgroundColor: '#E2E8F0',
                                              padding: '0.2rem 0.55rem',
                                              borderRadius: '5px'
                                            }}>
                                              {numLeds} LEDs
                                            </span>
                                          ) : (
                                            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                              <span>LEDs:</span>
                                              <input
                                                type="number"
                                                min="0"
                                                max="12"
                                                value={numLeds || ''}
                                                onChange={(e) => handleCambiarNumLedsEnPoste(pIdx, gIdx, e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                style={{ width: '45px', padding: '0.2rem 0.35rem', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center', fontWeight: '700' }}
                                              />
                                            </label>
                                          )}
                                          {cabezalesGrupos.length > 1 && !modoVisualizacion && (
                                            <button
                                              type="button"
                                              onClick={() => handleEliminarGrupoCabezalEnPoste(pIdx, gIdx)}
                                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center' }}
                                              title="Eliminar cabezal"
                                            >
                                              <FaTrashAlt size={11} />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {numLeds > 0 && (
                                        <div className="cabezal-leds-grid">
                                          {leds.map((led, idx) => {
                                            const colorActual = obtenerConfigColorLed(led.color)
                                            const isFunciona = (led.estado || 'Funciona') === 'Funciona'

                                            if (modoVisualizacion) {
                                              return (
                                                <div
                                                  key={`p-${pIdx}-g-${gIdx}-led-${led.numero || idx + 1}`}
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    backgroundColor: '#FFFFFF',
                                                    padding: '0.35rem 0.5rem',
                                                    borderRadius: '7px',
                                                    border: '1px solid #E2E8F0',
                                                    gap: '0.35rem',
                                                    boxSizing: 'border-box',
                                                    minWidth: 0
                                                  }}
                                                >
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                                    <span
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '22px',
                                                        height: '22px',
                                                        minWidth: '22px',
                                                        minHeight: '22px',
                                                        borderRadius: '50%',
                                                        border: `2px solid ${colorActual.color}`,
                                                        backgroundColor: '#FFFFFF',
                                                        flexShrink: 0
                                                      }}
                                                      title={`Color: ${colorActual.label}`}
                                                    >
                                                      <span
                                                        style={{
                                                          width: '13px',
                                                          height: '13px',
                                                          borderRadius: '50%',
                                                          backgroundColor: colorActual.color
                                                        }}
                                                      />
                                                    </span>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1E293B', minWidth: '18px', flexShrink: 0 }}>
                                                      L{led.numero || idx + 1}
                                                    </span>
                                                    <div
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '104px',
                                                        padding: '0.2rem 0.35rem',
                                                        border: '1px solid #CBD5E1',
                                                        borderLeft: `4px solid ${colorActual.color}`,
                                                        borderRadius: '6px',
                                                        fontSize: '0.78rem',
                                                        fontWeight: '600',
                                                        backgroundColor: '#FFFFFF',
                                                        color: '#1E293B',
                                                        boxSizing: 'border-box'
                                                      }}
                                                    >
                                                      <span>{colorActual.label}</span>
                                                      <span style={{ fontSize: '0.6rem', color: '#64748B' }}>▼</span>
                                                    </div>
                                                  </div>
                                                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0, marginLeft: 'auto', pointerEvents: 'none' }}>
                                                    {['Funciona', 'No funciona'].map((estado) => {
                                                      const isChecked = (led.estado || 'Funciona') === estado
                                                      const esFunc = estado === 'Funciona'
                                                      return (
                                                        <label
                                                          key={estado}
                                                          style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.2rem',
                                                            cursor: 'default',
                                                            fontSize: '0.74rem',
                                                            whiteSpace: 'nowrap',
                                                            fontWeight: isChecked ? '700' : '500',
                                                            color: isChecked ? (esFunc ? '#16A34A' : '#DC2626') : '#64748B'
                                                          }}
                                                        >
                                                          <input
                                                            type="radio"
                                                            name={`view-p-${pIdx}-g-${gIdx}-led-${idx}-estado`}
                                                            value={estado}
                                                            checked={isChecked}
                                                            disabled
                                                            readOnly
                                                            style={{ accentColor: '#691B31', width: '13px', height: '13px', cursor: 'default', margin: 0 }}
                                                          />
                                                          <span
                                                            style={{
                                                              display: 'inline-block',
                                                              width: '5px',
                                                              height: '5px',
                                                              borderRadius: '50%',
                                                              backgroundColor: esFunc ? '#16A34A' : '#DC2626',
                                                              flexShrink: 0
                                                            }}
                                                          />
                                                          {estado}
                                                        </label>
                                                      )
                                                    })}
                                                  </div>
                                                </div>
                                              )
                                            }

                                            return (
                                              <div
                                                key={`p-${pIdx}-g-${gIdx}-led-${led.numero || idx + 1}`}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  backgroundColor: '#FFFFFF',
                                                  padding: '0.35rem 0.5rem',
                                                  borderRadius: '7px',
                                                  border: '1px solid #E2E8F0',
                                                  gap: '0.35rem',
                                                  boxSizing: 'border-box',
                                                  minWidth: 0
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                                  <span
                                                    style={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      width: '22px',
                                                      height: '22px',
                                                      minWidth: '22px',
                                                      minHeight: '22px',
                                                      borderRadius: '50%',
                                                      border: `2px solid ${colorActual.color}`,
                                                      backgroundColor: '#FFFFFF',
                                                      flexShrink: 0
                                                    }}
                                                    title={`Color: ${colorActual.label}`}
                                                  >
                                                    <span
                                                      style={{
                                                        width: '13px',
                                                        height: '13px',
                                                        borderRadius: '50%',
                                                        backgroundColor: colorActual.color
                                                      }}
                                                    />
                                                  </span>
                                                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1E293B', minWidth: '18px', flexShrink: 0 }}>
                                                    L{led.numero || idx + 1}
                                                  </span>
                                                  <select
                                                    value={led.color || 'Rojo'}
                                                    onChange={(e) => handleCambiarLedEnPoste(pIdx, gIdx, idx, 'color', e.target.value)}
                                                    style={{
                                                      width: '104px',
                                                      padding: '0.2rem 0.35rem',
                                                      border: '1px solid #CBD5E1',
                                                      borderLeft: `4px solid ${colorActual.color}`,
                                                      borderRadius: '6px',
                                                      fontSize: '0.78rem',
                                                      fontWeight: '600',
                                                      backgroundColor: '#FFFFFF',
                                                      color: '#1E293B',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    {OPCIONES_COLORES_LED.map(c => (
                                                      <option key={c.valor} value={c.valor}>{c.label}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                                                  {['Funciona', 'No funciona'].map((estado) => {
                                                    const isChecked = (led.estado || 'Funciona') === estado
                                                    const esFunc = estado === 'Funciona'
                                                    return (
                                                      <label
                                                        key={estado}
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '0.2rem',
                                                          cursor: 'pointer',
                                                          fontSize: '0.74rem',
                                                          whiteSpace: 'nowrap',
                                                          fontWeight: isChecked ? '700' : '500',
                                                          color: isChecked ? (esFunc ? '#16A34A' : '#DC2626') : '#64748B'
                                                        }}
                                                      >
                                                        <input
                                                          type="radio"
                                                          name={`p-${pIdx}-g-${gIdx}-led-${idx}-estado`}
                                                          value={estado}
                                                          checked={isChecked}
                                                          onChange={() => handleCambiarLedEnPoste(pIdx, gIdx, idx, 'estado', estado)}
                                                          style={{ accentColor: '#691B31', width: '13px', height: '13px', cursor: 'pointer', margin: 0 }}
                                                        />
                                                        <span
                                                          style={{
                                                            display: 'inline-block',
                                                            width: '5px',
                                                            height: '5px',
                                                            borderRadius: '50%',
                                                            backgroundColor: esFunc ? '#16A34A' : '#DC2626',
                                                            flexShrink: 0
                                                          }}
                                                        />
                                                        {estado}
                                                      </label>
                                                    )
                                                  })}
                                                </div>
                                              </div>
                                            )
                                           })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* Semáforo Peatonal */}
                      <div style={{
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginTop: '1rem',
                        marginBottom: '1.25rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#691B31', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <FaWalking size={14} style={{ color: '#BC955B' }} /> Semáforo Peatonal
                            </span>
                            {poste.tienePeatonal ? (() => {
                              const lista = poste.peatonalesLista || []
                              const conCabezal = lista.filter(pt => pt.modelo && !pt.modelo.toLowerCase().includes('sin cabezal')).length
                              const conAudible = lista.filter(pt => pt.tieneAudible).length
                              if (conCabezal === 0 && conAudible > 0) {
                                return (
                                  <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.45rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <FaVolumeUp size={10} /> Solo audible ({conAudible})
                                  </span>
                                )
                              }
                              return (
                                <span style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                  {conCabezal} {conCabezal === 1 ? 'semáforo' : 'semáforos'}
                                  {conAudible > 0 && ` • ${conAudible} con audible`}
                                </span>
                              )
                            })() : (
                              <span style={{ backgroundColor: '#F1F5F9', color: '#94A3B8', fontSize: '0.72rem', fontWeight: '600', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                No instalado
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>¿Instalado en este poste?:</span>
                            {modoVisualizacion ? (
                              renderBadgeConsulta(poste.tienePeatonal ? 'Sí' : 'No')
                            ) : (
                              <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '5px', gap: '2px', border: '1px solid #CBD5E1' }}>
                                <button
                                  type="button"
                                  onClick={() => handleActualizarPosteMultiple(pIdx, {
                                    tienePeatonal: true,
                                    peatonalModelo: poste.peatonalModelo || MODELOS_PEATONAL_CATALOGO[0],
                                    peatonalModuloEstado: poste.peatonalModuloEstado || 'Operando'
                                  })}
                                  style={{
                                    border: 'none',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    fontWeight: poste.tienePeatonal ? '700' : '500',
                                    backgroundColor: poste.tienePeatonal ? '#691B31' : 'transparent',
                                    color: poste.tienePeatonal ? '#FFFFFF' : '#475569',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleActualizarPosteMultiple(pIdx, { tienePeatonal: false })}
                                  style={{
                                    border: 'none',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    fontWeight: !poste.tienePeatonal ? '700' : '500',
                                    backgroundColor: !poste.tienePeatonal ? '#691B31' : 'transparent',
                                    color: !poste.tienePeatonal ? '#FFFFFF' : '#475569',
                                    cursor: 'pointer'
                                  }}
                                >
                                  No
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {poste.tienePeatonal && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {(poste.peatonalesLista || [crearPeatonalInicial(1)]).map((pt, ptIdx) => (
                              <div
                                key={pt.id || ptIdx}
                                style={{
                                  backgroundColor: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  padding: '0.65rem 0.8rem'
                                }}
                              >
                                {(poste.peatonalesLista || []).length > 1 && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <FaWalking size={11} style={{ color: '#691B31' }} />
                                      Semáforo Peatonal #{ptIdx + 1}
                                    </span>
                                    {!modoVisualizacion && (
                                      <button
                                        type="button"
                                        onClick={() => handleEliminarPeatonalEnPoste(pIdx, ptIdx)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#DC2626',
                                          fontSize: '0.75rem',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          padding: '0.15rem 0.35rem'
                                        }}
                                        title="Quitar este semáforo peatonal"
                                      >
                                        <FaTrashAlt size={10} /> Quitar
                                      </button>
                                    )}
                                  </div>
                                )}

                                <div className="form-responsive-grid grid-2" style={{ gap: '0.65rem 0.85rem', marginBottom: '0.5rem' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.25rem' }}>
                                      <span>Modelo peatonal: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                    </label>
                                    {modoVisualizacion ? (
                                      renderDatoConsulta(pt.modelo || 'Sin modelo')
                                    ) : (
                                      <select
                                        value={pt.modelo || ''}
                                        onChange={(e) => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'modelo', e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '0.82rem', backgroundColor: 'white', color: '#1E293B', boxSizing: 'border-box' }}
                                      >
                                        <option value="">-- Modelo peatonal --</option>
                                        {MODELOS_PEATONAL_CATALOGO.map((modelo) => (
                                          <option key={modelo} value={modelo}>{modelo}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>

                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.25rem' }}>
                                      <span>{pt.modelo && pt.modelo.toLowerCase().includes('sin cabezal') ? 'Estado del equipo / soporte:' : 'Estado del módulo:'} {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                    </label>
                                    {modoVisualizacion ? (
                                      renderBadgeConsulta(pt.estado || 'Operando')
                                    ) : (
                                      <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: '2px', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '5px', border: '1px solid #CBD5E1', minWidth: '160px' }}>
                                        {['Operando', 'Dañado'].map((opcion) => {
                                          const isSel = (pt.estado || 'Operando') === opcion
                                          return (
                                            <button
                                              key={opcion}
                                              type="button"
                                              onClick={() => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'estado', opcion)}
                                              style={{
                                                border: 'none',
                                                borderRadius: '3px',
                                                padding: '0.3rem 0.4rem',
                                                fontSize: '0.78rem',
                                                fontWeight: isSel ? '700' : '500',
                                                backgroundColor: isSel ? (opcion === 'Operando' ? '#16A34A' : '#DC2626') : 'transparent',
                                                color: isSel ? '#FFFFFF' : '#475569',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              {opcion}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                                    <span>Observaciones de este semáforo peatonal:</span>
                                  </label>
                                  {modoVisualizacion ? (
                                    renderObservacionesConsulta(pt.observaciones, 'Sin observaciones registradas')
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="Detalles sobre mica, leds apagados, soporte, orientación..."
                                      value={pt.observaciones || ''}
                                      onChange={(e) => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'observaciones', e.target.value)}
                                      style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                    />
                                  )}
                                </div>

                                {/* Dispositivo Audible integrado para este semáforo peatonal */}
                                <div style={{
                                  marginTop: '0.65rem',
                                  paddingTop: '0.6rem',
                                  borderTop: '1px dashed #E2E8F0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.45rem'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <FaVolumeUp size={11} style={{ color: '#691B31' }} /> ¿Tiene dispositivo audible?:
                                    </span>
                                    {modoVisualizacion ? (
                                      renderBadgeConsulta(pt.tieneAudible ? 'Sí' : 'No')
                                    ) : (
                                      <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '5px', gap: '2px', border: '1px solid #CBD5E1' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'tieneAudible', true)}
                                          style={{
                                            border: 'none',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '3px',
                                            fontSize: '0.75rem',
                                            fontWeight: pt.tieneAudible ? '700' : '500',
                                            backgroundColor: pt.tieneAudible ? '#691B31' : 'transparent',
                                            color: pt.tieneAudible ? '#FFFFFF' : '#475569',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Sí
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'tieneAudible', false)}
                                          style={{
                                            border: 'none',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '3px',
                                            fontSize: '0.75rem',
                                            fontWeight: !pt.tieneAudible ? '700' : '500',
                                            backgroundColor: !pt.tieneAudible ? '#691B31' : 'transparent',
                                            color: !pt.tieneAudible ? '#FFFFFF' : '#475569',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          No
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {pt.tieneAudible && (
                                    <div style={{
                                      backgroundColor: '#FFFFFF',
                                      border: '1px solid #CBD5E1',
                                      borderRadius: '6px',
                                      padding: '0.65rem 0.8rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.55rem',
                                      marginTop: '0.35rem'
                                    }}>
                                      <div className="form-responsive-grid grid-2" style={{ gap: '0.65rem 0.85rem' }}>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#334155', marginBottom: '0.25rem' }}>
                                            <span>Modelo audible: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                          </label>
                                          {modoVisualizacion ? (
                                            renderDatoConsulta(pt.audibleModelo, 'Sin modelo')
                                          ) : (
                                            <>
                                              <input
                                                type="text"
                                                list={`sugerencias-audible-${pIdx}-${ptIdx}`}
                                                placeholder="ej. Novax DS-100 Audible"
                                                value={pt.audibleModelo || ''}
                                                onChange={(e) => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'audibleModelo', e.target.value)}
                                                style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                              />
                                              <datalist id={`sugerencias-audible-${pIdx}-${ptIdx}`}>
                                                <option value="Novax DS-100 Audible" />
                                                <option value="Novax Audible Peatonal" />
                                                <option value="Dispositivo Audible Genérico" />
                                              </datalist>
                                            </>
                                          )}
                                        </div>

                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#334155', marginBottom: '0.25rem' }}>
                                            <span>Estado audible: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                          </label>
                                          {modoVisualizacion ? (
                                            renderBadgeConsulta(pt.audibleEstado || 'Operando')
                                          ) : (
                                            <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: '2px', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '5px', border: '1px solid #CBD5E1', minWidth: '150px' }}>
                                              {['Operando', 'Dañado'].map((opcion) => {
                                                const isSel = (pt.audibleEstado || 'Operando') === opcion
                                                return (
                                                  <button
                                                    key={opcion}
                                                    type="button"
                                                    onClick={() => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'audibleEstado', opcion)}
                                                    style={{
                                                      border: 'none',
                                                      borderRadius: '3px',
                                                      padding: '0.25rem 0.35rem',
                                                      fontSize: '0.75rem',
                                                      fontWeight: isSel ? '700' : '500',
                                                      backgroundColor: isSel ? (opcion === 'Operando' ? '#16A34A' : '#DC2626') : 'transparent',
                                                      color: isSel ? '#FFFFFF' : '#475569',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    {opcion}
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '700', color: '#475569', marginBottom: '0.2rem' }}>
                                          <span>Observaciones del audible:</span>
                                        </label>
                                        {modoVisualizacion ? (
                                          renderObservacionesConsulta(pt.audibleObservaciones, 'Sin observaciones registradas')
                                        ) : (
                                          <input
                                            type="text"
                                            placeholder="Observaciones sobre volumen, pulsador, cableado o fallas..."
                                            value={pt.audibleObservaciones || ''}
                                            onChange={(e) => handleActualizarPeatonalEnPoste(pIdx, ptIdx, 'audibleObservaciones', e.target.value)}
                                            style={{ width: '100%', padding: '0.3rem 0.5rem', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '0.78rem', boxSizing: 'border-box' }}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {!modoVisualizacion && (
                              <button
                                type="button"
                                onClick={() => handleAgregarPeatonalEnPoste(pIdx)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px dashed #691B31',
                                  color: '#691B31',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  width: 'fit-content',
                                  alignSelf: 'flex-start'
                                }}
                              >
                                <FaPlus size={10} style={{ color: '#BC955B' }} /> + Agregar otro semáforo peatonal en este poste
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dispositivo Audible (solo para postes vehiculares/mixtos sin semáforo peatonal) */}
                      {poste.tipoPoste !== 'peatonal' && !poste.tienePeatonal && (
                        <div style={{
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginTop: '1rem',
                          marginBottom: '1.25rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#691B31', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <FaVolumeUp size={14} style={{ color: '#BC955B' }} /> Dispositivo Audible
                            </span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>¿Instalado en este poste?:</span>
                              {modoVisualizacion ? (
                                renderBadgeConsulta(poste.tieneAudible ? 'Sí' : 'No')
                              ) : (
                                <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '5px', gap: '2px', border: '1px solid #CBD5E1' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleActualizarPosteMultiple(pIdx, {
                                      tieneAudible: true,
                                      audibleModelo: poste.audibleModelo || 'Novax DS-100 Audible',
                                      audibleModuloEstado: poste.audibleModuloEstado || 'Operando'
                                    })}
                                    style={{
                                      border: 'none',
                                      padding: '0.25rem 0.6rem',
                                      borderRadius: '4px',
                                      fontSize: '0.78rem',
                                      fontWeight: poste.tieneAudible ? '700' : '500',
                                      backgroundColor: poste.tieneAudible ? '#691B31' : 'transparent',
                                      color: poste.tieneAudible ? '#FFFFFF' : '#475569',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Sí
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleActualizarPosteMultiple(pIdx, {
                                      tieneAudible: false
                                    })}
                                    style={{
                                      border: 'none',
                                      padding: '0.25rem 0.6rem',
                                      borderRadius: '4px',
                                      fontSize: '0.78rem',
                                      fontWeight: !poste.tieneAudible ? '700' : '500',
                                      backgroundColor: !poste.tieneAudible ? '#691B31' : 'transparent',
                                      color: !poste.tieneAudible ? '#FFFFFF' : '#475569',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    No
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {poste.tieneAudible && (
                            <div style={{
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '0.75rem 0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.55rem'
                            }}>
                              <div className="form-responsive-grid grid-2" style={{ gap: '0.65rem 0.85rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.25rem' }}>
                                    <span>Modelo audible: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                  </label>
                                  {modoVisualizacion ? (
                                    renderDatoConsulta(poste.audibleModelo, 'Sin modelo especificado')
                                  ) : (
                                    <>
                                      <input
                                        type="text"
                                        list={`sugerencias-audible-${pIdx}`}
                                        placeholder="ej. Novax DS-100 Audible"
                                        value={poste.audibleModelo || ''}
                                        onChange={(e) => handleActualizarPoste(pIdx, 'audibleModelo', e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                      />
                                      <datalist id={`sugerencias-audible-${pIdx}`}>
                                        <option value="Novax DS-100 Audible" />
                                        <option value="Novax Audible Peatonal" />
                                        <option value="Dispositivo Audible Genérico" />
                                      </datalist>
                                    </>
                                  )}
                                </div>

                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.25rem' }}>
                                    <span>Estado audible: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                  </label>
                                  {modoVisualizacion ? (
                                    renderBadgeConsulta(poste.audibleModuloEstado || 'Operando')
                                  ) : (
                                    <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: '2px', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '5px', border: '1px solid #CBD5E1', minWidth: '150px' }}>
                                      {['Operando', 'Dañado'].map((opcion) => {
                                        const isSel = (poste.audibleModuloEstado || 'Operando') === opcion
                                        return (
                                          <button
                                            key={opcion}
                                            type="button"
                                            onClick={() => handleActualizarPoste(pIdx, 'audibleModuloEstado', opcion)}
                                            style={{
                                              border: 'none',
                                              borderRadius: '3px',
                                              padding: '0.3rem 0.4rem',
                                              fontSize: '0.78rem',
                                              fontWeight: isSel ? '700' : '500',
                                              backgroundColor: isSel ? (opcion === 'Operando' ? '#16A34A' : '#DC2626') : 'transparent',
                                              color: isSel ? '#FFFFFF' : '#475569',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {opcion}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                                  <span>Observaciones del audible:</span>
                                </label>
                                {modoVisualizacion ? (
                                  renderObservacionesConsulta(poste.audibleObservaciones)
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Detalles de pulsador, volumen, tono, fallas o cableado..."
                                    value={poste.audibleObservaciones || ''}
                                    onChange={(e) => handleActualizarPoste(pIdx, 'audibleObservaciones', e.target.value)}
                                    style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cámaras Videodetectoras */}
                      <div style={{
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginTop: '1rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#691B31', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <FaVideo size={14} style={{ color: '#BC955B' }} /> Cámaras Videodetectoras
                          </span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>¿Instalada en este poste?:</span>
                            {modoVisualizacion ? (
                              renderBadgeConsulta(poste.tieneCamara ? 'Sí' : 'No')
                            ) : (
                              <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '5px', gap: '2px', border: '1px solid #CBD5E1' }}>
                                <button
                                  type="button"
                                  onClick={() => handleActualizarPosteMultiple(pIdx, {
                                    tieneCamara: true,
                                    camaraModelo: poste.camaraModelo || MODELOS_CAMARA_CATALOGO[0],
                                    camaraCantidad: poste.camaraCantidad || '1'
                                  })}
                                  style={{
                                    border: 'none',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    fontWeight: poste.tieneCamara ? '700' : '500',
                                    backgroundColor: poste.tieneCamara ? '#691B31' : 'transparent',
                                    color: poste.tieneCamara ? '#FFFFFF' : '#475569',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleActualizarPoste(pIdx, 'tieneCamara', false)}
                                  style={{
                                    border: 'none',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    fontWeight: !poste.tieneCamara ? '700' : '500',
                                    backgroundColor: !poste.tieneCamara ? '#691B31' : 'transparent',
                                    color: !poste.tieneCamara ? '#FFFFFF' : '#475569',
                                    cursor: 'pointer'
                                  }}
                                >
                                  No
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {poste.tieneCamara && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                                  <span>Modelo de cámara: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                </label>
                                {modoVisualizacion ? (
                                  renderDatoConsulta(poste.camaraModelo, 'Sin modelo de cámara')
                                ) : (
                                  <select
                                    value={poste.camaraModelo || ''}
                                    onChange={(e) => handleActualizarPoste(pIdx, 'camaraModelo', e.target.value)}
                                    style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: 'white', color: '#1E293B', boxSizing: 'border-box' }}
                                  >
                                    <option value="">-- Seleccionar modelo de cámara --</option>
                                    {MODELOS_CAMARA_CATALOGO.map((modelo) => (
                                      <option key={modelo} value={modelo}>{modelo}</option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                                  <span>Cantidad de equipos: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                                </label>
                                {modoVisualizacion ? (
                                  renderDatoConsulta(`${poste.camaraCantidad || 1} equipo(s)`)
                                ) : (
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="ej. 1"
                                    value={poste.camaraCantidad || ''}
                                    onChange={(e) => handleActualizarPoste(pIdx, 'camaraCantidad', e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                  />
                                )}
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                                <span>Observaciones de la cámara:</span>
                              </label>
                              {modoVisualizacion ? (
                                renderObservacionesConsulta(poste.camaraObservaciones)
                              ) : (
                                <textarea
                                  rows={2}
                                  placeholder="Detalles de cobertura, orientación, cableado o estado físico..."
                                  value={poste.camaraObservaciones || ''}
                                  onChange={(e) => handleActualizarPoste(pIdx, 'camaraObservaciones', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.45rem 0.65rem',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    boxSizing: 'border-box',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

                {/* Botón inferior: Agregar otro poste */}
                {(controladorForm.postes || []).length > 0 && !modoVisualizacion && (
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={handleAgregarPoste}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px dashed #CBD5E1',
                        borderRadius: '8px',
                        color: '#691B31',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#691B31'; e.currentTarget.style.backgroundColor = '#FCFBF9'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                    >
                      <FaPlus size={11} style={{ color: '#BC955B' }} /> Agregar otro poste al crucero
                    </button>
                  </div>
                )}
              </div>

              {/* REGISTROS DE PISO */}
              <div style={{
                marginBottom: '1.5rem',
                backgroundColor: '#fcfbf9',
                padding: 'clamp(0.65rem, 2.5vw, 1.15rem)',
                borderRadius: '10px',
                border: '1px solid #DDC9A3',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '0.65rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <h4 style={{
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    color: '#691B31',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaLayerGroup size={15} style={{ color: '#BC955B' }} /> Sección 6: Registros de Piso
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>
                      Tapas e infraestructura subterránea
                    </span>
                    {editandoControladorId && !modoVisualizacion && (
                      <button
                        type="button"
                        onClick={handleGuardarRegistrosPisoModular}
                        disabled={guardandoModularSeccion === 'registros'}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid #691B31',
                          color: '#691B31',
                          borderRadius: '6px',
                          padding: '0.3rem 0.7rem',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                        title="Guarda los datos de registros y tapas en el servidor sin afectar los postes ni el gabinete"
                      >
                        {guardandoModularSeccion === 'registros' ? <FaSyncAlt className="fa-spin" size={11} /> : <FaSave size={11} />}
                        <span>{guardandoModularSeccion === 'registros' ? 'Guardando...' : 'Guardar solo Registros'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-responsive-grid grid-2" style={{ gap: '0.85rem 1rem' }}>
                  {/* Cantidad de tapas */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaLayerGroup size={13} style={{ color: '#691B31' }} />
                      <span>Cantidad de tapas: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(`${controladorForm.registrosPisoTapas ?? 0} tapas`)
                    ) : (
                      <div>
                        <input
                          type="number"
                          min="0"
                          placeholder="ej. 4"
                          value={controladorForm.registrosPisoTapas}
                          onChange={(e) => handleCambiarRegistrosTapas(e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: `1px solid ${controladorErrores.registrosPisoTapas ? '#DC2626' : '#CBD5E1'}`,
                            backgroundColor: controladorErrores.registrosPisoTapas ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                        />
                        {controladorErrores.registrosPisoTapas && (
                          <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.registrosPisoTapas}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Registros dañados */}
                  <div style={{ backgroundColor: 'white', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                      <FaExclamationTriangle size={13} style={{ color: '#DC2626' }} />
                      <span>Registros dañados: {!modoVisualizacion && <span style={{ color: '#DC2626' }}>*</span>}</span>
                    </label>
                    {modoVisualizacion ? (
                      renderDatoConsulta(`${controladorForm.registrosPisoDanados ?? 0} registros dañados`)
                    ) : (
                      <div>
                        <input
                          type="number"
                          min="0"
                          max={controladorForm.registrosPisoTapas !== '' && !isNaN(parseInt(controladorForm.registrosPisoTapas, 10)) ? parseInt(controladorForm.registrosPisoTapas, 10) : undefined}
                          placeholder="ej. 1"
                          value={controladorForm.registrosPisoDanados}
                          onChange={(e) => handleCambiarRegistrosDanados(e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: `1px solid ${controladorErrores.registrosPisoDanados ? '#DC2626' : '#CBD5E1'}`,
                            backgroundColor: controladorErrores.registrosPisoDanados ? '#FEF2F2' : '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box',
                            marginTop: 'auto'
                          }}
                        />
                        {controladorErrores.registrosPisoDanados && (
                          <span style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            <FaExclamationTriangle size={10} /> {controladorErrores.registrosPisoDanados}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* APARTADO DINÁMICO DE COORDENADAS (Solo si hay registros dañados) */}
                {Number(controladorForm.registrosPisoDanados) > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #FCD34D',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        borderBottom: '1px dashed #E2E8F0',
                        paddingBottom: '0.5rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <FaMapMarkerAlt style={{ color: '#D97706' }} /> Coordenadas de los {controladorForm.registrosPisoDanados} registro(s) dañado(s):
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          Latitud, Longitud (ej. 20.123456, -98.765432)
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: Number(controladorForm.registrosPisoDanados) > 1 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
                        gap: '0.75rem'
                      }}>
                        {(controladorForm.registrosPisoCoordenadas || []).map((item, idx) => (
                          <div
                            key={`registro-coord-${idx}`}
                            style={{
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '0.65rem 0.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem'
                            }}
                          >
                            {(() => {
                              const coordsReg = extraerCoordenadasValidas(item.coordenadas)
                              const mapaRegVisible = mapasDanadasVisibles[idx] !== false && Boolean(coordsReg)

                              return (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: '700', color: '#A02142' }}>
                                      <FaExclamationTriangle size={11} style={{ color: '#DC2626' }} /> Registro dañado #{idx + 1}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      {coordsReg && (
                                        <button
                                          type="button"
                                          onClick={() => setMapasDanadasVisibles(prev => ({
                                            ...prev,
                                            [idx]: mapaRegVisible ? false : true
                                          }))}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            padding: '0.15rem 0.45rem',
                                            backgroundColor: mapaRegVisible ? '#EFF6FF' : '#F1F5F9',
                                            color: mapaRegVisible ? '#1D4ED8' : '#475569',
                                            border: mapaRegVisible ? '1px solid #BFDBFE' : '1px solid #CBD5E1',
                                            borderRadius: '4px',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'auto'
                                          }}
                                          title={mapaRegVisible ? "Ocultar mapa interactivo" : "Mostrar mapa interactivo"}
                                        >
                                          <FaMap size={10} />
                                          <span>{mapaRegVisible ? 'Ocultar mapa' : 'Ver mapa'}</span>
                                        </button>
                                      )}
                                      {!modoVisualizacion && (
                                        <button
                                          type="button"
                                          onClick={() => handleObtenerGpsRegistro(idx)}
                                          disabled={capturandoGpsIndex === idx}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            backgroundColor: capturandoGpsIndex === idx ? '#E2E8F0' : '#FEF3C7',
                                            color: '#92400E',
                                            border: '1px solid #FCD34D',
                                            borderRadius: '4px',
                                            padding: '0.2rem 0.5rem',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            cursor: capturandoGpsIndex === idx ? 'wait' : 'pointer'
                                          }}
                                          title="Capturar ubicación GPS actual del dispositivo"
                                        >
                                          <FaMapMarkerAlt size={10} />
                                          {capturandoGpsIndex === idx ? 'Obteniendo GPS...' : 'GPS actual'}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {modoVisualizacion ? (
                                    renderDatoConsulta(item.coordenadas, 'Sin coordenadas registradas')
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="ej. 20.123456, -98.765432"
                                      value={item.coordenadas || ''}
                                      onChange={(e) => {
                                        handleCambiarCoordenada(idx, e.target.value)
                                        if (extraerCoordenadasValidas(e.target.value)) {
                                          setMapasDanadasVisibles(prev => ({ ...prev, [idx]: true }))
                                        }
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '0.45rem 0.65rem',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '5px',
                                        fontSize: '0.82rem',
                                        backgroundColor: 'white',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                  )}

                                  {coordsReg && mapaRegVisible && (
                                    <div style={{
                                      marginTop: '0.45rem',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      border: '1px solid #CBD5E1',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                      backgroundColor: '#ffffff'
                                    }}>
                                      <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.35rem 0.6rem',
                                        backgroundColor: '#F8FAFC',
                                        borderBottom: '1px solid #E2E8F0',
                                        fontSize: '0.73rem',
                                        fontWeight: '600',
                                        color: '#475569',
                                        flexWrap: 'wrap',
                                        gap: '0.35rem'
                                      }}>
                                        <span>GPS: <strong style={{ color: '#1E293B' }}>{coordsReg.lat.toFixed(6)}, {coordsReg.lng.toFixed(6)}</strong></span>
                                        <a
                                          href={`https://www.google.com/maps?q=${coordsReg.lat},${coordsReg.lng}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: '600' }}
                                        >
                                          <FaExternalLinkAlt size={8} /> Abrir en Google Maps
                                        </a>
                                      </div>
                                      <iframe
                                        title={`Mapa del registro dañado #${idx + 1}`}
                                        src={`https://maps.google.com/maps?q=${coordsReg.lat},${coordsReg.lng}&hl=es&z=17&output=embed`}
                                        style={{ width: '100%', height: '170px', border: 'none', display: 'block' }}
                                        loading="lazy"
                                      />
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                  {modoVisualizacion ? (
                    <button
                      type="button"
                      onClick={() => {
                        setModalControladorAbierto(false)
                        setModoVisualizacion(false)
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 1.4rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        backgroundColor: '#475569',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      <FaTimes size={14} /> Cerrar
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalControladorAbierto(false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.6rem 1.2rem',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          color: '#6F7271',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        <FaTimes size={13} /> Cancelar
                      </button>
                      <button
                        type="submit"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.6rem 1.2rem',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: '#691B31',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        <FaSave size={13} /> {editandoControladorId ? 'Actualizar' : 'Guardar'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {modalHistorialAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10050, padding: '1rem', backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#691B31', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaHistory /> Historial de Asignación y Retiro
                </h2>
                {componenteHistorialActual && (
                  <p style={{ margin: '0.25rem 0 0', color: '#6F7271', fontSize: '0.95rem' }}>
                    Componente: <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{componenteHistorialActual.nombre}</strong>
                  </p>
                )}
              </div>
              <button onClick={cerrarHistorial} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem' }}>
                <FaTimes size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Filtrar por Mes:</label>
                <input
                  type="month"
                  value={filtroMesHistorial}
                  onChange={(e) => setFiltroMesHistorial(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px',
                    fontSize: '0.9rem', color: '#334155', outline: 'none'
                  }}
                />
                {filtroMesHistorial && (
                  <button
                    onClick={() => setFiltroMesHistorial('')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {cargandoHistorial ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Cargando historial...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#334155', fontWeight: '700' }}>Fecha</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#334155', fontWeight: '700' }}>Movimiento</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#334155', fontWeight: '700' }}>Reporte</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#334155', fontWeight: '700' }}>Crucero / Estación</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#334155', fontWeight: '700' }}>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialData
                      .filter(h => {
                        if (!filtroMesHistorial) return true;
                        const fecha = new Date(h.fecha);
                        const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                        return mesAnio === filtroMesHistorial;
                      })
                      .map((h, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569', whiteSpace: 'nowrap' }}>
                            {new Date(h.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: h.esSalida ? '#EFF6FF' : '#FEF2F2',
                              color: h.esSalida ? '#1E40AF' : '#991B1B',
                              border: h.esSalida ? '1px solid #BFDBFE' : '1px solid #FECACA'
                            }}>
                              {h.esSalida ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <FaArrowDown size={10} /> Asignada a Crucero
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <FaSyncAlt size={10} /> Retirada de Crucero
                                </span>
                              )}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#0284c7', fontWeight: '700' }}>{h.reporte?.folio || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <FaMapMarkerAlt size={12} style={{ color: '#691B31', flexShrink: 0 }} />
                              <span>{h.reporte?.crucero || h.reporte?.estacion || 'No especificado'}</span>
                            </div>
                            {h.reporte?.estacion && h.reporte?.crucero && (
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                                Estación: {h.reporte?.estacion}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '800', color: h.esSalida ? '#ef4444' : '#16a34a' }}>
                            {h.esSalida ? `-${h.cantidad}` : `+${h.cantidad}`}
                          </td>
                        </tr>
                      ))}
                    {historialData.filter(h => {
                      if (!filtroMesHistorial) return true;
                      const fecha = new Date(h.fecha);
                      const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                      return mesAnio === filtroMesHistorial;
                    }).length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            No hay registros de historial {filtroMesHistorial ? 'para el mes seleccionado' : ''}.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DESGLOSE DE LEDS / COMPONENTES AGRUPADOS               */}
      {/* ============================================================ */}
      {grupoSeleccionado && (() => {
        const grupos = agruparExistenciasDisponibles(
          existencias.filter(item => !((item.nombre || '').toLowerCase().includes('reemplazada') || ['dañada', 'danada', 'reparacion', 'en reparación'].includes((item.estadoFisico || '').toLowerCase())))
        );
        const grupo = grupos.find(g => g.key === grupoSeleccionado);
        if (!grupo) return null;

        const subItemsFiltrados = grupo.subItems.filter(sub => coincideBusquedaSemaforo(sub, busquedaDesglose));

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: 'white', borderRadius: '16px',
              width: '100%', maxWidth: '950px', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: '#fafaf9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '10px', height: '36px', borderRadius: '4px',
                    backgroundColor: grupo.colorStripe || '#691B31'
                  }}></div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {grupo.nombre}
                      <span style={{
                        fontSize: '0.85rem', fontWeight: '700',
                        backgroundColor: grupo.bgBadge || '#f1f5f9',
                        color: grupo.colorBadge || '#475569',
                        padding: '0.2rem 0.6rem', borderRadius: '6px'
                      }}>
                        {grupo.cantidad} {grupo.cantidad === 1 ? 'unidad' : 'unidades'}
                      </span>
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Marca: <strong>{grupo.marca}</strong> — Consulta y edición individual con No. de Serie y No. de Inventario
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setGrupoSeleccionado(null)}
                  style={{
                    background: 'none', border: 'none', color: '#64748b',
                    fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem',
                    borderRadius: '8px', display: 'flex', alignItems: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Filter and Action Bar */}
              <div style={{
                padding: '1rem 1.5rem', backgroundColor: '#ffffff',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: '1rem', flexWrap: 'wrap'
              }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '450px' }}>
                  <input
                    type="text"
                    placeholder="Buscar por No. Serie, No. Inventario o Modelo..."
                    value={busquedaDesglose}
                    onChange={(e) => setBusquedaDesglose(e.target.value)}
                    style={{
                      width: '100%', padding: '0.55rem 1rem 0.55rem 2.2rem',
                      border: '1px solid #cbd5e1', borderRadius: '8px',
                      fontSize: '0.88rem', color: '#334155', outline: 'none'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                    <FaSearch size={13} />
                  </span>
                  {busquedaDesglose && (
                    <button
                      onClick={() => setBusquedaDesglose('')}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setEditandoStockId(null)
                    setModoAjusteDirecto(false)
                    setStockForm({
                      nombre: grupo.subItems[0]?.nombre || grupo.nombre,
                      categoria: grupo.categoria || 'componente',
                      cantidad: 1,
                      marca: grupo.marca || 'SEMEX',
                      modelo: grupo.subItems[0]?.modelo || '',
                      numeroSerie: '',
                      numeroInventario: '',
                      tipoInventario: 'semaforos'
                    })
                    setModalStockAbierto(true)
                  }}
                  style={{
                    backgroundColor: '#BC955B', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '0.55rem 1rem', fontSize: '0.85rem',
                    fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#9a7541'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#BC955B'}
                >
                  <FaPlus size={12} />
                  Agregar Nuevo {grupo.nombre}
                </button>
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', width: '40px', color: '#475569', fontWeight: '700' }}>#</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>No. Inventario</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>No. Serie</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Marca</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Modelo</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: '#475569', fontWeight: '700' }}>Cant.</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center', width: '130px', color: '#475569', fontWeight: '700' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subItemsFiltrados.map((subItem, idx) => (
                      <tr
                        key={subItem.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? 'white' : '#fcfcfd',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#fcfcfd'}
                      >
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', fontWeight: '700', color: '#1e293b' }}>
                          {subItem.numeroInventario ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              fontWeight: '700',
                              fontSize: '0.82rem'
                            }}>
                              {subItem.numeroInventario}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', fontFamily: 'monospace', fontWeight: '700', color: '#334155' }}>
                          {subItem.numeroSerie || <span style={{ color: '#94a3b8', fontFamily: 'inherit', fontWeight: 'normal' }}>—</span>}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: '#475569' }}>
                          {subItem.marca || grupo.marca || 'SEMEX'}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.83rem' }}>
                          {subItem.modelo || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: '6px',
                            backgroundColor: '#f1f5f9', fontWeight: '700', color: '#334155', fontSize: '0.82rem'
                          }}>
                            {subItem.cantidad}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                            <button
                              onClick={() => abrirHistorial(subItem)}
                              title="Ver historial de asignación"
                              style={{
                                backgroundColor: '#e0f2fe', border: 'none', color: '#0284c7',
                                cursor: 'pointer', padding: '0.45rem', borderRadius: '6px',
                                display: 'flex', alignItems: 'center'
                              }}
                            >
                              <FaHistory size={13} />
                            </button>
                            <button
                              onClick={() => handleEditarStock(subItem)}
                              title="Editar datos de esta pieza"
                              style={{
                                backgroundColor: '#fef3c7', border: 'none', color: '#d97706',
                                cursor: 'pointer', padding: '0.45rem', borderRadius: '6px',
                                display: 'flex', alignItems: 'center'
                              }}
                            >
                              <FaEdit size={13} />
                            </button>
                            <button
                              onClick={() => handleEliminarStock(subItem.id)}
                              title="Eliminar refacción"
                              style={{
                                backgroundColor: '#fee2e2', border: 'none', color: '#dc2626',
                                cursor: 'pointer', padding: '0.45rem', borderRadius: '6px',
                                display: 'flex', alignItems: 'center'
                              }}
                            >
                              <FaTrashAlt size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {subItemsFiltrados.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                          No se encontraron piezas que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{
                padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0',
                backgroundColor: '#fafaf9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Mostrando {subItemsFiltrados.length} de {grupo.subItems.length} piezas registradas
                </span>
                <button
                  onClick={() => setGrupoSeleccionado(null)}
                  style={{
                    backgroundColor: '#64748b', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '0.5rem 1.25rem', fontSize: '0.88rem',
                    fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

          </main>
  )
}
