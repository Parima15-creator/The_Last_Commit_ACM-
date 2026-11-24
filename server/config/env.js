import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Groq AI configuration.
  groqApiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '',
  groqBaseUrl: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
  groqVisionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
  groqTextModel: process.env.GROQ_TEXT_MODEL || 'openai/gpt-oss-120b',
  groqTimeout: parseInt(process.env.GROQ_API_TIMEOUT || '30000', 10),

  // Existing JSON data store for bills, contacts, and payments.
  dbPath: process.env.DATABASE_URL || path.resolve(__dirname, '../data/jholfree.json'),

  // Authentication MySQL database.
  authDbHost: process.env.AUTH_DB_HOST || '127.0.0.1',
  authDbPort: parseInt(process.env.AUTH_DB_PORT || '3306', 10),
  authDbName: process.env.AUTH_DB_NAME || 'jholfree_auth',
  authDbUser: process.env.AUTH_DB_USER || 'root',
  authDbPassword: process.env.AUTH_DB_PASSWORD || '',
  authOtpTtlSeconds: parseInt(process.env.AUTH_OTP_TTL_SECONDS || '300', 10),
  authSessionDays: parseInt(process.env.AUTH_SESSION_DAYS || '7', 10),
  authGoogleClientId: process.env.GOOGLE_CLIENT_ID || '',
  authGoogleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  authGoogleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  // UPI defaults.
  upiDefaultId: process.env.UPI_DEFAULT_ID || 'you.jholfree@okaxis',
  upiDefaultName: process.env.UPI_DEFAULT_NAME || 'Me',
};

export function validateConfig() {
  if (!config.groqApiKey) {
    console.info('[JholFree Config]: Groq AI is disabled because GROQ_API_KEY is empty. Manual bill entry remains available.');
    return;
  }

  console.log('[JholFree Config]: Groq API key loaded. Vision model:', config.groqVisionModel);
}
