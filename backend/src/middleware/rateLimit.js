const rateLimit = require('express-rate-limit');

const reporteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { ok: false, error: 'Demasiados reportes enviados. Intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // Máximo 10 intentos por IP
  message: { ok: false, error: 'Demasiados intentos de inicio de sesión. Por favor espera 10 minutos antes de intentar de nuevo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { reporteLimiter, loginLimiter };
