const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Configurar la ruta de la base de datos para Render
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/inventorytrack.db'  // Ruta en Render
  : path.join(__dirname, '../database/inventorytrack.db'); // Ruta local

const dbDir = path.dirname(dbPath);

// Crear el directorio si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Función para realizar la migración inicial
function initializeDatabaseSchema(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Crear tabla de materiales si no existe
      db.run(`
        CREATE TABLE IF NOT EXISTS materiales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT UNIQUE NOT NULL
        );
      `);

      // Crear tabla de productos si no existe
      db.run(`
        CREATE TABLE IF NOT EXISTS productos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          material_id INTEGER NOT NULL,
          nombre TEXT NOT NULL,
          FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE CASCADE
        );
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Conectar a la base de datos SQLite
const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('❌ Error al conectar con SQLite:', err.message);
    return;
  }
  
  console.log('✅ Conectado a la base de datos SQLite');
  
  try {
    await initializeDatabaseSchema(db);
    console.log('✅ Esquema de base de datos verificado y actualizado');
  } catch (error) {
    console.error('❌ Error al inicializar el esquema:', error);
  }
});

module.exports = db;