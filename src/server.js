require('dotenv').config();

const { spawn } = require('child_process');
const app = require('./app');
const pool = require('./config/db');

let seedParcialRunning = false;

app.get('/seed-parcial', (req, res) => {
  const clave = req.query.clave;

  if (clave !== 'atelier2026parcial') {
    return res.status(403).json({
      success: false,
      message: 'Clave incorrecta',
    });
  }

  if (seedParcialRunning) {
    return res.json({
      success: true,
      message: 'La carga masiva ya se está ejecutando. Revisa los logs de Render.',
    });
  }

  seedParcialRunning = true;

  const child = spawn('node', ['seed-parcial.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    seedParcialRunning = false;
    console.log(`seed-parcial terminó con código ${code}`);
  });

  child.on('error', (error) => {
    seedParcialRunning = false;
    console.error('Error ejecutando seed-parcial:', error);
  });

  return res.json({
    success: true,
    message: 'Carga masiva iniciada. Revisa los logs de Render.',
  });
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