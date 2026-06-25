const rateLimit = require('express-rate-limit');

const reporteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { ok: false, error: 'Demasiados reportes enviados. Intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { reporteLimiter };
