const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const pool = require('../config/db');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'productos');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    cb(null, `${Date.now()}-${cleanName || 'producto'}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes JPG, PNG o WEBP'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
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
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);

    res.status(500).json({
      ok: false,
      message: 'Error al obtener productos',
    });
  }
});

router.post('/', upload.single('foto'), async (req, res) => {
  try {
    const { nombre, marca, precio, id_categoria } = req.body;
    const imagen_url = getImageUrl(req, req.file);

    if (!nombre || !precio || !id_categoria) {
      return res.status(400).json({
        ok: false,
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
      [nombre, marca || '', precio, id_categoria, imagen_url || null]
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
      message: 'Producto creado correctamente',
      data: producto[0],
    });
  } catch (error) {
    console.error('Error al crear producto:', error);

    res.status(500).json({
      ok: false,
      message: error.message || 'Error al crear producto',
    });
  }
});

router.put('/:id', upload.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, marca, precio, id_categoria, imagen_url: imagenActual } = req.body;
    const nuevaImagen = getImageUrl(req, req.file);
    const imagen_url = nuevaImagen || imagenActual || null;

    if (!nombre || !precio || !id_categoria) {
      return res.status(400).json({
        ok: false,
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
      [nombre, marca || '', precio, id_categoria, imagen_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
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
      message: 'Producto actualizado correctamente',
      data: producto[0],
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);

    res.status(500).json({
      ok: false,
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
        message: 'Producto no encontrado',
      });
    }

    res.json({
      ok: true,
      message: 'Producto eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);

    res.status(500).json({
      ok: false,
      message: 'Error al eliminar producto',
    });
  }
});

module.exports = router;
