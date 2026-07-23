import express from 'express';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTransactions)
  .post(upload.single('receipt'), createTransaction);

router
  .route('/:id')
  .put(upload.single('receipt'), updateTransaction)
  .delete(deleteTransaction);

export default router;
