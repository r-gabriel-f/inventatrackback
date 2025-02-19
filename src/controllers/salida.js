const db = require("../db");
const moment = require("moment");
// GET: Obtener todas las salidas
const getSalidas = async (req, res) => {
  try {
    const { todas } = req.query; // Recibir parámetro desde el frontend
    const fechaHoy = moment().format('YYYY-MM-DD'); // Obtener la fecha actual

    let query = `
      SELECT s.id, s.codigo, m.nombre AS material, p.nombre AS producto, p.unidad, 
             s.cantidad, s.rumpero, s.nivel, s.responsable_nombre, s.trabajador, s.fecha_salida, s.status
      FROM salidas s 
      JOIN materiales m ON s.material_id = m.id 
      JOIN productos p ON s.producto_id = p.id 
      WHERE m.status = 1 AND s.status = 1`; // Filtrar solo materiales activos

    if (!todas || todas === "false") {
      query += ` AND DATE(s.fecha_salida) = $1`; // Usar parámetro para la fecha
      const result = await db.query(query, [fechaHoy]);
      res.json(result.rows);
    } else {
      const result = await db.query(query);
      res.json(result.rows);
    }
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
      `SELECT s.id, s.codigo, m.nombre AS material, p.nombre AS producto, p.unidad, 
              s.cantidad, s.rumpero, s.nivel, s.responsable_nombre, s.trabajador, s.fecha_salida, s.status,
              s.material_id, s.producto_id
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id
       WHERE s.id = ?
`,
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
  const {
    material_id,
    producto_id,
    nivel,
    responsable_nombre,
    cantidad,
    rumpero,
    trabajador,
  } = req.body;
  try {
    // Insertar la salida con el valor de status = 1 por defecto
    const result = await db.query(
      `INSERT INTO salidas (material_id, producto_id, nivel, responsable_nombre, cantidad, rumpero, trabajador, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        material_id,
        producto_id,
        nivel,
        responsable_nombre,
        cantidad,
        rumpero,
        trabajador,
      ]
    );

    const lastIdResult = await db.query('SELECT last_insert_rowid() as id');
    const salidaId = lastIdResult.rows[0].id;

    // Obtener las primeras 3 letras del material
    const materialResult = await db.query(
      `SELECT lower(substr(nombre, 1, 3)) AS codigo_material FROM materiales WHERE id = ?`,
      [material_id]
    );

    if (materialResult.rows.length === 0) {
      return res.status(400).json({ message: "Material no encontrado" });
    }

    const codigo = `${materialResult.rows[0].codigo_material}${salidaId}`;

    // Actualizar la salida con el código generado
    await db.query(`UPDATE salidas SET codigo = ? WHERE id = ?`, [
      codigo,
      salidaId,
    ]);

    // Obtener la salida con el código generado
    const salidaCompleta = await db.query(
      `SELECT * FROM salidas WHERE id = ?`,
      [salidaId]
    );

    res.status(201).json(salidaCompleta.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear salida" });
  }
};

// PUT: Actualizar una salida
const updateSalida = async (req, res) => {
  const { id } = req.params;
  const {
    material_id,
    producto_id,
    nivel,
    responsable_nombre,
    cantidad,
    rumpero,
    trabajador,
    status,
  } = req.body; // Desestructuramos 'status' también
  try {
    // Actualizar la salida incluyendo 'status'
    const result = await db.query(
      `UPDATE salidas 
       SET material_id = ?, producto_id = ?, nivel = ?, responsable_nombre = ?, cantidad = ?, rumpero = ?, trabajador = ?, status = ?
       WHERE id = ?`,
      [
        material_id,
        producto_id,
        nivel,
        responsable_nombre,
        cantidad,
        rumpero,
        trabajador,
        status,
        id,
      ] // Agregamos 'status' en la lista de parámetros
    );

    const checkResult = await db.query('SELECT * FROM salidas WHERE id = ?', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }

    // Obtener las primeras 3 letras del material
    const materialResult = await db.query(
      `SELECT lower(substr(nombre, 1, 3)) AS codigo_material FROM materiales WHERE id = ?`,
      [material_id]
    );

    if (materialResult.rows.length === 0) {
      return res.status(400).json({ message: "Material no encontrado" });
    }

    const codigo = `${materialResult.rows[0].codigo_material}${id}`;

    // Actualizar el código
    await db.query(`UPDATE salidas SET codigo = ? WHERE id = ?`, [
      codigo,
      id,
    ]);

    // Obtener la salida actualizada
    const salidaActualizada = await db.query(
      `SELECT * FROM salidas WHERE id = ?`,
      [id]
    );

    res.json(salidaActualizada.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar salida" });
  }
};

// DELETE: Eliminar una salida
const deleteSalida = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM salidas WHERE id = ?",
      [id]
    );
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
