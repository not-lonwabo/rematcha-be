const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'password123',
    host: 'localhost',
    port: 5432,
    database: 'rematcha'
});

module.exports = pool;