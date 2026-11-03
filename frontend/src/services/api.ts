import { getTenantSlug } from '../utils/tenantHelper';

const getApiBase = () => {
  if (typeof window === 'undefined') return '/api';
  const h = window.location.hostname.toLowerCase();
  // Local development
  if (h.includes('localhost') || h.includes('127.0.0.1')) {
    return '/api';
  }
  // If browsing from any asrockstudios.in subdomain (admin.asrockstudios.in, cafe.asrockstudios.in, etc.)
  // route all API requests to the production backend server
  if (h.endsWith('asrockstudios.in') && h !== 'roastfuze.asrockstudios.in') {
    return 'https://roastfuze.asrockstudios.in/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('roastfuze_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (typeof window !== 'undefined') {
    const slug = getTenantSlug();
    if (slug) {
      headers['X-Restaurant-Slug'] = slug;
    }
  }
  return headers;
}

export const api = {
  // Public
  async getLandingPage(slug = 'roastfuze') {
    const res = await fetch(`${API_BASE}/public/landing/${slug}`);
    if (!res.ok) throw new Error('Failed to load landing page');
    return res.json();
  },

  async getMenu(slug = 'roastfuze') {
    const res = await fetch(`${API_BASE}/public/menu/${slug}`);
    if (!res.ok) throw new Error('Failed to load menu');
    return res.json();
  },

  async getTableByToken(token: string) {
    const res = await fetch(`${API_BASE}/public/table/${token}`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to resolve table');
    }
    return res.json();
  },

  async getPublicTables(slug = 'roastfuze') {
    const res = await fetch(`${API_BASE}/public/tables?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch tables');
    return res.json();
  },

  async getLoyaltyBalance(phone: string, slug = 'roastfuze') {
    const res = await fetch(`${API_BASE}/public/loyalty/balance?phone=${encodeURIComponent(phone)}&slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text();
      let message = 'Failed to fetch loyalty balance';
      if (text) {
        try { message = JSON.parse(text).error || message; } catch { /* server returned a non-JSON error */ }
      }
      throw new Error(message);
    }
    return res.json();
  },

  async calculateCart(payload: {
    restaurantSlug: string;
    items: any[];
    discountCode?: string;
    customerPhone?: string;
    redeemFoodPoints?: number;
    redeemCoffeePoints?: number;
  }) {
    const res = await fetch(`${API_BASE}/public/cart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to calculate cart');
    return res.json();
  },

  async createOrder(payload: any) {
    const res = await fetch(`${API_BASE}/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');
    return data;
  },

  async getOrderStatus(orderToken: string) {
    const res = await fetch(`${API_BASE}/public/orders/${orderToken}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  async confirmOrderPayment(orderToken: string, payload?: { utrNumber?: string; paymentMethod?: string }) {
    const res = await fetch(`${API_BASE}/public/orders/${orderToken}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) throw new Error('Failed to record payment');
    return res.json();
  },

  async submitReview(slug: string, payload: { customerName: string; rating: number; comment: string }) {
    const res = await fetch(`${API_BASE}/public/reviews/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },

  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Admin
  async getAdminAnalytics(restaurantId?: string) {
    const url = restaurantId ? `${API_BASE}/admin/analytics?restaurantId=${restaurantId}` : `${API_BASE}/admin/analytics`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getAdminProfile() {
    const res = await fetch(`${API_BASE}/admin/profile`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateAdminProfile(data: any) {
    const res = await fetch(`${API_BASE}/admin/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async getLandingEditor() {
    const res = await fetch(`${API_BASE}/admin/landing`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch landing content');
    return res.json();
  },

  async updateLandingEditor(data: any) {
    const res = await fetch(`${API_BASE}/admin/landing`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update landing editor');
    return res.json();
  },

  async getWebsiteCustomizer() {
    const res = await fetch(`${API_BASE}/admin/customizer`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch website customizer data');
    return res.json();
  },

  async updateWebsiteCustomizer(data: any) {
    const res = await fetch(`${API_BASE}/admin/customizer`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save website customization');
    return res.json();
  },

  async toggleWebsitePublish() {
    const res = await fetch(`${API_BASE}/admin/customizer/toggle-publish`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle publish status');
    return res.json();
  },

  async getAdminCategories() {
    const res = await fetch(`${API_BASE}/admin/categories`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async createCategory(data: any) {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async updateCategory(id: string, data: any) {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async deleteCategory(id: string) {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },

  async getAdminMenuItems() {
    const res = await fetch(`${API_BASE}/admin/items`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  async createMenuItem(data: any) {
    const res = await fetch(`${API_BASE}/admin/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create item');
    return res.json();
  },

  async updateMenuItem(id: string, data: any) {
    const res = await fetch(`${API_BASE}/admin/items/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update item');
    return res.json();
  },

  async toggleItemAvailability(id: string) {
    const res = await fetch(`${API_BASE}/admin/items/${id}/availability`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle availability');
    return res.json();
  },

  async deleteMenuItem(id: string) {
    const res = await fetch(`${API_BASE}/admin/items/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete item');
    return res.json();
  },

  async getAdminTables() {
    const res = await fetch(`${API_BASE}/admin/tables`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tables');
    return res.json();
  },

  async createTable(data: any) {
    const res = await fetch(`${API_BASE}/admin/tables`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create table');
    return res.json();
  },

  async regenerateTableQR(tableId: string) {
    const res = await fetch(`${API_BASE}/admin/tables/${tableId}/regenerate-qr`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to regenerate QR');
    return res.json();
  },

  async deleteTable(tableId: string) {
    const res = await fetch(`${API_BASE}/admin/tables/${tableId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete table');
    return res.json();
  },

  async freeTable(tableId: string) {
    const res = await fetch(`${API_BASE}/admin/tables/${tableId}/free`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to free table');
    return res.json();
  },

  async freeAllTables() {
    const res = await fetch(`${API_BASE}/admin/tables/free-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to free all tables');
    return res.json();
  },

  async getAdminOrders(status?: string, search?: string) {
    let url = `${API_BASE}/admin/orders?`;
    if (status) url += `status=${status}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async updateOrderStatus(id: string, status: string, rejectionReason?: string) {
    const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, rejectionReason }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async updateOrderPaymentStatus(id: string, paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED') {
    const res = await fetch(`${API_BASE}/admin/orders/${id}/payment`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ paymentStatus }),
    });
    if (!res.ok) throw new Error('Failed to update payment status');
    return res.json();
  },

  async getMarketplaceConnections() {
    const res = await fetch(`${API_BASE}/admin/marketplace-connections`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load marketplace connections');
    return res.json();
  },

  async saveMarketplaceConnection(provider: 'SWIGGY' | 'ZOMATO', data: any) {
    const res = await fetch(`${API_BASE}/admin/marketplace-connections/${provider}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save marketplace connection');
    return result;
  },

  async getKitchenQueue() {
    const res = await fetch(`${API_BASE}/admin/kitchen`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch kitchen queue');
    return res.json();
  },

  async getDiscounts() {
    const res = await fetch(`${API_BASE}/admin/discounts`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch discounts');
    return res.json();
  },

  async createDiscount(data: any) {
    const res = await fetch(`${API_BASE}/admin/discounts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create discount');
    return res.json();
  },

  async deleteDiscount(id: string) {
    const res = await fetch(`${API_BASE}/admin/discounts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete discount');
    return res.json();
  },

  async getTeamMembers() {
    const res = await fetch(`${API_BASE}/admin/team`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch team');
    return res.json();
  },

  async createTeamMember(data: any) {
    const res = await fetch(`${API_BASE}/admin/team`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add staff');
    return res.json();
  },

  async getGallery() {
    const res = await fetch(`${API_BASE}/admin/gallery`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to get gallery');
    return res.json();
  },

  async addGalleryImage(data: any) {
    const res = await fetch(`${API_BASE}/admin/gallery`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add image');
    return res.json();
  },

  async deleteGalleryImage(id: string) {
    const res = await fetch(`${API_BASE}/admin/gallery/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete gallery image');
    return res.json();
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('roastfuze_token');
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async getAdminCustomers() {
    const res = await fetch(`${API_BASE}/admin/customers`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async getCustomerLoyalty(phone: string) {
    const res = await fetch(`${API_BASE}/admin/customers/${encodeURIComponent(phone)}/loyalty`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch customer loyalty');
    return res.json();
  },

  async adjustCustomerLoyalty(payload: {
    customerPhone: string;
    customerName?: string;
    pointsType: 'FOOD' | 'COFFEE';
    amount: number;
    reason?: string;
    description?: string;
  }) {
    const res = await fetch(`${API_BASE}/admin/customers/loyalty/adjust`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to adjust loyalty points');
    return data;
  },

  async getLoyaltySettings() {
    const res = await fetch(`${API_BASE}/admin/loyalty/settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load loyalty settings');
    return res.json();
  },

  async updateLoyaltySettings(payload: {
    isLoyaltyEnabled?: boolean;
    loyaltyPerOrderPoints?: number;
    loyaltyFoodSpendPerPoint?: number;
    loyaltyCoffeeSpendPerPoint?: number;
    loyaltyPointValue?: number;
    loyaltyMinOrderAmount?: number;
  }) {
    const res = await fetch(`${API_BASE}/admin/loyalty/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update loyalty settings');
    return data;
  },

  async updateMenuItemLoyalty(id: string, loyaltyPoints: number) {
    const res = await fetch(`${API_BASE}/admin/items/${id}/loyalty`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ loyaltyPoints }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update item loyalty points');
    return data;
  },

  async batchUpdateMenuItemLoyalty(payload: {
    updates?: Array<{ id: string; loyaltyPoints: number }>;
    categoryId?: string;
    setAllPoints?: number;
  }) {
    const res = await fetch(`${API_BASE}/admin/loyalty/batch-items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to batch update loyalty points');
    return data;
  },

  async getAdminModifiers() {
    const res = await fetch(`${API_BASE}/admin/modifiers`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch modifiers');
    return res.json();
  },

  async createModifierGroup(data: any) {
    const res = await fetch(`${API_BASE}/admin/modifiers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create modifier group');
    return res.json();
  },

  async deleteModifierGroup(id: string) {
    const res = await fetch(`${API_BASE}/admin/modifiers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete modifier group');
    return res.json();
  },

  async addModifierOption(data: any) {
    const res = await fetch(`${API_BASE}/admin/modifiers/options`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add modifier option');
    return res.json();
  },

  async deleteModifierOption(id: string) {
    const res = await fetch(`${API_BASE}/admin/modifiers/options/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete modifier option');
    return res.json();
  },

  // Super Admin
  async getSuperAdminOverview() {
    const res = await fetch(`${API_BASE}/super-admin/overview`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch super admin overview');
    return res.json();
  },

  async getSuperAdminRestaurants() {
    const res = await fetch(`${API_BASE}/super-admin/restaurants`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },

  async createRestaurant(data: any) {
    const res = await fetch(`${API_BASE}/super-admin/restaurants`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create restaurant');
    return res.json();
  },

  async toggleRestaurantStatus(id: string) {
    const res = await fetch(`${API_BASE}/super-admin/restaurants/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle status');
    return res.json();
  },

  async updateSuperAdminRestaurant(id: string, data: any) {
    const res = await fetch(`${API_BASE}/super-admin/restaurants/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update restaurant');
    return res.json();
  },

  async deleteRestaurant(id: string) {
    const res = await fetch(`${API_BASE}/super-admin/restaurants/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (res.ok) return { success: true };
      throw new Error(`Server error (${res.status}): Failed to delete restaurant`);
    }
    if (!res.ok) throw new Error(data.error || 'Failed to delete restaurant');
    return data;
  },

  async restoreRestaurant(id: string) {
    const res = await fetch(`${API_BASE}/super-admin/restaurants/${id}/restore`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (res.ok) return { success: true };
      throw new Error(`Server error (${res.status}): Failed to restore restaurant`);
    }
    if (!res.ok) throw new Error(data.error || 'Failed to restore restaurant');
    return data;
  },

  async getSuperAdminUsers() {
    const res = await fetch(`${API_BASE}/super-admin/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async resetUserPassword(userId: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/super-admin/users/${userId}/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (res.ok) return { success: true };
      throw new Error(`Server error (${res.status}): Please check backend connection.`);
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to change password');
    return resData;
  },

  async getSuperAdminPlans() {
    const res = await fetch(`${API_BASE}/super-admin/plans`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  },

  async updateSubscriptionPlan(planId: string, data: any) {
    const res = await fetch(`${API_BASE}/super-admin/plans/${planId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to update plan');
    return resData;
  },

  async createSubscriptionPlan(data: any) {
    const res = await fetch(`${API_BASE}/super-admin/plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to create plan');
    return resData;
  },

  async getSuperAdminAuditLogs() {
    const res = await fetch(`${API_BASE}/super-admin/audit-logs`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getSuperAdminAnalytics() {
    const res = await fetch(`${API_BASE}/super-admin/analytics`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch platform analytics');
    return res.json();
  },

  async getSuperAdminSettings() {
    const res = await fetch(`${API_BASE}/super-admin/settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch platform settings');
    return res.json();
  },

  async updateSuperAdminSettings(data: any) {
    const res = await fetch(`${API_BASE}/super-admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update platform settings');
    return res.json();
  },

  // Community & Events
  async getCommunityEvents() {
    const res = await fetch(`${API_BASE}/public/community/events`);
    if (!res.ok) throw new Error('Failed to fetch community events');
    return res.json();
  },

  async createSongRequest(data: any) {
    const res = await fetch(`${API_BASE}/public/community/song-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit song request');
    return res.json();
  },

  async getSongRequests() {
    const res = await fetch(`${API_BASE}/public/community/song-requests`);
    if (!res.ok) throw new Error('Failed to fetch song requests');
    return res.json();
  },

  async createEventRsvp(data: any) {
    const res = await fetch(`${API_BASE}/public/community/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit RSVP');
    return res.json();
  },

  // Admin Push Notifications & Broadcasts
  async sendCustomerNotification(payload: any) {
    const res = await fetch(`${API_BASE}/admin/notifications/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send push notification');
    return res.json();
  },

  async getAdminNotificationHistory() {
    const res = await fetch(`${API_BASE}/admin/notifications/history`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load notification history');
    return res.json();
  },

  async getAdminSongRequests() {
    const res = await fetch(`${API_BASE}/admin/community/song-requests`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load song requests');
    return res.json();
  },

  async updateAdminSongRequest(id: string, status: string) {
    const res = await fetch(`${API_BASE}/admin/community/song-requests/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update song request');
    return res.json();
  },

  async getAdminEventRsvps() {
    const res = await fetch(`${API_BASE}/admin/community/rsvps`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load RSVPs');
    return res.json();
  },

  async getAdminReviews() {
    const res = await fetch(`${API_BASE}/admin/reviews`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load reviews');
    return res.json();
  },

  async toggleReviewApproval(id: string) {
    const res = await fetch(`${API_BASE}/admin/reviews/${id}/approval`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle review approval');
    return res.json();
  },
};

