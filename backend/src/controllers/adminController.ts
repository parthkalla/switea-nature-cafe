import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateQRCodeDataUrl, generateQRCodeSVG, buildTableMenuUrl } from '../utils/qr';
import { emitOrderStatusUpdated, emitDeliveryPartnerAssigned, emitNewOrder } from '../realtime/socket';
import { resolveItemType } from './publicController';
import { sendLoyaltyWhatsApp } from '../services/whatsapp';
import { pushMarketplaceStatus, Marketplace } from '../services/marketplace';
import { pushActionToQueue } from './integrationController';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper to resolve live public frontend domain from incoming request
function getDynamicFrontendUrl(req: Request): string {
  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer as string).origin : '');
  if (origin && typeof origin === 'string' && origin.startsWith('http')) {
    return origin.replace(/\/$/, '');
  }
  const forwardedHost = req.headers['x-forwarded-host'] as string;
  if (forwardedHost) {
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    return `${proto}://${forwardedHost}`.replace(/\/$/, '');
  }
  const host = req.headers.host as string;
  if (host && !host.includes('localhost:5000') && !host.includes('127.0.0.1:5000')) {
    const proto = req.secure ? 'https' : 'http';
    return `${proto}://${host}`.replace(/\/$/, '');
  }
  return FRONTEND_URL;
}

// Helper to get authorized restaurant ID
function getRestaurantId(req: Request): string {
  if (req.user?.role === 'SUPER_ADMIN') {
    if (req.headers['x-restaurant-id']) return req.headers['x-restaurant-id'] as string;
    if (req.query.restaurantId) return req.query.restaurantId as string;
  }
  return (req.user?.restaurantId || (req.headers['x-restaurant-id'] as string) || req.query.restaurantId || req.params.restaurantId || '8b16826a-4c98-4c5c-b0d0-b7e9de0c859f') as string;
}

// 1. Dashboard Analytics
export async function getDashboardAnalytics(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      allOrders,
      totalTables,
      totalMenuItems,
      recentOrders,
      categoriesCount,
      qrScansCount,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          restaurantId,
          isDemo: false,
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.order.findMany({
        where: { restaurantId, isDemo: false },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          orderType: true,
        },
      }),
      prisma.table.count({ where: { restaurantId, isArchived: false } }),
      prisma.menuItem.count({ where: { restaurantId } }),
      prisma.order.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          table: { select: { tableNumber: true, name: true } },
          items: true,
        },
      }),
      prisma.menuCategory.count({ where: { restaurantId } }),
      prisma.qRScanEvent.count({
        where: { qrCode: { table: { restaurantId } } },
      }),
    ]);

    const salesToday = ordersToday
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalSales = allOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const completedOrders = allOrders.filter((o) => o.status === 'SERVED').length;
    const pendingOrders = allOrders.filter((o) => ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;
    const avgOrderValue = allOrders.length > 0 ? totalSales / (allOrders.filter((o) => o.status !== 'CANCELLED').length || 1) : 0;

    // Top selling items
    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ['itemName'],
      where: { order: { restaurantId, isDemo: false, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 6,
    });

    const topSellingItems = topItemsRaw.map((item) => ({
      name: item.itemName,
      quantity: item._sum.quantity || 0,
      revenue: item._sum.totalPrice || 0,
    }));

    // 7-day trend data for graphs
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailySalesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = allOrders.filter(
        (o) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd && o.status !== 'CANCELLED'
      );
      const daySales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      dailySalesTrend.push({
        day: daysOfWeek[d.getDay()],
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sales: Number(daySales.toFixed(2)),
        ordersCount: dayOrders.length,
      });
    }

    // Channel breakdown
    const dineInOrders = allOrders.filter((o) => o.orderType === 'DINE_IN').length;
    const takeawayOrders = allOrders.filter((o) => o.orderType === 'TAKEAWAY').length;
    const deliveryOrders = allOrders.filter((o) => o.orderType === 'DELIVERY').length;
    const totalChannels = allOrders.length || 1;

    const channelBreakdown = {
      dineIn: { count: dineInOrders, percentage: Math.round((dineInOrders / totalChannels) * 100) },
      takeaway: { count: takeawayOrders, percentage: Math.round((takeawayOrders / totalChannels) * 100) },
      delivery: { count: deliveryOrders, percentage: Math.round((deliveryOrders / totalChannels) * 100) },
    };

    // Category distribution
    const categoriesWithItems = await prisma.menuCategory.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: {
            orderItems: {
              where: { order: { isDemo: false, status: { not: 'CANCELLED' } } },
            },
          },
        },
      },
    });

    const categoryBreakdown = categoriesWithItems.map((cat) => {
      let revenue = 0;
      let itemsSold = 0;
      for (const item of cat.items) {
        for (const oi of item.orderItems) {
          revenue += oi.totalPrice;
          itemsSold += oi.quantity;
        }
      }
      return {
        name: cat.name,
        revenue: Number(revenue.toFixed(2)),
        itemsSold,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return res.json({
      metrics: {
        salesToday: Number(salesToday.toFixed(2)),
        ordersTodayCount: ordersToday.length,
        totalSales: Number(totalSales.toFixed(2)),
        totalOrdersCount: allOrders.length,
        pendingOrders,
        completedOrders,
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        totalTables,
        totalMenuItems,
        categoriesCount,
        qrScansCount,
      },
      dailySalesTrend,
      channelBreakdown,
      categoryBreakdown,
      recentOrders,
      topSellingItems,
    });
  } catch (err: any) {
    console.error('getDashboardAnalytics error:', err);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
}

// 2. Profile
export async function getRestaurantProfile(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    return res.json({ restaurant });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get profile.' });
  }
}

export async function updateRestaurantProfile(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const {
      name,
      description,
      tagLine,
      logo,
      coverImage,
      address,
      city,
      state,
      postalCode,
      phone,
      email,
      mapLink,
      whatsappNumber,
      upiId,
      openingHours,
      currency,
      currencySymbol,
      timezone,
      taxPercent,
      isOrderingEnabled,
      isPayAtCounterOnly,
      isOpen,
      themeTemplate,
      primaryColor,
      accentColor,
      isLoyaltyEnabled,
      loyaltyPerOrderPoints,
      loyaltyFoodSpendPerPoint,
      loyaltyCoffeeSpendPerPoint,
      loyaltyPointValue,
      loyaltyMinOrderAmount,
    } = req.body;

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name,
        description,
        tagLine,
        themeTemplate: themeTemplate !== undefined ? String(themeTemplate).trim() : undefined,
        primaryColor: primaryColor !== undefined ? String(primaryColor).trim() : undefined,
        accentColor: accentColor !== undefined ? String(accentColor).trim() : undefined,
        isLoyaltyEnabled: isLoyaltyEnabled !== undefined ? Boolean(isLoyaltyEnabled) : undefined,
        loyaltyPerOrderPoints: loyaltyPerOrderPoints !== undefined ? Math.max(0, parseInt(String(loyaltyPerOrderPoints), 10) || 0) : undefined,
        loyaltyFoodSpendPerPoint: loyaltyFoodSpendPerPoint !== undefined ? Math.max(0.1, parseFloat(String(loyaltyFoodSpendPerPoint)) || 10.0) : undefined,
        loyaltyCoffeeSpendPerPoint: loyaltyCoffeeSpendPerPoint !== undefined ? Math.max(0.1, parseFloat(String(loyaltyCoffeeSpendPerPoint)) || 10.0) : undefined,
        loyaltyPointValue: loyaltyPointValue !== undefined ? Math.max(0.01, parseFloat(String(loyaltyPointValue)) || 1.0) : undefined,
        loyaltyMinOrderAmount: loyaltyMinOrderAmount !== undefined ? Math.max(0, parseFloat(String(loyaltyMinOrderAmount)) || 0) : undefined,
        logo,
        coverImage,
        address,
        city,
        state,
        postalCode,
        phone,
        email,
        mapLink,
        whatsappNumber,
        upiId: upiId !== undefined ? String(upiId).trim() : undefined,
        openingHours,
        currency,
        currencySymbol,
        timezone,
        taxPercent: taxPercent !== undefined ? Number(taxPercent) : undefined,
        isOrderingEnabled: isOrderingEnabled !== undefined ? Boolean(isOrderingEnabled) : undefined,
        isPayAtCounterOnly: isPayAtCounterOnly !== undefined ? Boolean(isPayAtCounterOnly) : undefined,
        isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
      },
    });

    return res.json({ success: true, restaurant: updated });
  } catch (err: any) {
    console.error('updateRestaurantProfile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

// 3. Landing Page Editor
export async function getLandingPageEditor(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const content = await prisma.landingPageContent.findUnique({
      where: { restaurantId },
    });
    return res.json({ content });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load landing content.' });
  }
}

export async function updateLandingPageEditor(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = req.body;

    const content = await prisma.landingPageContent.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    return res.json({ success: true, content });
  } catch (err: any) {
    console.error('updateLandingPageEditor error:', err);
    return res.status(500).json({ error: 'Failed to update landing page.' });
  }
}

