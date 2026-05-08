const pool = require('./src/config/db');

async function main() {
  const [db] = await pool.query('SELECT DATABASE() AS database_name');
  console.log('Base de datos usada por el backend:', db[0].database_name);

  console.log('\nAntes:');
  const [before] = await pool.query("SHOW COLUMNS FROM usuarios LIKE 'rol'");
  console.table(before);

  await pool.query(`
    ALTER TABLE usuarios
    MODIFY COLUMN rol ENUM('admin', 'empleado', 'cliente') NOT NULL DEFAULT 'cliente'
  `);

  console.log('\nDespués:');
  const [after] = await pool.query("SHOW COLUMNS FROM usuarios LIKE 'rol'");
  console.table(after);

  console.log('\nListo: ahora usuarios.rol acepta admin, empleado y cliente.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
