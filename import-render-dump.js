const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const sqlFile = 'tienda_ropa_dump.sql';

  if (!fs.existsSync(sqlFile)) {
    console.error('No encontré tienda_ropa_dump.sql');
    process.exit(1);
  }

  let sql = fs.readFileSync(sqlFile, 'utf8');

  if (!sql.trim()) {
    console.error('El archivo SQL está vacío');
    process.exit(1);
  }

  sql = sql
    .replace(/CREATE DATABASE[\s\S]*?;/gi, '')
    .replace(/CREATE SCHEMA[\s\S]*?;/gi, '')
    .replace(/USE\s+`?[^`;]+`?\s*;/gi, '')
    .replace(/`tienda de ropa`\./gi, '')
    .replace(/`defaultdb`\./gi, '');

  const conn = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    multipleStatements: true,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log('Conectado a Aiven desde Render. Importando base...');

  await conn.query(sql);

  const [tables] = await conn.query('SHOW TABLES');

  console.log('Importación terminada. Tablas encontradas:');
  console.table(tables);

  await conn.end();
}

main().catch((error) => {
  console.error('Error importando:', error.message);
  process.exit(1);
});