// Unified Visual Website Customizer
export async function getWebsiteCustomizer(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const [restaurant, landingContent] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          id: true,
          name: true,
          slug: true,
          tagLine: true,
          themeTemplate: true,
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          bgCream: true,
          photoLayout: true,
          description: true,
          logo: true,
          coverImage: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          phone: true,
          email: true,
          whatsappNumber: true,
          mapLink: true,
          openingHours: true,
          isOpen: true,
        },
      }),
      prisma.landingPageContent.findUnique({
        where: { restaurantId },
      }),
    ]);
    return res.json({ restaurant, landingContent });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load website customizer data.' });
  }
}

export async function updateWebsiteCustomizer(req: Request, res: Response) {
  try {
    let restaurantId = getRestaurantId(req);
    let existingRest = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existingRest || existingRest.isDeleted) {
      const headerSlug = ((req.headers['x-restaurant-slug'] || req.query.slug) as string)?.toLowerCase().trim();
      if (headerSlug && headerSlug !== 'all') {
        const bySlug = await prisma.restaurant.findUnique({ where: { slug: headerSlug } });
        if (bySlug && !bySlug.isDeleted) {
          restaurantId = bySlug.id;
          existingRest = bySlug;
        }
      }
    }
    if (!existingRest || existingRest.isDeleted) {
      const fallback = await prisma.restaurant.findFirst({
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
      });
      if (fallback) {
        restaurantId = fallback.id;
        existingRest = fallback;
      }
    }

    if (!existingRest) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    const { restaurant: restData, landingContent: landingData, isPublished } = req.body;

    await prisma.$transaction(async (tx) => {
      if (restData) {
        await tx.restaurant.update({
          where: { id: restaurantId },
          data: {
            name: restData.name,
            tagLine: restData.tagLine,
            themeTemplate: restData.themeTemplate,
            primaryColor: restData.primaryColor,
            secondaryColor: restData.secondaryColor,
            accentColor: restData.accentColor,
            bgCream: restData.bgCream,
            photoLayout: restData.photoLayout,
            description: restData.description,
            logo: restData.logo,
            coverImage: restData.coverImage,
            address: restData.address,
            city: restData.city,
            phone: restData.phone,
            email: restData.email,
            whatsappNumber: restData.whatsappNumber,
            mapLink: restData.mapLink,
            openingHours: restData.openingHours,
            isOpen: restData.isOpen !== undefined ? Boolean(restData.isOpen) : undefined,
          },
        });
      }

      if (landingData) {
        const publishedVal = isPublished !== undefined ? Boolean(isPublished) : landingData.isPublished;
        await tx.landingPageContent.upsert({
          where: { restaurantId },
          create: {
            restaurantId,
            heroTitle: landingData.heroTitle || 'Welcome',
            heroSubtitle: landingData.heroSubtitle,
            heroCtaText: landingData.heroCtaText || 'Explore Digital Menu',
            heroImage: landingData.heroImage,
            aboutTitle: landingData.aboutTitle || 'Our Story',
            aboutText: landingData.aboutText,
            aboutHighlight1: landingData.aboutHighlight1 || 'Fresh Craft',
            aboutHighlight2: landingData.aboutHighlight2 || 'Cozy Ambiance',
            aboutHighlight3: landingData.aboutHighlight3 || 'Quality Fare',
            aboutImage: landingData.aboutImage,
            announcementText: landingData.announcementText,
            announcementActive: landingData.announcementActive !== undefined ? Boolean(landingData.announcementActive) : true,
            instagramUrl: landingData.instagramUrl,
            facebookUrl: landingData.facebookUrl,
            mapEmbedUrl: landingData.mapEmbedUrl,
            metaTitle: landingData.metaTitle || 'Restaurant & Cafe',
            metaDescription: landingData.metaDescription,
            isPublished: publishedVal !== undefined ? publishedVal : true,
          },
          update: {
            ...landingData,
            isPublished: publishedVal !== undefined ? publishedVal : undefined,
          },
        });
      }
    });

    return res.json({ success: true, message: 'Website customized successfully!' });
  } catch (err: any) {
    console.error('updateWebsiteCustomizer error:', err);
    return res.status(500).json({ error: 'Failed to update website customization.' });
  }
}

export async function toggleWebsitePublish(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const content = await prisma.landingPageContent.findUnique({ where: { restaurantId } });
    const current = content ? content.isPublished : false;
    const updated = await prisma.landingPageContent.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        heroTitle: 'Welcome',
        isPublished: !current,
      },
      update: {
        isPublished: !current,
      },
    });
    return res.json({ success: true, isPublished: updated.isPublished });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to toggle publish status.' });
  }
}

// 4. Gallery Images
export async function getGalleryImages(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const images = await prisma.galleryImage.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
    });
    return res.json({ images });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get gallery.' });
  }
}

export async function addGalleryImage(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { title, imageUrl, displayOrder } = req.body;

    const img = await prisma.galleryImage.create({
      data: {
        restaurantId,
        title: title || 'Cafe Moment',
        imageUrl,
        displayOrder: displayOrder ? Number(displayOrder) : 0,
      },
    });
    return res.status(201).json({ success: true, image: img });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add image.' });
  }
}

export async function deleteGalleryImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.galleryImage.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete image.' });
  }
}

// 5. Menu Categories
export async function getCategories(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { items: true } },
      },
    });
    return res.json({ categories });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get categories.' });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { name, description, image, itemType = 'FOOD', displayOrder, isActive = true } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const category = await prisma.menuCategory.create({
      data: {
        restaurantId,
        name: String(name).trim(),
        slug,
        description,
        image,
        itemType: itemType === 'COFFEE' ? 'COFFEE' : 'FOOD',
        displayOrder: displayOrder ? Number(displayOrder) : 0,
        isActive: Boolean(isActive),
      },
    });

    return res.status(201).json({ success: true, category });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, image, itemType, displayOrder, isActive } = req.body;

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        name,
        description,
        image,
        itemType: itemType !== undefined ? (itemType === 'COFFEE' ? 'COFFEE' : 'FOOD') : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return res.json({ success: true, category });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update category.' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.menuCategory.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
}

// 6. Menu Items
export async function getMenuItems(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
      include: {
        category: { select: { id: true, name: true, itemType: true } },
        variants: true,
        modifierGroups: {
          include: { options: true },
        },
      },
    });
    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get menu items.' });
  }
}

