const qrcode = require( 'qrcode' );
const { Request } = require( 'tedious' );
const { Connection } = require( 'tedious' );

const config = require( '../../dbConfig' );

exports.generateQR = ( req, res ) => {
    const id = req.body.id;
    const qrSize = 500;
    
    // Configuración de la BD
    const connection = new Connection( config );
    connection.connect(); // Establece la conexión a la BD

    connection.on( 'connect', function ( err ) {
        if ( err ) {
            console.error( 'Error al conectar a la BD:', err.message );
            throw err;
        }

        const request = new Request(
            `SELECT * FROM ARTICULOS_QR WHERE ItemCode = '${id}'`,
            ( err, rowCount ) => {
                if ( err ) {
                    res.status( 500 ).json( { error: 'Algo salió mal con la consulta a la BD' } );
                } else if (rowCount === 0) {
                    res.status( 404 ).json( { error: 'No se encontró información para el ID' } );
                }
            }
        );

        let qr_info = {};
        const rows = [];

        request.on( 'row', columns => {
            const row = {};
            columns.forEach( column => {
                row[column.metadata.colName] = column.value;
            });
            rows.push( row );
        });

        request.on( 'doneInProc', ( rowCount, more ) => {
            if ( rowCount === 0 ) {
                res.status( 404 ).json( { error: 'No se encontró información para el ID' } );
            } else {
                qr_info = rows[0];
                const qr_text = `${qr_info.ItemCode} - ${qr_info.ItemName}`;

                qrcode.toDataURL( qr_text, { width: qrSize }, ( err, src ) => {
                    if ( err ) {
                        res.status( 500 ).json( { error: 'Algo salió mal al generar el código QR' } );
                    } else {
                        res.json({
                            qr_code: src,
                            qr_info: qr_info,
                            qr_text: qr_text
                        });
                    }
                });
            }
        });
        connection.execSql( request ); // Ejecuta la consulta a la base de datos
    });
};
