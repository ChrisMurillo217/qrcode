const bcrypt = require( 'bcrypt' );

// Función para comprobar si la contraseña proporcionada coincide con el hash almacenado
function isValidPassword( storedHash, password ) {
    return bcrypt.compareSync( password, storedHash );
}

module.exports = {
    isValidPassword,
};
