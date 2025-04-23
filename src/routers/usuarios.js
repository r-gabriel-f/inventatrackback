const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios');

router.get('/usuarios', usuariosController.getUsuarios);
router.post('/usuarios', usuariosController.createUsuario);
router.delete('/usuarios/:id', usuariosController.deleteUsuario);
router.put('/usuarios/:id', usuariosController.updateUsuario);

module.exports = router;
