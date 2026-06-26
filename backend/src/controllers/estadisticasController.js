const { obtenerEstadisticas } = require('../services/statsService');
const { ok } = require('../utils/response');

async function listar(req, res) {
  const filtroTiempo = req.query.filtroTiempo || 'dia';
  const data = await obtenerEstadisticas(filtroTiempo);
  ok(res, data);
}

module.exports = { listar };
