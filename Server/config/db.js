require('dotenv').config();

let sql;
let poolPromise;

// If Cloud credentials (DB_USER & DB_PASSWORD) are present, use standard pure-JS 'tedious' driver
if (process.env.DB_USER && process.env.DB_PASSWORD) {
    sql = require('mssql');
    const cloudConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT || '1433', 10),
        database: process.env.DB_DATABASE,
        options: {
            encrypt: process.env.DB_ENCRYPT !== 'false', // Default true for Azure and Cloud MSSQL
            trustServerCertificate: process.env.DB_TRUST_CERT !== 'false'
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };

    poolPromise = new sql.ConnectionPool(cloudConfig)
        .connect()
        .then(pool => {
            console.log(`Connected to Cloud MS SQL Server (${process.env.DB_SERVER})`);
            return pool;
        })
        .catch(err => {
            console.error('Cloud Database Connection Failed! Error:', err);
            throw err;
        });
} else {
    // Local development fallback: Windows Authentication via msnodesqlv8
    try {
        sql = require('mssql/msnodesqlv8');
        const localConfig = {
            driver: 'msnodesqlv8',
            connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_DATABASE || 'AIStudyPlanner'};Trusted_Connection=yes;TrustServerCertificate=yes;`
        };

        poolPromise = new sql.ConnectionPool(localConfig)
            .connect()
            .then(pool => {
                console.log('Connected to Local MS SQL Server (Windows Authentication)');
                return pool;
            })
            .catch(err => {
                console.error('Local Database Connection Failed! Bad Config:', err);
                throw err;
            });
    } catch (e) {
        console.warn('msnodesqlv8 not available on this platform. Falling back to standard mssql.');
        sql = require('mssql');
    }
}

module.exports = {
    sql,
    poolPromise
};
