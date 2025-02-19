const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Asegurar que el directorio database existe
const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

// Crear conexión a la base de datos SQLite
const db = new Database(path.join(process.cwd(), 'database/database.sqlite'));

console.log('Conexión exitosa a SQLite');

// Crear las tablas si no existen
db.exec(`CREATE TABLE IF NOT EXISTS materiales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    status INTEGER DEFAULT 1
)`);

db.exec(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    unidad TEXT,
    FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE CASCADE
)`);

db.exec(`CREATE TABLE IF NOT EXISTS salidas (
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

// Agregar método query para mantener compatibilidad con el código existente
db.query = function (sql, params = []) {
    try {
        const stmt = this.prepare(sql);
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
            const result = stmt.run(...params);
            return Promise.resolve({ 
                rows: [{ id: result.lastInsertRowid }] 
            });
        } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
            const result = stmt.run(...params);
            return Promise.resolve({ 
                rows: result.changes > 0 ? [{ id: params[params.length - 1] }] : [] 
            });
        } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
            const result = stmt.run(...params);
            return Promise.resolve({ 
                rows: result.changes > 0 ? [{ changes: result.changes }] : [] 
            });
        } else {
            const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
            return Promise.resolve({ rows });
        }
    } catch (err) {
        console.error('Error en query:', err);
        return Promise.reject(err);
    }
};

module.exports = db;
