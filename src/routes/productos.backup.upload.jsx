const express = require('express');
const router = express.Router();
const rawDb = require('../db');

const db = rawDb.promise ? rawDb.promise() : rawDb;

async function query(sql, params = []) {
  const result = await db.query(sql, params);

  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }

  return result;
}

router.get('/', async (req, res) => {
  try {
    const productos = await query(`
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
      data: productos,
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);

    res.status(500).json({
      ok: false,
      message: 'Error al obtener productos',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, marca, precio, id_categoria, imagen_url } = req.body;

    if (!nombre || !precio || !id_categoria) {
      return res.status(400).json({
        ok: false,
        message: 'Nombre, precio y categoria son obligatorios',
      });
    }

    const result = await query(
      `
      INSERT INTO productos
        (nombre, marca, precio, id_categoria, imagen_url)
      VALUES
        (?, ?, ?, ?, ?)
      `,
      [nombre, marca || '', precio, id_categoria, imagen_url || null]
    );

    const nuevoProducto = await query(
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
      data: nuevoProducto[0],
    });
  } catch (error) {
    console.error('Error al crear producto:', error);

    res.status(500).json({
      ok: false,
      message: 'Error al crear producto',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, marca, precio, id_categoria, imagen_url } = req.body;

    if (!nombre || !precio || !id_categoria) {
      return res.status(400).json({
        ok: false,
        message: 'Nombre, precio y categoria son obligatorios',
      });
    }

    const result = await query(
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
      [nombre, marca || '', precio, id_categoria, imagen_url || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Producto no encontrado',
      });
    }

    const productoActualizado = await query(
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
      data: productoActualizado[0],
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);

    res.status(500).json({
      ok: false,
      message: 'Error al actualizar producto',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
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
