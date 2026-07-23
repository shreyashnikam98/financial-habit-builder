import express from 'express';
import {
  getBudgets,
  createBudget,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/analytics', getBudgetAnalytics);

router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.route('/:id')
  .get(getBudgetById)
  .put(updateBudget)
  .delete(deleteBudget);

export default router;
