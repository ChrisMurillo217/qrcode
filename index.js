const express = require( 'express' );
const path = require( 'path' );
const qrcode = require( 'qrcode' );
const Connection = require( 'tedious' ).Connection;
const Request = require( 'tedious' ).Request;

const app = express();
const port = process.env.port || 3000;

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
    console.error( 'Error al conectar a la BD:', err.message);
    console.log( err );
    throw err;
  }

  executeStatement();
});

function executeStatement() {
  // Configuración de la aplicación
  app.use( express.json() );
  app.use( express.urlencoded( { extended: false } ) );
  app.use( express.static( 'public' ) );
  app.set( 'view engine', 'ejs' );
  app.set( 'views', path.join( __dirname, 'view' ) );
  
  // Ruta principal
  app.get( '/', ( req, res ) => {
    res.render( 'index' );
  } );
  
  // Ruta para generar y mostrar código QR
  app.post( '/scan', ( req, res, next ) => {
    const id = req.body.id;
    console.log('ID recibido:', id);
    const qrSize = 500; // Perzonaliza el tamaño del código QR
  
    // Realiza la consulta a la base de datos para obtener la información del ID
    const request = new Request(
      `SELECT * FROM table_1 WHERE id = ${id}`,
      ( err, rowCount ) => {
        if ( err ) {
          res.send( 'Algo salió mal con la consulta a la BD' );
          console.log( err );
        } else if ( rowCount === 0 ) {
          res.send( 'No se encontró información para el ID' );
        } /*else {
          const qr_info = rows[ 0 ];
          console.log( qr_info );
          qrcode.toDataURL( id, { width: qrSize }, ( err, src ) => {
            if ( err ) {
              res.send( 'Algo salió mal al generar el código QR' );
            } else {
              res.render( 'scan', {
                qr_code: src,
                qr_info: qr_info,
              });
            }
          });
        }*/
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
        res.send( 'No se encontró información para el ID' );
      } else {
        qr_info = rows[0];
        qrcode.toDataURL( id, { width: qrSize }, ( err, src ) => {
          if ( err ) {
            res.send( 'Algo salió mal al generar el código QR' );
          } else {
            res.render( 'scan', {
              qr_code: src,
              qr_info: qr_info,
            });
          }
        });
      }
    });
    console.log( qr_info );
  
    connection.execSql( request );
    /*qrcode.toDataURL( input_text, { width: qrSize }, ( err, src ) => {
      if ( err ) {
        res.send( 'Algo salió mal!!!' );
      } else {
      res.render( 'scan', {
          qr_code: src,
          qr_text: input_text // Agrega la información del código QR a los datos renderizados
        });
      }
    });*/
  });
  
  //Inicia el servidor
  app.listen( port, console.log( `Listening on port ${ port }` ) );
}
