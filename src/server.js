require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

app.get('/parcial-latencia', async (req, res) => {
  const clave = req.query.clave;

  if (clave !== 'atelier2026parcial') {
    return res.status(403).json({ success: false, message: 'Clave incorrecta' });
  }

  try {
    const medirConsulta = async (nombre, sql) => {
      const startTime = performance.now();
      const [resultado] = await pool.query(sql);
      const endTime = performance.now();
      return {
        consulta: nombre,
        tiempo_ms: Number((endTime - startTime).toFixed(2)),
        registros_obtenidos: Array.isArray(resultado) ? resultado.length : 0,
        resultado,
      };
    };

    const conteoProductos = await medirConsulta('Conteo total de productos', 'SELECT COUNT(*) AS total_productos FROM productos');
    const conteoClientes = await medirConsulta('Conteo total de clientes', 'SELECT COUNT(*) AS total_clientes FROM clientes');
    const conteoInventario = await medirConsulta('Conteo total de inventario', 'SELECT COUNT(*) AS total_inventario FROM inventario');

    return res.json({
      success: true,
      message: 'Pruebas de latencia ejecutadas correctamente',
      metricas: [conteoProductos, conteoClientes, conteoInventario],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor en modo ${process.env.NODE_ENV}`);
  console.log(`📡 API escuchando en http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  await pool.end();
  server.close(() => {
    console.log('Proceso terminado.');
    process.exit(0);
  });
});