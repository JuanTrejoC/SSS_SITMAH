import Swal from 'sweetalert2'

/**
 * Determina si un error es debido a pérdida o falta de conexión a internet o de red
 */
export const esErrorDeConexion = (err) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true
  }
  if (!err) return false
  const msg = (err.message || err.toString() || '').toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('net::err') ||
    msg.includes('abort') ||
    msg.includes('sin conexión') ||
    msg.includes('conexión') ||
    msg.includes('timeout') ||
    err.name === 'TypeError'
  )
}

/**
 * Obtiene un mensaje amigable y claro ante problemas de red o del servidor
 */
export const getMensajeErrorConexion = (err, defaultMsg = 'Ocurrió un error al procesar la solicitud.') => {
  if (esErrorDeConexion(err)) {
    return 'Sin conexión a internet. Revisa tu conexión de red o datos móviles e inténtalo nuevamente.'
  }
  const rawMsg = err?.response?.data?.error || err?.error || err?.message || (typeof err === 'string' ? err : '')
  if (rawMsg === 'Error interno del servidor' || rawMsg.toLowerCase().includes('internal server error')) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'Sin conexión a internet. Revisa tu conexión a internet.'
    }
    return 'No se pudo conectar con el servidor en este momento. Revisa tu conexión a internet o inténtalo más tarde.'
  }
  return rawMsg || defaultMsg
}

/**
 * Muestra una alerta estandarizada de Swal con detección de falta de internet
 */
export const mostrarAlertaError = (err, titulo = 'Error', defaultMsg) => {
  const esConexion = esErrorDeConexion(err)
  const mensaje = getMensajeErrorConexion(err, defaultMsg)
  return Swal.fire({
    title: esConexion ? 'Sin conexión a internet' : titulo,
    text: mensaje,
    icon: esConexion ? 'warning' : 'error',
    confirmButtonColor: '#691B31'
  })
}

/**
 * Verifica si hay conexión antes de intentar enviar formularios o peticiones
 * Si no hay conexión, muestra alerta preventiva y retorna false
 */
export const verificarConexion = () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    Swal.fire({
      title: 'Sin conexión a internet',
      text: 'Tu dispositivo no tiene conexión a internet en este momento. Revisa tu red Wi-Fi o datos móviles antes de continuar.',
      icon: 'warning',
      confirmButtonColor: '#691B31'
    })
    return false
  }
  return true
}

