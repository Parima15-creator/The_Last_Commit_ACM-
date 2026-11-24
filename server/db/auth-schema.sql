-- Paste this entire script into phpMyAdmin > SQL.
-- It is safe to run more than once because it does not drop existing data.

CREATE DATABASE IF NOT EXISTS jholfree_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jholfree_auth;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  google_id VARCHAR(191) NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(20) NULL,
  name VARCHAR(120) NOT NULL DEFAULT 'JholFree User',
  avatar_url VARCHAR(500) NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_google_id (google_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token (token_hash),
  KEY idx_auth_sessions_user (user_id),
  KEY idx_auth_sessions_expiry (expires_at),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE otp_codes MODIFY phone VARCHAR(20) NULL;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS email VARCHAR(191) NULL AFTER phone;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS purpose VARCHAR(64) NULL AFTER email;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS challenge_id CHAR(64) NULL AFTER purpose;
ALTER TABLE otp_codes MODIFY code_hash VARCHAR(255) NOT NULL;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER code_hash;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS resend_available_at DATETIME NULL AFTER failed_attempts;
ALTER TABLE otp_codes ADD INDEX IF NOT EXISTS idx_otp_email_created (email, created_at);
ALTER TABLE otp_codes ADD INDEX IF NOT EXISTS idx_otp_challenge (challenge_id);
