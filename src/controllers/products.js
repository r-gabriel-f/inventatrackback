const db = require('../db');

// GET: Obtener todos los productos
const getProducts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

// POST: Crear un nuevo producto
const createProduct = async (req, res) => {
  const { material_id, nombre, unidad } = req.body;  // Añadido unidad
  try {
    const result = await db.query(
      'INSERT INTO productos (material_id, nombre, unidad) VALUES ($1, $2, $3) RETURNING *',
      [material_id, nombre, unidad]  // Añadido unidad
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

// DELETE: Eliminar un producto
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM productos WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

// UPDATE: Actualizar un producto
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { material_id, nombre, unidad } = req.body;  // Añadido unidad
  try {
    const result = await db.query(
      'UPDATE productos SET material_id = $1, nombre = $2, unidad = $3 WHERE id = $4 RETURNING *',
      [material_id, nombre, unidad, id]  // Añadido unidad
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct
};
