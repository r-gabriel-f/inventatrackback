const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports");

router.get("/reporte-dia", reportsController.generateReport);
router.get('/reportes/mensual/:yearMonth', reportsController.generateMonthlyReport);
router.get('/reportes/mensual-total/:yearMonth', reportsController.generateMonthlyReportTotal);

module.exports = router;
