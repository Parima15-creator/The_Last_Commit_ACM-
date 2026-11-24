import crypto from 'crypto';
import { authDb } from '../db/authDb.js';
import { config } from '../config/env.js';

const googleStates = new Map();

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

async function createSession(userId) {
  const token = createSessionToken();
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + config.authSessionDays * 24 * 60 * 60 * 1000);
  await authDb.execute(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt],
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
    await authDb.execute(
      'INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES (?, ?, ?)',
      [phone, hash(otp), new Date(Date.now() + config.authOtpTtlSeconds * 1000)],
    );

    const response = { message: 'Verification code generated.' };
    if (config.nodeEnv !== 'production') response.devOtp = otp;
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
      'SELECT id FROM otp_codes WHERE phone = ? AND code_hash = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [phone, hash(otp)],
    );
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
       WHERE s.token_hash = ? AND s.expires_at > NOW()`,
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
