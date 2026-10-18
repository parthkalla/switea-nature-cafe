import { Router } from 'express';
import {
  getDashboardAnalytics,
  getRestaurantProfile,
  updateRestaurantProfile,
  getLandingPageEditor,
  updateLandingPageEditor,
  getGalleryImages,
  addGalleryImage,
  deleteGalleryImage,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
  getTables,
  createTable,
  regenerateTableQRToken,
  deleteTable,
  getOrders,
  updateOrderStatus,
  getKitchenQueue,
  getDiscounts,
  createDiscount,
  deleteDiscount,
  getTeamMembers,
  createTeamMember,
  getReviews,
  toggleReviewApproval,
  handleImageUpload,
  getCustomers,
  getModifierGroups,
  createModifierGroup,
  deleteModifierGroup,
  addModifierOption,
  deleteModifierOption,
} from '../controllers/adminController';
import { authenticateJWT, requireRestaurantAccess } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const router = Router();

// Protect all admin routes
router.use(authenticateJWT);
router.use(requireRestaurantAccess);

// Dashboard analytics
router.get('/analytics', getDashboardAnalytics);

// Restaurant Profile
router.get('/profile', getRestaurantProfile);
router.put('/profile', updateRestaurantProfile);

// Landing page editor
router.get('/landing', getLandingPageEditor);
router.put('/landing', updateLandingPageEditor);

// Gallery
router.get('/gallery', getGalleryImages);
router.post('/gallery', addGalleryImage);
router.delete('/gallery/:id', deleteGalleryImage);

// Menu Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Menu Items
router.get('/items', getMenuItems);
router.post('/items', createMenuItem);
router.put('/items/:id', updateMenuItem);
router.patch('/items/:id/availability', toggleItemAvailability);
router.delete('/items/:id', deleteMenuItem);

// Tables & QR Codes
router.get('/tables', getTables);
router.post('/tables', createTable);
router.post('/tables/:id/regenerate-qr', regenerateTableQRToken);
router.delete('/tables/:id', deleteTable);

// Orders
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Kitchen queue
router.get('/kitchen', getKitchenQueue);

// Discounts
router.get('/discounts', getDiscounts);
router.post('/discounts', createDiscount);
router.delete('/discounts/:id', deleteDiscount);

// Team
router.get('/team', getTeamMembers);
router.post('/team', createTeamMember);

// Reviews
router.get('/reviews', getReviews);
router.patch('/reviews/:id/approval', toggleReviewApproval);

// Customers
router.get('/customers', getCustomers);

// Modifiers
router.get('/modifiers', getModifierGroups);
router.post('/modifiers', createModifierGroup);
router.delete('/modifiers/:id', deleteModifierGroup);
router.post('/modifiers/options', addModifierOption);
router.delete('/modifiers/options/:id', deleteModifierOption);

// Uploads
router.post('/upload', uploadImage.single('image'), handleImageUpload);

export default router;