export async function createMenuItem(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const {
      categoryId,
      name,
      description,
      price,
      itemType,
      isVeg = true,
      isBestseller = false,
      isSpecial = false,
      isAvailable = true,
      image,
      prepTimeMinutes = 15,
      loyaltyPoints = 0,
      variants,
      modifierGroups,
    } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        name: String(name).trim(),
        slug,
        description,
        price: Number(price),
        itemType: itemType === 'COFFEE' || itemType === 'FOOD' ? itemType : null,
        isVeg: Boolean(isVeg),
        isBestseller: Boolean(isBestseller),
        isSpecial: Boolean(isSpecial),
        isAvailable: Boolean(isAvailable),
        image,
        prepTimeMinutes: Number(prepTimeMinutes),
        loyaltyPoints: loyaltyPoints !== undefined ? Math.max(0, parseInt(String(loyaltyPoints), 10) || 0) : 0,
        variants: variants && variants.length > 0 ? {
          create: variants.map((v: any) => ({
            name: v.name,
            price: Number(v.price),
            isDefault: Boolean(v.isDefault),
          })),
        } : undefined,
        modifierGroups: modifierGroups && modifierGroups.length > 0 ? {
          create: modifierGroups.map((mg: any) => ({
            name: mg.name,
            minSelect: Number(mg.minSelect || 0),
            maxSelect: Number(mg.maxSelect || 1),
            isRequired: Boolean(mg.isRequired),
            options: {
              create: (mg.options || []).map((opt: any) => ({
                name: opt.name,
                price: Number(opt.price || 0),
                isDefault: Boolean(opt.isDefault),
              })),
            },
          })),
        } : undefined,
      },
      include: {
        variants: true,
        modifierGroups: { include: { options: true } },
      },
    });

    return res.status(201).json({ success: true, item });
  } catch (err: any) {
    console.error('createMenuItem error:', err);
    return res.status(500).json({ error: 'Failed to create menu item.' });
  }
}

export async function updateMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      categoryId,
      name,
      description,
      price,
      itemType,
      isVeg,
      isBestseller,
      isSpecial,
      isAvailable,
      image,
      prepTimeMinutes,
      loyaltyPoints,
    } = req.body;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        price: price !== undefined ? Number(price) : undefined,
        itemType: itemType !== undefined ? (itemType === 'COFFEE' || itemType === 'FOOD' ? itemType : null) : undefined,
        isVeg: isVeg !== undefined ? Boolean(isVeg) : undefined,
        isBestseller: isBestseller !== undefined ? Boolean(isBestseller) : undefined,
        isSpecial: isSpecial !== undefined ? Boolean(isSpecial) : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
        image,
        prepTimeMinutes: prepTimeMinutes !== undefined ? Number(prepTimeMinutes) : undefined,
        loyaltyPoints: loyaltyPoints !== undefined ? Math.max(0, parseInt(String(loyaltyPoints), 10) || 0) : undefined,
      },
    });

    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update menu item.' });
  }
}

export async function toggleItemAvailability(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });

    return res.json({ success: true, isAvailable: updated.isAvailable });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to toggle availability.' });
  }
}

export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete menu item.' });
  }
}

// 7. Table and QR Code Management
export async function getTables(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const tables = await prisma.table.findMany({
      where: { restaurantId, isArchived: false },
      orderBy: { tableNumber: 'asc' },
      include: {
        qrCode: true,
        _count: { select: { orders: true } },
        orders: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
            paymentStatus: { not: 'PAID' },
            createdAt: { gte: threeHoursAgo },
          },
          select: { id: true, orderNumber: true, status: true, totalAmount: true },
        },
      },
    });

    // Attach full URL, QR preview and live occupancy status to each table
    const liveFrontendUrl = getDynamicFrontendUrl(req);
    const enrichedTables = await Promise.all(
      tables.map(async (t) => {
        const token = t.qrCode?.token || '';
        const url = buildTableMenuUrl(liveFrontendUrl, restaurant?.slug || 'roastfuze', token);
        const qrDataUrl = token ? await generateQRCodeDataUrl(url) : null;
        const isOccupied = t.orders.length > 0;
        return {
          ...t,
          qrUrl: url,
          qrDataUrl,
          isOccupied,
          status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
        };
      })
    );

    return res.json({ tables: enrichedTables });
  } catch (err: any) {
    console.error('getTables error:', err);
    return res.status(500).json({ error: 'Failed to fetch tables.' });
  }
}

export async function createTable(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { tableNumber, name, capacity, section } = req.body;

    const token = `rf-tbl-${crypto.randomBytes(8).toString('hex')}`;

    const table = await prisma.table.create({
      data: {
        restaurantId,
        tableNumber: String(tableNumber).trim(),
        name: String(name).trim(),
        capacity: Number(capacity || 4),
        section: section ? String(section).trim() : 'Garden Area',
        qrCode: {
          create: {
            token,
          },
        },
      },
      include: {
        qrCode: true,
      },
    });

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });
    const liveFrontendUrl = getDynamicFrontendUrl(req);
    const url = buildTableMenuUrl(liveFrontendUrl, restaurant?.slug || 'roastfuze', token);
    const qrDataUrl = await generateQRCodeDataUrl(url);

    return res.status(201).json({
      success: true,
      table: {
        ...table,
        qrUrl: url,
        qrDataUrl,
      },
    });
  } catch (err: any) {
    console.error('createTable error:', err);
    return res.status(500).json({ error: 'Failed to create table. Ensure table number is unique.' });
  }
}

export async function regenerateTableQRToken(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const newToken = `sw-tbl-${crypto.randomBytes(8).toString('hex')}`;

    const qr = await prisma.tableQRCode.upsert({
      where: { tableId: id },
      update: {
        token: newToken,
        scanCount: 0,
        lastScannedAt: null,
      },
      create: {
        tableId: id,
        token: newToken,
      },
      include: {
        table: {
          include: { restaurant: { select: { slug: true } } },
        },
      },
    });

    const liveFrontendUrl = getDynamicFrontendUrl(req);
    const url = buildTableMenuUrl(liveFrontendUrl, qr.table.restaurant.slug, newToken);
    const qrDataUrl = await generateQRCodeDataUrl(url);

    return res.json({
      success: true,
      token: newToken,
      qrUrl: url,
      qrDataUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to regenerate QR token.' });
  }
}

export async function deleteTable(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.table.update({
      where: { id },
      data: { isArchived: true, isActive: false },
    });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to archive table.' });
  }
}

export async function freeTable(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const restaurantId = getRestaurantId(req);

    const table = await prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found.' });
    }

    // 1. Close active dining sessions on this table
    await prisma.diningSession.updateMany({
      where: { tableId: id, status: 'ACTIVE' },
      data: { status: 'COMPLETED', closedAt: new Date() },
    });

    // 2. Mark any unserved orders on this table as SERVED so table is free
    await prisma.order.updateMany({
      where: {
        tableId: id,
        status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      data: {
        status: 'SERVED',
      },
    });

    return res.json({
      success: true,
      message: `Table ${table.tableNumber} is now marked as AVAILABLE and free for new guests.`,
    });
  } catch (err: any) {
    console.error('freeTable error:', err);
    return res.status(500).json({ error: 'Failed to free table.' });
  }
}

export async function freeAllTables(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);

    // 1. Close all active dining sessions for this restaurant
    await prisma.diningSession.updateMany({
      where: {
        table: { restaurantId },
        status: 'ACTIVE',
      },
      data: { status: 'COMPLETED', closedAt: new Date() },
    });

    // 2. Mark unserved orders as SERVED
    await prisma.order.updateMany({
      where: {
        restaurantId,
        status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      data: {
        status: 'SERVED',
      },
    });

    return res.json({
      success: true,
      message: 'All cafe tables have been released and marked as AVAILABLE.',
    });
  } catch (err: any) {
    console.error('freeAllTables error:', err);
    return res.status(500).json({ error: 'Failed to free all tables.' });
  }
}

