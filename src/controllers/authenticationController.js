const bcrypt = require( 'bcrypt' );
const jwt = require( 'jsonwebtoken' );
const { Request } = require( 'tedious' );
const { Connection } = require( 'tedious' );

const config = require( '../../dbConfig' );

// Crear y exportar los controladores
exports.login = ( req, res ) => {
    const { username, password } = req.body;
    
    // Configuración de la BD
    const connection = new Connection( config );
    connection.connect();

    connection.on( 'connect', function ( err ) {
        if ( err ) {
            console.error( 'Error al conectar a la BD:', err.message );
            console.log( err );
            throw err;
        }

        const request = new Request(
            `SELECT * FROM Users WHERE username = '${username}'`,
            ( err, rowCount, rows ) => {
                if ( err ) {
                    res.status( 500 ).json({ error: 'Algo salió mal con la consulta a la BD' });
                    console.log( err );
                } else if ( rowCount === 0 ) {
                    res.status( 401 ).json({ error: 'Credenciales inválidas' });
                } else {
                    const user = rows[0];

                    bcrypt.compare( password, user.password, ( err, result ) => {
                        if ( err ) {
                            res.status( 500 ).json({ error: 'Algo salió mal al verificar la contraseña' });
                        } else if ( result ) {
                            const token = jwt.sign( { id: user.id, email: user.email }, 'secret_key' );

                            res.json({ token });
                        } else {
                            res.status( 401 ).json( { error: 'Credenciales inválidas' } );
                        }
                    });
                }
            }
        );

        connection.execSql( request );
    });
};
