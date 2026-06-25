const path = require('path');
const fs = require('fs');
const prisma = require('../config/db');
const { fail } = require('../utils/response');

async function obtener(req, res) {
  const id = Number(req.params.id);
  const evidencia = await prisma.evidencia.findUnique({ where: { id } });

  if (!evidencia) return fail(res, 'Evidencia no encontrada', 404);

  const filePath = path.join(__dirname, '../../uploads', evidencia.filepath);

  if (!fs.existsSync(filePath)) {
    return fail(res, 'Archivo no encontrado', 404);
  }

  if (evidencia.mimetype) {
    res.setHeader('Content-Type', evidencia.mimetype);
  }

  res.sendFile(filePath);
}

module.exports = { obtener };
