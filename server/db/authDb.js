import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

export const authDb = mysql.createPool({
  host: config.authDbHost,
  port: config.authDbPort,
  user: config.authDbUser,
  password: config.authDbPassword,
  database: config.authDbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
});

export async function checkAuthDbConnection() {
  const connection = await authDb.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
