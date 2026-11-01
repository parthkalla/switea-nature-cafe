import { Router } from 'express';
import {
  receiveMarketplaceOrder,
  syncExtensionOrder,
  queueExtensionAction,
  getPendingActions,
  ackAction,
  updateRiderStatus,
} from '../controllers/integrationController';

const router = Router();

// Existing Webhook
router.post('/:source/orders', receiveMarketplaceOrder);

// Chrome Extension Direct Bridge Endpoints
router.post('/extension/sync-order', syncExtensionOrder);
router.get('/extension/pending-actions', getPendingActions);
router.post('/extension/action-ack', ackAction);
router.post('/extension/queue-action', queueExtensionAction);
router.patch('/extension/rider-status', updateRiderStatus);

export default router;
