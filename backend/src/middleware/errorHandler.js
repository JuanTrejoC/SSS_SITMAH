function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ZodError') {
    const mensaje = err.errors.map((e) => e.message).join(', ');
    return res.status(400).json({ ok: false, error: mensaje });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ ok: false, error: 'El registro ya existe' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ ok: false, error: 'Registro no encontrado' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ ok: false, error: 'La imagen no debe superar 5 MB' });
  }

  if (err.message && err.message.includes('Solo se permiten imágenes')) {
    return res.status(400).json({ ok: false, error: err.message });
  }

  if (err.name === 'PrismaClientValidationError' || (err.message && err.message.includes('invocation in'))) {
    return res.status(400).json({ ok: false, error: 'Los datos enviados contienen un formato inválido o no soportado.' });
  }

  const status = err.status || 500;
  const esErrorTecnico = status === 500 || (err.message && (err.message.includes('prisma') || err.message.includes('SQL') || err.message.length > 150));
  const mensajeFinal = esErrorTecnico
    ? 'Ocurrió un error en el servidor. Por favor intente más tarde.'
    : (err.message || 'Error interno del servidor');

  res.status(status).json({
    ok: false,
    error: mensajeFinal,
  });
}

module.exports = errorHandler;
