const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        i.id_inventario,
        i.id_producto,
        i.id_talla,
        i.color,
        i.stock,
        p.nombre AS producto,
        p.marca AS marca,
        p.precio AS precio,
        COALESCE(p.imagen_url, '') AS imagen_url,
        t.nombre_talla AS talla
      FROM inventario i
      JOIN productos p ON i.id_producto = p.id_producto
      JOIN tallas t ON i.id_talla = t.id_talla
      ORDER BY i.id_inventario DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);

    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id_producto, id_talla, color, stock } = req.body;

    if (!id_producto || !id_talla || stock === '' || stock === null || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Producto, talla y stock son obligatorios',
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO inventario
        (id_producto, id_talla, color, stock)
      VALUES
        (?, ?, ?, ?)
      `,
      [id_producto, id_talla, color || '', stock]
    );

    res.status(201).json({
      success: true,
      message: 'Inventario creado correctamente',
      id_inventario: result.insertId,
    });
  } catch (error) {
    console.error('Error al crear inventario:', error);

    res.status(500).json({
      success: false,
      message: 'Error al crear inventario',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_producto, id_talla, color, stock } = req.body;

    if (!id_producto || !id_talla || stock === '' || stock === null || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Producto, talla y stock son obligatorios',
      });
    }

    const [result] = await pool.query(
      `
      UPDATE inventario
      SET
        id_producto = ?,
        id_talla = ?,
        color = ?,
        stock = ?
      WHERE id_inventario = ?
      `,
      [id_producto, id_talla, color || '', stock, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Inventario actualizado correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar inventario:', error);

    res.status(500).json({
      success: false,
      message: 'Error al actualizar inventario',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM inventario
      WHERE id_inventario = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Inventario eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar inventario:', error);

    res.status(500).json({
      success: false,
      message: 'Error al eliminar inventario',
    });
  }
});

module.exports = router;
