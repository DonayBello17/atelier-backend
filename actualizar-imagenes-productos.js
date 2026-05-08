require('dotenv').config();

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password:
    process.env.DB_PASSWORD ||
    process.env.DB_PASS ||
    process.env.MYSQL_PASSWORD ||
    '',
  database:
    process.env.DB_NAME ||
    process.env.DB_DATABASE ||
    process.env.MYSQL_DATABASE ||
    'tienda de ropa',
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
};

function q(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [table, column]
  );

  return rows.length > 0;
}

function pickImage(producto, index) {
  const nombre = String(producto.nombre || '').toLowerCase();

  if (nombre.includes('camisa')) return '/productos/producto-1.jpg';
  if (nombre.includes('buzo')) return '/productos/producto-2.jpg';
  if (nombre.includes('pantalon') || nombre.includes('pantalón')) return '/productos/producto-3.jpg';
  if (nombre.includes('jean')) return '/productos/producto-4.jpg';
  if (nombre.includes('mocho') || nombre.includes('moño') || nombre.includes('gorra') || nombre.includes('ajustable')) return '/productos/producto-5.jpg';
  if (nombre.includes('zapato') || nombre.includes('tenis')) return '/productos/producto-6.jpg';
  if (nombre.includes('chaqueta') || nombre.includes('jacket')) return '/productos/producto-7.jpg';
  if (nombre.includes('vestido')) return '/productos/producto-8.jpg';
  if (nombre.includes('falda')) return '/productos/producto-9.jpg';

  const imagenes = [
    '/productos/producto-1.jpg',
    '/productos/producto-2.jpg',
    '/productos/producto-3.jpg',
    '/productos/producto-4.jpg',
    '/productos/producto-5.jpg',
    '/productos/producto-6.jpg',
    '/productos/producto-7.jpg',
    '/productos/producto-8.jpg',
    '/productos/producto-9.jpg',
    '/productos/producto-10.jpg',
  ];

  return imagenes[index % imagenes.length];
}

async function main() {
  const connection = await mysql.createConnection(DB_CONFIG);

  console.log('');
  console.log('Conectado a MySQL');
  console.log('Base de datos:', DB_CONFIG.database);
  console.log('');

  const hasImagenUrl = await columnExists(connection, 'productos', 'imagen_url');

  if (!hasImagenUrl) {
    await connection.execute(`
      ALTER TABLE ${q('productos')}
      ADD COLUMN ${q('imagen_url')} TEXT NULL
    `);

    console.log('Columna imagen_url agregada a productos.');
  } else {
    console.log('La columna imagen_url ya existe.');
  }

  const [productos] = await connection.execute(`
    SELECT id_producto, nombre, marca, id_categoria
    FROM ${q('productos')}
    ORDER BY id_producto ASC
  `);

  if (productos.length === 0) {
    console.log('No hay productos para actualizar.');
    await connection.end();
    return;
  }

  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    const imagen = pickImage(producto, i);

    await connection.execute(
      `
      UPDATE ${q('productos')}
      SET ${q('imagen_url')} = ?
      WHERE ${q('id_producto')} = ?
      `,
      [imagen, producto.id_producto]
    );

    console.log(`Producto ${producto.id_producto} actualizado con imagen: ${imagen}`);
  }

  await connection.end();

  console.log('');
  console.log('Listo. Ya cada producto tiene imagen_url.');
  console.log('Ahora recarga el navegador con Ctrl + F5.');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('Error actualizando imagenes');
  console.error(error.message);
  console.error('');
  process.exit(1);
});
