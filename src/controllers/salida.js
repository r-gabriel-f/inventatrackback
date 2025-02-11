const db = require("../db");

// GET: Obtener todas las salidas
const getSalidas = async (req, res) => {
  try {
    const { todas } = req.query; // Recibir parámetro desde el frontend
    let query = `
      SELECT s.id, m.nombre AS material, p.nombre AS producto, p.unidad, 
             s.cantidad, s.rumpero, s.nivel, s.responsable_nombre, s.trabajador, s.fecha_salida
      FROM salidas s 
      JOIN materiales m ON s.material_id = m.id 
      JOIN productos p ON s.producto_id = p.id`;

    if (!todas || todas === "false") {
      query += ` WHERE DATE(s.fecha_salida) = CURRENT_DATE`; // Solo los de hoy
    }

    const result = await db.query(query);
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
      `SELECT s.id, m.nombre AS material, p.nombre AS producto, p.unidad, s.cantidad, s.rumpero, s.nivel, s.responsable_nombre, s.trabajador, s.fecha_salida
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
  const { material_id, producto_id, nivel, responsable_nombre, cantidad, rumpero, trabajador } = req.body;
  console.log(material_id, producto_id, nivel, responsable_nombre, cantidad, rumpero, trabajador);
  try {
    // Insertar la salida sin la columna 'unidad'
    const result = await db.query(
      `INSERT INTO salidas (material_id, producto_id, nivel, responsable_nombre, cantidad, rumpero, trabajador) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [material_id, producto_id, nivel, responsable_nombre, cantidad, rumpero, trabajador]
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
  const { material_id, producto_id, nivel, responsable_nombre, cantidad, rumpero, trabajador } = req.body;
  try {
    // Actualizar la salida sin la columna 'unidad'
    const result = await db.query(
      `UPDATE salidas SET material_id = $1, producto_id = $2, nivel = $3, responsable_nombre = $4, cantidad = $5, rumpero = $6, trabajador = $7
       WHERE id = $8 RETURNING *`,
      [material_id, producto_id, nivel, responsable_nombre, cantidad, rumpero, trabajador, id]
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
