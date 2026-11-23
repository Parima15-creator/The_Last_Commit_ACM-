import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Groq API Configuration
  groqApiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '',
  groqBaseUrl: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
  groqVisionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
  groqTextModel: process.env.GROQ_TEXT_MODEL || 'openai/gpt-oss-120b',
  groqTimeout: parseInt(process.env.GROQ_API_TIMEOUT || '30000', 10),

  // Database path
  dbPath: process.env.DATABASE_URL || path.resolve(__dirname, '../data/jholfree.json'),

  // UPI Defaults
  upiDefaultId: process.env.UPI_DEFAULT_ID || 'you.jholfree@okaxis',
  upiDefaultName: process.env.UPI_DEFAULT_NAME || 'Me',
};

export function validateConfig() {
  if (!config.groqApiKey) {
    console.warn('⚠️ [JholFree Config Warning]: GROQ_API_KEY is not set in .env. Receipt OCR and voice splitting will prompt the user to configure it or use manual entry.');
  } else {
    console.log('✅ [JholFree Config]: Groq API Key loaded securely on backend proxy. Vision model:', config.groqVisionModel);
  }
}
