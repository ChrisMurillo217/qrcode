const bcrypt = require( 'bcrypt' );
const jwt = require( 'jsonwebtoken' );
const { Request } = require( 'tedious' );
const { Connection } = require( 'tedious' );

const config = require( '../../dbConfig' );

// Importa la función isValidPassword de passwordUtils.js
const { isValidPassword } = require( './passwordUtils' );

// Crear y exportar los controladores
exports.login = ( req, res ) => {
    const { username, password } = req.body;
    
    // Configuración de la BD
    const connection = new Connection( config );
    connection.connect(); // Establece la conexión a la BD

    connection.on( 'connect', function ( err ) {
        if ( err ) {
            console.error( 'Error al conectar a la BD:', err.message );
            console.log( err );
            throw err;
        }

        const request = new Request(
            `SELECT * FROM Users WHERE username = '${username}'`,
            
            ( err, rowCount ) => {
                if ( err ) {
                    res.status( 500 ).json({ error: 'Algo salió mal con la consulta a la BD' });
                    console.log( err );
                } else if ( rowCount === 0 ) {
                    res.status( 401 ).json({ error: 'Credenciales inválidas' });
                }
            });

            const rows = [];
            
            request.on( 'row', columns => {
                const row = {};
                columns.forEach( column => {
                    row[column.metadata.colName] = column.value;
                });
                rows.push( row );
            });   
            
            request.on( 'doneInProc', ( rowCount, more ) => {
                const user = rows[0];
                if ( rowCount === 0 || isValidPassword( user.password, password ) ) {
                    res.status( 500 ).json( { error: 'No se encontró la contraseña del usuario' } );
                } else {
                    bcrypt.compare( user.password, password, ( err, same ) => {
                        console.log( user, password, err, same );
                        if ( err ) {
                            res.status( 500 ).json( { error: 'Algo salió mal al verificar la contraseña' } );
                        } else if ( same ) {
                            const token = jwt.sign( { id: user.id, email: user.email }, 'secret_key' );
                            
                            res.json({ token });
                        } else {
                            res.status( 401 ).json( { error: 'Credenciales incorrectas' } );
                        }
                    });
                }
            }
        );
        connection.execSql( request );
    });
};
