import { Router } from 'express';
import {
  getLandingPage,
  getMenu,
  getTableByToken,
  calculateCart,
  createOrder,
  getOrderStatus,
  createReview,
  confirmOrderPayment,
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

// Order creation, tracking and payment
router.post('/orders', createOrder);
router.get('/orders/:orderToken', getOrderStatus);
router.post('/orders/:orderToken/payment', confirmOrderPayment);

// Customer reviews
router.post('/reviews/:slug?', createReview);

export default router;
