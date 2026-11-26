import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FaCheck, FaExternalLinkAlt, FaMapMarkerAlt, FaCrosshairs } from 'react-icons/fa'

const pinSvg = (color = '#DC2626') => `
  <div style="position: relative; width: 32px; height: 40px; transform: translate(-50%, -100%); cursor: grab;">
    <svg viewBox="0 0 24 32" width="32" height="40" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20c0-6.63-5.37-12-12-12z" fill="${color}"/>
      <circle cx="12" cy="11.5" r="4" fill="#FFFFFF"/>
    </svg>
  </div>
`

const crearIconoPin = (color = '#DC2626') => L.divIcon({
  className: 'custom-leaflet-pin',
  html: pinSvg(color),
  iconSize: [0, 0],
  iconAnchor: [0, 0]
})

export default function MapaInteractivoUbicacion({
  coordenadas,
  onGuardarCoordenadas,
  titulo = 'Ubicación',
  readOnly = false,
  altura = '240px'
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const layerCalleRef = useRef(null)
  const layerSateliteRef = useRef(null)

  const [tipoCapa, setTipoCapa] = useState('calles') // 'calles' | 'satelite'
  const [coordsActuales, setCoordsActuales] = useState(null)
  const [fijadoExitoso, setFijadoExitoso] = useState(false)
  const [huboCambioManual, setHuboCambioManual] = useState(false)

  // Extraer coordenadas iniciales o fallback a Pachuca de Soto
  const parseCoords = (str) => {
    if (!str || typeof str !== 'string') return null
    const partes = str.split(',').map(s => parseFloat(s.trim()))
    if (partes.length >= 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
      return { lat: partes[0], lng: partes[1] }
    }
    return null
  }

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Evitar error de doble inicialización de Leaflet
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id
    }

    const parsed = parseCoords(coordenadas) || { lat: 20.11697, lng: -98.73329 }
    const center = [parsed.lat, parsed.lng]
    const initialZoom = parseCoords(coordenadas) ? 19 : 14

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: initialZoom,
      maxZoom: 21,
      zoomControl: true,
      attributionControl: false
    })
    mapInstanceRef.current = map

    const capaCalles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 21,
      maxNativeZoom: 19
    })
    const capaSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 21,
      maxNativeZoom: 19
    })

    layerCalleRef.current = capaCalles
    layerSateliteRef.current = capaSatelite
    capaCalles.addTo(map)

    const marker = L.marker(center, {
      icon: crearIconoPin('#DC2626'),
      draggable: !readOnly
    }).addTo(map)
    markerRef.current = marker

    setCoordsActuales(parsed)

    // Eventos de arrastre del marcador
    if (!readOnly) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        const nuevas = { lat: pos.lat, lng: pos.lng }
        setCoordsActuales(nuevas)
        setHuboCambioManual(true)
        setFijadoExitoso(false)
      })

      // Clic en el mapa para mover el marcador
      map.on('click', (e) => {
        marker.setLatLng(e.latlng)
        const nuevas = { lat: e.latlng.lat, lng: e.latlng.lng }
        setCoordsActuales(nuevas)
        setHuboCambioManual(true)
        setFijadoExitoso(false)
      })
    }

    // Corregir tamaño del mapa si el contenedor se redimensiona
    const resizeTimer = setTimeout(() => {
      try {
        map.invalidateSize()
      } catch {
        // ignore
      }
    }, 200)

    return () => {
      clearTimeout(resizeTimer)
      try {
        map.remove()
      } catch {
        // ignore
      }
      mapInstanceRef.current = null
    }
  }, [])

  // Sincronizar cuando 'coordenadas' cambia desde fuera (ej. clic en 'GPS actual')
  useEffect(() => {
    const parsed = parseCoords(coordenadas)
    if (!parsed || !mapInstanceRef.current || !markerRef.current) return

    setCoordsActuales(parsed)
    setHuboCambioManual(false)
    markerRef.current.setLatLng([parsed.lat, parsed.lng])
    mapInstanceRef.current.setView([parsed.lat, parsed.lng], 19, { animate: true })
  }, [coordenadas])

  // Cambiar capa (Calles vs Satélite)
  const alternarCapa = (tipo) => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    if (tipo === 'satelite') {
      if (layerCalleRef.current) map.removeLayer(layerCalleRef.current)
      if (layerSateliteRef.current) layerSateliteRef.current.addTo(map)
      setTipoCapa('satelite')
    } else {
      if (layerSateliteRef.current) map.removeLayer(layerSateliteRef.current)
      if (layerCalleRef.current) layerCalleRef.current.addTo(map)
      setTipoCapa('calles')
    }
  }

  // Guardar ubicación seleccionada
  const handleFijarUbicacion = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!coordsActuales) return
    const str = `${coordsActuales.lat.toFixed(6)}, ${coordsActuales.lng.toFixed(6)}`
    if (onGuardarCoordenadas) {
      onGuardarCoordenadas(str)
    }
    setFijadoExitoso(true)
    setHuboCambioManual(false)
    setTimeout(() => setFijadoExitoso(false), 3000)
  }

  const coordsTexto = coordsActuales
    ? `${coordsActuales.lat.toFixed(6)}, ${coordsActuales.lng.toFixed(6)}`
    : 'Sin coordenadas'

  return (
    <div style={{
      border: '1px solid #CBD5E1',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#F8FAFC',
      marginTop: '0.4rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Barra superior con controles */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.75rem',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#334155', fontWeight: '700' }}>
          <FaMapMarkerAlt size={12} color="#DC2626" />
          <span>{titulo}:</span>
          <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: '800' }}>
            {coordsTexto}
          </span>
          {huboCambioManual && (
            <span style={{ fontSize: '0.68rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #FDE68A' }}>
              Punto ajustado
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* Selector de capa: Calles vs Satélite */}
          <div style={{ display: 'inline-flex', borderRadius: '5px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
            <button
              type="button"
              onClick={() => alternarCapa('calles')}
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: tipoCapa === 'calles' ? '#691B31' : '#F1F5F9',
                color: tipoCapa === 'calles' ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s'
              }}
            >
              Calles
            </button>
            <button
              type="button"
              onClick={() => alternarCapa('satelite')}
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: tipoCapa === 'satelite' ? '#691B31' : '#F1F5F9',
                color: tipoCapa === 'satelite' ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s'
              }}
            >
              Satélite
            </button>
          </div>

          {/* Enlace para abrir en Google Maps externo */}
          {coordsActuales && (
            <a
              href={`https://maps.google.com/?q=${coordsActuales.lat},${coordsActuales.lng}`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#0284C7',
                fontSize: '0.72rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: '600',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                backgroundColor: '#F0F9FF'
              }}
              title="Ver en Google Maps"
            >
              <FaExternalLinkAlt size={9} />
            </a>
          )}
        </div>
      </div>

      {/* Contenedor del mapa Leaflet */}
      <div style={{ position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: altura }} />

        {/* Indicador de ayuda flotante */}
        {!readOnly && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            color: '#FFFFFF',
            fontSize: '0.7rem',
            padding: '0.25rem 0.55rem',
            borderRadius: '4px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            backdropFilter: 'blur(2px)'
          }}>
            <FaCrosshairs size={10} color="#38BDF8" />
            <span>Arrastra el pin rojo o toca el mapa para fijar la banqueta</span>
          </div>
        )}
      </div>

      {/* Barra de acción para confirmar/fijar ubicación exacta */}
      {!readOnly && (
        <div style={{
          padding: '0.45rem 0.75rem',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
            {huboCambioManual
              ? 'Has movido el marcador. Pulsa el botón para guardar este punto exacto.'
              : 'Puedes mover el pin al punto milimétrico del poste.'}
          </span>

          <button
            type="button"
            onClick={handleFijarUbicacion}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: fijadoExitoso ? '#059669' : (huboCambioManual ? '#16A34A' : '#691B31'),
              color: '#FFFFFF',
              border: 'none',
              padding: '0.35rem 0.85rem',
              borderRadius: '5px',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <FaCheck size={11} />
            {fijadoExitoso ? '¡Ubicación fijada!' : 'Fijar esta ubicación exacta'}
          </button>
        </div>
      )}
    </div>
  )
}
