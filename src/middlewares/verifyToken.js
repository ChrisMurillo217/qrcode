const jwt = require( 'jsonwebtoken' );

module.exports = ( req, res, next ) => {
    const token = req.headers['authorization'];

    if ( token ) {
        jwt.verify( token, 'secret_key', ( err, decoded ) => {
            if ( err ) {
                res.status( 401 ).json( { error: 'Token inválido' } );
            } else {
                req.user = decoded; // Decodifica el token y agrega los datos del usuario al objeto de solicitud (req)
                next();
            }
        });
    } else {
        res.status( 401 ).json( { error: 'Acceso no autorizado' } );
    }
};