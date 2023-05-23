const express = require( 'express' );
const path = require( 'path' );
const qrcode = require( 'qrcode' );

const app = express();
const port = process.env.port || 3000;

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
  const input_text = req.body.text;
  const qrSize = 500; // Perzonaliza el tamaño del código QR

  qrcode.toDataURL( input_text, { width: qrSize }, ( err, src ) => {
    if ( err ) {
      res.send( 'Algo salió mal!!!' );
    } else {
    res.render( 'scan', {
        qr_code: src,
        qr_text: input_text // Agrega la información del código QR a los datos renderizados
      });
    }
  });
});

//Inicia el servidor
app.listen( port, console.log( `Listening on port ${ port }` ) );
