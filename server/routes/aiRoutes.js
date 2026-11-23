import express from 'express';
import {
  extractReceipt,
  mapVoiceToItems,
  getAiHealth,
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/extract-receipt', extractReceipt);
router.post('/voice-split', mapVoiceToItems);
router.get('/health', getAiHealth);

export default router;
