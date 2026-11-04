import { Router } from 'express';
import {
  getDashboardAnalytics,
  getRestaurantProfile,
  updateRestaurantProfile,
  getLandingPageEditor,
  updateLandingPageEditor,
  getWebsiteCustomizer,
  updateWebsiteCustomizer,
  toggleWebsitePublish,
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
  freeTable,
  freeAllTables,
  getOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  createAdminPosOrder,
  getMarketplaceConnections,
  saveMarketplaceConnection,
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
  getCustomerLoyalty,
  adjustCustomerLoyalty,
  getLoyaltySettings,
  updateLoyaltySettings,
  updateMenuItemLoyalty,
  batchUpdateMenuItemLoyalty,
  getModifierGroups,
  createModifierGroup,
  deleteModifierGroup,
  addModifierOption,
  deleteModifierOption,
  sendCustomerNotification,
  getAdminNotificationHistory,
  getAdminSongRequests,
  updateAdminSongRequest,
  getAdminEventRsvps,
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

// Landing page editor & Visual Website Customizer
router.get('/landing', getLandingPageEditor);
router.put('/landing', updateLandingPageEditor);
router.get('/customizer', getWebsiteCustomizer);
router.put('/customizer', updateWebsiteCustomizer);
router.patch('/customizer/toggle-publish', toggleWebsitePublish);

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
router.patch('/items/:id/loyalty', updateMenuItemLoyalty);
router.delete('/items/:id', deleteMenuItem);

// Tables & QR Codes
router.get('/tables', getTables);
router.post('/tables', createTable);
router.post('/tables/free-all', freeAllTables);
router.post('/tables/:id/free', freeTable);
router.post('/tables/:id/regenerate-qr', regenerateTableQRToken);
router.delete('/tables/:id', deleteTable);

// Orders & POS
router.get('/orders', getOrders);
router.post('/pos/order', createAdminPosOrder);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/payment', updateOrderPaymentStatus);

// Marketplace integrations
router.get('/marketplace-connections', getMarketplaceConnections);
router.put('/marketplace-connections/:provider', saveMarketplaceConnection);

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

// Customers & Loyalty
router.get('/customers', getCustomers);
router.get('/customers/:phone/loyalty', getCustomerLoyalty);
router.post('/customers/loyalty/adjust', adjustCustomerLoyalty);
router.get('/loyalty/settings', getLoyaltySettings);
router.put('/loyalty/settings', updateLoyaltySettings);
router.post('/loyalty/batch-items', batchUpdateMenuItemLoyalty);

// Modifiers
router.get('/modifiers', getModifierGroups);
router.post('/modifiers', createModifierGroup);
router.delete('/modifiers/:id', deleteModifierGroup);
router.post('/modifiers/options', addModifierOption);
router.delete('/modifiers/options/:id', deleteModifierOption);

// Push Notifications & Community Broadcasts
router.post('/notifications/send', sendCustomerNotification);
router.get('/notifications/history', getAdminNotificationHistory);
router.get('/community/song-requests', getAdminSongRequests);
router.patch('/community/song-requests/:id', updateAdminSongRequest);
router.get('/community/rsvps', getAdminEventRsvps);

// Uploads
router.post('/upload', uploadImage.single('image'), handleImageUpload);

export default router;
