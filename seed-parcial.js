try {
  require('dotenv').config();
} catch (error) {
  // Si dotenv no está instalado, usa variables del sistema.
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

const catalogoBase = [
  {
    nombre: 'Buzo Algodon Casual',
    marca: 'Puma',
    id_categoria: 2,
    imagen_url: '/productos/buzo-algodon.jpg',
    precio: 50,
  },
  {
    nombre: 'Buzo Rojo Algodon',
    marca: 'Nike',
    id_categoria: 1,
    imagen_url: '/productos/buzo-rojo-algodon.jpg',
    precio: 48,
  },
  {
    nombre: 'Camisa Cuadros Manga Larga',
    marca: 'Levis',
    id_categoria: 1,
    imagen_url: '/productos/camisa-cuadros-manga-larga.jpg',
    precio: 61,
  },
  {
    nombre: 'Camisa Manga Larga Celeste',
    marca: 'Levis',
    id_categoria: 1,
    imagen_url: '/productos/camisa-manga-larga.jpg',
    precio: 61,
  },
  {
    nombre: 'Camiseta Sencilla Algodon',
    marca: 'Adidas',
    id_categoria: 2,
    imagen_url: '/productos/camiseta-sencilla-algodon.jpg',
    precio: 35,
  },
  {
    nombre: 'Conjunto Tiro Deportivo',
    marca: 'Adidas',
    id_categoria: 1,
    imagen_url: '/productos/conjunto-tiro-25.jpg.avif',
    precio: 45,
  },
  {
    nombre: 'Jordan Flight Essentials',
    marca: 'Nike',
    id_categoria: 1,
    imagen_url: '/productos/jordan-flight.jpg.avif',
    precio: 41,
  },
  {
    nombre: 'Blusa Rayas Azul',
    marca: 'Tommy Hilfiger',
    id_categoria: 2,
    imagen_url: '/productos/producto-3.jpg',
    precio: 40,
  },
  {
    nombre: 'Blusa Casual Beige',
    marca: 'Calvin Klein',
    id_categoria: 2,
    imagen_url: '/productos/producto-6.jpg',
    precio: 38,
  },
  {
    nombre: 'Chaqueta Casual Azul',
    marca: 'H&M',
    id_categoria: 1,
    imagen_url: '/productos/producto-7.jpg',
    precio: 52,
  },
  {
    nombre: 'Tenis Urbanos Blanco Negro',
    marca: 'Adidas',
    id_categoria: 1,
    imagen_url: '/productos/producto-8.jpg',
    precio: 60,
  },
  {
    nombre: 'Blazer Rosa Elegante',
    marca: 'Calvin Klein',
    id_categoria: 2,
    imagen_url: '/productos/producto-9.jpg',
    precio: 62,
  },
  {
    nombre: 'Look Urbano Negro',
    marca: 'Nike',
    id_categoria: 1,
    imagen_url: '/productos/producto-10.jpg',
    precio: 44,
  },
  {
    nombre: 'Camiseta Casual Turquesa',
    marca: 'Puma',
    id_categoria: 1,
    imagen_url: '/productos/producto-11.jpg',
    precio: 39,
  },
  {
    nombre: 'Jogger Deportivo Negro',
    marca: 'Nike',
    id_categoria: 1,
    imagen_url: '/productos/producto-12.jpg',
    precio: 42,
  },
  {
    nombre: 'Pantalon Deportivo Negro',
    marca: 'Under Armour',
    id_categoria: 1,
    imagen_url: '/productos/producto-13.jpg',
    precio: 40,
  },
  {
    nombre: 'Bermuda Casual Gris',
    marca: 'H&M',
    id_categoria: 1,
    imagen_url: '/productos/producto-14.jpg',
    precio: 33,
  },
  {
    nombre: 'Chaqueta Casual Cafe',
    marca: 'Zara',
    id_categoria: 1,
    imagen_url: '/productos/producto-15.jpg',
    precio: 52,
  },
  {
    nombre: 'Gabardina Elegante Beige',
    marca: 'Zara',
    id_categoria: 1,
    imagen_url: '/productos/producto-16.jpg',
    precio: 57,
  },
  {
    nombre: 'Vestido Minimalista Celeste',
    marca: 'Calvin Klein',
    id_categoria: 2,
    imagen_url: '/productos/producto-17.jpg',
    precio: 49,
  },
  {
    nombre: 'Chaqueta Urbana Negra',
    marca: 'Nike',
    id_categoria: 1,
    imagen_url: '/productos/producto-18.jpg',
    precio: 47,
  },
  {
    nombre: 'Vestido Floral Rosado',
    marca: 'Guess',
    id_categoria: 2,
    imagen_url: '/productos/producto-19.jpg',
    precio: 54,
  },
  {
    nombre: 'Traje Ejecutivo Azul',
    marca: 'Levis',
    id_categoria: 1,
    imagen_url: '/productos/producto-20.jpg',
    precio: 100,
  },
  {
    nombre: 'Outfit Casual Femenino',
    marca: 'H&M',
    id_categoria: 2,
    imagen_url: '/productos/producto-21.jpg',
    precio: 46,
  },
  {
    nombre: 'Conjunto Sastre Beige',
    marca: 'Calvin Klein',
    id_categoria: 2,
    imagen_url: '/productos/producto-22.jpg',
    precio: 59,
  },
  {
    nombre: 'Vestido Elegante Verde',
    marca: 'Zara',
    id_categoria: 2,
    imagen_url: '/productos/producto-23.jpg',
    precio: 58,
  },
  {
    nombre: 'Camiseta Deportiva Negro Rojo',
    marca: 'Nike',
    id_categoria: 1,
    imagen_url: '/productos/producto-24.jpg',
    precio: 41,
  },
  {
    nombre: 'Camisa Blanca Slim Fit',
    marca: 'Levis',
    id_categoria: 1,
    imagen_url: '/productos/producto-25.jpg',
    precio: 61,
  },
  {
    nombre: 'Short Denim Azul',
    marca: 'H&M',
    id_categoria: 2,
    imagen_url: '/productos/producto-26.jpg',
    precio: 36,
  },
  {
    nombre: 'Camiseta Negra Basica',
    marca: 'Puma',
    id_categoria: 1,
    imagen_url: '/productos/producto-27.jpg',
    precio: 34,
  },
  {
    nombre: 'Camisa Cuadros Azul',
    marca: 'Tommy Hilfiger',
    id_categoria: 1,
    imagen_url: '/productos/producto-28.jpg',
    precio: 63,
  },
  {
    nombre: 'Blusa Nocturna Negra',
    marca: 'Zara',
    id_categoria: 2,
    imagen_url: '/productos/producto-29.jpg',
    precio: 43,
  },
  {
    nombre: 'Abrigo Mostaza Largo',
    marca: 'Zara',
    id_categoria: 2,
    imagen_url: '/productos/producto-30.jpg',
    precio: 56,
  },
  {
    nombre: 'Traje Formal Azul Marino',
    marca: 'Levis',
    id_categoria: 1,
    imagen_url: '/productos/traje-formal.jpg.png',
    precio: 100,
  },
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

async function eliminarPorIds(conn, tabla, columna, ids) {
  if (!ids || ids.length === 0) return 0;

  let total = 0;
  const chunkSize = 300;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(',');

    const [result] = await conn.execute(
      `DELETE FROM ${normalizarTabla(tabla)} WHERE ${normalizarTabla(columna)} IN (${placeholders})`,
      chunk
    );

    total += result.affectedRows || 0;
  }

  return total;
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

  const tallasBase = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36'];

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

async function limpiarCargaAnterior(conn, tablaDetalleVentas) {
  console.log('Limpiando carga anterior del parcial...');

  const [productosSeed] = await conn.query(
    `
    SELECT id_producto
    FROM productos
    WHERE nombre REGEXP ' [0-9]{4}$'
    `
  );

  const productIds = productosSeed.map((row) => row.id_producto);

  const [clientesSeed] = await conn.query(
    `
    SELECT id_cliente
    FROM clientes
    WHERE email LIKE 'cliente.%@atelier.test'
    `
  );

  const clienteIds = clientesSeed.map((row) => row.id_cliente);

  let inventarioIds = [];
  let ventaIds = [];

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');

    const [inventarioSeed] = await conn.execute(
      `
      SELECT id_inventario
      FROM inventario
      WHERE id_producto IN (${placeholders})
      `,
      productIds
    );

    inventarioIds = inventarioSeed.map((row) => row.id_inventario);
  }

  if (clienteIds.length > 0) {
    const placeholders = clienteIds.map(() => '?').join(',');

    const [ventasSeed] = await conn.execute(
      `
      SELECT id_venta
      FROM ventas
      WHERE id_cliente IN (${placeholders})
      `,
      clienteIds
    );

    ventaIds = ventasSeed.map((row) => row.id_venta);
  }

  if (inventarioIds.length > 0 && tablaDetalleVentas) {
    const placeholders = inventarioIds.map(() => '?').join(',');

    const [ventasPorInventario] = await conn.execute(
      `
      SELECT DISTINCT id_venta
      FROM ${normalizarTabla(tablaDetalleVentas)}
      WHERE id_inventario IN (${placeholders})
      `,
      inventarioIds
    );

    ventaIds = [
      ...new Set([...ventaIds, ...ventasPorInventario.map((row) => row.id_venta)]),
    ];
  }

  if (tablaDetalleVentas) {
    await eliminarPorIds(conn, tablaDetalleVentas, 'id_venta', ventaIds);
    await eliminarPorIds(conn, tablaDetalleVentas, 'id_inventario', inventarioIds);
  }

  await eliminarPorIds(conn, 'ventas', 'id_venta', ventaIds);
  await eliminarPorIds(conn, 'inventario', 'id_inventario', inventarioIds);
  await eliminarPorIds(conn, 'productos', 'id_producto', productIds);
  await eliminarPorIds(conn, 'clientes', 'id_cliente', clienteIds);

  console.log(`Productos de prueba eliminados: ${productIds.length}`);
  console.log(`Clientes de prueba eliminados: ${clienteIds.length}`);
  console.log(`Inventarios de prueba eliminados: ${inventarioIds.length}`);
  console.log(`Ventas de prueba eliminadas: ${ventaIds.length}`);
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
  if (!tablaDetalleVentas) throw new Error('No encontre tabla de detalle de ventas');

  console.log(`Tabla detalle ventas detectada: ${tablaDetalleVentas}`);

  await limpiarCargaAnterior(conn, tablaDetalleVentas);

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

  console.log('Insertando 1100 productos coherentes con imagen...');

  for (let i = 1; i <= 1100; i++) {
    const base = catalogoBase[(i - 1) % catalogoBase.length];
    const numero = String(i).padStart(4, '0');

    const producto = {
      nombre: `${base.nombre} ${numero}`,
      marca: base.marca,
      precio: base.precio + (i % 7),
      id_categoria: base.id_categoria,
      imagen_url: base.imagen_url,
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