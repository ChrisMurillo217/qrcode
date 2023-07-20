const express = require( 'express' );
const router = express.Router();

// Importa el modelo y cualquier otro módulo necesario
const User = require( '../models/user' );

// Ruta para obtener todos los usuarios
router.get( '/api/users', async ( req, res ) => {
    try {
        const users = await User.find(); // Suponiendo que estás utilizando Mongoose u otro ORM para acceder a la base de datos
        res.json( users );
    } catch ( error ) {
        console.error( 'Error al obtener los usuarios:', error );
        res.status( 500 ).json( { error: 'Ocurrió un error al obtener los usuarios' } );
    }
});

module.exports = router;
