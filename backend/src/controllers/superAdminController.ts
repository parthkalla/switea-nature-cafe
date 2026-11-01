import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { THEME_PRESETS, ThemeTemplateId } from '../utils/themePresets';

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
      themeTemplate = 'GARDEN_CAFE',
    } = req.body;

    if (!name || !slug || !ownerEmail) {
      return res.status(400).json({ error: 'Restaurant name, slug, and owner email are required.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const selectedThemeId = (themeTemplate in THEME_PRESETS ? themeTemplate : 'GARDEN_CAFE') as ThemeTemplateId;
    const theme = THEME_PRESETS[selectedThemeId];

    // Check slug collision
    const existing = await prisma.restaurant.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(400).json({ error: 'Restaurant slug already taken.' });
    }

    // Find or create owner
    let owner = await prisma.user.findUnique({ where: { email: ownerEmail.toLowerCase().trim() } });
    const passwordHash = await bcrypt.hash(ownerPassword || 'CafeOwner@2026!', 10);
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          email: ownerEmail.toLowerCase().trim(),
          name: ownerName || `${name} Owner`,
          phone: phone || null,
          role: 'OWNER',
          passwordHash,
          status: 'ACTIVE',
        },
      });
    } else {
      // If owner already exists, ensure their password is set to the one configured during onboarding
      owner = await prisma.user.update({
        where: { id: owner.id },
        data: {
          passwordHash,
          ...(ownerName ? { name: ownerName } : {}),
          ...(phone ? { phone } : {}),
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
        tagLine: theme.tagLine,
        themeTemplate: selectedThemeId,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        bgCream: theme.bgCream,
        photoLayout: 'bento',
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
            heroSubtitle: theme.heroSubtitle,
            aboutTitle: theme.aboutTitle,
            aboutText: theme.aboutText,
            aboutHighlight1: theme.aboutHighlights[0],
            aboutHighlight2: theme.aboutHighlights[1],
            aboutHighlight3: theme.aboutHighlights[2],
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

    // Populate theme starter categories and items so menu is immediately live!
    if (theme.starterCategories && theme.starterCategories.length > 0) {
      for (let cIdx = 0; cIdx < theme.starterCategories.length; cIdx++) {
        const catDef = theme.starterCategories[cIdx];
        const category = await prisma.menuCategory.create({
          data: {
            restaurantId: restaurant.id,
            name: catDef.name,
            slug: `${catDef.slug}-${cleanSlug}`,
            itemType: catDef.itemType,
            description: catDef.description,
            image: catDef.image,
            displayOrder: cIdx + 1,
            isActive: true,
          },
        });

        for (let iIdx = 0; iIdx < catDef.items.length; iIdx++) {
          const itm = catDef.items[iIdx];
          await prisma.menuItem.create({
            data: {
              restaurantId: restaurant.id,
              categoryId: category.id,
              name: itm.name,
              slug: `${itm.slug}-${cleanSlug}`,
              description: itm.description,
              price: itm.price,
              isVeg: itm.isVeg,
              isAvailable: true,
              isBestseller: itm.isBestseller,
              image: itm.image,
              displayOrder: iIdx + 1,
            },
          });
        }
      }
    }

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

    return res.status(201).json({
      success: true,
      restaurant,
      onboarding: {
        menuSubdomainUrl: `https://${cleanSlug}.asrockstudios.in`,
        menuDirectUrl: `https://roastfuze.asrockstudios.in/menu/${cleanSlug}`,
        adminUrl: `https://${cleanSlug}.asrockstudios.in/admin/login`,
        ownerEmail: owner.email,
        ownerName: owner.name,
        tempPassword: ownerPassword || 'SwiteaOwner2026!',
      },
    });
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

// Soft-delete / Archive Cafe without destroying DB historical data
export async function deleteRestaurant(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { landingContent: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    // 1. Unpublish public landing page
    if (restaurant.landingContent) {
      await prisma.landingPageContent.update({
        where: { id: restaurant.landingContent.id },
        data: { isPublished: false },
      });
    }

    // 2. Archive and free up slug so name/slug can be reused if desired
    const originalSlug = restaurant.slug;
    const archivedSlug = originalSlug.includes('-deleted-')
      ? originalSlug
      : `${originalSlug}-deleted-${Date.now().toString().slice(-6)}`;

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isOpen: false,
        isOrderingEnabled: false,
        slug: archivedSlug,
      },
    });

    // 3. Log audit action
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_DELETE_RESTAURANT',
        entityType: 'Restaurant',
        entityId: restaurant.id,
        restaurantId: restaurant.id,
        details: JSON.stringify({
          originalSlug,
          archivedSlug,
          name: restaurant.name,
        }),
      },
    });

    return res.json({
      success: true,
      message: `Cafe '${restaurant.name}' deleted successfully. Public website and subdomains taken offline. Database records preserved safely.`,
      restaurant: updated,
    });
  } catch (err: any) {
    console.error('deleteRestaurant error:', err);
    return res.status(500).json({ error: 'Failed to delete restaurant.' });
  }
}

