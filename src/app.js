const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend funcionando correctamente',
  });
});

app.use('/auth', require('./routes/auth'));
app.use('/productos', require('./routes/productos'));
app.use('/clientes', require('./routes/clientes'));
app.use('/inventario', require('./routes/inventario'));
app.use('/ventas', require('./routes/ventas'));
app.use('/tallas', require('./routes/tallas'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/tallas', require('./routes/tallas'));

app.use((err, req, res, next) => {
  console.error('Error global:', err);

  res.status(500).json({
    ok: false,
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
