const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        v.id_venta,
        v.id_cliente,
        v.total,
        v.fecha,
        v.estado,
        v.fecha_anulacion,
        v.motivo_anulacion,
        COALESCE(c.nombre, 'Cliente no registrado') AS cliente,
        COALESCE(c.telefono, '') AS telefono,
        COALESCE(c.email, '') AS email,
        COALESCE(SUM(dv.cantidad), 0) AS unidades,
        COUNT(dv.id_venta) AS lineas
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      GROUP BY
        v.id_venta,
        v.id_cliente,
        v.total,
        v.fecha,
        v.estado,
        v.fecha_anulacion,
        v.motivo_anulacion,
        c.nombre,
        c.telefono,
        c.email
      ORDER BY v.fecha DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener ventas',
    });
  }
});

router.post('/', async (req, res) => {
  const { id_cliente, detalles } = req.body;

  if (!id_cliente) {
    return res.status(400).json({
      success: false,
      message: 'Selecciona un cliente',
    });
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Agrega al menos un producto a la venta',
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let total = 0;
    const detallesProcesados = [];

    for (const item of detalles) {
      const idInventario = Number(item.id_inventario);
      const cantidad = Number(item.cantidad);
      const precioUnitarioEnviado = Number(item.precio_unitario);

      if (!idInventario || !cantidad || cantidad <= 0) {
        throw new Error('Cada producto debe tener inventario y cantidad válida');
      }

      const [inventarioRows] = await conn.query(
        `
        SELECT
          i.id_inventario,
          i.stock,
          p.nombre AS producto,
          p.precio AS precio
        FROM inventario i
        JOIN productos p ON i.id_producto = p.id_producto
        WHERE i.id_inventario = ?
        FOR UPDATE
        `,
        [idInventario]
      );

      if (inventarioRows.length === 0) {
        throw new Error('Uno de los productos seleccionados no existe en inventario');
      }

      const inventario = inventarioRows[0];

      if (Number(inventario.stock) < cantidad) {
        throw new Error(`Stock insuficiente para ${inventario.producto}. Disponible: ${inventario.stock}`);
      }

      const precioUnitario = precioUnitarioEnviado > 0
        ? precioUnitarioEnviado
        : Number(inventario.precio);

      if (!precioUnitario || precioUnitario <= 0) {
        throw new Error(`Precio inválido para ${inventario.producto}`);
      }

      total += cantidad * precioUnitario;

      detallesProcesados.push({
        id_inventario: idInventario,
        cantidad,
        precio_unitario: precioUnitario,
      });
    }

    const [ventaResult] = await conn.query(
      `
      INSERT INTO ventas
        (id_cliente, total, estado)
      VALUES
        (?, ?, 'activa')
      `,
      [id_cliente, total]
    );

    const idVenta = ventaResult.insertId;

    for (const detalle of detallesProcesados) {
      await conn.query(
        `
        INSERT INTO detalle_ventas
          (id_venta, id_inventario, cantidad, precio_unitario)
        VALUES
          (?, ?, ?, ?)
        `,
        [
          idVenta,
          detalle.id_inventario,
          detalle.cantidad,
          detalle.precio_unitario,
        ]
      );

      await conn.query(
        `
        UPDATE inventario
        SET stock = stock - ?
        WHERE id_inventario = ?
        `,
        [
          detalle.cantidad,
          detalle.id_inventario,
        ]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Venta registrada correctamente',
      id_venta: idVenta,
      total,
    });
  } catch (error) {
    await conn.rollback();

    console.error('Error al crear venta:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear venta',
    });
  } finally {
    conn.release();
  }
});

router.post('/:id/anular', async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [ventaRows] = await conn.query(
      `
      SELECT id_venta, estado
      FROM ventas
      WHERE id_venta = ?
      FOR UPDATE
      `,
      [id]
    );

    if (ventaRows.length === 0) {
      throw new Error('Venta no encontrada');
    }

    const venta = ventaRows[0];

    if (venta.estado === 'anulada') {
      throw new Error('Esta venta ya fue anulada');
    }

    const [detalles] = await conn.query(
      `
      SELECT id_inventario, cantidad
      FROM detalle_ventas
      WHERE id_venta = ?
      `,
      [id]
    );

    for (const detalle of detalles) {
      await conn.query(
        `
        UPDATE inventario
        SET stock = stock + ?
        WHERE id_inventario = ?
        `,
        [
          detalle.cantidad,
          detalle.id_inventario,
        ]
      );
    }

    await conn.query(
      `
      UPDATE ventas
      SET
        estado = 'anulada',
        fecha_anulacion = NOW(),
        motivo_anulacion = ?
      WHERE id_venta = ?
      `,
      [
        motivo || 'Venta anulada desde el sistema',
        id,
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: 'Venta anulada correctamente y stock devuelto',
    });
  } catch (error) {
    await conn.rollback();

    console.error('Error al anular venta:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al anular venta',
    });
  } finally {
    conn.release();
  }
});

router.get('/:id/detalles', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        dv.id_venta,
        dv.id_inventario,
        dv.cantidad,
        dv.precio_unitario,
        (dv.cantidad * dv.precio_unitario) AS subtotal,
        p.nombre AS producto,
        p.marca AS marca,
        COALESCE(p.imagen_url, '') AS imagen_url,
        t.nombre_talla AS talla,
        i.color
      FROM detalle_ventas dv
      JOIN inventario i ON dv.id_inventario = i.id_inventario
      JOIN productos p ON i.id_producto = p.id_producto
      JOIN tallas t ON i.id_talla = t.id_talla
      WHERE dv.id_venta = ?
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener detalle de venta:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener detalle de venta',
    });
  }
});

module.exports = router;
