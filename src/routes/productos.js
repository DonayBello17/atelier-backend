const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const router = express.Router();
const pool = require('../config/db');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'productos');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();

    if (!ext) {
      if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/avif') ext = '.avif';
      else if (file.mimetype === 'image/gif') ext = '.gif';
      else ext = '.jpg';
    }

    const cleanName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    cb(null, `${Date.now()}-${cleanName || 'producto'}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function getImageUrl(req, file) {
  if (!file) return null;
  return `${req.protocol}://${req.get('host')}/uploads/productos/${file.filename}`;
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_producto,
        nombre,
        marca,
        precio,
        id_categoria,
        COALESCE(imagen_url, '') AS imagen_url
      FROM productos
      ORDER BY id_producto DESC
    `);

    res.json({
      ok: true,
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);

    res.status(500).json({
      ok: false,
      success: false,
      message: error.message || 'Error al obtener productos',
    });
  }
});

router.post('/', upload.single('foto'), async (req, res) => {
  try {
    console.log('BODY PRODUCTO:', req.body);
    console.log('ARCHIVO PRODUCTO:', req.file);

    const { nombre, marca, precio, id_categoria } = req.body;
    const imagen_url = getImageUrl(req, req.file);

    if (!nombre || !precio || !id_categoria) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Nombre, precio y categoria son obligatorios',
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO productos
        (nombre, marca, precio, id_categoria, imagen_url)
      VALUES
        (?, ?, ?, ?, ?)
      `,
      [
        nombre,
        marca || '',
        precio,
        id_categoria,
        imagen_url,
      ]
    );

    const [producto] = await pool.query(
      `
      SELECT
        id_producto,
        nombre,
        marca,
        precio,
        id_categoria,
        COALESCE(imagen_url, '') AS imagen_url
      FROM productos
      WHERE id_producto = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      ok: true,
      success: true,
      message: 'Producto creado correctamente',
      data: producto[0],
    });
  } catch (error) {
    console.error('Error al crear producto:', error);

    res.status(500).json({
      ok: false,
      success: false,
      message: error.message || 'Error al crear producto',
    });
  }
});

router.put('/:id', upload.single('foto'), async (req, res) => {
  try {
    console.log('BODY UPDATE PRODUCTO:', req.body);
    console.log('ARCHIVO UPDATE PRODUCTO:', req.file);

    const { id } = req.params;
    const { nombre, marca, precio, id_categoria, imagen_url: imagenAnterior } = req.body;

    const nuevaImagen = getImageUrl(req, req.file);
    const imagen_url = nuevaImagen || imagenAnterior || null;

    if (!nombre || !precio || !id_categoria) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Nombre, precio y categoria son obligatorios',
      });
    }

    const [result] = await pool.query(
      `
      UPDATE productos
      SET
        nombre = ?,
        marca = ?,
        precio = ?,
        id_categoria = ?,
        imagen_url = ?
      WHERE id_producto = ?
      `,
      [
        nombre,
        marca || '',
        precio,
        id_categoria,
        imagen_url,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        success: false,
        message: 'Producto no encontrado',
      });
    }

    const [producto] = await pool.query(
      `
      SELECT
        id_producto,
        nombre,
        marca,
        precio,
        id_categoria,
        COALESCE(imagen_url, '') AS imagen_url
      FROM productos
      WHERE id_producto = ?
      `,
      [id]
    );

    res.json({
      ok: true,
      success: true,
      message: 'Producto actualizado correctamente',
      data: producto[0],
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);

    res.status(500).json({
      ok: false,
      success: false,
      message: error.message || 'Error al actualizar producto',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM productos
      WHERE id_producto = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        success: false,
        message: 'Producto no encontrado',
      });
    }

    res.json({
      ok: true,
      success: true,
      message: 'Producto eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);

    res.status(500).json({
      ok: false,
      success: false,
      message: error.message || 'Error al eliminar producto',
    });
  }
});

// --------------------- EXPORTAR EXCEL ---------------------
const XLSX = require('xlsx');

router.get('/exportar-excel', async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT
        p.id_producto AS ID,
        p.nombre AS Nombre,
        p.marca AS Marca,
        p.precio AS Precio,
        CASE
          WHEN p.id_categoria = 1 THEN 'Caballeros'
          WHEN p.id_categoria = 2 THEN 'Damas'
          ELSE 'Sin categoría'
        END AS Categoria,
        COALESCE(p.imagen_url, '') AS Imagen_URL,
        COALESCE(SUM(i.stock), 0) AS Stock_Total,
        COALESCE(GROUP_CONCAT(DISTINCT i.color SEPARATOR ', '), 'Sin colores') AS Colores_Disponibles
      FROM productos p
      LEFT JOIN inventario i ON i.id_producto = p.id_producto
      GROUP BY
        p.id_producto,
        p.nombre,
        p.marca,
        p.precio,
        p.id_categoria,
        p.imagen_url
      ORDER BY p.id_producto DESC
    `);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(productos);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogo');

    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="catalogo_atelier.xlsx"'
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    return res.send(buffer);
  } catch (error) {
    console.error('Error exportando Excel:', error);

    return res.status(500).json({
      ok: false,
      success: false,
      message: error.message || 'No se pudo exportar el Excel',
    });
  }
});

// --------------------- IMPORTAR EXCEL ---------------------
const multerExcel = multer({ dest: 'uploads/' });

router.post('/importar-excel', multerExcel.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(sheet);

    let agregados = 0;

    for (let row of datos) {
      if (!row.nombre || !row.marca || !row.id_categoria) continue;

      const [exist] = await pool.query(
        'SELECT id_producto FROM productos WHERE nombre=? AND marca=? AND id_categoria=?',
        [row.nombre, row.marca, row.id_categoria]
      );

      let id_producto;
      if (exist.length === 0) {
        const [result] = await pool.query(
          'INSERT INTO productos(nombre, marca, precio, id_categoria, imagen_url) VALUES(?,?,?,?,?)',
          [row.nombre, row.marca, row.precio || 0, row.id_categoria, row.imagen_url || '']
        );
        id_producto = result.insertId;
        agregados++;
      } else {
        id_producto = exist[0].id_producto;
      }

      // Talla
      const [tallaExist] = await pool.query(
        'SELECT id_talla FROM tallas WHERE talla=?',
        [row.talla]
      );

      let id_talla;
      if (tallaExist.length === 0) {
        const [tResult] = await pool.query('INSERT INTO tallas(talla) VALUES(?)', [row.talla]);
        id_talla = tResult.insertId;
      } else {
        id_talla = tallaExist[0].id_talla;
      }

      // Inventario
      await pool.query(
        'INSERT INTO inventario(id_producto, id_talla, color, stock) VALUES(?,?,?,?)',
        [id_producto, id_talla, row.color || '', row.stock || 0]
      );
    }

    res.json({ success: true, message: `Importación completada: ${agregados} productos agregados.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
