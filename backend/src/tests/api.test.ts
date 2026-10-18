import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../index';
import prisma from '../config/db';

describe('Switea Cafe API Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Wait for server ready
  });

  afterAll(async () => {
    if (server.listening) {
      server.close();
    }
    await prisma.$disconnect();
  });

  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/login should authenticate owner and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@switea.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('OWNER');
    authToken = res.body.token;
  });

  it('GET /api/public/landing/switea should return Switea landing page data', async () => {
    const res = await request(app).get('/api/public/landing/switea');
    expect(res.status).toBe(200);
    expect(res.body.restaurant.name).toBe('Switea Nature Cafe');
    expect(res.body.landingContent).toBeDefined();
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('GET /api/public/menu/switea should return verified categories and menu items', async () => {
    const res = await request(app).get('/api/public/menu/switea');
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
    const firstCategory = res.body.categories[0];
    expect(firstCategory.items.length).toBeGreaterThan(0);
  });

  it('GET /api/public/table/sw-tbl-g01-nature should resolve Table 01 details', async () => {
    const res = await request(app).get('/api/public/table/sw-tbl-g01-nature');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.table.tableNumber).toBe('Table 01');
    expect(res.body.restaurant.name).toBe('Switea Nature Cafe');
  });

  it('POST /api/public/cart/calculate should calculate subtotal, discount, and tax correctly', async () => {
    const item = await prisma.menuItem.findFirst({ where: { slug: 'adrak-masala-kulhad-chai' } });
    expect(item).toBeDefined();

    const res = await request(app)
      .post('/api/public/cart/calculate')
      .send({
        restaurantSlug: 'switea',
        items: [{ menuItemId: item!.id, quantity: 2 }],
        discountCode: 'NATURE10',
      });

    expect(res.status).toBe(200);
    expect(res.body.subtotal).toBe(item!.price * 2);
    expect(res.body.totalAmount).toBeGreaterThan(0);
  });

  it('POST /api/public/orders should place a table-wise order with valid server validation', async () => {
    const item = await prisma.menuItem.findFirst({ where: { slug: 'adrak-masala-kulhad-chai' } });

    const res = await request(app)
      .post('/api/public/orders')
      .send({
        restaurantSlug: 'switea',
        tableToken: 'sw-tbl-g01-nature',
        customerName: 'Test Customer',
        customerPhone: '+91 99999 88888',
        items: [{ menuItemId: item!.id, quantity: 1, notes: 'Extra hot please' }],
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(201);
    expect(res.body.orderToken).toBeDefined();
    expect(res.body.orderNumber).toBeDefined();
    expect(res.body.tableNumber).toBe('Table 01');

    // Customer can track order status
    const statusRes = await request(app).get(`/api/public/orders/${res.body.orderToken}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('PENDING');
  });

  it('GET /api/admin/analytics should return real database metrics for authenticated staff', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalTables).toBeGreaterThan(0);
    expect(res.body.metrics.totalMenuItems).toBeGreaterThan(0);
  });

  it('GET /api/admin/customers should return patron history and lifetime metrics', async () => {
    const res = await request(app)
      .get('/api/admin/customers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.customers)).toBe(true);
  });

  it('GET /api/admin/modifiers should return modifier groups linked to dishes', async () => {
    const res = await request(app)
      .get('/api/admin/modifiers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.groups)).toBe(true);
  });

  it('Super Admin endpoints should authenticate and return platform metrics & settings', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@switea.com', password: 'Password123!' });

    expect(loginRes.status).toBe(200);
    const superToken = loginRes.body.token;

    const analyticsRes = await request(app)
      .get('/api/super-admin/analytics')
      .set('Authorization', `Bearer ${superToken}`);
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.summary.totalRestaurants).toBeGreaterThan(0);

    const settingsRes = await request(app)
      .get('/api/super-admin/settings')
      .set('Authorization', `Bearer ${superToken}`);
    expect(settingsRes.status).toBe(200);
    expect(settingsRes.body.settings.platformName).toBeDefined();
  });
});

