const express = require( 'express' );
const cors = require( 'cors' );
const qrcode = require( 'qrcode' );
const Connection = require( 'tedious' ).Connection;
const Request = require( 'tedious' ).Request;

const app = express();
const port = process.env.port || 3000;

app.use( cors() ); // Habilita el middleware cors

// Configuración y conexión a la BD
const config = {
  server: '192.168.20.15',
  authentication: {
    type: 'default',
    options: {
      userName: 'qrcode',
      password: 'Empaq.2023'
    }
  },
  options: {
    port: 1433,
    database: 'pruebasqr',
    trustServerCertificate: true
  }
};

const connection = new Connection( config );  

connection.connect();

connection.on( 'connect', function( err ) {
  if ( err ) {
    console.error( 'Error al conectar a la BD:', err.message );
    console.log( err );
    throw err;
  }

  executeStatement();
});

function executeStatement() {
  // Configuración de la aplicación
  app.use( express.json() );
  app.use( express.urlencoded( { extended: false } ) );
  
  // Ruta principal
  app.get( '/', ( req, res ) => {
    res.send( 'API is running' );
  } );

  // Ruta para generar y mostrar código QR
  app.post( '/scan', ( req, res, next ) => {
    const id = req.body.id;
    const qrSize = 500; // Perzonaliza el tamaño del código QR
  
    // Realiza la consulta a la base de datos para obtener la información del ID
    const request = new Request(
      `SELECT * FROM ARTICULOS_QR WHERE ItemCode = '${id}'`,
      ( err, rowCount ) => {
        if ( err ) {
          res.status( 500 ).json( { error: 'Algo salió mal con la consulta a la BD' } );
          console.log( err );
        } else if ( rowCount === 0 ) {
          res.status( 404 ).json( { error: 'No se encontró información para el ID' } );
        }
      }
    );

    let qr_info = {}; // Variable para almacenar los datos obtenidos de la base de datos

    const rows = []; // Array para almacenar los resultados de la consulta

    // Evento 'row' para recopilar los resultados de la consulta
    request.on( 'row', columns => {
      const row = {};
      columns.forEach( column => {
        row[ column.metadata.colName ] = column.value;
      });
      rows.push( row );
    });

    // Evento 'doneInProc' para procesar los resultados de la consulta
    request.on( 'doneInProc', ( rowCount, more ) => {
      if ( rowCount === 0 ) {
        res.status( 404 ).json( { error: 'No se encontró información para el ID' } );
      } else {
        qr_info = rows[0];
        const qr_text = `${ qr_info.ItemCode } - ${ qr_info.ItemName }`;

        // Genera el código QR a partir de lo que recibe del input de la vista
        qrcode.toDataURL( qr_text, { width: qrSize }, ( err, src ) => {
          if ( err ) {
            res.status( 500 ).json( { error: 'Algo salió mal al generar el código QR' } );
          } else {
            res.json({
              qr_code: src, // URL del código QR generado
              qr_info: qr_info, // Información obtenida de la BD
              qr_text: qr_text // Texto utilizado para generar el código QR
            });
          }
        });
      }
    });
  
    connection.execSql( request );
  });
  
  //Inicia el servidor
  app.listen( port, console.log( `Listening on port ${ port }` ) );
}
