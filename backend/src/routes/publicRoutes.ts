import { Router } from 'express';
import {
  getLandingPage,
  getMenu,
  getTableByToken,
  getPublicTables,
  calculateCart,
  createOrder,
  getOrderStatus,
  createReview,
  confirmOrderPayment,
  handlePhonePeWebhook,
  handlePaytmWebhook,
  getLoyaltyBalance,
  getPublicCommunityEvents,
  createSongRequest,
  getPublicSongRequests,
  createEventRsvp,
} from '../controllers/publicController';

const router = Router();

// Loyalty points lookup
router.get('/loyalty/balance', getLoyaltyBalance);

// Tables list
router.get('/tables', getPublicTables);

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

// Payment Gateway Webhooks (PhonePe for Business & Paytm for Business)
router.post('/payments/phonepe/webhook', handlePhonePeWebhook);
router.post('/payments/paytm/webhook', handlePaytmWebhook);

// Customer reviews
router.post('/reviews/:slug?', createReview);

// Community, Events & Musical Balcony
router.get('/community/events', getPublicCommunityEvents);
router.post('/community/song-request', createSongRequest);
router.get('/community/song-requests', getPublicSongRequests);
router.post('/community/rsvp', createEventRsvp);

export default router;
