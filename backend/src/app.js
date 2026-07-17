require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const { ok } = require('./utils/response');

const authRoutes = require('./routes/authRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const evidenciaRoutes = require('./routes/evidenciaRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  ok(res, { message: 'SITMAH API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/evidencias', evidenciaRoutes);
app.use('/api/inventario', inventarioRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SITMAH API corriendo en http://localhost:${PORT}`);
});

module.exports = app;
