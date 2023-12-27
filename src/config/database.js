const sql = require('mssql');

const prod = {
    user: process.env.DB_PROD_USER,
    password: process.env.DB_PROD_PASSWORD,
    server: process.env.DB_PROD_SERVER,
    database: process.env.DB_PROD_DATABASE,
};

const dev = {
    user: process.env.DB_DEV_USER,
    password: process.env.DB_DEV_PASSWORD,
    server: process.env.DB_DEV_SERVER,
    database: process.env.DB_DEV_DATABASE,
};

const use = prod;

const configRemote = {
  user: use.user,
  password: use.password,
  server: use.server,
  database: use.database,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const configLocal = {
  user: use.user,
  password: use.password,
  server: 'localhost',
  database: use.database,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

var connection;
try {
    connection = sql.connect(configLocal, (error) => {
        if (error) {
            console.log('Error al conectar a la base de datos local');
            console.log('Intentando conectar a la base de datos remota...');
            connection = sql.connect(configRemote, (error) => {
                if (error) {
                    console.log('Error al conectar a la base de datos remota', error);
                } else {
                    console.log('**** Conexión correcta a la base de datos remota ****');
                }
            });
        } else {
            console.log('**** Conexión correcta a la base de datos local ****');
        }
    });
} catch (error) { 
    console.log('Error al conectar a la base de datos', error);
}

module.exports = connection;