// 8. Order Management
export async function getOrders(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { status, date, search } = req.query;

    const where: any = { restaurantId };
    if (status && status !== 'ALL') {
      where.status = String(status);
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search) } },
        { customerName: { contains: String(search) } },
        { customerPhone: { contains: String(search) } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        table: { select: { tableNumber: true, name: true, section: true } },
        items: {
          include: {
            modifiers: true,
          },
        },
        payments: true,
      },
    });

    return res.json({ orders });
  } catch (err: any) {
    console.error('getOrders error:', err);
    return res.status(500).json({ error: 'Failed to get orders.' });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, rejectionReason, paymentStatus } = req.body;

    const validStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition.' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (rejectionReason !== undefined) dataToUpdate.rejectionReason = rejectionReason ? String(rejectionReason) : null;
    if (paymentStatus) {
      const validPaymentStatuses = ['PAID', 'PENDING', 'FAILED', 'REFUNDED'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status.' });
      }
      dataToUpdate.paymentStatus = paymentStatus;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: {
        table: true,
        items: { include: { modifiers: true } },
      },
    });

    // If marked PAID, create payment record if not exists
    if (paymentStatus === 'PAID') {
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: order.id, status: 'PAID' },
      });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
            method: order.paymentMethod,
            status: 'PAID',
            transactionId: `COUNTER_${Date.now()}`,
          },
        });
      }

      // If order was marked PAID and has a table, check if table can be freed
      if (order.tableId) {
        const remainingActive = await prisma.order.count({
          where: {
            tableId: order.tableId,
            id: { not: order.id },
            status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
            paymentStatus: { not: 'PAID' },
          },
        });
        if (remainingActive === 0) {
          await prisma.diningSession.updateMany({
            where: { tableId: order.tableId, status: 'ACTIVE' },
            data: { status: 'COMPLETED', closedAt: new Date() },
          });
        }
      }
    }

    // If order was served, cancelled or marked paid, check if table can be freed
    if (order.tableId && (status === 'SERVED' || status === 'CANCELLED' || paymentStatus === 'PAID')) {
      const remainingActive = await prisma.order.count({
        where: {
          tableId: order.tableId,
          id: { not: order.id },
          status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
          paymentStatus: { not: 'PAID' },
        },
      });
      if (remainingActive === 0) {
        await prisma.diningSession.updateMany({
          where: { tableId: order.tableId, status: 'ACTIVE' },
          data: { status: 'COMPLETED', closedAt: new Date() },
        });
      }
    }

    // Realtime notification
    emitOrderStatusUpdated(updated.restaurantId, updated.orderToken, updated.status, updated);

    let marketplaceSync: { sent: boolean; reason?: string } | undefined;
    if (status && (order.source === 'SWIGGY' || order.source === 'ZOMATO') && order.externalOrderId) {
      try {
        marketplaceSync = await pushMarketplaceStatus(order.source as Marketplace, order.externalOrderId, status);
      } catch (syncError) {
        console.error('Marketplace status sync error:', syncError);
        marketplaceSync = { sent: false, reason: 'MARKETPLACE_STATUS_SYNC_FAILED' };
      }

      // Also dispatch bi-directional command to Chrome Extension Sync Bridge
      const rest = await prisma.restaurant.findUnique({ where: { id: order.restaurantId }, select: { slug: true } });
      const actionType = status === 'READY' ? 'MARK_READY' : status === 'ACCEPTED' ? 'ACCEPT_ORDER' : status === 'CANCELLED' ? 'REJECT_ORDER' : null;
      if (actionType) {
        pushActionToQueue({
          restaurantId: order.restaurantId,
          restaurantSlug: rest?.slug || 'roastfuze',
          orderId: order.id,
          externalOrderId: order.externalOrderId || undefined,
          source: order.source as 'SWIGGY' | 'ZOMATO',
          action: actionType,
        });
      }
    }

    return res.json({ success: true, order: updated, marketplaceSync });
  } catch (err: any) {
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}

export async function getMarketplaceConnections(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const connections = await prisma.marketplaceConnection.findMany({
      where: { restaurantId },
      orderBy: { provider: 'asc' },
      select: {
        id: true, provider: true, status: true, restaurantHandle: true,
        externalRestaurantId: true, statusUrl: true, lastSyncAt: true, updatedAt: true,
      },
    });
    return res.json({ connections });
  } catch (err) {
    console.error('getMarketplaceConnections error:', err);
    return res.status(500).json({ error: 'Failed to load marketplace connections.' });
  }
}

export async function saveMarketplaceConnection(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const provider = String(req.params.provider || '').toUpperCase();
    if (!['SWIGGY', 'ZOMATO'].includes(provider)) return res.status(400).json({ error: 'Provider must be SWIGGY or ZOMATO.' });
    const { status = 'DEMO', restaurantHandle, externalRestaurantId, apiToken, webhookSecret, statusUrl } = req.body;
    const connection = await prisma.marketplaceConnection.upsert({
      where: { restaurantId_provider: { restaurantId, provider } },
      create: { restaurantId, provider, status, restaurantHandle, externalRestaurantId, apiToken, webhookSecret, statusUrl },
      update: { status, restaurantHandle, externalRestaurantId, ...(apiToken ? { apiToken } : {}), ...(webhookSecret ? { webhookSecret } : {}), statusUrl },
      select: { id: true, provider: true, status: true, restaurantHandle: true, externalRestaurantId: true, statusUrl: true, updatedAt: true },
    });

    // Demo mode also creates real Order rows so the demo is visible in Live Orders.
    if (status === 'DEMO') {
      const demoOrders = provider === 'SWIGGY'
        ? [{ id: 'SWG-78421', name: 'Rahul Sharma', total: 468, state: 'PREPARING', rider: 'Amit Kumar', riderPhone: '9876543210', vehicle: 'RJ14 AB 2345', address: 'Vaishali Nagar, Jaipur', lat: 26.9124, lng: 75.7873, eta: 18, items: [{ name: 'Cold Coffee', qty: 2, price: 180 }, { name: 'Paneer Tikka Sandwich', qty: 1, price: 108 }] }]
        : [{ id: 'ZOM-55208', name: 'Ananya Mehta', total: 612, state: 'PENDING', rider: 'Rohit Singh', riderPhone: '9876501234', vehicle: 'RJ14 CD 6789', address: 'Mansarovar, Jaipur', lat: 26.8500, lng: 75.7600, eta: 25, items: [{ name: 'Farmhouse Pizza', qty: 1, price: 420 }, { name: 'Masala Chai', qty: 2, price: 96 }] }];
      for (const demo of demoOrders) {
        const exists = await prisma.order.findFirst({ where: { restaurantId, source: provider, externalOrderId: demo.id } });
        if (!exists) {
          await prisma.order.create({
            data: {
              orderNumber: demo.id,
              orderToken: `ord-demo-${provider.toLowerCase()}-${demo.id.toLowerCase()}`,
              restaurantId,
              orderType: 'DELIVERY',
              source: provider,
              externalOrderId: demo.id,
              externalStatus: demo.state,
              externalPayload: JSON.stringify({ demo: true, provider }),
              customerName: demo.name,
              riderName: demo.rider,
              riderPhone: demo.riderPhone,
              riderVehicle: demo.vehicle,
              deliveryAddress: demo.address,
              deliveryLat: demo.lat,
              deliveryLng: demo.lng,
              deliveryEta: demo.eta,
              subtotal: demo.total,
              taxAmount: 0,
              discountAmount: 0,
              totalAmount: demo.total,
              status: demo.state,
              paymentStatus: 'PAID',
              paymentMethod: provider,
              items: { create: demo.items.map((item) => ({ itemName: item.name, itemType: item.name.toLowerCase().includes('coffee') || item.name.toLowerCase().includes('chai') ? 'COFFEE' : 'FOOD', unitPrice: item.price, quantity: item.qty, totalPrice: item.price * item.qty })) },
            },
          });
        } else {
          await prisma.order.update({
            where: { id: exists.id },
            data: { riderName: demo.rider, riderPhone: demo.riderPhone, riderVehicle: demo.vehicle, deliveryAddress: demo.address, deliveryLat: demo.lat, deliveryLng: demo.lng, deliveryEta: demo.eta },
          });
          emitDeliveryPartnerAssigned(restaurantId, {
            orderNumber: exists.orderNumber,
            riderName: demo.rider,
            riderPhone: demo.riderPhone,
            vehicle: demo.vehicle,
            eta: demo.eta,
            message: `🛵 Delivery Partner ${demo.rider} assigned to #${exists.orderNumber} (ETA ${demo.eta} min)!`,
          });
        }
      }
    }
    return res.json({ success: true, connection });
  } catch (err) {
    console.error('saveMarketplaceConnection error:', err);
    return res.status(500).json({ error: 'Failed to save marketplace connection.' });
  }
}

