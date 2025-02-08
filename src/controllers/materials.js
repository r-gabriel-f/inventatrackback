const db = require('../db');

// GET: Obtener todos los materiales
const getMaterials = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM materiales');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener materiales' });
  }
};

// POST: Crear un nuevo material
const createMaterial = async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await db.query('INSERT INTO materiales (nombre) VALUES ($1) RETURNING *', [nombre]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear material' });
  }
};

// DELETE: Eliminar un material
const deleteMaterial = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM materiales WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar material' });
  }
};

// UPDATE: Actualizar un material
const updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    const result = await db.query('UPDATE materiales SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);
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
