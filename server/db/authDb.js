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
  timezone: config.authDbTimezone,
});

export async function checkAuthDbConnection() {
  const connection = await authDb.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

export async function ensureEmailOtpSchema() {
  const connection = await authDb.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        phone VARCHAR(20) NULL,
        email VARCHAR(191) NULL,
        purpose VARCHAR(64) NULL,
        challenge_id CHAR(64) NULL,
        code_hash VARCHAR(255) NOT NULL,
        failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
        resend_available_at DATETIME NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_otp_phone_created (phone, created_at),
        KEY idx_otp_email_created (email, created_at),
        KEY idx_otp_challenge (challenge_id),
        KEY idx_otp_expiry (expires_at)
      ) ENGINE=InnoDB
    `);

    const [columns] = await connection.query('SHOW COLUMNS FROM otp_codes');
    const names = new Set(columns.map((column) => column.Field));

    if (!names.has('email')) await connection.query('ALTER TABLE otp_codes ADD COLUMN email VARCHAR(191) NULL AFTER phone');
    if (!names.has('purpose')) await connection.query('ALTER TABLE otp_codes ADD COLUMN purpose VARCHAR(64) NULL AFTER email');
    if (!names.has('challenge_id')) await connection.query('ALTER TABLE otp_codes ADD COLUMN challenge_id CHAR(64) NULL AFTER purpose');
    if (!names.has('failed_attempts')) await connection.query('ALTER TABLE otp_codes ADD COLUMN failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER code_hash');
    if (!names.has('resend_available_at')) await connection.query('ALTER TABLE otp_codes ADD COLUMN resend_available_at DATETIME NULL AFTER failed_attempts');

    await connection.query('ALTER TABLE otp_codes MODIFY phone VARCHAR(20) NULL');
    await connection.query('ALTER TABLE otp_codes MODIFY code_hash VARCHAR(255) NOT NULL');

    const [indexes] = await connection.query('SHOW INDEX FROM otp_codes');
    const indexNames = new Set(indexes.map((index) => index.Key_name));
    if (!indexNames.has('idx_otp_email_created')) await connection.query('ALTER TABLE otp_codes ADD INDEX idx_otp_email_created (email, created_at)');
    if (!indexNames.has('idx_otp_challenge')) await connection.query('ALTER TABLE otp_codes ADD INDEX idx_otp_challenge (challenge_id)');
  } finally {
    connection.release();
  }
}
