/*const express = require( 'express' );
const path = require( 'path' );
const qrcode = require( 'qrcode' );
const { Connection, Request, TYPES } = require( 'tedious' );
const session = require( 'express-session' );
const passport = require( 'passport' );
const LocalStrategy = require( 'passport-local' ).Strategy;
const bcrypt = require( 'bcrypt' );

const app = express();
const port = process.env.port || 3000;

// Configuración de la sesión de Express
app.use( session({
  secret: 'Empaq.QR2023',
  resave: false,
  saveUninitialized: false
}));

// Inicialización de Passport y sesión
app.use( passport.initialize() );
app.use( passport.session() );

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

// Configuración de la estrategia de autenticación local
passport.use(
  new LocalStrategy(
    { usernameField: 'username' },
    async ( username, password, done ) => {
      try {
        const request = new Request(
          `SELECT * FROM Users WHERE username = ${ username }`,
          ( err, rowCount, rows ) => {
            if ( err ) return done( err );
            if ( rowCount === 0 ) return done( null, false, { message: 'Usuario no encontrado' } );

            const user = rows[0];
            bcrypt.compare( password, user.password, ( err, isMatch ) => {
              if ( err ) return done( err );
              if ( isMatch ) return done( null, user );
              else return done( null, false, { message: 'Contraseña incorrecta' } );
            } );
          }
        );
        request.addParameter( 'username', TYPES.NVarChar, username );
        connection.execSql( request );
      } catch ( err ) {
        return done( err );
      }
    }
  )
);

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

passport.serializeUser(( user, done ) => {
  done( null, user.id );
});

passport.deserializeUser(( id, done ) => {
  try {
    const request = new Request(
      `SELECT * FROM Users WHERE id = @id`,
      ( err, rowCount, rows ) => {
        if ( err ) return done( err );
        if ( rowCount === 0 ) return done( null, false );

        const user = rows[0];
        done( null, user );
      }
    );
    request.addParameter( 'id', TYPES.Int, id );
    connection.execSql( request );
  } catch ( err ) {
    return done( err );
  }
});

// Middleware para redireccionar a /login si no hay un usuario autenticado
app.use((req, res, next) => {
  if (!req.user && req.path !== '/login') {
    return res.redirect('/login');
  }
  next();
});

// Ruta para mostrar el formulario de inicio de sesión
app.get( '/login', ( req, res ) => {
  res.render( 'login' ); 
} );

// Ruta para procesar el inicio de sesión
app.post( '/login', passport.authenticate( 'local', {
  successRedirect: '/index', // Redirige en caso de inicio de sesión exitoso
  failureRedirect: '/login', // Se redirige en caso de fallo de inicio de sesión
  failureFlash: true // Activa mensajes flash en caso de fallo de inicio de sesión (requiere configuración adicional)
} ) );

// Ruta para mostrar el formulario de registro
app.get( '/signup', ( req, res ) => {
  res.render( 'signup' ); // Crea una vista llamada signup.ejs con el formulario de registro
} );

// Ruta para procesar el registro
app.post( '/signup', async ( req, res ) => {
  const { username, password } = req.body;

  try {
    // Verifica si el usuario ya existe en la base de datos
    const request = new Request(
      `SELECT * FROM Users WHERE username = ${ username }`,
      ( err, rowCount, rows ) => {
        if ( err ) throw err;
        if ( rowCount > 0 ) {
          // El usuario ya existe, muestra un mensaje de error
          res.render( 'signup', { error: 'El usuario ya existe' } );
        } else {
          // El usuario no existe, crea el nuevo usuario en la base de datos
          bcrypt.hash( password, 10, ( err, hashedPassword ) => {
            if ( err ) throw err;
            const insertRequest = new Request(
              `INSERT INTO Users (username, password) VALUES (${ username }, ${ password })`,
              ( err ) => {
                if ( err ) throw err;
                // Registro exitoso, redirige al usuario al inicio de sesión
                res.redirect( '/login' );
              }
            );
            insertRequest.addParameter( 'username', TYPES.NVarChar, username );
            insertRequest.addParameter( 'password', TYPES.NVarChar, hashedPassword );
            connection.execSql( insertRequest );
          });
        }
      }
    );
    request.addParameter( 'username', TYPES.NVarChar, username );
    connection.execSql( request );
  } catch ( err ) {
    console.error( err );
    res.render( 'signup', { error: 'Error en el registro' } );
  }
});

function executeStatement() {
  // Configuración de la aplicación
  app.use( express.json() );
  app.use( express.urlencoded( { extended: false } ) );
  app.use( express.static( 'public' ) );
  app.set( 'view engine', 'ejs' ); // Motor de plantillas EJS
  app.set( 'views', path.join( __dirname, 'view' ) ); // Directorio de vistas
  
  // Ruta principal
  app.get( '/index', ( req, res ) => {
    res.render( 'index' );
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
          res.send( 'Algo salió mal con la consulta a la BD' );
          console.log( err );
        } else if ( rowCount === 0 ) {
          res.send( 'No se encontró información para el ID' );
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
        res.send( 'No se encontró información para el ID' );
      } else {
        qr_info = rows[0];
        const qr_text = `${ qr_info.ItemCode } - ${ qr_info.ItemName }`;

        // Genera el código QR a partir de lo que recibe del input de la vista
        qrcode.toDataURL( qr_text, { width: qrSize }, ( err, src ) => {
          if ( err ) {
            res.send( 'Algo salió mal al generar el código QR' );
          } else {
            res.render( 'scan', {
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
}*/


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
  app.set( 'view engine', 'ejs' ); // Motor de plantillas EJS
  app.set( 'views', path.join( __dirname, 'view' ) ); // Directorio de vistas
  
  // Ruta principal
  app.get( '/', ( req, res ) => {
    res.render( 'index' );
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
          res.send( 'Algo salió mal con la consulta a la BD' );
          console.log( err );
        } else if ( rowCount === 0 ) {
          res.send( 'No se encontró información para el ID' );
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
        res.send( 'No se encontró información para el ID' );
      } else {
        qr_info = rows[0];
        const qr_text = `${ qr_info.ItemCode } - ${ qr_info.ItemName }`;

        // Genera el código QR a partir de lo que recibe del input de la vista
        qrcode.toDataURL( qr_text, { width: qrSize }, ( err, src ) => {
          if ( err ) {
            res.send( 'Algo salió mal al generar el código QR' );
          } else {
            res.render( 'scan', {
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

