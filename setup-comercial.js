require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'tienda de ropa',
};

async function columnExists(db, table, column) {
  const [rows] = await db.execute(
    `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [table, column]
  );

  return rows.length > 0;
}

async function addColumnIfMissing(db, table, column, definition) {
  const exists = await columnExists(db, table, column);

  if (!exists) {
    await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`Columna agregada: ${table}.${column}`);
  } else {
    console.log(`Columna ya existe: ${table}.${column}`);
  }
}

async function main() {
  const db = await mysql.createConnection(DB_CONFIG);

  await addColumnIfMissing(db, 'ventas', 'estado', "VARCHAR(20) NOT NULL DEFAULT 'activa'");
  await addColumnIfMissing(db, 'ventas', 'fecha_anulacion', 'DATETIME NULL');
  await addColumnIfMissing(db, 'ventas', 'motivo_anulacion', 'TEXT NULL');

  await addColumnIfMissing(db, 'clientes', 'telefono', 'VARCHAR(50) NULL');
  await addColumnIfMissing(db, 'clientes', 'email', 'VARCHAR(120) NULL');
  await addColumnIfMissing(db, 'clientes', 'direccion', 'VARCHAR(255) NULL');

  await db.execute(`
    UPDATE ventas
    SET estado = 'activa'
    WHERE estado IS NULL OR estado = ''
  `);

  await db.end();

  console.log('');
  console.log('Setup comercial listo.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
