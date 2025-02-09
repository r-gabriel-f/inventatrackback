const db = require('../db');

// GET: Obtener todos los materiales
const getMaterials = (req, res) => {
  db.all('SELECT * FROM materiales', [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener materiales' });
      return;
    }
    res.json(rows);
  });
};

// POST: Crear un nuevo material
const createMaterial = (req, res) => {
  const { nombre } = req.body;
  db.run('INSERT INTO materiales (nombre) VALUES (?)', [nombre], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear material' });
      return;
    }
    res.status(201).json({ id: this.lastID, nombre });
  });
};

// DELETE: Eliminar un material
const deleteMaterial = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM materiales WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al eliminar material' });
      return;
    }
    res.status(204).send();
  });
};

// UPDATE: Actualizar un material
const updateMaterial = (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  db.run('UPDATE materiales SET nombre = ? WHERE id = ?', [nombre, id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar material' });
      return;
    }
    res.json({ id, nombre });
  });
};

module.exports = {
  getMaterials,
  createMaterial,
  deleteMaterial,
  updateMaterial
};