// Restore an archived / deleted cafe
export async function restoreRestaurant(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { landingContent: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    // Attempt to recover original clean slug
    let targetSlug = restaurant.slug.replace(/-deleted-\d+$/, '');
    const existing = await prisma.restaurant.findUnique({ where: { slug: targetSlug } });
    if (existing && existing.id !== restaurant.id) {
      targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        isOpen: true,
        isOrderingEnabled: true,
        slug: targetSlug,
      },
    });

    if (restaurant.landingContent) {
      await prisma.landingPageContent.update({
        where: { id: restaurant.landingContent.id },
        data: { isPublished: true },
      });
    }

    return res.json({
      success: true,
      message: `Cafe '${restaurant.name}' restored successfully.`,
      restaurant: updated,
    });
  } catch (err: any) {
    console.error('restoreRestaurant error:', err);
    return res.status(500).json({ error: 'Failed to restore restaurant.' });
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

export async function updateSubscriptionPlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, price, billingInterval, maxTables, maxItems, features, isActive } = req.body;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: name !== undefined ? name : plan.name,
        price: price !== undefined ? parseFloat(price) : plan.price,
        billingInterval: billingInterval !== undefined ? billingInterval : plan.billingInterval,
        maxTables: maxTables !== undefined ? parseInt(maxTables, 10) : plan.maxTables,
        maxItems: maxItems !== undefined ? parseInt(maxItems, 10) : plan.maxItems,
        features: features !== undefined ? (typeof features === 'string' ? features : JSON.stringify(features)) : plan.features,
        isActive: isActive !== undefined ? !!isActive : plan.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_UPDATED_PLAN',
        entityType: 'SubscriptionPlan',
        entityId: id,
        details: JSON.stringify({ name: updated.name, price: updated.price, billingInterval: updated.billingInterval }),
      },
    });

    return res.json({ success: true, plan: updated });
  } catch (err: any) {
    console.error('updateSubscriptionPlan error:', err);
    return res.status(500).json({ error: 'Failed to update plan.' });
  }
}

export async function createSubscriptionPlan(req: Request, res: Response) {
  try {
    const { name, slug, price, billingInterval = 'MONTHLY', maxTables = 20, maxItems = 150, features = [] } = req.body;

    if (!name || !slug || price === undefined) {
      return res.status(400).json({ error: 'Name, slug, and price are required.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.subscriptionPlan.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(400).json({ error: 'Plan with this slug already exists.' });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        slug: cleanSlug,
        price: parseFloat(price),
        billingInterval: billingInterval.toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        maxTables: parseInt(maxTables, 10),
        maxItems: parseInt(maxItems, 10),
        features: typeof features === 'string' ? features : JSON.stringify(features),
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_CREATED_PLAN',
        entityType: 'SubscriptionPlan',
        entityId: plan.id,
        details: JSON.stringify({ name: plan.name, price: plan.price, billingInterval: plan.billingInterval }),
      },
    });

    return res.status(201).json({ success: true, plan });
  } catch (err: any) {
    console.error('createSubscriptionPlan error:', err);
    return res.status(500).json({ error: 'Failed to create plan.' });
  }
}

export async function resetUserPassword(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'SUPER_ADMIN_RESET_PASSWORD',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({ targetEmail: user.email }),
      },
    });

    return res.json({ success: true, message: `Password for ${user.email} updated successfully.` });
  } catch (err: any) {
    console.error('resetUserPassword error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
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
  platformName: 'RoastFuze Restaurant Operating System',
  supportEmail: 'support@roastfuze.com',
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

