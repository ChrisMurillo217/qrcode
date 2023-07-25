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

// Ruta para obtener las opciones de registro
router.get( '/options', authenticationController.getOptions );

// Ruta para registrar nuevos usuarios
router.post( '/register', authenticationController.register );

// Ruta protegida que requiere autenticación
router.get( '/protected', verifyToken, protectedController.getProtectedData );

// Ruta para obtener la lista de usuarios
router.get( '/users', authenticationController.getUsers );

// Ruta para eliminar un usuario por su ID
router.delete( '/users/:id', authenticationController.deleteUser );

// Ruta para actualizar un usuario por su ID
router.put( '/users/:id', authenticationController.updateUser );

// Ruta para generar y mostrar código QR
router.post( '/scan', scanController.generateQR );

module.exports = router;