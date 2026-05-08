require('dotenv').config();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

const USERS = [
  {
    nombre: 'Administrador',
    email: 'admin@atelier.com',
    password: '123456',
    rol: 'admin',
  },
  {
    nombre: 'Empleado',
    email: 'empleado@atelier.com',
    password: '123456',
    rol: 'empleado',
  },
];

function q(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    `
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    LIMIT 1
    `,
    [table]
  );

  return rows.length > 0;
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

async function getColumns(connection, table) {
  const [rows] = await connection.execute(
    `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
    `,
    [table]
  );

  return rows.map((row) => row.COLUMN_NAME);
}

async function listTables(connection) {
  const [rows] = await connection.execute(
    `
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME
    `
  );

  return rows.map((row) => row.TABLE_NAME);
}

function pickColumn(columns, candidates) {
  return candidates.find((candidate) => columns.includes(candidate));
}

async function main() {
  const connection = await mysql.createConnection(DB_CONFIG);

  console.log('');
  console.log('Conectado a MySQL');
  console.log('Base de datos:', DB_CONFIG.database);
  console.log('');

  const tables = await listTables(connection);
  console.log('Tablas encontradas:', tables.join(', '));
  console.log('');

  const productosExiste = await tableExists(connection, 'productos');

  if (!productosExiste) {
    throw new Error(
      'No existe la tabla productos. Revisa si tu tabla tiene otro nombre.'
    );
  }

  const hasImagenUrl = await columnExists(connection, 'productos', 'imagen_url');

  if (!hasImagenUrl) {
    await connection.execute(`
      ALTER TABLE ${q('productos')}
      ADD COLUMN ${q('imagen_url')} TEXT NULL
    `);

    console.log('Columna imagen_url agregada a productos.');
  } else {
    console.log('La columna imagen_url ya existe en productos.');
  }

  const usuariosExiste = await tableExists(connection, 'usuarios');

  if (!usuariosExiste) {
    throw new Error(
      'No existe la tabla usuarios. Revisa si tu tabla tiene otro nombre.'
    );
  }

  const userColumns = await getColumns(connection, 'usuarios');

  console.log('');
  console.log('Columnas encontradas en usuarios:', userColumns.join(', '));
  console.log('');

  const emailColumn = pickColumn(userColumns, [
    'email',
    'correo',
    'usuario',
  ]);

  const passwordColumn = pickColumn(userColumns, [
    'password',
    'contrasena',
    'contraseña',
    'clave',
  ]);

  const nombreColumn = pickColumn(userColumns, [
    'nombre',
    'name',
  ]);

  const rolColumn = pickColumn(userColumns, [
    'rol',
    'role',
  ]);

  if (!emailColumn || !passwordColumn || !rolColumn) {
    throw new Error(
      'No pude detectar las columnas necesarias. Debe existir una columna para email/correo, otra para password/contrasena/clave y otra para rol.'
    );
  }

  const [sampleRows] = await connection.execute(
    `
    SELECT ${q(passwordColumn)} AS passwordValue
    FROM ${q('usuarios')}
    WHERE ${q(passwordColumn)} IS NOT NULL
      AND ${q(passwordColumn)} <> ''
    LIMIT 1
    `
  );

  const samplePassword = sampleRows[0]?.passwordValue || '';

  const looksLikeBcrypt =
    typeof samplePassword === 'string' && samplePassword.startsWith('$2');

  let useBcrypt = looksLikeBcrypt;

  if (process.env.USE_BCRYPT === 'true') {
    useBcrypt = true;
  }

  if (process.env.USE_BCRYPT === 'false') {
    useBcrypt = false;
  }

  console.log(
    useBcrypt
      ? 'Usando contraseñas encriptadas con bcrypt.'
      : 'Usando contraseñas en texto plano.'
  );

  for (const user of USERS) {
    const finalPassword = useBcrypt
      ? await bcrypt.hash(user.password, 10)
      : user.password;

    const [existing] = await connection.execute(
      `
      SELECT *
      FROM ${q('usuarios')}
      WHERE ${q(emailColumn)} = ?
      LIMIT 1
      `,
      [user.email]
    );

    if (existing.length > 0) {
      const updates = [];
      const values = [];

      if (nombreColumn) {
        updates.push(`${q(nombreColumn)} = ?`);
        values.push(user.nombre);
      }

      updates.push(`${q(passwordColumn)} = ?`);
      values.push(finalPassword);

      updates.push(`${q(rolColumn)} = ?`);
      values.push(user.rol);

      values.push(user.email);

      await connection.execute(
        `
        UPDATE ${q('usuarios')}
        SET ${updates.join(', ')}
        WHERE ${q(emailColumn)} = ?
        `,
        values
      );

      console.log(`Usuario actualizado: ${user.email}`);
    } else {
      const columns = [];
      const values = [];
      const placeholders = [];

      if (nombreColumn) {
        columns.push(q(nombreColumn));
        values.push(user.nombre);
        placeholders.push('?');
      }

      columns.push(q(emailColumn));
      values.push(user.email);
      placeholders.push('?');

      columns.push(q(passwordColumn));
      values.push(finalPassword);
      placeholders.push('?');

      columns.push(q(rolColumn));
      values.push(user.rol);
      placeholders.push('?');

      await connection.execute(
        `
        INSERT INTO ${q('usuarios')}
          (${columns.join(', ')})
        VALUES
          (${placeholders.join(', ')})
        `,
        values
      );

      console.log(`Usuario creado: ${user.email}`);
    }
  }

  await connection.end();

  console.log('');
  console.log('Listo.');
  console.log('');
  console.log('Puedes iniciar sesión con:');
  console.log('');
  console.log('ADMIN');
  console.log('Email: admin@atelier.com');
  console.log('Password: 123456');
  console.log('');
  console.log('EMPLEADO');
  console.log('Email: empleado@atelier.com');
  console.log('Password: 123456');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('Error ejecutando setup-dev.js');
  console.error(error.message);
  console.error('');
  process.exit(1);
});
