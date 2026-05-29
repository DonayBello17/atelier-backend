try {
  require('dotenv').config();
} catch (error) {
  // Si dotenv no está instalado, el script usa las variables del sistema.
}

const mysql = require('mysql2/promise');

const env = process.env;

const config = {
  host: env.MYSQLHOST || env.AIVEN_HOST,
  port: Number(env.MYSQLPORT || env.AIVEN_PORT || 3306),
  user: env.MYSQLUSER || env.AIVEN_USER,
  password: env.MYSQLPASSWORD || env.AIVEN_PASSWORD,
  database: env.MYSQLDATABASE || env.AIVEN_DATABASE || 'defaultdb',
  ssl:
    env.DB_SSL === 'true' || env.MYSQL_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
};

const marcas = [
  'Levis',
  'Nike',
  'Adidas',
  'Puma',
  'Zara',
  'H&M',
  'Tommy Hilfiger',
  'Calvin Klein',
  'Lacoste',
  'Atelier',
  'Diesel',
  'Guess',
];

const prendasCaballero = [
  'Camisa Oxford Slim Fit',
  'Pantalon Chino Beige',
  'Chaqueta Bomber Negra',
  'Jeans Clasico Azul',
  'Polo Premium Algodon',
  'Conjunto Deportivo Urbano',
  'Traje Formal Ejecutivo',
  'Sudadera Oversize',
  'Pantalon Cargo Verde',
  'Blazer Casual',
  'Buzo Algodon Premium',
  'Camisa Manga Corta',
  'Chaqueta Denim Azul',
  'Pantalon Jogger Negro',
  'Sueter Tejido Elegante',
  'Camisa Cuadros Manga Larga',
  'Camiseta Sencilla Algodon',
  'Chaqueta Casual Negra',
  'Pantalon Slim Fit',
  'Conjunto Tiro Deportivo',
];

const prendasDama = [
  'Blusa Manga Larga Seda',
  'Vestido Satinado Elegante',
  'Falda Plisada Negra',
  'Jeans Tiro Alto Azul',
  'Chaqueta Casual Beige',
  'Conjunto Deportivo Dama',
  'Camisa Oversize Blanca',
  'Pantalon Palazzo Negro',
  'Blazer Ejecutivo Dama',
  'Top Elegante Satinado',
  'Vestido Casual Primavera',
  'Blusa Formal Beige',
  'Falda Denim Azul',
  'Chaqueta Cropped Negra',
  'Pantalon Sastre Dama',
];

const colores = [
  'Negro',
  'Blanco',
  'Azul',
  'Gris',
  'Beige',
  'Rojo',
  'Verde',
  'Marron',
  'Crema',
  'Azul claro',
  'Rosado',
  'Arena',
];

const imagenes = [
  '/productos/buzo-algodon.jpg',
  '/productos/buzo-rojo-algodon.jpg',
  '/productos/camisa-cuadros-manga-larga.jpg',
  '/productos/camisa-manga-larga.jpg',
  '/productos/camiseta-sencilla-algodon.jpg',
  '/productos/conjunto-tiro-25.jpg.avif',
  '/productos/jordan-flight.jpg.avif',
  '/productos/producto-3.jpg',
  '/productos/producto-6.jpg',
  '/productos/producto-7.jpg',
  '/productos/producto-8.jpg',
  '/productos/producto-9.jpg',
  '/productos/producto-10.jpg',
  '/productos/producto-11.jpg',
  '/productos/producto-12.jpg',
  '/productos/producto-13.jpg',
  '/productos/producto-14.jpg',
  '/productos/producto-15.jpg',
  '/productos/producto-16.jpg',
  '/productos/producto-17.jpg',
  '/productos/producto-18.jpg',
  '/productos/producto-19.jpg',
  '/productos/producto-20.jpg',
  '/productos/producto-21.jpg',
  '/productos/producto-22.jpg',
  '/productos/producto-23.jpg',
  '/productos/producto-24.jpg',
  '/productos/producto-25.jpg',
  '/productos/producto-26.jpg',
  '/productos/producto-27.jpg',
  '/productos/producto-28.jpg',
  '/productos/producto-29.jpg',
  '/productos/producto-30.jpg',
  '/productos/traje-formal.jpg.png',
];

