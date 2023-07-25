const jwt = require( 'jsonwebtoken' );
const { Request } = require( 'tedious' );
const { Connection } = require( 'tedious' );
const crypto = require( 'crypto' );

const config = require( '../../dbConfig' );

function encryptPassword( password ) {
    const hashedPassword = crypto.createHash( 'sha256' ).update( password ).digest( 'hex' );
    return hashedPassword;
}

function decryptPassword( encryptedPassword ) {
    return encryptedPassword;
}

// Exportar el controlador para inicio de sesión
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
                    res.status( 500 ).json( { error: 'Algo salió mal con la consulta a la BD' } );
                    console.log( err );
                } else if ( rowCount === 0 ) {
                    connection.close(); // Cierra la conexión después de completar la consulta
                    res.status( 401 ).json( { error: 'Credenciales incorrectas' } );
                }
            });

            const rows = [];
            
            request.on( 'row', ( columns ) => {
                const row = {};
                columns.forEach( ( column ) => {
                    row[column.metadata.colName] = column.value;
                });
                rows.push( row );
            });   
            
            request.on( 'doneInProc', ( ) => {
                const user = rows[0];

                // Si el usuario y la contraseña son válidos, entonces emite un token JWT
                if ( username === user.username && encryptPassword( password ) === decryptPassword( user.password ) ) {
                    const payload = {
                        username: username
                    };
                
                    const token = jwt.sign( payload, 'your_secret_key', { expiresIn: '1h' } );
                    res.json( { token } );
                } else {
                    res.status( 401 ).json( { message: 'Credenciales inválidas' } );
                }
            }
        );
        connection.execSql( request );
    });
};

// Exportar el controlador para registrar un usuario
exports.register = ( req, res ) => {
    const { name, username, password, mail, id_area, id_role } = req.body;

    const connection = new Connection( config );
    connection.connect();

    connection.on( 'connect', function ( err ) {
        if ( err ) {
            console.error( 'Error al conectar a la BD:', err.message );
            console.log( err );
            throw err;
        }

        const request = new Request(
            `INSERT INTO Users (name, username, password, mail, id_area, id_role) VALUES ('${name}', '${username}', '${password}', '${mail}', ${id_area || 'NULL'}, ${id_role || 'NULL'})`,
            ( err, rowCount ) => {
                if ( err ) {
                    console.error( 'Error al registrar el usuario:', err.message );
                    res.status( 500 ).json( { error: 'Algo salió mal al registrar el usuario' } );
                } else {
                    connection.close(); // Cierra la conexión después de completar la consulta
                    res.json( { message: 'Usuario registrado exitosamente' } );
                }
            }
        );

        connection.execSql( request );
    });
};

// Obtener opciones para id_role e id_area
exports.getOptions = ( req, res ) => {
    const options = {};

    const connection = new Connection( config );
    connection.connect();
  
    connection.on( 'connect', function ( err ) {
        if ( err ) {
            console.error( 'Error al conectar a la BD:', err.message );
            console.log( err );
            throw err;
        }
    
        const roleRequest = new Request(
            `SELECT id_role, rolename FROM Rol`,
            ( err, rowCount ) => {
                if ( err ) {
                    console.error( 'Error en la consulta de roles:', err.message );
                    res.status( 500 ).json( { error: 'Algo salió mal al obtener roles' } );
                }
            }
        );
    
        const areaRequest = new Request(
            `SELECT id_area, areaname FROM Area`,
            ( err, rowCount ) => {
                if ( err ) {
                    console.error( 'Error en la consulta de áreas:', err.message );
                    res.status( 500 ).json( { error: 'Algo salió mal al obtener áreas' } );
                } else {
                    const roles = [];
                    const areas = [];
                
                    roleRequest.on( 'row', columns => {
                        const role = {};
                        columns.forEach(column => {
                            role[column.metadata.colName] = column.value;
                        });
                        roles.push( role );
                    });
                
                    areaRequest.on( 'row', columns => {
                        const area = {};
                        columns.forEach(column => {
                            area[column.metadata.colName] = column.value;
                        });
                        areas.push( area );
                    });

                    areaRequest.on('doneInProc', () => {
                        connection.close();
                        res.json({
                            roles: roles,
                            areas: areas
                        });
                    });

                    connection.execSql( areaRequest );
                }
            }
        );
    
        connection.execSql( roleRequest );
    });
};

