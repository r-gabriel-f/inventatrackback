const { Client } = require("pg");
const client = new Client({
  host: "localhost",
  port: 5432,
  user: "robert",
  password: "10475442",
  database: "inventorymaterial",
});

// Conectar a la base de datos
client
  .connect()
  .then(() => console.log("Conexión exitosa a PostgreSQL"))
  .catch((err) => console.error("Error de conexión a PostgreSQL", err.stack));

module.exports = client;