const nombresClientes = [
  'Alejandro Martinez',
  'Victor Julio Torres',
  'Daniela Ramirez',
  'Carlos Jimenez',
  'Maria Fernandez',
  'Jose Rodriguez',
  'Valentina Gomez',
  'Luis Herrera',
  'Camila Reyes',
  'Andres Castillo',
  'Sofia Morales',
  'Miguel Vargas',
  'Laura Pena',
  'Samuel Diaz',
  'Natalia Rojas',
  'Juan Medina',
  'Gabriela Santos',
  'Pedro Alvarez',
  'Marcos Castillo',
  'Paola Jimenez',
  'Cristian Herrera',
  'Rosa Martinez',
];

function normalizarTabla(nombre) {
  return `\`${nombre}\``;
}

async function obtenerTablas(conn) {
  const [rows] = await conn.query('SHOW TABLES');
  return rows.map((row) => Object.values(row)[0]);
}

async function obtenerColumnas(conn, tabla) {
  const [rows] = await conn.query(`SHOW COLUMNS FROM ${normalizarTabla(tabla)}`);
  return rows.map((row) => row.Field);
}

async function insertar(conn, tabla, data) {
  const columnas = await obtenerColumnas(conn, tabla);
  const filtrado = {};

  for (const [key, value] of Object.entries(data)) {
    if (columnas.includes(key)) {
      filtrado[key] = value;
    }
  }

  const keys = Object.keys(filtrado);

  if (keys.length === 0) {
    throw new Error(`No hay columnas compatibles para insertar en ${tabla}`);
  }

  const sql = `
    INSERT INTO ${normalizarTabla(tabla)} (${keys.map(normalizarTabla).join(', ')})
    VALUES (${keys.map(() => '?').join(', ')})
  `;

  const values = keys.map((key) => filtrado[key]);
  const [result] = await conn.execute(sql, values);

  return result.insertId;
}

async function crearIndiceSiNoExiste(conn, tabla, nombreIndice, columnasIndice) {
  try {
    const tablas = await obtenerTablas(conn);
    if (!tablas.includes(tabla)) return;

    const columnas = await obtenerColumnas(conn, tabla);
    const columnasExisten = columnasIndice.every((columna) => columnas.includes(columna));

    if (!columnasExisten) return;

    const [existente] = await conn.execute(
      `
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
      `,
      [config.database, tabla, nombreIndice]
    );

    if (existente.length > 0) return;

    await conn.query(
      `CREATE INDEX ${normalizarTabla(nombreIndice)} ON ${normalizarTabla(tabla)} (${columnasIndice
        .map(normalizarTabla)
        .join(', ')})`
    );

    console.log(`Indice creado: ${nombreIndice}`);
  } catch (error) {
    console.log(`No se pudo crear indice ${nombreIndice}: ${error.message}`);
  }
}

async function detectarTablaDetalleVentas(conn) {
  const tablas = await obtenerTablas(conn);

  const posibles = [
    'detalle_ventas',
    'detalles_venta',
    'ventas_detalle',
    'venta_detalle',
    'detalle_venta',
  ];

  return posibles.find((tabla) => tablas.includes(tabla)) || null;
}

async function obtenerTallas(conn) {
  const tablas = await obtenerTablas(conn);

  if (!tablas.includes('tallas')) {
    throw new Error('No existe la tabla tallas');
  }

  let [rows] = await conn.query('SELECT * FROM tallas');

  if (rows.length > 0) {
    return rows;
  }

  const tallasBase = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  for (const talla of tallasBase) {
    await insertar(conn, 'tallas', {
      talla,
      nombre: talla,
      nombre_talla: talla,
      descripcion: talla,
    });
  }

  [rows] = await conn.query('SELECT * FROM tallas');
  return rows;
}

function obtenerIdTalla(talla) {
  return talla.id_talla || talla.id || talla.ID;
}

