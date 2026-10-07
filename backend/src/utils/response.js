function formatZodError(error) {
  if (!error) return 'Datos inválidos';
  if (typeof error === 'string') return error;
  const errObj = error.error || error;
  const issues = errObj.issues || errObj.errors;
  if (Array.isArray(issues) && issues.length > 0) {
    return issues[0].message || 'Datos inválidos';
  }
  return errObj.message || 'Datos inválidos';
}

function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

function fail(res, error, status = 400) {
  const mensaje = formatZodError(error);
  return res.status(status).json({ ok: false, error: mensaje });
}

module.exports = { ok, fail, formatZodError };
