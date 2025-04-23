const db = require('../db');

// GET: Obtener todos los niveles con status = 1
const getNiveles = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM niveles WHERE status = 1');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener niveles' });
  }
};

// POST: Crear un nuevo nivel con status = 1 por defecto
const createNivel = async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO niveles (nombre, status) VALUES (?, 1)',
      [nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear nivel' });
  }
};

// DELETE: Eliminar un nivel (borrado lógico, cambia status a 0 en lugar de eliminar)
const deleteNivel = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE niveles SET status = 0 WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar nivel' });
  }
};

// UPDATE: Actualizar un nivel (permitiendo cambiar nombre)
const updateNivel = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    const result = await db.query(
      'UPDATE niveles SET nombre = ? WHERE id = ?',
      [nombre, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar nivel' });
  }
};

module.exports = {
  getNiveles,
  createNivel,
  deleteNivel,
  updateNivel
};
