import express from 'express';
import {
  getWealthAssets,
  createWealthAsset,
  updateWealthAsset,
  deleteWealthAsset,
} from '../controllers/wealthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getWealthAssets).post(createWealthAsset);
router.route('/:id').put(updateWealthAsset).delete(deleteWealthAsset);

export default router;
