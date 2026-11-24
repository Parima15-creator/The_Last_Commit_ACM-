import crypto from 'crypto';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import { authDb } from '../db/authDb.js';
import { config } from '../config/env.js';

const googleStates = new Map();
const scryptAsync = promisify(crypto.scrypt);

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return null;
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function hashOtp(otp) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(otp, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
}

async function verifyOtpHash(otp, storedHash) {
  const [algorithm, salt, expectedHex] = String(storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
  const actual = await scryptAsync(otp, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeOtpPurpose(value) {
  const allowed = new Set(['login', 'registration', 'forgot_password', 'email_change']);
  return allowed.has(value) ? value : 'login';
}

async function sendOtpEmail(email, otp) {
  if (!config.smtpHost || !config.smtpFrom) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser ? {
      user: config.smtpUser,
      pass: config.smtpPassword,
    } : undefined,
  });

  await transporter.sendMail({
    from: config.smtpFrom,
    to: email,
    subject: `${config.appName || 'JholFree'} verification code`,
    text: `Your verification code is ${otp}. It expires in ${Math.ceil(config.authOtpTtlSeconds / 60)} minutes.`,
    html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in ${Math.ceil(config.authOtpTtlSeconds / 60)} minutes.</p>`,
  });
  return { sent: true };
}

async function sendOtpSms(phone, otp) {
  const { smsAccountSid, smsAuthToken, smsFromNumber, appName, authOtpTtlSeconds } = config;
  if (!smsAccountSid || !smsAuthToken || !smsFromNumber) {
    return { sent: false, reason: 'sms_not_configured' };
  }

  const body = new URLSearchParams({
    To: phone,
    From: smsFromNumber,
    Body: `Your ${appName || 'JholFree'} verification code is ${otp}. It expires in ${Math.ceil(authOtpTtlSeconds / 60)} minutes.`,
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${smsAccountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${smsAccountSid}:${smsAuthToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const error = new Error(details.message || 'SMS delivery failed. Check the SMS gateway settings.');
    error.status = 502;
    throw error;
  }
  return { sent: true };
}

async function createSession(userId) {
  const token = createSessionToken();
  const tokenHash = hash(token);
  await authDb.execute(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ? DAY)',
    [userId, tokenHash, config.authSessionDays],
  );
  return token;
}

async function getUserById(userId) {
  const [rows] = await authDb.execute(
    'SELECT id, name, email, phone, avatar_url AS avatarUrl, created_at AS createdAt FROM users WHERE id = ?',
    [userId],
  );
  return rows[0] || null;
}

export async function requestPhoneOtp(req, res, next) {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Enter a valid 10-digit Indian phone number.' });

    const otp = String(crypto.randomInt(100000, 1000000));
    await authDb.execute('UPDATE otp_codes SET used_at = NOW() WHERE phone = ? AND used_at IS NULL', [phone]);
    const [insertResult] = await authDb.execute(
      'INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ? SECOND)',
      [phone, hash(otp), config.authOtpTtlSeconds],
    );

    let smsResult;
    try {
      smsResult = await sendOtpSms(phone, otp);
    } catch (error) {
      await authDb.execute('DELETE FROM otp_codes WHERE id = ?', [insertResult.insertId]);
      return next(error);
    }

    const response = {
      message: smsResult.sent
        ? 'A 6-digit verification code was sent to your phone.'
        : 'SMS delivery is not configured.',
      smsSent: smsResult.sent,
    };
    if (!smsResult.sent && config.nodeEnv !== 'production') response.devOtp = otp;
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function verifyPhoneOtp(req, res, next) {
  const connection = await authDb.getConnection();
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || '').replace(/\D/g, '');
    if (!phone || otp.length !== 6) return res.status(400).json({ error: 'Enter a valid phone number and 6-digit code.' });

    const [otpRows] = await connection.execute(
      'SELECT id FROM otp_codes WHERE phone = ? AND code_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP() ORDER BY id DESC LIMIT 1',
      [phone, hash(otp)],
    );
    console.info('[OTP Verify]', { phone, otpLength: otp.length, matchedRows: otpRows.length });
    if (!otpRows.length) return res.status(401).json({ error: 'The code is invalid or expired.' });

    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO users (phone, name, last_login_at)
       VALUES (?, 'JholFree User', NOW())
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), last_login_at = NOW(), updated_at = NOW()`,
      [phone],
    );
    const [[user]] = await connection.execute('SELECT id FROM users WHERE phone = ?', [phone]);
    await connection.execute('UPDATE otp_codes SET used_at = NOW() WHERE id = ?', [otpRows[0].id]);
    await connection.commit();

    const token = await createSession(user.id);
    return res.json({ token, user: await getUserById(user.id) });
  } catch (error) {
    await connection.rollback().catch(() => {});
    return next(error);
  } finally {
    connection.release();
  }
}

export async function requestEmailOtp(req, res, next) {
  try {
    let email = normalizeEmail(req.body.email);
    const purpose = normalizeOtpPurpose(req.body.purpose);

    if (req.body.challengeId) {
      const [challengeRows] = await authDb.execute(
        'SELECT email, purpose FROM otp_codes WHERE challenge_id = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1',
        [req.body.challengeId],
      );
      if (challengeRows.length) {
        email = normalizeEmail(challengeRows[0].email);
        req.body.purpose = challengeRows[0].purpose;
      }
    }

    if (!email) return res.status(400).json({ error: 'Enter a valid email address.' });
    const challengePurpose = normalizeOtpPurpose(req.body.purpose);

    const [cooldownRows] = await authDb.execute(
      `SELECT GREATEST(TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), resend_available_at), 0) AS retry_after
       FROM otp_codes
       WHERE email = ? AND purpose = ? AND used_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [email, challengePurpose],
    );
    if (cooldownRows.length && cooldownRows[0].retry_after > 0) {
      const retryAfter = cooldownRows[0].retry_after;
      if (retryAfter > 0) {
        return res.status(429).json({
          error: `Please wait ${retryAfter} seconds before requesting another code.`,
          retryAfter,
        });
      }
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const codeHash = await hashOtp(otp);
    const challengeId = crypto.randomBytes(32).toString('hex');

    await authDb.execute(
      'UPDATE otp_codes SET used_at = UTC_TIMESTAMP() WHERE email = ? AND purpose = ? AND used_at IS NULL',
      [email, challengePurpose],
    );
    const [insertResult] = await authDb.execute(
      `INSERT INTO otp_codes
       (email, purpose, challenge_id, code_hash, failed_attempts, resend_available_at, expires_at)
       VALUES (?, ?, ?, ?, 0, UTC_TIMESTAMP() + INTERVAL ? SECOND, UTC_TIMESTAMP() + INTERVAL ? SECOND)`,
      [email, challengePurpose, challengeId, codeHash, config.authOtpResendSeconds, config.authOtpTtlSeconds],
    );

    let emailResult;
    try {
      emailResult = await sendOtpEmail(email, otp);
    } catch (error) {
      await authDb.execute('DELETE FROM otp_codes WHERE id = ?', [insertResult.insertId]);
      return next(error);
    }

    const at = email.indexOf('@');
    const maskedEmail = `${email.slice(0, 2)}***${email.slice(at)}`;
    const response = {
      message: emailResult.sent
        ? 'A 6-digit verification code was sent to your email.'
        : 'Verification code generated for development.',
      emailSent: emailResult.sent,
      challengeId,
      expiresInSeconds: config.authOtpTtlSeconds,
      retryAfterSeconds: config.authOtpResendSeconds,
      maskedEmail,
    };
    if (!emailResult.sent && config.nodeEnv !== 'production') response.devOtp = otp;
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function verifyEmailOtp(req, res, next) {
  const connection = await authDb.getConnection();
  try {
    const challengeId = String(req.body.challengeId || '');
    const otp = String(req.body.otp || '').replace(/\D/g, '');
    if (!/^[a-f0-9]{64}$/.test(challengeId) || otp.length !== 6) {
      return res.status(400).json({ error: 'Enter a valid challenge and 6-digit code.' });
    }

    const [otpRows] = await connection.execute(
      `SELECT id, email, purpose, code_hash, failed_attempts,
              expires_at > UTC_TIMESTAMP() AS is_active
       FROM otp_codes
       WHERE challenge_id = ? AND used_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [challengeId],
    );
    if (!otpRows.length) return res.status(401).json({ error: 'The code is invalid or expired.' });

    const record = otpRows[0];
    if (!record.is_active) {
      await connection.execute('UPDATE otp_codes SET used_at = UTC_TIMESTAMP() WHERE id = ?', [record.id]);
      return res.status(401).json({ error: 'The code has expired. Request a new one.' });
    }
    if (record.failed_attempts >= config.authOtpMaxAttempts) {
      await connection.execute('UPDATE otp_codes SET used_at = UTC_TIMESTAMP() WHERE id = ?', [record.id]);
      return res.status(429).json({ error: 'Maximum verification attempts reached. Request a new code.' });
    }

    const matches = await verifyOtpHash(otp, record.code_hash);
    if (!matches) {
      const failedAttempts = record.failed_attempts + 1;
      await connection.execute(
        'UPDATE otp_codes SET failed_attempts = ?, used_at = IF(? >= ?, UTC_TIMESTAMP(), used_at) WHERE id = ?',
        [failedAttempts, failedAttempts, config.authOtpMaxAttempts, record.id],
      );
      return res.status(401).json({
        error: 'The code is invalid.',
        attemptsRemaining: Math.max(0, config.authOtpMaxAttempts - failedAttempts),
      });
    }

    await connection.beginTransaction();
    await connection.execute('UPDATE otp_codes SET used_at = UTC_TIMESTAMP() WHERE id = ?', [record.id]);

    if (record.purpose === 'login' || record.purpose === 'registration') {
      await connection.execute(
        `INSERT INTO users (email, name, last_login_at)
         VALUES (?, 'JholFree User', UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), last_login_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()`,
        [record.email],
      );
      const [[user]] = await connection.execute('SELECT id FROM users WHERE email = ?', [record.email]);
      await connection.commit();
      const token = await createSession(user.id);
      return res.json({ token, user: await getUserById(user.id), purpose: record.purpose });
    }

    await connection.commit();
    return res.json({ verified: true, email: record.email, purpose: record.purpose });
  } catch (error) {
    await connection.rollback().catch(() => {});
    return next(error);
  } finally {
    connection.release();
  }
}

export function startGoogleAuth(req, res) {
  if (!config.authGoogleClientId || !config.authGoogleClientSecret) {
    const message = 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.';
    return res.redirect(`${config.appUrl}/auth?authError=${encodeURIComponent(message)}`);
  }

  const state = crypto.randomBytes(24).toString('hex');
  googleStates.set(state, Date.now());
  const params = new URLSearchParams({
    client_id: config.authGoogleClientId,
    redirect_uri: config.authGoogleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
  });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export async function handleGoogleCallback(req, res, next) {
  try {
    const { code, state } = req.query;
    const stateCreatedAt = googleStates.get(state);
    googleStates.delete(state);
    if (!code || !stateCreatedAt || Date.now() - stateCreatedAt > 10 * 60 * 1000) {
      return res.status(400).send('Invalid or expired Google sign-in request.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.authGoogleClientId,
        client_secret: config.authGoogleClientSecret,
        redirect_uri: config.authGoogleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error('Google token exchange failed.');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub || !profile.email) throw new Error('Google profile could not be verified.');

    await authDb.execute(
      `INSERT INTO users (google_id, email, name, avatar_url, last_login_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name), avatar_url = VALUES(avatar_url), last_login_at = NOW(), updated_at = NOW()`,
      [profile.sub, profile.email, profile.name || profile.email.split('@')[0], profile.picture || null],
    );
    const [[user]] = await authDb.execute('SELECT id FROM users WHERE google_id = ?', [profile.sub]);
    const token = await createSession(user.id);
    return res.redirect(`${config.appUrl}/auth?authToken=${encodeURIComponent(token)}`);
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    const [rows] = await authDb.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar_url AS avatarUrl
       FROM auth_sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()`,
      [hash(token)],
    );
    if (!rows.length) return res.status(401).json({ error: 'Session expired.' });
    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function authHealth(req, res) {
  await authDb.query('SELECT 1');
  return res.json({ status: 'online', database: config.authDbName });
}
