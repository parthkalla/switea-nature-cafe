import { Router } from 'express';
import {
  getPlatformOverview,
  getAllRestaurants,
  createRestaurant,
  toggleRestaurantStatus,
  deleteRestaurant,
  restoreRestaurant,
  updateRestaurant,
  getAllUsers,
  resetUserPassword,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  createSubscriptionPlan,
  getAuditLogs,
  getPlatformAnalytics,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/superAdminController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

// Protect all super admin routes
router.use(authenticateJWT);
router.use(requireRole('SUPER_ADMIN'));

router.get('/overview', getPlatformOverview);
router.get('/restaurants', getAllRestaurants);
router.post('/restaurants', createRestaurant);
router.patch('/restaurants/:id/toggle-status', toggleRestaurantStatus);
router.delete('/restaurants/:id', deleteRestaurant);
router.post('/restaurants/:id/restore', restoreRestaurant);
router.put('/restaurants/:id', updateRestaurant);
router.get('/users', getAllUsers);
router.put('/users/:userId/password', resetUserPassword);
router.get('/plans', getSubscriptionPlans);
router.post('/plans', createSubscriptionPlan);
router.put('/plans/:id', updateSubscriptionPlan);
router.get('/audit-logs', getAuditLogs);
router.get('/analytics', getPlatformAnalytics);
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

export default router;
