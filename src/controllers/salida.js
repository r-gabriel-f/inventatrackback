const db = require("../db");

// GET: Obtener todas las salidas
const getSalidas = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, s.fecha_salida
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener salidas" });
  }
};

// GET: Obtener una salida por ID
const getSalidaById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT s.id, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, s.fecha_salida
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id
       WHERE s.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener la salida" });
  }
};

// POST: Crear una nueva salida
const createSalida = async (req, res) => {
  const { material_id, producto_id, nivel, responsable_nombre } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO salidas (material_id, producto_id, nivel, responsable_nombre) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [material_id, producto_id, nivel, responsable_nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear salida" });
  }
};

// PUT: Actualizar una salida
const updateSalida = async (req, res) => {
  const { id } = req.params;
  const { material_id, producto_id, nivel, responsable_nombre } = req.body;
  try {
    const result = await db.query(
      `UPDATE salidas SET material_id = $1, producto_id = $2, nivel = $3, responsable_nombre = $4 
       WHERE id = $5 RETURNING *`,
      [material_id, producto_id, nivel, responsable_nombre, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar salida" });
  }
};

// DELETE: Eliminar una salida
const deleteSalida = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM salidas WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }
    res.json({ message: "Salida eliminada exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar salida" });
  }
};

module.exports = {
  getSalidas,
  getSalidaById,
  createSalida,
  updateSalida,
  deleteSalida,
};
