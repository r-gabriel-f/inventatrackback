
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,        
  user: process.env.DB_USER || 'robert', 
  password: process.env.DB_PASSWORD || '10475442',
  database: process.env.DB_NAME || 'inventorymaterial'
});

// Conectar a la base de datos
client.connect()
  .then(() => console.log('Conexión exitosa a PostgreSQL'))
  .catch(err => console.error('Error de conexión a PostgreSQL', err.stack));

module.exports = client;