async function medirLatencia(conn, nombre, sql, params = []) {
  const inicio = process.hrtime.bigint();
  await conn.execute(sql, params);
  const fin = process.hrtime.bigint();

  const ms = Number(fin - inicio) / 1_000_000;

  console.log(`${nombre}: ${ms.toFixed(2)} ms`);

  return ms;
}

async function main() {
  if (!config.host || !config.user || !config.password || !config.database) {
    console.log('Faltan variables de conexion.');
    console.log('Necesitas MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD y MYSQLDATABASE.');
    process.exit(1);
  }

  const conn = await mysql.createConnection(config);

  console.log('Conectado a MySQL');
  console.log(`Base de datos: ${config.database}`);

  const tablas = await obtenerTablas(conn);
  const tablaDetalleVentas = await detectarTablaDetalleVentas(conn);

  if (!tablas.includes('productos')) throw new Error('No existe la tabla productos');
  if (!tablas.includes('clientes')) throw new Error('No existe la tabla clientes');
  if (!tablas.includes('inventario')) throw new Error('No existe la tabla inventario');
  if (!tablas.includes('ventas')) throw new Error('No existe la tabla ventas');
  if (!tablaDetalleVentas) {
    throw new Error('No encontre tabla de detalle de ventas');
  }

  console.log(`Tabla detalle ventas detectada: ${tablaDetalleVentas}`);

  await crearIndiceSiNoExiste(conn, 'productos', 'idx_productos_nombre', ['nombre']);
  await crearIndiceSiNoExiste(conn, 'productos', 'idx_productos_categoria', ['id_categoria']);
  await crearIndiceSiNoExiste(conn, 'clientes', 'idx_clientes_email', ['email']);
  await crearIndiceSiNoExiste(conn, 'clientes', 'idx_clientes_nombre', ['nombre']);
  await crearIndiceSiNoExiste(conn, 'clientes', 'idx_clientes_estado', ['estado']);
  await crearIndiceSiNoExiste(conn, 'inventario', 'idx_inventario_producto', ['id_producto']);
  await crearIndiceSiNoExiste(conn, 'inventario', 'idx_inventario_talla', ['id_talla']);
  await crearIndiceSiNoExiste(conn, 'ventas', 'idx_ventas_cliente', ['id_cliente']);
  await crearIndiceSiNoExiste(conn, tablaDetalleVentas, 'idx_detalle_ventas_venta', ['id_venta']);
  await crearIndiceSiNoExiste(conn, tablaDetalleVentas, 'idx_detalle_ventas_inventario', ['id_inventario']);

  const batch = Date.now().toString().slice(-6);
  const tallas = await obtenerTallas(conn);

  const productosInsertados = [];
  const inventariosInsertados = [];
  const clientesInsertados = [];

  console.log('Insertando 1100 productos con imagen...');

  for (let i = 1; i <= 1100; i++) {
    const esDama = i % 4 === 0;
    const listaPrendas = esDama ? prendasDama : prendasCaballero;
    const nombreBase = listaPrendas[i % listaPrendas.length];

    const producto = {
      nombre: `${nombreBase} ${String(i).padStart(4, '0')}`,
      marca: marcas[i % marcas.length],
      precio: 35 + (i % 120),
      id_categoria: esDama ? 2 : 1,
      imagen_url: imagenes[i % imagenes.length],
      estado: 'activo',
    };

    const idProducto = await insertar(conn, 'productos', producto);

    productosInsertados.push({
      id_producto: idProducto,
      precio: producto.precio,
    });

    for (let v = 0; v < 2; v++) {
      const talla = tallas[(i + v) % tallas.length];
      const idTalla = obtenerIdTalla(talla);

      const idInventario = await insertar(conn, 'inventario', {
        id_producto: idProducto,
        id_talla: idTalla,
        color: colores[(i + v) % colores.length],
        stock: 8 + ((i + v) % 25),
        estado: 'activo',
      });

      inventariosInsertados.push({
        id_inventario: idInventario,
        precio: producto.precio,
      });
    }

    if (i % 100 === 0) {
      console.log(`Productos insertados: ${i}`);
    }
  }

  console.log('Insertando 500 clientes...');

  for (let i = 1; i <= 500; i++) {
    const nombre = nombresClientes[i % nombresClientes.length];

    const idCliente = await insertar(conn, 'clientes', {
      nombre: `${nombre} ${String(i).padStart(3, '0')}`,
      telefono: `350${String(1000000 + i)}`,
      email: `cliente.${batch}.${i}@atelier.test`,
      direccion: `Calle ${20 + (i % 80)} #${i % 99}-${10 + (i % 50)}`,
      estado: i % 12 === 0 ? 'inactivo' : 'activo',
    });

    clientesInsertados.push(idCliente);
  }

  console.log('Insertando 300 ventas con detalles...');

  let ventasCreadas = 0;

  for (let i = 1; i <= 300; i++) {
    try {
      const idCliente = clientesInsertados[i % clientesInsertados.length];
      const item1 = inventariosInsertados[(i * 2) % inventariosInsertados.length];
      const item2 = inventariosInsertados[(i * 3) % inventariosInsertados.length];

      const cantidad1 = 1 + (i % 2);
      const cantidad2 = 1;

      const total =
        cantidad1 * Number(item1.precio || 0) +
        cantidad2 * Number(item2.precio || 0);

      const fecha = new Date();

      const idVenta = await insertar(conn, 'ventas', {
        id_cliente: idCliente,
        fecha,
        fecha_venta: fecha,
        total,
        total_venta: total,
        monto_total: total,
        estado: i % 20 === 0 ? 'anulada' : 'activa',
      });

      await insertar(conn, tablaDetalleVentas, {
        id_venta: idVenta,
        id_inventario: item1.id_inventario,
        cantidad: cantidad1,
        precio_unitario: item1.precio,
        subtotal: cantidad1 * Number(item1.precio || 0),
      });

      await insertar(conn, tablaDetalleVentas, {
        id_venta: idVenta,
        id_inventario: item2.id_inventario,
        cantidad: cantidad2,
        precio_unitario: item2.precio,
        subtotal: cantidad2 * Number(item2.precio || 0),
      });

      await conn.execute(
        'UPDATE inventario SET stock = GREATEST(stock - ?, 0) WHERE id_inventario = ?',
        [cantidad1, item1.id_inventario]
      );

      await conn.execute(
        'UPDATE inventario SET stock = GREATEST(stock - ?, 0) WHERE id_inventario = ?',
        [cantidad2, item2.id_inventario]
      );

      ventasCreadas++;
    } catch (error) {
      console.log(`Venta ${i} no se pudo insertar: ${error.message}`);
    }
  }

  const [conteos] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM productos) AS productos,
      (SELECT COUNT(*) FROM clientes) AS clientes,
      (SELECT COUNT(*) FROM inventario) AS inventario,
      (SELECT COUNT(*) FROM ventas) AS ventas
  `);

  console.log('Conteo final de registros:');
  console.table(conteos);

  console.log('Pruebas rapidas de latencia:');

  await medirLatencia(
    conn,
    'COUNT productos',
    'SELECT COUNT(*) FROM productos'
  );

  await medirLatencia(
    conn,
    'Busqueda productos por camisa',
    "SELECT id_producto, nombre, marca, precio FROM productos WHERE nombre LIKE '%Camisa%' ORDER BY id_producto DESC LIMIT 12"
  );

  await medirLatencia(
    conn,
    'Inventario por producto',
    `
    SELECT p.nombre, i.color, i.stock
    FROM inventario i
    JOIN productos p ON p.id_producto = i.id_producto
    WHERE p.nombre LIKE '%Camisa%'
    LIMIT 20
    `
  );

  await medirLatencia(
    conn,
    'COUNT clientes',
    'SELECT COUNT(*) FROM clientes'
  );

  console.log('Carga finalizada correctamente.');
  console.log(`Productos nuevos: ${productosInsertados.length}`);
  console.log(`Clientes nuevos: ${clientesInsertados.length}`);
  console.log(`Inventarios nuevos: ${inventariosInsertados.length}`);
  console.log(`Ventas nuevas: ${ventasCreadas}`);

  await conn.end();
}

main().catch((error) => {
  console.error('Error en seed-parcial:', error);
  process.exit(1);
});