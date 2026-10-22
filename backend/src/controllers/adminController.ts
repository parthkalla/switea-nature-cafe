import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateQRCodeDataUrl, generateQRCodeSVG, buildTableMenuUrl } from '../utils/qr';
import { emitOrderStatusUpdated } from '../realtime/socket';

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
  return (req.user?.restaurantId || req.query.restaurantId || req.params.restaurantId) as string;
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
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.order.findMany({
        where: { restaurantId },
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
      where: { order: { restaurantId, status: { not: 'CANCELLED' } } },
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
              where: { order: { status: { not: 'CANCELLED' } } },
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
    } = req.body;

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
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
    const { name, description, image, displayOrder, isActive = true } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const category = await prisma.menuCategory.create({
      data: {
        restaurantId,
        name: String(name).trim(),
        slug,
        description,
        image,
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
    const { name, description, image, displayOrder, isActive } = req.body;

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        name,
        description,
        image,
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
        category: { select: { id: true, name: true } },
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
      isVeg = true,
      isBestseller = false,
      isSpecial = false,
      isAvailable = true,
      image,
      prepTimeMinutes = 15,
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
        isVeg: Boolean(isVeg),
        isBestseller: Boolean(isBestseller),
        isSpecial: Boolean(isSpecial),
        isAvailable: Boolean(isAvailable),
        image,
        prepTimeMinutes: Number(prepTimeMinutes),
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
      isVeg,
      isBestseller,
      isSpecial,
      isAvailable,
      image,
      prepTimeMinutes,
    } = req.body;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        price: price !== undefined ? Number(price) : undefined,
        isVeg: isVeg !== undefined ? Boolean(isVeg) : undefined,
        isBestseller: isBestseller !== undefined ? Boolean(isBestseller) : undefined,
        isSpecial: isSpecial !== undefined ? Boolean(isSpecial) : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
        image,
        prepTimeMinutes: prepTimeMinutes !== undefined ? Number(prepTimeMinutes) : undefined,
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

    const tables = await prisma.table.findMany({
      where: { restaurantId, isArchived: false },
      orderBy: { tableNumber: 'asc' },
      include: {
        qrCode: true,
        _count: { select: { orders: true } },
      },
    });

    // Attach full URL and QR preview to each table using dynamic live domain
    const liveFrontendUrl = getDynamicFrontendUrl(req);
    const enrichedTables = await Promise.all(
      tables.map(async (t) => {
        const token = t.qrCode?.token || '';
        const url = buildTableMenuUrl(liveFrontendUrl, restaurant?.slug || 'switea', token);
        const qrDataUrl = token ? await generateQRCodeDataUrl(url) : null;
        return {
          ...t,
          qrUrl: url,
          qrDataUrl,
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

    const token = `sw-tbl-${crypto.randomBytes(8).toString('hex')}`;

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
    const url = buildTableMenuUrl(liveFrontendUrl, restaurant?.slug || 'switea', token);
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
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition.' });
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
      data: {
        status,
        rejectionReason: rejectionReason ? String(rejectionReason) : undefined,
        paymentStatus: paymentStatus ? String(paymentStatus) : undefined,
      },
      include: {
        table: true,
        items: { include: { modifiers: true } },
      },
    });

    // Realtime notification
    emitOrderStatusUpdated(updated.restaurantId, updated.orderToken, status, updated);

    return res.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
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

    const customers = Array.from(customerMap.values()).map(c => ({
      ...c,
      totalSpent: Number(c.totalSpent.toFixed(2)),
    }));

    return res.json({ customers });
  } catch (err: any) {
    console.error('getCustomers error:', err);
    return res.status(500).json({ error: 'Failed to retrieve customers.' });
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

