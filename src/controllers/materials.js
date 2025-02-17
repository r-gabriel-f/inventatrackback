const db = require('../db');

// GET: Obtener todos los materiales con status = 1
const getMaterials = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM materiales WHERE status = 1');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener materiales' });
  }
};

// POST: Crear un nuevo material con status = 1 por defecto
const createMaterial = async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO materiales (nombre, status) VALUES ($1, 1) RETURNING *',
      [nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear material' });
  }
};

// DELETE: Eliminar un material (borrado lógico, cambia status a 0 en lugar de eliminar)
const deleteMaterial = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE materiales SET status = 0 WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar material' });
  }
};

// UPDATE: Actualizar un material (permitiendo cambiar nombre y status)
const updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { nombre, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE materiales SET nombre = $1, status = $2 WHERE id = $3 RETURNING *',
      [nombre, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar material' });
  }
};

module.exports = {
  getMaterials,
  createMaterial,
  deleteMaterial,
  updateMaterial
};
