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

module.exports = config;