export async function updateOrderPaymentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validPaymentStatuses = ['PAID', 'PENDING', 'FAILED', 'REFUNDED'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status.' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: {
        table: true,
        items: { include: { modifiers: true } },
      },
    });

    if (paymentStatus === 'PAID') {
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: order.id, status: 'PAID' },
      });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
            method: order.paymentMethod,
            status: 'PAID',
            transactionId: `COUNTER_${Date.now()}`,
          },
        });
      }

      // If order was marked PAID and has a table, check if table can be freed
      if (order.tableId) {
        const remainingActive = await prisma.order.count({
          where: {
            tableId: order.tableId,
            id: { not: order.id },
            status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
            paymentStatus: { not: 'PAID' },
          },
        });
        if (remainingActive === 0) {
          await prisma.diningSession.updateMany({
            where: { tableId: order.tableId, status: 'ACTIVE' },
            data: { status: 'COMPLETED', closedAt: new Date() },
          });
        }
      }
    }

    // Realtime notification
    emitOrderStatusUpdated(updated.restaurantId, updated.orderToken, updated.status, updated);

    return res.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('updateOrderPaymentStatus error:', err);
    return res.status(500).json({ error: 'Failed to update payment status.' });
  }
}

// 9. Kitchen Display Workflow
export async function getKitchenQueue(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const queue = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ['ACCEPTED', 'PREPARING'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: { select: { tableNumber: true, name: true } },
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    return res.json({ queue });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch kitchen queue.' });
  }
}

// 10. Discount Offers
export async function getDiscounts(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const discounts = await prisma.discount.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ discounts });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch discounts.' });
  }
}

export async function createDiscount(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { code, discountType, value, minOrderAmount, maxDiscount, usageLimit } = req.body;

    const discount = await prisma.discount.create({
      data: {
        restaurantId,
        code: String(code).trim().toUpperCase(),
        discountType: discountType || 'PERCENTAGE',
        value: Number(value),
        minOrderAmount: Number(minOrderAmount || 0),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        isActive: true,
      },
    });

    return res.status(201).json({ success: true, discount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create discount. Ensure code is unique.' });
  }
}

export async function deleteDiscount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.discount.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete discount.' });
  }
}

// 11. Staff Management
export async function getTeamMembers(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const members = await prisma.restaurantMembership.findMany({
      where: { restaurantId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true, status: true, createdAt: true } },
      },
    });

    return res.json({ members });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get team members.' });
  }
}

export async function createTeamMember(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { name, email, phone, role = 'STAFF', password } = req.body;

    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        role,
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            restaurantId,
            role,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(201).json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add staff member. Email might already exist.' });
  }
}

// 12. Reviews
export async function getReviews(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ reviews });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load reviews.' });
  }
}

export async function toggleReviewApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Review not found.' });

    const updated = await prisma.review.update({
      where: { id },
      data: { isApproved: !review.isApproved },
    });

    return res.json({ success: true, isApproved: updated.isApproved });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update review status.' });
  }
}

// 13. Image upload handler
export async function handleImageUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    return res.status(500).json({ error: 'Image upload failed.' });
  }
}

// 14. Customer Analytics & History
export async function getCustomers(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        OR: [
          { customerPhone: { not: null } },
          { customerName: { not: null } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        orderType: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    const loyalties = await prisma.customerLoyalty.findMany({
      where: { restaurantId },
    });
    const loyaltyMap = new Map(loyalties.map((l) => [l.customerPhone.trim(), l]));

    const customerMap = new Map<string, {
      id: string;
      name: string;
      phone: string;
      totalOrders: number;
      totalSpent: number;
      lastVisit: Date;
      orderTypes: string[];
      recentOrders: Array<{ orderNumber: string; amount: number; date: Date; type: string; status: string }>;
    }>();

    for (const order of orders) {
      const key = (order.customerPhone || order.customerName || 'Anonymous').trim();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: order.customerName || 'Guest Customer',
          phone: order.customerPhone || 'Not Provided',
          totalOrders: 0,
          totalSpent: 0,
          lastVisit: order.createdAt,
          orderTypes: [],
          recentOrders: [],
        });
      }

      const record = customerMap.get(key)!;
      record.totalOrders += 1;
      if (order.status !== 'CANCELLED') {
        record.totalSpent += order.totalAmount;
      }
      if (!record.orderTypes.includes(order.orderType)) {
        record.orderTypes.push(order.orderType);
      }
      if (record.recentOrders.length < 3) {
        record.recentOrders.push({
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          date: order.createdAt,
          type: order.orderType,
          status: order.status,
        });
      }
    }

    // Add any loyalty members who haven't ordered recently
    for (const loyalty of loyalties) {
      const phoneKey = loyalty.customerPhone.trim();
      if (!customerMap.has(phoneKey)) {
        customerMap.set(phoneKey, {
          id: phoneKey,
          name: loyalty.customerName || 'Loyalty Member',
          phone: phoneKey,
          totalOrders: 0,
          totalSpent: 0,
          lastVisit: loyalty.updatedAt,
          orderTypes: [],
          recentOrders: [],
        });
      }
    }

    const customers = Array.from(customerMap.values()).map(c => {
      const loyalty = loyaltyMap.get(c.phone);
      return {
        ...c,
        totalSpent: Number(c.totalSpent.toFixed(2)),
        foodPoints: loyalty?.foodPoints || 0,
        coffeePoints: loyalty?.coffeePoints || 0,
        lifetimeFoodPoints: loyalty?.lifetimeFoodPoints || 0,
        lifetimeCoffeePoints: loyalty?.lifetimeCoffeePoints || 0,
      };
    });

    return res.json({ customers });
  } catch (err: any) {
    console.error('getCustomers error:', err);
    return res.status(500).json({ error: 'Failed to retrieve customers.' });
  }
}

export async function getCustomerLoyalty(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const phone = String(req.params.phone || req.query.phone || '').trim();

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required.' });
    }

    const loyalty = await prisma.customerLoyalty.findUnique({
      where: {
        restaurantId_customerPhone: {
          restaurantId,
          customerPhone: phone,
        },
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            order: {
              select: { orderNumber: true, totalAmount: true, status: true },
            },
          },
        },
      },
    });

    if (!loyalty) {
      return res.json({
        loyalty: {
          customerPhone: phone,
          foodPoints: 0,
          coffeePoints: 0,
          lifetimeFoodPoints: 0,
          lifetimeCoffeePoints: 0,
          transactions: [],
        },
      });
    }

    return res.json({ loyalty });
  } catch (err: any) {
    console.error('getCustomerLoyalty error:', err);
    return res.status(500).json({ error: 'Failed to retrieve customer loyalty details.' });
  }
}

export async function adjustCustomerLoyalty(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const {
      customerPhone,
      customerName,
      pointsType, // "FOOD" or "COFFEE"
      amount,
      reason = 'ADMIN_ADJUSTMENT',
      description,
    } = req.body;

    if (!customerPhone || !pointsType || amount === undefined) {
      return res.status(400).json({ error: 'Customer phone, pointsType, and amount are required.' });
    }

    const cleanPhone = String(customerPhone).trim();
    const type = pointsType === 'COFFEE' ? 'COFFEE' : 'FOOD';
    const pointDelta = parseInt(amount, 10);

    if (isNaN(pointDelta) || pointDelta === 0) {
      return res.status(400).json({ error: 'Amount must be a non-zero integer.' });
    }

    let loyalty = await prisma.customerLoyalty.findUnique({
      where: {
        restaurantId_customerPhone: {
          restaurantId,
          customerPhone: cleanPhone,
        },
      },
    });

    if (!loyalty) {
      loyalty = await prisma.customerLoyalty.create({
        data: {
          restaurantId,
          customerPhone: cleanPhone,
          customerName: customerName ? String(customerName).trim() : null,
          foodPoints: type === 'FOOD' ? Math.max(0, pointDelta) : 0,
          coffeePoints: type === 'COFFEE' ? Math.max(0, pointDelta) : 0,
          lifetimeFoodPoints: type === 'FOOD' && pointDelta > 0 ? pointDelta : 0,
          lifetimeCoffeePoints: type === 'COFFEE' && pointDelta > 0 ? pointDelta : 0,
        },
      });
    } else {
      const currentPoints = type === 'COFFEE' ? loyalty.coffeePoints : loyalty.foodPoints;
      const newPoints = Math.max(0, currentPoints + pointDelta);

      loyalty = await prisma.customerLoyalty.update({
        where: { id: loyalty.id },
        data: {
          customerName: customerName ? String(customerName).trim() : loyalty.customerName,
          foodPoints: type === 'FOOD' ? newPoints : undefined,
          coffeePoints: type === 'COFFEE' ? newPoints : undefined,
          lifetimeFoodPoints: type === 'FOOD' && pointDelta > 0 ? { increment: pointDelta } : undefined,
          lifetimeCoffeePoints: type === 'COFFEE' && pointDelta > 0 ? { increment: pointDelta } : undefined,
        },
      });
    }

    // Record Loyalty Transaction
    await prisma.loyaltyTransaction.create({
      data: {
        customerLoyaltyId: loyalty.id,
        pointsType: type,
        points: pointDelta,
        reason,
        description: description || `Admin adjustment of ${pointDelta > 0 ? '+' : ''}${pointDelta} ${type} points`,
      },
    });

    return res.json({
      success: true,
      message: `Successfully adjusted ${pointDelta > 0 ? '+' : ''}${pointDelta} ${type} points.`,
      loyalty,
    });
  } catch (err: any) {
    console.error('adjustCustomerLoyalty error:', err);
    return res.status(500).json({ error: 'Failed to adjust customer loyalty points.' });
  }
}

