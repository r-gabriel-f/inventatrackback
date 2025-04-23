const express = require('express');
const router = express.Router();
const nivelesController = require('../controllers/niveles');

router.get('/niveles', nivelesController.getNiveles);
router.post('/niveles', nivelesController.createNivel);
router.delete('/niveles/:id', nivelesController.deleteNivel);
router.put('/niveles/:id', nivelesController.updateNivel);

module.exports = router;
