import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';

export async function getPlatformOverview(req: Request, res: Response) {
  try {
    const [
      totalRestaurants,
      totalUsers,
      totalOrders,
      activeSubscriptions,
      recentRestaurants,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.restaurant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: { select: { orders: true, tables: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { email: true, name: true } },
          restaurant: { select: { name: true } },
        },
      }),
    ]);

    const allOrders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { totalAmount: true },
    });

    const platformGMV = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return res.json({
      metrics: {
        totalRestaurants,
        totalUsers,
        totalOrders,
        platformGMV: Number(platformGMV.toFixed(2)),
        activeSubscriptions,
      },
      recentRestaurants,
      recentAuditLogs,
      systemHealth: {
        status: 'HEALTHY',
        database: 'CONNECTED',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('getPlatformOverview error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform metrics.' });
  }
}

export async function getAllRestaurants(req: Request, res: Response) {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          where: { role: 'OWNER' },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { tables: true, orders: true, menuItems: true } },
      },
    });

    return res.json({ restaurants });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get restaurants.' });
  }
}

export async function createRestaurant(req: Request, res: Response) {
  try {
    const {
      name,
      slug,
      ownerEmail,
      ownerName,
      ownerPassword,
      phone,
      address,
      city = 'Jaipur',
      planSlug = 'pro',
    } = req.body;

    if (!name || !slug || !ownerEmail) {
      return res.status(400).json({ error: 'Restaurant name, slug, and owner email are required.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check slug collision
    const existing = await prisma.restaurant.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(400).json({ error: 'Restaurant slug already taken.' });
    }

    // Find or create owner
    let owner = await prisma.user.findUnique({ where: { email: ownerEmail.toLowerCase().trim() } });
    if (!owner) {
      const passwordHash = await bcrypt.hash(ownerPassword || 'SwiteaOwner2026!', 10);
      owner = await prisma.user.create({
        data: {
          email: ownerEmail.toLowerCase().trim(),
          name: ownerName || 'Restaurant Owner',
          phone: phone || null,
          role: 'OWNER',
          passwordHash,
          status: 'ACTIVE',
        },
      });
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: { slug: planSlug },
    });

    // Create restaurant and associations
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug: cleanSlug,
        phone: phone || '+91 95554 95454',
        email: ownerEmail,
        address: address || 'Jaipur, Rajasthan',
        city,
        memberships: {
          create: {
            userId: owner.id,
            role: 'OWNER',
          },
        },
        landingContent: {
          create: {
            heroTitle: name,
            heroSubtitle: 'Welcome to our premium dining experience.',
          },
        },
        subscriptions: plan
          ? {
              create: {
                planId: plan.id,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            }
          : undefined,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        restaurantId: restaurant.id,
        action: 'SUPER_ADMIN_CREATED_RESTAURANT',
        entityType: 'Restaurant',
        entityId: restaurant.id,
        details: JSON.stringify({ name: restaurant.name, slug: restaurant.slug }),
      },
    });

    return res.status(201).json({ success: true, restaurant });
  } catch (err: any) {
    console.error('createRestaurant error:', err);
    return res.status(500).json({ error: 'Failed to create restaurant.' });
  }
}

export async function toggleRestaurantStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const updated = await prisma.restaurant.update({
      where: { id },
      data: { isOpen: !restaurant.isOpen },
    });

    return res.json({ success: true, isOpen: updated.isOpen });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to toggle status.' });
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        memberships: {
          include: {
            restaurant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
}

export async function getSubscriptionPlans(req: Request, res: Response) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
    return res.json({ plans });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch plans.' });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { email: true, name: true } },
        restaurant: { select: { name: true, slug: true } },
      },
    });

    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
}

// Global Platform Analytics
export async function getPlatformAnalytics(req: Request, res: Response) {
  try {
    const [restaurants, orders, subscriptions, qrScans] = await Promise.all([
      prisma.restaurant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          isOpen: true,
          orders: {
            where: { status: { not: 'CANCELLED' } },
            select: { totalAmount: true, orderType: true },
          },
          tables: { select: { id: true } },
        },
      }),
      prisma.order.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { totalAmount: true, orderType: true, createdAt: true },
      }),
      prisma.subscription.findMany({
        include: { plan: true },
      }),
      prisma.qRScanEvent.count(),
    ]);

    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

    const dineInOrders = orders.filter((o) => o.orderType === 'DINE_IN').length;
    const takeawayOrders = orders.filter((o) => o.orderType === 'TAKEAWAY').length;
    const deliveryOrders = orders.filter((o) => o.orderType === 'DELIVERY').length;

    const restaurantPerformance = restaurants.map((r) => {
      const sales = r.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        isOpen: r.isOpen,
        totalSales: Number(sales.toFixed(2)),
        totalOrders: r.orders.length,
        totalTables: r.tables.length,
      };
    });

    // Plan distribution
    const planCounts: Record<string, number> = {};
    for (const sub of subscriptions) {
      const name = sub.plan.name;
      planCounts[name] = (planCounts[name] || 0) + 1;
    }

    return res.json({
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrdersCount: orders.length,
        totalRestaurants: restaurants.length,
        totalScans: qrScans,
        orderTypes: {
          dineIn: dineInOrders,
          takeaway: takeawayOrders,
          delivery: deliveryOrders,
        },
      },
      restaurantPerformance,
      planDistribution: planCounts,
    });
  } catch (err: any) {
    console.error('getPlatformAnalytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform analytics.' });
  }
}

// In-memory or database configuration store
let platformSettingsState = {
  platformName: 'Switea Restaurant Operating System',
  supportEmail: 'support@switea.com',
  defaultCurrency: 'INR',
  maintenanceMode: false,
  razorpayActive: true,
  razorpayMode: 'SANDBOX',
  allowNewRegistrations: true,
  defaultTrialDays: 14,
  analyticsRetentionDays: 90,
};

export async function getPlatformSettings(req: Request, res: Response) {
  try {
    return res.json({ settings: platformSettingsState });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch platform settings.' });
  }
}

export async function updatePlatformSettings(req: Request, res: Response) {
  try {
    const updates = req.body;
    platformSettingsState = { ...platformSettingsState, ...updates };

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_UPDATED_SETTINGS',
        entityType: 'SystemSettings',
        details: JSON.stringify(updates),
      },
    });

    return res.json({ success: true, settings: platformSettingsState });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update platform settings.' });
  }
}

