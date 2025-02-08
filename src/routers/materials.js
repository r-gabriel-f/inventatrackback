const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materials');

router.get('/materials', materialController.getMaterials);
router.post('/materials', materialController.createMaterial);
router.delete('/materials/:id', materialController.deleteMaterial);
router.put('/materials/:id', materialController.updateMaterial);

module.exports = router;
