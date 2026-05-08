const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id_cliente,
        c.nombre,
        COALESCE(c.telefono, '') AS telefono,
        COALESCE(c.email, '') AS email,
        COALESCE(c.direccion, '') AS direccion,
        COUNT(v.id_venta) AS compras,
        COALESCE(SUM(CASE WHEN v.estado = 'activa' THEN v.total ELSE 0 END), 0) AS total_gastado,
        MAX(v.fecha) AS ultima_compra
      FROM clientes c
      LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
      GROUP BY
        c.id_cliente,
        c.nombre,
        c.telefono,
        c.email,
        c.direccion
      ORDER BY c.id_cliente DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener clientes',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, email, direccion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del cliente es obligatorio',
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO clientes
        (nombre, telefono, email, direccion)
      VALUES
        (?, ?, ?, ?)
      `,
      [
        nombre.trim(),
        telefono || '',
        email || '',
        direccion || '',
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      id_cliente: result.insertId,
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear cliente',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, direccion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del cliente es obligatorio',
      });
    }

    const [result] = await pool.query(
      `
      UPDATE clientes
      SET
        nombre = ?,
        telefono = ?,
        email = ?,
        direccion = ?
      WHERE id_cliente = ?
      `,
      [
        nombre.trim(),
        telefono || '',
        email || '',
        direccion || '',
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar cliente',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [compras] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM ventas
      WHERE id_cliente = ?
      `,
      [id]
    );

    if (Number(compras[0].total) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar un cliente con ventas registradas',
      });
    }

    const [result] = await pool.query(
      `
      DELETE FROM clientes
      WHERE id_cliente = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Cliente eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar cliente',
    });
  }
});

module.exports = router;
