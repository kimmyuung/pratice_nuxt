import mysql from 'mysql2/promise';

let pool;

export const getDbPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: 'localhost',
      user: 'user',
      password: '1234',
      database: 'boarddev',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
};