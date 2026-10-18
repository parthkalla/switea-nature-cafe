import { Router } from 'express';
import {
  getLandingPage,
  getMenu,
  getTableByToken,
  calculateCart,
  createOrder,
  getOrderStatus,
  createReview,
} from '../controllers/publicController';

const router = Router();

// Landing page data
router.get('/landing/:slug?', getLandingPage);

// Menu
router.get('/menu/:slug?', getMenu);

// Table QR token resolution
router.get('/table/:token', getTableByToken);

// Cart calculation
router.post('/cart/calculate', calculateCart);

// Order creation and tracking
router.post('/orders', createOrder);
router.get('/orders/:orderToken', getOrderStatus);

// Customer reviews
router.post('/reviews/:slug?', createReview);

export default router;