// 15. Modifiers and Variants Management
export async function getModifierGroups(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const groups = await prisma.modifierGroup.findMany({
      where: {
        menuItem: { restaurantId },
      },
      include: {
        menuItem: { select: { id: true, name: true, slug: true, price: true } },
        options: { orderBy: { price: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ groups });
  } catch (err: any) {
    console.error('getModifierGroups error:', err);
    return res.status(500).json({ error: 'Failed to fetch modifier groups.' });
  }
}

export async function createModifierGroup(req: Request, res: Response) {
  try {
    const { menuItemId, name, minSelect = 0, maxSelect = 1, isRequired = false, options = [] } = req.body;
    if (!menuItemId || !name) {
      return res.status(400).json({ error: 'Menu item and group name are required.' });
    }

    const group = await prisma.modifierGroup.create({
      data: {
        menuItemId,
        name: String(name).trim(),
        minSelect: Number(minSelect),
        maxSelect: Number(maxSelect),
        isRequired: Boolean(isRequired),
        options: {
          create: options.map((opt: any) => ({
            name: String(opt.name).trim(),
            price: Number(opt.price || 0),
            isDefault: Boolean(opt.isDefault),
          })),
        },
      },
      include: {
        menuItem: { select: { id: true, name: true } },
        options: true,
      },
    });

    return res.status(201).json({ success: true, group });
  } catch (err: any) {
    console.error('createModifierGroup error:', err);
    return res.status(500).json({ error: 'Failed to create modifier group.' });
  }
}

export async function deleteModifierGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.modifierGroup.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete modifier group.' });
  }
}

export async function addModifierOption(req: Request, res: Response) {
  try {
    const { modifierGroupId, name, price = 0, isDefault = false } = req.body;
    if (!modifierGroupId || !name) {
      return res.status(400).json({ error: 'Modifier group and option name are required.' });
    }

    const option = await prisma.modifierOption.create({
      data: {
        modifierGroupId,
        name: String(name).trim(),
        price: Number(price),
        isDefault: Boolean(isDefault),
      },
    });

    return res.status(201).json({ success: true, option });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add modifier option.' });
  }
}

export async function deleteModifierOption(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.modifierOption.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete modifier option.' });
  }
}

// ----------------------------------------------------
// PUSH NOTIFICATIONS & COMMUNITY MANAGEMENT
// ----------------------------------------------------
import {
  sendPushNotification,
  getNotificationHistory,
  getSongRequests,
  updateSongRequestStatus,
  getEventRsvps,
} from '../realtime/socket';

export async function sendCustomerNotification(req: Request, res: Response) {
  try {
    const { target = 'ALL', phone, recipientName, title, message, url } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const notif = sendPushNotification({
      target: target as 'ALL' | 'SPECIFIC' | 'SUPER',
      phone: phone ? String(phone).trim() : undefined,
      recipientName: recipientName ? String(recipientName).trim() : undefined,
      title: String(title).trim(),
      message: String(message).trim(),
      url: url || '/community',
      sentBy: (req as any).user?.name || 'Cafe Barista Desk',
    });

    return res.status(201).json({ success: true, notification: notif });
  } catch (err: any) {
    console.error('sendCustomerNotification error:', err);
    return res.status(500).json({ error: 'Failed to send notification.' });
  }
}

export async function getAdminNotificationHistory(req: Request, res: Response) {
  return res.json({ history: getNotificationHistory() });
}

export async function getAdminSongRequests(req: Request, res: Response) {
  return res.json({ requests: getSongRequests() });
}

export async function updateAdminSongRequest(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  const updated = updateSongRequestStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Song request not found.' });
  }
  return res.json({ success: true, request: updated });
}

export async function getAdminEventRsvps(req: Request, res: Response) {
  return res.json({ rsvps: getEventRsvps() });
}


// 14b. Loyalty Program Configuration & Item Rules
export async function getLoyaltySettings(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        currencySymbol: true,
        isLoyaltyEnabled: true,
        loyaltyPerOrderPoints: true,
        loyaltyFoodSpendPerPoint: true,
        loyaltyCoffeeSpendPerPoint: true,
        loyaltyPointValue: true,
        loyaltyMinOrderAmount: true,
        loyaltyMinRedeemPoints: true,
      },
    });

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const [memberCount, pointAggregations, itemsWithPointsCount] = await Promise.all([
      prisma.customerLoyalty.count({ where: { restaurantId } }),
      prisma.customerLoyalty.aggregate({
        where: { restaurantId },
        _sum: {
          foodPoints: true,
          coffeePoints: true,
          lifetimeFoodPoints: true,
          lifetimeCoffeePoints: true,
        },
      }),
      prisma.menuItem.count({
        where: {
          restaurantId,
          loyaltyPoints: { gt: 0 },
        },
      }),
    ]);

    return res.json({
      settings: restaurant,
      stats: {
        totalMembers: memberCount,
        activeFoodPoints: pointAggregations._sum.foodPoints || 0,
        activeCoffeePoints: pointAggregations._sum.coffeePoints || 0,
        lifetimeFoodPoints: pointAggregations._sum.lifetimeFoodPoints || 0,
        lifetimeCoffeePoints: pointAggregations._sum.lifetimeCoffeePoints || 0,
        itemsWithPointsCount,
      },
    });
  } catch (err: any) {
    console.error('getLoyaltySettings error:', err);
    return res.status(500).json({ error: 'Failed to load loyalty settings.' });
  }
}

