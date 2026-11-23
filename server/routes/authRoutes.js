import express from 'express';
import {
  requestPhoneOtp,
  verifyPhoneOtp,
  startGoogleAuth,
  handleGoogleCallback,
  getCurrentUser,
  authHealth,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/phone/request-otp', requestPhoneOtp);
router.post('/phone/verify', verifyPhoneOtp);
router.get('/google', startGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/me', getCurrentUser);
router.get('/health', authHealth);

export default router;
