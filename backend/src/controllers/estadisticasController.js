const { obtenerEstadisticas } = require('../services/statsService');
const { ok } = require('../utils/response');

async function listar(req, res) {
  const data = await obtenerEstadisticas();
  ok(res, data);
}

module.exports = { listar };