// Obtener la lista de usuarios
exports.getUsers = ( req, res ) => {
    const connection = new Connection( config );
    connection.connect();

    connection.on( 'connect', function( err ) {
        if ( err ) {
            console.error( 'Error al conectar a la BD:', err.message );
            console.log( err );
            throw err;
        }
        const request = new Request(
            `SELECT * FROM Users`,
            ( err, rowCount ) => {
                if ( err ) {
                    console.error( 'Error al obtener la lista de usuarios:', err.message );
                    res.status( 500 ).json( { error: 'Algo salió mal al obtener la lista de usuarios' } );
                } else {
                    connection.close();
                }
            }
        );

        const users = [];

        request.on( 'row', ( columns ) => {
            const user = {};
            columns.forEach( ( column ) => {
                user[column.metadata.colName] = column.value;
            });
            users.push( user );
        });

        request.on( 'doneInProc', () => {
            res.json( users );
        });

        connection.execSql( request );
    });
};

// Eliminar un usuario por su ID
exports.deleteUser = ( req, res ) => {
    const { id } = req.params;

    const connection = new Connection( config );

    const connectPromise = new Promise((resolve, reject) => {
        connection.on('connect', (err) => {
            if (err) {
                console.error('Error al conectar a la BD:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
        connection.connect();
    });

    connectPromise.then(() => {
        // Ahora que la conexión está establecida, creamos y ejecutamos la consulta para eliminar el usuario
        const request = new Request(
            `DELETE FROM Users WHERE id_user = ${id}`,
            ( err, rowCount ) => {
                if ( err ) {
                    console.error( 'Error al eliminar el usuario:', err.message );
                    res.status( 500 ).json( { error: 'Algo salió mal al eliminar el usuario' } );
                } else {
                    connection.close();
                    res.json( { message: 'Usuario eliminado exitosamente' } );
                }
            }
        );

        connection.execSql( request );
    }).catch( ( err ) => {
        res.status( 500 ).json( { error: 'Error al conectar a la base de datos' } );
    });
};

// Exportar el controlador para actualizar un usuario por su ID
exports.updateUser = ( req, res ) => {
    // Recoger los parametros del front
    const { id } = req.params;
    const { name, password, mail, id_area, id_role } = req.body;
    
    const connection = new Connection( config );
    connection.connect();
    
    connection.on( 'connect', function ( err ) {
        if ( err ) {
            console.error( 'Error al conectar a la BD:', err.message );
            console.log( err );
            throw err;
        }
        
        const getUserQuery = `SELECT * FROM Users WHERE id_user = ${id}`; // Obtiene el usuario actual
        
        const request = new Request( getUserQuery, ( err, rowCount ) => {
            if ( err ) {
                console.error( 'Error al obtener el usuario:', err.message );
                res.status( 500 ).json( { error: 'Algo salió mal al obtener el usuario' } );
            } else if ( rowCount === 0 ) {
                connection.close();
                res.status( 404 ).json( { error: 'No se encontró un usuario con el ID proporcionado' } );
            }
        });

        const updateUserQuery = `UPDATE Users
        SET name = '${name}',
            mail = '${mail}',
            id_area = ${id_area},
            id_role = ${id_role}
        WHERE id_user = ${id}
        `;
        
        request.on( 'doneInProc', () => {
            connection.execSql( new Request( updateUserQuery, ( err, rowCount ) => {
                if ( err ) {
                    console.error( 'Error al actualizar el usuario:', err.message );
                    res.status( 500 ).json( { error: 'Algo salió mal al actualizar el usuario' } );
                } else {
                    connection.close();
                    res.json( { message: 'Usuario actualizado exitosamente' } );
                }
            }));
        });
    
        connection.execSql( request );
    });
};