export async function updateLoyaltySettings(req: Request, res: Response) {
  try {
    let restaurantId = getRestaurantId(req);
    let existingRest = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existingRest || existingRest.isDeleted) {
      const headerSlug = ((req.headers['x-restaurant-slug'] || req.query.slug) as string)?.toLowerCase().trim();
      if (headerSlug && headerSlug !== 'all') {
        const bySlug = await prisma.restaurant.findUnique({ where: { slug: headerSlug } });
        if (bySlug && !bySlug.isDeleted) {
          restaurantId = bySlug.id;
          existingRest = bySlug;
        }
      }
    }
    if (!existingRest || existingRest.isDeleted) {
      const fallback = await prisma.restaurant.findFirst({
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
      });
      if (fallback) {
        restaurantId = fallback.id;
        existingRest = fallback;
      }
    }

    if (!existingRest) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    const {
      isLoyaltyEnabled,
      loyaltyPerOrderPoints,
      loyaltyFoodSpendPerPoint,
      loyaltyCoffeeSpendPerPoint,
      loyaltyPointValue,
      loyaltyMinOrderAmount,
      loyaltyMinRedeemPoints,
    } = req.body;

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        isLoyaltyEnabled: isLoyaltyEnabled !== undefined ? Boolean(isLoyaltyEnabled) : undefined,
        loyaltyPerOrderPoints: loyaltyPerOrderPoints !== undefined ? Math.max(0, parseInt(String(loyaltyPerOrderPoints), 10) || 0) : undefined,
        loyaltyFoodSpendPerPoint: loyaltyFoodSpendPerPoint !== undefined ? Math.max(0.1, parseFloat(String(loyaltyFoodSpendPerPoint)) || 10.0) : undefined,
        loyaltyCoffeeSpendPerPoint: loyaltyCoffeeSpendPerPoint !== undefined ? Math.max(0.1, parseFloat(String(loyaltyCoffeeSpendPerPoint)) || 10.0) : undefined,
        loyaltyPointValue: loyaltyPointValue !== undefined ? Math.max(0.01, parseFloat(String(loyaltyPointValue)) || 1.0) : undefined,
        loyaltyMinOrderAmount: loyaltyMinOrderAmount !== undefined ? Math.max(0, parseFloat(String(loyaltyMinOrderAmount)) || 0) : undefined,
        loyaltyMinRedeemPoints: loyaltyMinRedeemPoints !== undefined ? Math.max(0, parseInt(String(loyaltyMinRedeemPoints), 10) || 0) : undefined,
      },
      select: {
        id: true,
        name: true,
        currencySymbol: true,
        isLoyaltyEnabled: true,
        loyaltyPerOrderPoints: true,
        loyaltyFoodSpendPerPoint: true,
        loyaltyCoffeeSpendPerPoint: true,
        loyaltyPointValue: true,
        loyaltyMinOrderAmount: true,
        loyaltyMinRedeemPoints: true,
      },
    });

    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('updateLoyaltySettings error:', err);
    return res.status(500).json({ error: 'Failed to update loyalty settings.' });
  }
}

export async function updateMenuItemLoyalty(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { loyaltyPoints } = req.body;
    const pts = Math.max(0, parseInt(String(loyaltyPoints), 10) || 0);

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { loyaltyPoints: pts },
    });

    return res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error('updateMenuItemLoyalty error:', err);
    return res.status(500).json({ error: 'Failed to update item loyalty points.' });
  }
}

export async function batchUpdateMenuItemLoyalty(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { updates, categoryId, setAllPoints } = req.body as {
      updates?: Array<{ id: string; loyaltyPoints: number }>;
      categoryId?: string;
      setAllPoints?: number;
    };

    if (Array.isArray(updates) && updates.length > 0) {
      await Promise.all(
        updates.map((u) =>
          prisma.menuItem.updateMany({
            where: { id: u.id, restaurantId },
            data: { loyaltyPoints: Math.max(0, parseInt(String(u.loyaltyPoints), 10) || 0) },
          })
        )
      );
    } else if (setAllPoints !== undefined) {
      const pts = Math.max(0, parseInt(String(setAllPoints), 10) || 0);
      await prisma.menuItem.updateMany({
        where: {
          restaurantId,
          ...(categoryId && categoryId !== 'ALL' ? { categoryId } : {}),
        },
        data: { loyaltyPoints: pts },
      });
    }

    return res.json({ success: true, message: 'Loyalty points updated successfully.' });
  } catch (err: any) {
    console.error('batchUpdateMenuItemLoyalty error:', err);
    return res.status(500).json({ error: 'Failed to batch update loyalty points.' });
  }
}

// 15. Admin POS / Counter Order Creation
function cleanPhoneVariants(phone: string) {
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, '');
  const ten = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return Array.from(new Set([raw, ten, `+91${ten}`, `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`].filter(Boolean)));
}

