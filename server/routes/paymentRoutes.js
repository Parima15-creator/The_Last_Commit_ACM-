import express from 'express';
import {
  getAllPayments,
  updatePaymentStatus,
  getSharePayload,
} from '../controllers/paymentController.js';

const router = express.Router();

router.get('/', getAllPayments);
router.put('/:id/status', updatePaymentStatus);
router.get('/:id/share', getSharePayload);

export default router;
