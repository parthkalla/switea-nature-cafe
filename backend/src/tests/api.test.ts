import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../index';
import prisma from '../config/db';

describe('RoastFuze Multi-Tenant SaaS Integration & Regression Tests', () => {
  let superAdminToken: string;
  let ownerToken: string;

  beforeAll(async () => {
    // Ensure parth-cafe exists, is active and published for regression tests
    const parthRecord = await prisma.restaurant.findFirst({
      where: { OR: [{ slug: 'parth-cafe' }, { name: { contains: 'Parth' } }] },
    });
    if (parthRecord) {
      await prisma.restaurant.update({
        where: { id: parthRecord.id },
        data: { slug: 'parth-cafe', isDeleted: false, isOpen: true, isOrderingEnabled: true, themeTemplate: 'GARDEN_CAFE' },
      });
      await prisma.landingPageContent.updateMany({
        where: { restaurantId: parthRecord.id },
        data: { isPublished: true },
      });
    }
  });

  afterAll(async () => {
    if (server.listening) {
      server.close();
    }
    await prisma.$disconnect();
  });

  // 1. System Health
  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // 2. Authentication: Super Admin
  it('POST /api/auth/login should authenticate Super Admin (admin@asrockstudios.in)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@asrockstudios.in', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    superAdminToken = res.body.token;
  });

  // 3. Authentication: Cafe Owner
  it('POST /api/auth/login should authenticate Cafe Owner (dheeraj@asrockstudios.in)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dheeraj@asrockstudios.in', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('OWNER');
    ownerToken = res.body.token;
  });

  it('POST /api/auth/login should reject invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@asrockstudios.in', password: 'WrongPassword' });

    expect(res.status).toBe(401);
  });

  // 4. Public Website Routing: Existing RoastFuze Cafe
  it('GET /api/public/landing/roastfuze should return 200 with RoastFuze details', async () => {
    const res = await request(app).get('/api/public/landing/roastfuze');
    expect(res.status).toBe(200);
    expect(res.body.restaurant.slug).toBe('roastfuze');
    expect(res.body.restaurant.name).toContain('RoastFuze');
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('GET /api/public/menu/roastfuze should return 200 with categories and items', async () => {
    const res = await request(app).get('/api/public/menu/roastfuze');
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
    const cat = res.body.categories[0];
    expect(cat.items.length).toBeGreaterThan(0);
  });

  // 5. Public Website Routing: Custom Onboarded Cafe (parth-cafe)
  it('GET /api/public/landing/parth-cafe should return 200 with Garden Cafe template', async () => {
    const res = await request(app).get('/api/public/landing/parth-cafe');
    expect(res.status).toBe(200);
    expect(res.body.restaurant.slug).toBe('parth-cafe');
    expect(res.body.restaurant.themeTemplate).toBe('GARDEN_CAFE');
    expect(res.body.restaurant.name.toLowerCase()).toContain('parth');
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('GET /api/public/menu/parth-cafe should return 200 with Parth Garden menu items', async () => {
    const res = await request(app).get('/api/public/menu/parth-cafe');
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  // 6. Unknown / Nonexistent Restaurant Handling (Regression check for req 10)
  it('GET /api/public/landing/unknown-cafe-slug-xyz should return 404', async () => {
    const res = await request(app).get('/api/public/landing/unknown-cafe-slug-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/public/menu/unknown-cafe-slug-xyz should return 404', async () => {
    const res = await request(app).get('/api/public/menu/unknown-cafe-slug-xyz');
    expect(res.status).toBe(404);
  });

  // 7. Tenant Isolation & Menu Separation
  it('Tenant Isolation: Parth Garden Cafe dishes should not bleed into RoastFuze menu', async () => {
    const [roastRes, parthRes] = await Promise.all([
      request(app).get('/api/public/menu/roastfuze'),
      request(app).get('/api/public/menu/parth-cafe'),
    ]);

    const roastCategories = roastRes.body.categories.map((c: any) => c.name);
    const parthCategories = parthRes.body.categories.map((c: any) => c.name);

    expect(roastCategories).not.toContain('Ceremonial Matcha & Teas');
    expect(parthCategories).toContain('Ceremonial Matcha & Teas');
  });

  // 8. Protected Admin Endpoints & Security
  it('Unauthenticated requests to /api/admin/* should be rejected with 401', async () => {
    const res = await request(app).get('/api/admin/customizer');
    expect(res.status).toBe(401);
  });

  it('Authenticated Owner can access /api/admin/customizer', async () => {
    const res = await request(app)
      .get('/api/admin/customizer')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.restaurant).toBeDefined();
    expect(res.body.landingContent).toBeDefined();
  });

  // 9. Visual Website Customizer: Updating Branding & Theme
  it('Owner can update website customization via PUT /api/admin/customizer', async () => {
    const res = await request(app)
      .put('/api/admin/customizer')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        restaurant: {
          tagLine: 'Artisan Roasts & Musical Sunset Balcony',
        },
        landingContent: {
          heroTitle: 'RoastFuze Coffee Bar',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 10. Super Admin Governance
  it('Super Admin can access /api/super-admin/overview and view platform GMV', async () => {
    const res = await request(app)
      .get('/api/super-admin/overview')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalRestaurants).toBeGreaterThanOrEqual(1);
  });
});
