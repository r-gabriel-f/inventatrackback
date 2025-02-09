const express = require("express");
const router = express.Router();
const salidasController = require("../controllers/salida");

router.get("/exit", salidasController.getSalidas);
router.get("/exit/:id", salidasController.getSalidaById);
router.post("/exit", salidasController.createSalida);
router.put("/exit/:id", salidasController.updateSalida);
router.delete("/exit/:id", salidasController.deleteSalida);

module.exports = router;
