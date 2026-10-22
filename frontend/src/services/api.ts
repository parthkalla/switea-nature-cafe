const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('switea_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Public
  async getLandingPage(slug = 'switea') {
    const res = await fetch(`${API_BASE}/public/landing/${slug}`);
    if (!res.ok) throw new Error('Failed to load landing page');
    return res.json();
  },

  async getMenu(slug = 'switea') {
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

  async calculateCart(payload: { restaurantSlug: string; items: any[]; discountCode?: string }) {
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
    const token = localStorage.getItem('switea_token');
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

  async getSuperAdminUsers() {
    const res = await fetch(`${API_BASE}/super-admin/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getSuperAdminPlans() {
    const res = await fetch(`${API_BASE}/super-admin/plans`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
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
};

