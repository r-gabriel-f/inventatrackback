const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports");

router.get("/reporte-dia", reportsController.generateReport);
router.get('/reportes/mensual/:yearMonth', reportsController.generateMonthlyReport);

module.exports = router;
