const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/productos', require('./routes/productos'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/tallas', require('./routes/tallas'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor tienda de ropa funcionando',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

module.exports = app;