export async function createAdminPosOrder(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const {
      orderType = 'DINE_IN',
      tableId,
      customerName,
      customerPhone,
      notes,
      items,
      paymentMethod = 'CASH',
      paymentStatus = 'PAID',
      status = 'ACCEPTED',
      redeemFoodPoints = 0,
      redeemCoffeePoints = 0,
    } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one menu item is required to create a POS order.' });
    }

    // Resolve Table & Dining Session if Dine-In
    let resolvedTableId: string | null = null;
    let diningSessionId: string | null = null;

    if (orderType === 'DINE_IN' && tableId) {
      const table = await prisma.table.findFirst({
        where: { id: tableId, restaurantId },
      });
      if (table) {
        resolvedTableId = table.id;
        let session = await prisma.diningSession.findFirst({
          where: { tableId: table.id, status: 'ACTIVE' },
        });
        if (!session) {
          session = await prisma.diningSession.create({
            data: {
              tableId: table.id,
              sessionToken: `ses-${crypto.randomBytes(8).toString('hex')}`,
              customerName: customerName ? String(customerName).trim() : null,
              customerPhone: customerPhone ? String(customerPhone).trim() : null,
            },
          });
        }
        diningSessionId = session.id;
      }
    }

    let subtotal = 0;
    let foodSubtotal = 0;
    let coffeeSubtotal = 0;
    let itemSpecificFoodPoints = 0;
    let itemSpecificCoffeePoints = 0;
    let eligibleFoodSpend = 0;
    let eligibleCoffeeSpend = 0;
    const orderItemsData: any[] = [];

    for (const input of items) {
      const item = await prisma.menuItem.findFirst({
        where: { id: input.menuItemId, restaurantId },
        include: {
          category: true,
          variants: true,
          modifierGroups: {
            include: { options: true },
          },
        },
      });

      if (!item) {
        return res.status(400).json({ error: `Menu item not found in catalog.` });
      }

      const itemType = resolveItemType(item, item.category);

      let unitPrice = item.price;
      let itemName = item.name;

      if (input.variantId) {
        const variant = item.variants.find((v) => v.id === input.variantId);
        if (variant) {
          unitPrice = variant.price;
          itemName = `${item.name} (${variant.name})`;
        }
      }

      let modifiersPrice = 0;
      const itemModifiersData: any[] = [];

      if (input.modifierOptionIds && Array.isArray(input.modifierOptionIds)) {
        for (const group of item.modifierGroups) {
          for (const opt of group.options) {
            if (input.modifierOptionIds.includes(opt.id)) {
              modifiersPrice += opt.price;
              itemModifiersData.push({
                modifierOptionId: opt.id,
                modifierName: opt.name,
                price: opt.price,
              });
            }
          }
        }
      }

      const quantity = Math.max(1, parseInt(String(input.quantity), 10) || 1);
      const totalPrice = (unitPrice + modifiersPrice) * quantity;
      subtotal += totalPrice;

      if (itemType === 'COFFEE') {
        coffeeSubtotal += totalPrice;
      } else {
        foodSubtotal += totalPrice;
      }

      const customPts = (item as any).loyaltyPoints || 0;
      if (customPts > 0) {
        if (itemType === 'COFFEE') {
          itemSpecificCoffeePoints += customPts * quantity;
        } else {
          itemSpecificFoodPoints += customPts * quantity;
        }
      } else {
        if (itemType === 'COFFEE') {
          eligibleCoffeeSpend += totalPrice;
        } else {
          eligibleFoodSpend += totalPrice;
        }
      }

      orderItemsData.push({
        menuItemId: item.id,
        itemName,
        itemType,
        unitPrice,
        quantity,
        totalPrice,
        notes: input.notes ? String(input.notes).trim() : null,
        modifiers: itemModifiersData,
      });
    }

    // Customer Loyalty Points Handling
    const cleanPhone = customerPhone && String(customerPhone).trim() ? String(customerPhone).trim() : null;
    let loyaltyRecord: any = null;
    let actualFoodRedeemed = 0;
    let actualCoffeeRedeemed = 0;

    if (cleanPhone) {
      loyaltyRecord = await prisma.customerLoyalty.findFirst({
        where: {
          restaurantId: restaurant.id,
          customerPhone: { in: cleanPhoneVariants(cleanPhone) },
        },
      });

      if (!loyaltyRecord) {
        loyaltyRecord = await prisma.customerLoyalty.create({
          data: {
            restaurantId: restaurant.id,
            customerPhone: cleanPhone,
            customerName: customerName ? String(customerName).trim() : null,
          },
        });
      } else if (customerName && !loyaltyRecord.customerName) {
        loyaltyRecord = await prisma.customerLoyalty.update({
          where: { id: loyaltyRecord.id },
          data: { customerName: String(customerName).trim() },
        });
      }

      const minRedeemPoints = restaurant.loyaltyMinRedeemPoints || 0;
      const totalWalletPoints = (loyaltyRecord.foodPoints || 0) + (loyaltyRecord.coffeePoints || 0);

      const wantRedeem = (redeemFoodPoints && Number(redeemFoodPoints) > 0) || (redeemCoffeePoints && Number(redeemCoffeePoints) > 0);
      if (wantRedeem && minRedeemPoints > 0 && totalWalletPoints < minRedeemPoints) {
        return res.status(400).json({
          error: `Minimum ${minRedeemPoints} points required in wallet to redeem (customer currently has ${totalWalletPoints} points).`,
        });
      }

      const maxFoodRedeem = Math.min(loyaltyRecord.foodPoints, Math.floor(foodSubtotal));
      const maxCoffeeRedeem = Math.min(loyaltyRecord.coffeePoints, Math.floor(coffeeSubtotal));

      if (redeemFoodPoints && Number(redeemFoodPoints) > 0) {
        actualFoodRedeemed = Math.min(Number(redeemFoodPoints), maxFoodRedeem);
      }
      if (redeemCoffeePoints && Number(redeemCoffeePoints) > 0) {
        actualCoffeeRedeemed = Math.min(Number(redeemCoffeePoints), maxCoffeeRedeem);
      }
    }

    const isLoyaltyActive = restaurant.isLoyaltyEnabled !== false;
    const foodSpendRate = restaurant.loyaltyFoodSpendPerPoint || 10.0;
    const coffeeSpendRate = restaurant.loyaltyCoffeeSpendPerPoint || 10.0;
    const pointValue = restaurant.loyaltyPointValue || 1.0;
    const minOrderAmt = restaurant.loyaltyMinOrderAmount || 0;
    const perOrderBonus = restaurant.loyaltyPerOrderPoints || 0;

    const loyaltyDiscount = Number(((actualFoodRedeemed + actualCoffeeRedeemed) * pointValue).toFixed(2));

    let foodPointsEarned = 0;
    let coffeePointsEarned = 0;

    if (isLoyaltyActive) {
      const spendFoodPoints = Math.floor(eligibleFoodSpend / foodSpendRate);
      const spendCoffeePoints = Math.floor(eligibleCoffeeSpend / coffeeSpendRate);

      foodPointsEarned = itemSpecificFoodPoints + spendFoodPoints;
      coffeePointsEarned = itemSpecificCoffeePoints + spendCoffeePoints;

      if (perOrderBonus > 0 && subtotal >= minOrderAmt) {
        foodPointsEarned += perOrderBonus;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - loyaltyDiscount);
    const taxAmount = Number(((discountedSubtotal * restaurant.taxPercent) / 100).toFixed(2));
    const totalAmount = Number((discountedSubtotal + taxAmount).toFixed(2));

    const count = await prisma.order.count({ where: { restaurantId: restaurant.id } });
    const orderNumber = `POS-${1001 + count}`;
    const orderToken = `ord-pos-${crypto.randomBytes(12).toString('hex')}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderToken,
        restaurantId: restaurant.id,
        tableId: resolvedTableId,
        diningSessionId,
        orderType,
        source: 'POS',
        customerName: customerName ? String(customerName).trim() : 'Walk-in Guest',
        customerPhone: cleanPhone,
        notes: notes ? String(notes).trim() : null,
        subtotal,
        discountAmount: 0,
        foodPointsEarned,
        coffeePointsEarned,
        foodPointsRedeemed: actualFoodRedeemed,
        coffeePointsRedeemed: actualCoffeeRedeemed,
        loyaltyDiscount,
        taxAmount,
        totalAmount,
        status: status || 'ACCEPTED',
        paymentStatus: paymentStatus || 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        items: {
          create: orderItemsData.map((oi) => ({
            menuItemId: oi.menuItemId,
            itemName: oi.itemName,
            itemType: oi.itemType,
            unitPrice: oi.unitPrice,
            quantity: oi.quantity,
            totalPrice: oi.totalPrice,
            notes: oi.notes,
            modifiers: {
              create: oi.modifiers.map((m: any) => ({
                modifierOptionId: m.modifierOptionId,
                modifierName: m.modifierName,
                price: m.price,
              })),
            },
          })),
        },
        payments: {
          create: {
            amount: totalAmount,
            currency: restaurant.currency,
            method: paymentMethod || 'CASH',
            status: paymentStatus || 'PAID',
          },
        },
      },
      include: {
        table: true,
        items: {
          include: {
            modifiers: true,
          },
        },
        payments: true,
      },
    });

    // Update Loyalty Points & Transactions
    let updatedLoyaltyRecord: any = null;
    if (loyaltyRecord) {
      updatedLoyaltyRecord = await prisma.customerLoyalty.update({
        where: { id: loyaltyRecord.id },
        data: {
          foodPoints: {
            increment: foodPointsEarned - actualFoodRedeemed,
          },
          coffeePoints: {
            increment: coffeePointsEarned - actualCoffeeRedeemed,
          },
          lifetimeFoodPoints: {
            increment: foodPointsEarned,
          },
          lifetimeCoffeePoints: {
            increment: coffeePointsEarned,
          },
        },
      });

      if (actualFoodRedeemed > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            customerLoyaltyId: loyaltyRecord.id,
            orderId: order.id,
            pointsType: 'FOOD',
            points: -actualFoodRedeemed,
            reason: 'POS_ORDER_REDEEMED',
            description: `Redeemed ${actualFoodRedeemed} Food points at POS for Order #${orderNumber}`,
          },
        });
      }

      if (actualCoffeeRedeemed > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            customerLoyaltyId: loyaltyRecord.id,
            orderId: order.id,
            pointsType: 'COFFEE',
            points: -actualCoffeeRedeemed,
            reason: 'POS_ORDER_REDEEMED',
            description: `Redeemed ${actualCoffeeRedeemed} Coffee points at POS for Order #${orderNumber}`,
          },
        });
      }

      if (foodPointsEarned > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            customerLoyaltyId: loyaltyRecord.id,
            orderId: order.id,
            pointsType: 'FOOD',
            points: foodPointsEarned,
            reason: 'POS_ORDER_EARNED',
            description: `Earned ${foodPointsEarned} Food points from POS Order #${orderNumber}`,
          },
        });
      }

      if (coffeePointsEarned > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            customerLoyaltyId: loyaltyRecord.id,
            orderId: order.id,
            pointsType: 'COFFEE',
            points: coffeePointsEarned,
            reason: 'POS_ORDER_EARNED',
            description: `Earned ${coffeePointsEarned} Coffee points from POS Order #${orderNumber}`,
          },
        });
      }
    }

    // Trigger WhatsApp receipt if configured
    if (cleanPhone) {
      void sendLoyaltyWhatsApp({
        phone: cleanPhone,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        orderToken: order.orderToken,
        foodPointsEarned,
        coffeePointsEarned,
        foodPointsBalance: updatedLoyaltyRecord?.foodPoints || 0,
        coffeePointsBalance: updatedLoyaltyRecord?.coffeePoints || 0,
      });
    }

    // Realtime broadcast to kitchen and admin staff
    emitNewOrder(restaurant.id, {
      ...order,
      createdAt: order.createdAt.toISOString(),
    });

    return res.status(201).json({
      success: true,
      order,
      loyalty: {
        foodPointsEarned,
        coffeePointsEarned,
        foodPointsRedeemed: actualFoodRedeemed,
        coffeePointsRedeemed: actualCoffeeRedeemed,
        customerBalance: updatedLoyaltyRecord ? {
          foodPoints: updatedLoyaltyRecord.foodPoints,
          coffeePoints: updatedLoyaltyRecord.coffeePoints,
        } : null,
      },
    });
  } catch (err: any) {
    console.error('createAdminPosOrder error:', err);
    return res.status(500).json({ error: 'Failed to create POS order.' });
  }
}
