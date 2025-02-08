// server.js
const express = require('express');
const app = express();
const materialRoutes = require('./routers/materials');
const productRoutes = require('./routers/products');

app.use(express.json()); // Middleware para parsear JSON

// Rutas
app.use('/api', materialRoutes);
app.use('/api', productRoutes);

// Iniciar el servidor
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
