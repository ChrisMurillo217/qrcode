const express = require( 'express' );
const cors = require( 'cors' );
const { Connection } = require( 'tedious' );

const config = require( './dbConfig' );

const app = express();
const port = process.env.PORT || 3000;

app.use( cors() );
app.use( express.json() );
app.use( express.urlencoded({ extended: false }) );

// Importa las rutas
const routes = require( './src/routes' );

// Configuración de la BD
const connection = new Connection( config );

connection.connect();

connection.on( 'connect', function ( err ) {
    if ( err ) {
        console.error( 'Error al conectar a la BD:', err.message );
        console.log( err );
        throw err;
    }

    app.use( '/api', routes );

    app.listen( port, console.log( `Listening on port ${port}` ) );
});
