import express from 'express';
import {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  splitBill,
} from '../controllers/billController.js';

const router = express.Router();

router.get('/', getAllBills);
router.post('/', createBill);
router.get('/:id', getBillById);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);
router.post('/:id/split', splitBill);

export default router;
