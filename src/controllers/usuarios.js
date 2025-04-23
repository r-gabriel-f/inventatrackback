const db = require('../db');

// GET: Obtener todos los usuarios con status = 1
const getUsuarios = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM usuarios WHERE status = 1');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// POST: Crear un nuevo usuario con status = 1 por defecto
const createUsuario = async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO usuarios (nombre, status) VALUES (?, 1)',
      [nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// DELETE: Eliminar un usuario (borrado lógico, cambia status a 0 en lugar de eliminar)
const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE usuarios SET status = 0 WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

// UPDATE: Actualizar un usuario (permitiendo cambiar nombre)
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    const result = await db.query(
      'UPDATE usuarios SET nombre = ? WHERE id = ?',
      [nombre, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  deleteUsuario,
  updateUsuario
};
