// server.js
const express = require('express');
const app = express();
const cors = require('cors');

const materialRoutes = require('./routers/materials');
const productRoutes = require('./routers/products');
const exitRoutes = require('./routers/salida');
const reportRoutes = require("./routers/reports");

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', materialRoutes);
app.use('/api', productRoutes);
app.use('/api', exitRoutes);
app.use('/api', reportRoutes);

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
