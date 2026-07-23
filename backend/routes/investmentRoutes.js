import express from 'express';
import {
  getInvestments,
  createInvestment,
  getInvestmentById,
  updateInvestment,
  deleteInvestment,
} from '../controllers/investmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInvestments)
  .post(createInvestment);

router.route('/:id')
  .get(getInvestmentById)
  .put(updateInvestment)
  .delete(deleteInvestment);

export default router;
