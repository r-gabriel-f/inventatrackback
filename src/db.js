const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear conexión a la base de datos SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'), (err) => {
  if (err) {
    console.error('Error al conectar a SQLite:', err.message);
  } else {
    console.log('Conexión exitosa a SQLite');
    
    // Crear las tablas si no existen
    db.serialize(() => {
      // Tabla materiales
      db.run(`CREATE TABLE IF NOT EXISTS materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        status INTEGER DEFAULT 1
      )`);

      // Tabla productos
      db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        unidad TEXT,
        FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE CASCADE
      )`);

      // Tabla salidas
      db.run(`CREATE TABLE IF NOT EXISTS salidas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        nivel TEXT NOT NULL,
        responsable_nombre TEXT NOT NULL,
        fecha_salida TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
        cantidad INTEGER,
        rumpero TEXT,
        trabajador TEXT,
        codigo TEXT,
        status INTEGER DEFAULT 1,
        FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
      )`);
    });
  }
});

// Convertir métodos de callback a promesas
db.query = function (sql, params) {
  return new Promise((resolve, reject) => {
    if (params) {
      this.all(sql, params, (err, rows) => {
        if (err) reject(err);
        resolve({ rows });
      });
    } else {
      this.all(sql, (err, rows) => {
        if (err) reject(err);
        resolve({ rows });
      });
    }
  });
};

module.exports = db;
