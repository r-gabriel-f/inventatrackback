const db = require('../db');

// GET: Obtener todos los productos
const getProducts = (req, res) => {
  db.all('SELECT * FROM productos', [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener productos' });
      return;
    }
    res.json(rows);
  });
};

// POST: Crear un nuevo producto
const createProduct = (req, res) => {
  const { material_id, nombre } = req.body;
  db.run('INSERT INTO productos (material_id, nombre) VALUES (?, ?)', [material_id, nombre], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear producto' });
      return;
    }
    res.status(201).json({ id: this.lastID, material_id, nombre });
  });
};

// DELETE: Eliminar un producto
const deleteProduct = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM productos WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al eliminar producto' });
      return;
    }
    res.status(204).send();
  });
};

// UPDATE: Actualizar un producto
const updateProduct = (req, res) => {
  const { id } = req.params;
  const { material_id, nombre } = req.body;
  db.run('UPDATE productos SET material_id = ?, nombre = ? WHERE id = ?', [material_id, nombre, id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar producto' });
      return;
    }
    res.json({ id, material_id, nombre });
  });
};

module.exports = {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct
};
