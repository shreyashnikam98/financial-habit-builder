import express from 'express';
import {
  getHabits,
  createHabit,
  toggleHabitCompletion,
  updateHabit,
  deleteHabit,
} from '../controllers/habitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getHabits).post(createHabit);
router.route('/:id').put(updateHabit).delete(deleteHabit);
router.post('/:id/toggle', toggleHabitCompletion);

export default router;
