const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports");

router.get("/reporte-dia", reportsController.generateReport);
router.get('/reportes/mensual/:yearMonth', reportsController.generateMonthlyReport);
router.get('/reportes/mensual-total/:yearMonth', reportsController.generateMonthlyReportTotal);
router.get('/reportes/mensual/:yearMonth/:nivel', reportsController.generateMonthlyLevelReport);
router.get('/reportes/mensual-total/:yearMonth/:nivel', reportsController.generateMonthlyLevelReportTotal);

module.exports = router;
