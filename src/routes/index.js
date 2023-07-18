const express = require( 'express' );
const router = express.Router();

// Importa los controladores
const authenticationController = require( '../controllers/authenticationController' );
const protectedController = require( '../controllers/protectedController' );
const scanController = require( '../controllers/scanController' );

// Importa los middlewares
const verifyToken = require( '../middlewares/verifyToken' );

// Ruta principal
router.get( '/', ( req, res ) => {
  res.send( 'API is running' );
});

// Rutas de autenticación
router.post( '/login', authenticationController.login );

// Ruta protegida que requiere autenticación
router.get( '/protected', verifyToken, protectedController.getProtectedData );

// Ruta para generar y mostrar código QR
router.post( '/scan', scanController.generateQR );

module.exports = router;