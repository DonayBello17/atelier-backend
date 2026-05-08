const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'atelier_secret_dev';

function crearToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      rol: usuario.rol,
    },
    JWT_SECRET,
    {
      expiresIn: '8h',
    }
  );
}

async function compararPassword(passwordIngresado, passwordGuardado) {
  if (!passwordGuardado) return false;

  const passwordString = String(passwordGuardado);

  if (passwordString.startsWith('$2')) {
    return bcrypt.compare(passwordIngresado, passwordString);
  }

  return passwordIngresado === passwordString;
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios',
      });
    }

    const [usuarios] = await pool.query(
      `
      SELECT
        id_usuario,
        nombre,
        email,
        password,
        rol
      FROM usuarios
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    const usuario = usuarios[0];

    const passwordCorrecto = await compararPassword(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos',
      });
    }

    let id_cliente = null;

    if (usuario.rol === 'cliente') {
      const [clientes] = await pool.query(
        `
        SELECT id_cliente
        FROM clientes
        WHERE email = ?
        LIMIT 1
        `,
        [usuario.email]
      );

      id_cliente = clientes[0]?.id_cliente || null;
    }

    const usuarioRespuesta = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      id_cliente,
    };

    res.json({
      success: true,
      ok: true,
      message: 'Inicio de sesión correcto',
      token: crearToken(usuario),
      usuario: usuarioRespuesta,
      user: usuarioRespuesta,
    });
  } catch (error) {
    console.error('Error en login:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al iniciar sesión',
    });
  }
});

router.post('/register', async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { nombre, email, password, confirmarPassword } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son obligatorios',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    if (confirmarPassword && password !== confirmarPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden',
      });
    }

    await conn.beginTransaction();

    const [existente] = await conn.query(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (existente.length > 0) {
      throw new Error('Ya existe una cuenta con este email');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [usuarioResult] = await conn.query(
      `
      INSERT INTO usuarios
        (nombre, email, password, rol)
      VALUES
        (?, ?, ?, 'cliente')
      `,
      [
        nombre.trim(),
        email.trim(),
        passwordHash,
      ]
    );

    let idCliente = null;

    const [clienteExistente] = await conn.query(
      `
      SELECT id_cliente
      FROM clientes
      WHERE email = ?
      LIMIT 1
      `,
      [email.trim()]
    );

    if (clienteExistente.length > 0) {
      idCliente = clienteExistente[0].id_cliente;

      await conn.query(
        `
        UPDATE clientes
        SET
          nombre = ?,
          estado = 'activo'
        WHERE id_cliente = ?
        `,
        [
          nombre.trim(),
          idCliente,
        ]
      );
    } else {
      const [clienteResult] = await conn.query(
        `
        INSERT INTO clientes
          (nombre, telefono, email, direccion, estado)
        VALUES
          (?, '', ?, '', 'activo')
        `,
        [
          nombre.trim(),
          email.trim(),
        ]
      );

      idCliente = clienteResult.insertId;
    }

    await conn.commit();

    const usuarioRespuesta = {
      id_usuario: usuarioResult.insertId,
      nombre: nombre.trim(),
      email: email.trim(),
      rol: 'cliente',
      id_cliente: idCliente,
    };

    res.status(201).json({
      success: true,
      ok: true,
      message: 'Cuenta creada correctamente',
      token: crearToken(usuarioRespuesta),
      usuario: usuarioRespuesta,
      user: usuarioRespuesta,
    });
  } catch (error) {
    await conn.rollback();

    console.error('Error en registro:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear cuenta',
    });
  } finally {
    conn.release();
  }
});

module.exports = router;
