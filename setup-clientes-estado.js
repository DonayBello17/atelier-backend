require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'tienda de ropa',
  });

  const [cols] = await db.execute(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clientes'
      AND COLUMN_NAME = 'estado'
  `);

  if (cols.length === 0) {
    await db.execute(`
      ALTER TABLE clientes
      ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    `);

    console.log('Columna clientes.estado agregada.');
  } else {
    console.log('La columna clientes.estado ya existe.');
  }

  await db.execute(`
    UPDATE clientes
    SET estado = 'activo'
    WHERE estado IS NULL OR estado = ''
  `);

  await db.end();
  console.log('Clientes preparados con estado activo/inactivo.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
