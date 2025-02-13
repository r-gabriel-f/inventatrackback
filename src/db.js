const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.USERDATA,
  host: process.env.HOST,         
  database: process.env.DATABASE,
  password: process.env.PASSWORD, 
  port: process.env.PORTSDATA,           
});
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar a la base de datos:', err.stack);
  }
  console.log('Conexión exitosa a PostgreSQL');
  release();
});

module.exports = pool;