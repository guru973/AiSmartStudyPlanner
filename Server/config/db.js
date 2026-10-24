require('dotenv').config();
const { fallbackPoolInstance, fallbackSql } = require('./fallbackDb');

let sql;
try {
    sql = require('mssql');
} catch (e) {
    sql = fallbackSql;
}

let poolPromise;

// 1. If Cloud MSSQL credentials (DB_USER & DB_PASSWORD) are present:
if (process.env.DB_USER && process.env.DB_PASSWORD) {
    const cloudConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT || '1433', 10),
        database: process.env.DB_DATABASE,
        options: {
            encrypt: process.env.DB_ENCRYPT !== 'false',
            trustServerCertificate: process.env.DB_TRUST_CERT !== 'false'
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        connectionTimeout: 10000
    };

    poolPromise = new sql.ConnectionPool(cloudConfig)
        .connect()
        .then(pool => {
            console.log(`[DB] Connected to Cloud MS SQL Server (${process.env.DB_SERVER})`);
            return pool;
        })
        .catch(err => {
            console.warn('[DB] Cloud Database Connection Failed. Engaging Autonomous Storage fallback:', err.message);
            return fallbackPoolInstance;
        });

// 2. Local Windows development with Windows Authentication (msnodesqlv8):
} else if (process.platform === 'win32' && process.env.NODE_ENV !== 'production') {
    try {
        const mssqlV8 = require('mssql/msnodesqlv8');
        const localConfig = {
            driver: 'msnodesqlv8',
            connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_DATABASE || 'AIStudyPlanner'};Trusted_Connection=yes;TrustServerCertificate=yes;`
        };

        poolPromise = new mssqlV8.ConnectionPool(localConfig)
            .connect()
            .then(pool => {
                console.log('[DB] Connected to Local MS SQL Server (Windows Authentication)');
                return pool;
            })
            .catch(err => {
                console.warn('[DB] Local MS SQL Server connection failed. Using Autonomous Storage fallback:', err.message);
                return fallbackPoolInstance;
            });
    } catch (e) {
        console.warn('[DB] msnodesqlv8 not available. Using Autonomous Storage fallback.');
        poolPromise = Promise.resolve(fallbackPoolInstance);
    }

// 3. Cloud / Render / Linux environment without external database:
} else {
    console.log('[DB] Production Cloud Environment detected. Using Autonomous Persistent Cloud Storage.');
    poolPromise = Promise.resolve(fallbackPoolInstance);
}

module.exports = {
    sql,
    poolPromise
};
