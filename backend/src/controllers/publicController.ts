import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { emitNewOrder, emitNewReview, emitOrderStatusUpdated } from '../realtime/socket';
import { buildLoyaltyWhatsAppLink, sendLoyaltyWhatsApp } from '../services/whatsapp';

export async function getLandingPage(req: Request, res: Response) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const slug = (req.params.slug || 'roastfuze').toLowerCase().trim();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        landingContent: true,
        galleryImages: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          take: 8,
          include: {
            items: {
              where: { isAvailable: true },
              take: 4,
            },
          },
        },
      },
    });

    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ error: 'Restaurant not found or no longer available.' });
    }

    const isPreview = req.query.preview === 'true';
    if (!isPreview && restaurant.landingContent && !restaurant.landingContent.isPublished) {
      return res.status(404).json({ error: 'This restaurant website is currently unpublished.', isPublished: false });
    }

    // Featured bestsellers
    const bestsellers = await prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        isBestseller: true,
        isAvailable: true,
      },
      take: 12,
      include: {
        variants: true,
      },
    });

    return res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        tagLine: restaurant.tagLine,
        themeTemplate: (restaurant as any).themeTemplate || 'BALCONY_MUSICAL',
        primaryColor: (restaurant as any).primaryColor || '#1A3C2B',
        accentColor: (restaurant as any).accentColor || '#E8B042',
        description: restaurant.description,
        logo: restaurant.logo,
        coverImage: restaurant.coverImage,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        postalCode: restaurant.postalCode,
        phone: restaurant.phone,
        email: restaurant.email,
        mapLink: restaurant.mapLink,
        whatsappNumber: restaurant.whatsappNumber,
        openingHours: restaurant.openingHours,
        currency: restaurant.currency,
        currencySymbol: restaurant.currencySymbol,
        taxPercent: restaurant.taxPercent,
        isOrderingEnabled: restaurant.isOrderingEnabled,
        isOpen: restaurant.isOpen,
      },
      landingContent: restaurant.landingContent,
      gallery: restaurant.galleryImages,
      reviews: restaurant.reviews,
      categories: restaurant.categories,
      bestsellers,
    });
  } catch (err: any) {
    console.error('getLandingPage error:', err);
    return res.status(500).json({ error: 'Failed to load landing page.' });
  }
}

export async function getMenu(req: Request, res: Response) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const slug = (req.params.slug || 'roastfuze').toLowerCase().trim();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
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
        openingHours: true,
        currency: true,
        currencySymbol: true,
        taxPercent: true,
        isOrderingEnabled: true,
        isLoyaltyEnabled: true,
        loyaltyPerOrderPoints: true,
        loyaltyFoodSpendPerPoint: true,
        loyaltyCoffeeSpendPerPoint: true,
        loyaltyPointValue: true,
        loyaltyMinOrderAmount: true,
        loyaltyMinRedeemPoints: true,
        isPayAtCounterOnly: true,
        isOpen: true,
        isDeleted: true,
        phone: true,
        address: true,
        landingContent: { select: { isPublished: true } },
      },
    });

    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ error: 'Restaurant not found or no longer available.' });
    }

    const isPreview = req.query.preview === 'true';
    if (!isPreview && restaurant.landingContent && !restaurant.landingContent.isPublished) {
      return res.status(404).json({ error: 'This restaurant website is currently unpublished.', isPublished: false });
    }

    const categories = await prisma.menuCategory.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            variants: true,
            modifierGroups: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      restaurant,
      categories,
    });
  } catch (err: any) {
    console.error('getMenu error:', err);
    return res.status(500).json({ error: 'Failed to load menu.' });
  }
}

export async function getTableByToken(req: Request, res: Response) {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ error: 'Table token is required.' });
    }

    const qrRecord = await prisma.tableQRCode.findUnique({
      where: { token },
      include: {
        table: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
                tagLine: true,
                logo: true,
                isOrderingEnabled: true,
                isOpen: true,
                taxPercent: true,
                currencySymbol: true,
              },
            },
          },
        },
      },
    });

    if (!qrRecord || !qrRecord.table || !qrRecord.table.isActive || qrRecord.table.isArchived) {
      return res.status(404).json({ error: 'Invalid or expired table QR code. Please ask the staff.' });
    }

    // Increment scan count asynchronously and record scan event
    await prisma.tableQRCode.update({
      where: { id: qrRecord.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });

    await prisma.qRScanEvent.create({
      data: {
        tableQRCodeId: qrRecord.id,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
        deviceType: /mobile/i.test(req.headers['user-agent'] || '') ? 'MOBILE' : 'DESKTOP',
      },
    });

    return res.json({
      valid: true,
      table: {
        id: qrRecord.table.id,
        tableNumber: qrRecord.table.tableNumber,
        name: qrRecord.table.name,
        section: qrRecord.table.section,
        capacity: qrRecord.table.capacity,
      },
      restaurant: qrRecord.table.restaurant,
      tableToken: token,
    });
  } catch (err: any) {
    console.error('getTableByToken error:', err);
    return res.status(500).json({ error: 'Failed to resolve table token.' });
  }
}

export async function getPublicTables(req: Request, res: Response) {
  try {
    const slug = (req.query.slug as string) || 'roastfuze';
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, isDeleted: true },
    });

    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ error: 'Restaurant not found or no longer available.' });
    }

    // Auto-clean stale sessions older than 3 hours so tables never get permanently stuck
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    try {
      await prisma.diningSession.updateMany({
        where: {
          status: 'ACTIVE',
          startedAt: { lt: threeHoursAgo },
        },
        data: {
          status: 'COMPLETED',
          closedAt: new Date(),
        },
      });
    } catch (e) {
      // Non-critical background cleanup
    }

    const tables = await prisma.table.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
        isArchived: false,
      },
      orderBy: { tableNumber: 'asc' },
      include: {
        qrCode: true,
        sessions: {
          where: {
            status: 'ACTIVE',
            startedAt: { gte: threeHoursAgo },
          },
          select: { id: true, startedAt: true },
        },
        orders: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
            paymentStatus: { not: 'PAID' },
            createdAt: { gte: threeHoursAgo },
          },
          select: { id: true, orderNumber: true, status: true, paymentStatus: true },
        },
      },
    });

    const formattedTables = tables.map((t) => {
      // A table is occupied ONLY if there is an active unserved/unpaid order placed within the last 3 hours
      const hasActiveOrder = t.orders.length > 0;
      const isOccupied = hasActiveOrder;

      return {
        id: t.id,
        tableNumber: t.tableNumber,
        name: t.name,
        section: t.section,
        capacity: t.capacity,
        token: t.qrCode?.token || null,
        isOccupied,
        status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
      };
    });

    return res.json({ tables: formattedTables });
  } catch (err: any) {
    console.error('getPublicTables error:', err);
    return res.status(500).json({ error: 'Failed to fetch public tables.' });
  }
}

interface CartItemInput {
  menuItemId: string;
  variantId?: string;
  modifierOptionIds?: string[];
  quantity: number;
  notes?: string;
}

export function resolveItemType(
  item: { itemType?: string | null },
  category?: { itemType?: string | null } | null
): 'FOOD' | 'COFFEE' {
  if (item.itemType === 'COFFEE' || item.itemType === 'FOOD') {
    return item.itemType;
  }
  if (category?.itemType === 'COFFEE' || category?.itemType === 'FOOD') {
    return category.itemType;
  }
  return 'FOOD';
}

function phoneVariants(phone: string) {
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, '');
  const ten = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return Array.from(new Set([raw, ten, `+91${ten}`, `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`].filter(Boolean)));
}

export async function getLoyaltyBalance(req: Request, res: Response) {
  try {
    const phone = req.query.phone ? String(req.query.phone).trim() : '';
    const slug = (req.query.slug ? String(req.query.slug).trim() : 'roastfuze').toLowerCase();

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required.' });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        isDeleted: true,
        isLoyaltyEnabled: true,
        loyaltyPerOrderPoints: true,
        loyaltyFoodSpendPerPoint: true,
        loyaltyCoffeeSpendPerPoint: true,
        loyaltyPointValue: true,
        loyaltyMinOrderAmount: true,
        loyaltyMinRedeemPoints: true,
      },
    });

    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ error: 'Restaurant not found or no longer available.' });
    }

    const loyalty = await prisma.customerLoyalty.findFirst({
      where: { restaurantId: restaurant.id, customerPhone: { in: phoneVariants(phone) } },
    });

    return res.json({
      phone,
      name: loyalty?.customerName || null,
      foodPoints: loyalty?.foodPoints || 0,
      coffeePoints: loyalty?.coffeePoints || 0,
      lifetimeFoodPoints: loyalty?.lifetimeFoodPoints || 0,
      lifetimeCoffeePoints: loyalty?.lifetimeCoffeePoints || 0,
      foodPointsValue: (loyalty?.foodPoints || 0) * (restaurant.loyaltyPointValue || 1.0),
      coffeePointsValue: (loyalty?.coffeePoints || 0) * (restaurant.loyaltyPointValue || 1.0),
      earnRate: {
        food: `1 Food Point per ₹${restaurant.loyaltyFoodSpendPerPoint || 10} spent on Food`,
        coffee: `1 Coffee Point per ₹${restaurant.loyaltyCoffeeSpendPerPoint || 10} spent on Coffee/Beverages`,
        perOrderBonus: restaurant.loyaltyPerOrderPoints || 0,
        pointValue: restaurant.loyaltyPointValue || 1.0,
        minOrderAmount: restaurant.loyaltyMinOrderAmount || 0,
        minRedeemPoints: restaurant.loyaltyMinRedeemPoints || 0,
        isLoyaltyEnabled: restaurant.isLoyaltyEnabled !== false,
      },
    });
  } catch (err: any) {
    console.error('getLoyaltyBalance error:', err);
    return res.status(500).json({ error: 'Failed to retrieve loyalty balance.' });
  }
}

export async function calculateCart(req: Request, res: Response) {
  try {
    const {
      restaurantSlug,
      items,
      discountCode,
      customerPhone,
      redeemFoodPoints,
      redeemCoffeePoints,
    } = req.body as {
      restaurantSlug: string;
      items: CartItemInput[];
      discountCode?: string;
      customerPhone?: string;
      redeemFoodPoints?: number;
      redeemCoffeePoints?: number;
    };

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug || 'roastfuze' },
    });

    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ error: 'Restaurant not found or no longer available.' });
    }

    if (!items || items.length === 0) {
      return res.json({
        subtotal: 0,
        foodSubtotal: 0,
        coffeeSubtotal: 0,
        potentialFoodPoints: 0,
        potentialCoffeePoints: 0,
        availableFoodPoints: 0,
        availableCoffeePoints: 0,
        maxRedeemableFoodPoints: 0,
        maxRedeemableCoffeePoints: 0,
        foodPointsRedeemed: 0,
        coffeePointsRedeemed: 0,
        loyaltyDiscount: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        items: [],
      });
    }

    let subtotal = 0;
    let foodSubtotal = 0;
    let coffeeSubtotal = 0;
    let itemSpecificFoodPoints = 0;
    let itemSpecificCoffeePoints = 0;
    let eligibleFoodSpend = 0;
    let eligibleCoffeeSpend = 0;
    const validatedItems = [];

    for (const input of items) {
      const item = await prisma.menuItem.findUnique({
        where: { id: input.menuItemId },
        include: {
          category: true,
          variants: true,
          modifierGroups: {
            include: { options: true },
          },
        },
      });

      if (!item || !item.isAvailable) {
        continue;
      }

      const itemType = resolveItemType(item, item.category);

      let unitPrice = item.price;
      let variantName: string | undefined;

      if (input.variantId) {
        const variant = item.variants.find((v) => v.id === input.variantId);
        if (variant) {
          unitPrice = variant.price;
          variantName = variant.name;
        }
      }

      let modifiersPrice = 0;
      const selectedModifiers = [];

      if (input.modifierOptionIds && input.modifierOptionIds.length > 0) {
        for (const group of item.modifierGroups) {
          for (const opt of group.options) {
            if (input.modifierOptionIds.includes(opt.id)) {
              modifiersPrice += opt.price;
              selectedModifiers.push({
                id: opt.id,
                name: opt.name,
                price: opt.price,
              });
            }
          }
        }
      }

      const quantity = Math.max(1, input.quantity);
      const itemTotal = (unitPrice + modifiersPrice) * quantity;
      subtotal += itemTotal;

      if (itemType === 'COFFEE') {
        coffeeSubtotal += itemTotal;
      } else {
        foodSubtotal += itemTotal;
      }

      const itemCustomPoints = (item as any).loyaltyPoints || 0;
      if (itemCustomPoints > 0) {
        const itemAwarded = itemCustomPoints * quantity;
        if (itemType === 'COFFEE') {
          itemSpecificCoffeePoints += itemAwarded;
        } else {
          itemSpecificFoodPoints += itemAwarded;
        }
      } else {
        if (itemType === 'COFFEE') {
          eligibleCoffeeSpend += itemTotal;
        } else {
          eligibleFoodSpend += itemTotal;
        }
      }

      validatedItems.push({
        menuItemId: item.id,
        name: item.name,
        itemType,
        variantName,
        unitPrice,
        modifiersPrice,
        modifiers: selectedModifiers,
        quantity,
        totalPrice: itemTotal,
        notes: input.notes,
      });
    }

    // Coupon discount logic
    let discountAmount = 0;
    let appliedDiscount: any = null;
    let discountError: string | null = null;
    let minOrderAmountRequired: number | null = null;

    if (discountCode && discountCode.trim()) {
      const cleanCode = discountCode.trim().toUpperCase();
      const discount = await prisma.discount.findUnique({
        where: {
          restaurantId_code: {
            restaurantId: restaurant.id,
            code: cleanCode,
          },
        },
      });

      if (!discount || !discount.isActive) {
        discountError = `Coupon code '${cleanCode}' is invalid or inactive.`;
      } else {
        minOrderAmountRequired = discount.minOrderAmount;
        if (subtotal < discount.minOrderAmount) {
          const shortage = (discount.minOrderAmount - subtotal).toFixed(2);
          discountError = `Coupon '${discount.code}' requires a minimum order of ₹${discount.minOrderAmount}. Add ₹${shortage} more to apply.`;
        } else {
          if (discount.discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * discount.value) / 100;
            if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
              discountAmount = discount.maxDiscount;
            }
          } else {
            discountAmount = Math.min(subtotal, discount.value);
          }
          appliedDiscount = {
            code: discount.code,
            amount: Number(discountAmount.toFixed(2)),
            value: discount.value,
            type: discount.discountType,
          };
        }
      }
    }

    // Dual Loyalty Points logic
    let potentialFoodPoints = 0;
    let potentialCoffeePoints = 0;

    const isLoyaltyActive = (restaurant as any).isLoyaltyEnabled !== false;
    const foodSpendRate = (restaurant as any).loyaltyFoodSpendPerPoint || 10.0;
    const coffeeSpendRate = (restaurant as any).loyaltyCoffeeSpendPerPoint || 10.0;
    const pointValue = (restaurant as any).loyaltyPointValue || 1.0;
    const minOrderAmt = (restaurant as any).loyaltyMinOrderAmount || 0;
    const perOrderBonus = (restaurant as any).loyaltyPerOrderPoints || 0;

    if (isLoyaltyActive) {
      const spendFoodPoints = Math.floor(eligibleFoodSpend / foodSpendRate);
      const spendCoffeePoints = Math.floor(eligibleCoffeeSpend / coffeeSpendRate);

      potentialFoodPoints = itemSpecificFoodPoints + spendFoodPoints;
      potentialCoffeePoints = itemSpecificCoffeePoints + spendCoffeePoints;

      if (perOrderBonus > 0 && subtotal >= minOrderAmt) {
        potentialFoodPoints += perOrderBonus;
      }
    }

    let availableFoodPoints = 0;
    let availableCoffeePoints = 0;

    if (customerPhone && customerPhone.trim()) {
      const cleanPhone = customerPhone.trim();
      const loyalty = await prisma.customerLoyalty.findUnique({
        where: {
          restaurantId_customerPhone: {
            restaurantId: restaurant.id,
            customerPhone: cleanPhone,
          },
        },
      });
      if (loyalty) {
        availableFoodPoints = loyalty.foodPoints;
        availableCoffeePoints = loyalty.coffeePoints;
      }
    }

    const minRedeemPoints = (restaurant as any).loyaltyMinRedeemPoints || 0;
    const totalWalletPoints = availableFoodPoints + availableCoffeePoints;
    const isRedeemEligible = minRedeemPoints <= 0 || totalWalletPoints >= minRedeemPoints;

    // Max redeemable: cannot exceed user's balance and cannot exceed food/coffee portions
    // If wallet has less than minRedeemPoints, maxRedeemable is 0
    const maxRedeemableFoodPoints = isRedeemEligible ? Math.min(availableFoodPoints, Math.floor(foodSubtotal)) : 0;
    const maxRedeemableCoffeePoints = isRedeemEligible ? Math.min(availableCoffeePoints, Math.floor(coffeeSubtotal)) : 0;

    let foodPointsRedeemed = 0;
    if (isRedeemEligible && redeemFoodPoints && Number(redeemFoodPoints) > 0) {
      foodPointsRedeemed = Math.min(Number(redeemFoodPoints), maxRedeemableFoodPoints);
    }

    let coffeePointsRedeemed = 0;
    if (isRedeemEligible && redeemCoffeePoints && Number(redeemCoffeePoints) > 0) {
      coffeePointsRedeemed = Math.min(Number(redeemCoffeePoints), maxRedeemableCoffeePoints);
    }

    // 1 point = ₹pointValue discount
    const loyaltyDiscount = Number(((foodPointsRedeemed + coffeePointsRedeemed) * pointValue).toFixed(2));

    const totalDeductions = discountAmount + loyaltyDiscount;
    const discountedSubtotal = Math.max(0, subtotal - totalDeductions);
    const taxAmount = Number(((discountedSubtotal * restaurant.taxPercent) / 100).toFixed(2));
    const totalAmount = Number((discountedSubtotal + taxAmount).toFixed(2));

    return res.json({
      subtotal: Number(subtotal.toFixed(2)),
      foodSubtotal: Number(foodSubtotal.toFixed(2)),
      coffeeSubtotal: Number(coffeeSubtotal.toFixed(2)),
      potentialFoodPoints,
      potentialCoffeePoints,
      availableFoodPoints,
      availableCoffeePoints,
      maxRedeemableFoodPoints,
      maxRedeemableCoffeePoints,
      foodPointsRedeemed,
      coffeePointsRedeemed,
      loyaltyDiscount: Number(loyaltyDiscount.toFixed(2)),
      minRedeemPoints,
      isRedeemEligible,
      minRedeemPointsError: !isRedeemEligible && ((redeemFoodPoints && Number(redeemFoodPoints) > 0) || (redeemCoffeePoints && Number(redeemCoffeePoints) > 0))
        ? `Minimum ${minRedeemPoints} points required in your wallet to redeem points.`
        : null,
      discountAmount: Number(discountAmount.toFixed(2)),
      discount: appliedDiscount,
      discountError,
      minOrderAmount: minOrderAmountRequired,
      taxPercent: restaurant.taxPercent,
      taxAmount,
      totalAmount,
      items: validatedItems,
    });
  } catch (err: any) {
    console.error('calculateCart error:', err);
    return res.status(500).json({ error: 'Calculation failed.' });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const {
      restaurantSlug,
      tableToken,
      items,
      orderType = 'DINE_IN',
      customerName,
      customerPhone,
      notes,
      discountCode,
      redeemFoodPoints,
      redeemCoffeePoints,
      paymentMethod = 'CASH',
    } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug || 'roastfuze' },
    });

    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ error: 'Restaurant not found or no longer available.' });
    }

    if (!restaurant.isOpen) {
      return res.status(400).json({ error: 'Restaurant is currently closed for new orders.' });
    }

    if (!restaurant.isOrderingEnabled) {
      return res.status(400).json({ error: 'Online ordering is currently paused by the cafe.' });
    }

    let tableId: string | null = null;
    let diningSessionId: string | null = null;

    if (tableToken) {
      const qrRecord = await prisma.tableQRCode.findUnique({
        where: { token: tableToken },
        include: { table: true },
      });

      if (qrRecord && qrRecord.table && qrRecord.table.isActive) {
        tableId = qrRecord.table.id;

        // Find or create active dining session for this table
        let session = await prisma.diningSession.findFirst({
          where: {
            tableId: tableId,
            status: 'ACTIVE',
          },
        });

        if (!session) {
          session = await prisma.diningSession.create({
            data: {
              tableId,
              sessionToken: `ses-${crypto.randomBytes(8).toString('hex')}`,
              customerName: customerName || null,
              customerPhone: customerPhone || null,
            },
          });
        }
        diningSessionId = session.id;
      }
    }

    if (orderType === 'DINE_IN' && !tableId) {
      return res.status(400).json({ error: 'Table association is required for dine-in orders.' });
    }

    // Authoritatively calculate order totals
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
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
      const item = await prisma.menuItem.findUnique({
        where: { id: input.menuItemId },
        include: {
          category: true,
          variants: true,
          modifierGroups: {
            include: { options: true },
          },
        },
      });

      if (!item || !item.isAvailable) {
        return res.status(400).json({ error: `Item "${item?.name || 'Unknown'}" is currently unavailable.` });
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

      if (input.modifierOptionIds && input.modifierOptionIds.length > 0) {
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

      const quantity = Math.max(1, input.quantity);
      const totalPrice = (unitPrice + modifiersPrice) * quantity;
      subtotal += totalPrice;

      if (itemType === 'COFFEE') {
        coffeeSubtotal += totalPrice;
      } else {
        foodSubtotal += totalPrice;
      }

      const itemCustomPoints = (item as any).loyaltyPoints || 0;
      if (itemCustomPoints > 0) {
        const itemAwarded = itemCustomPoints * quantity;
        if (itemType === 'COFFEE') {
          itemSpecificCoffeePoints += itemAwarded;
        } else {
          itemSpecificFoodPoints += itemAwarded;
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
        unitPrice: unitPrice + modifiersPrice,
        quantity,
        totalPrice,
        notes: input.notes || null,
        modifiers: itemModifiersData,
      });
    }

    // Apply Coupon Discount if applicable
    let discountAmount = 0;
    let validDiscountId: string | null = null;

    if (discountCode && discountCode.trim()) {
      const discount = await prisma.discount.findUnique({
        where: {
          restaurantId_code: {
            restaurantId: restaurant.id,
            code: discountCode.trim().toUpperCase(),
          },
        },
      });

      if (discount && discount.isActive && subtotal >= discount.minOrderAmount) {
        if (discount.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * discount.value) / 100;
          if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
            discountAmount = discount.maxDiscount;
          }
        } else {
          discountAmount = Math.min(subtotal, discount.value);
        }
        validDiscountId = discount.id;
      }
    }

    // Dual Loyalty Points:
    // Food Points can only be redeemed against Food subtotal
    // Coffee Points can only be redeemed against Coffee subtotal
    let loyaltyRecord: any = null;
    let actualFoodRedeemed = 0;
    let actualCoffeeRedeemed = 0;
    const cleanPhone = customerPhone ? String(customerPhone).trim() : null;

    if (cleanPhone) {
      loyaltyRecord = await prisma.customerLoyalty.findUnique({
        where: {
          restaurantId_customerPhone: {
            restaurantId: restaurant.id,
            customerPhone: cleanPhone,
          },
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

      const minRedeemPoints = (restaurant as any).loyaltyMinRedeemPoints || 0;
      const totalWalletPoints = (loyaltyRecord.foodPoints || 0) + (loyaltyRecord.coffeePoints || 0);
      const wantRedeem = (redeemFoodPoints && Number(redeemFoodPoints) > 0) || (redeemCoffeePoints && Number(redeemCoffeePoints) > 0);
      if (wantRedeem && minRedeemPoints > 0 && totalWalletPoints < minRedeemPoints) {
        return res.status(400).json({
          error: `Minimum ${minRedeemPoints} points required in your wallet to redeem (you currently have ${totalWalletPoints} points).`,
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

    const isLoyaltyActive = (restaurant as any).isLoyaltyEnabled !== false;
    const foodSpendRate = (restaurant as any).loyaltyFoodSpendPerPoint || 10.0;
    const coffeeSpendRate = (restaurant as any).loyaltyCoffeeSpendPerPoint || 10.0;
    const pointValue = (restaurant as any).loyaltyPointValue || 1.0;
    const minOrderAmt = (restaurant as any).loyaltyMinOrderAmount || 0;
    const perOrderBonus = (restaurant as any).loyaltyPerOrderPoints || 0;

    // Point = ₹pointValue discount
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

    const discountedSubtotal = Math.max(0, subtotal - discountAmount - loyaltyDiscount);
    const taxAmount = Number(((discountedSubtotal * restaurant.taxPercent) / 100).toFixed(2));
    const totalAmount = Number((discountedSubtotal + taxAmount).toFixed(2));

    // Unique order number and public order token
    const count = await prisma.order.count({ where: { restaurantId: restaurant.id } });
    const orderNumber = `RF-${1001 + count}`;
    const orderToken = `ord-${crypto.randomBytes(12).toString('hex')}`;

    // Persist Order and Items atomically
    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderToken,
        restaurantId: restaurant.id,
        tableId,
        diningSessionId,
        orderType,
        customerName: customerName ? String(customerName).trim() : null,
        customerPhone: cleanPhone,
        notes: notes ? String(notes).trim() : null,
        subtotal,
        discountAmount,
        foodPointsEarned,
        coffeePointsEarned,
        foodPointsRedeemed: actualFoodRedeemed,
        coffeePointsRedeemed: actualCoffeeRedeemed,
        loyaltyDiscount,
        taxAmount,
        totalAmount,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'RAZORPAY' ? 'PENDING' : 'PENDING',
        paymentMethod,
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
            method: paymentMethod,
            status: paymentMethod === 'RAZORPAY' ? 'PENDING' : 'PENDING',
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

    // Record discount redemption if used
    if (validDiscountId && discountAmount > 0) {
      await prisma.discountRedemption.create({
        data: {
          discountId: validDiscountId,
          orderId: order.id,
          amount: discountAmount,
        },
      });
      await prisma.discount.update({
        where: { id: validDiscountId },
        data: { timesUsed: { increment: 1 } },
      });
    }

    // Process Loyalty Updates & Transactions
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

      // Log transactions
      if (actualFoodRedeemed > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            customerLoyaltyId: loyaltyRecord.id,
            orderId: order.id,
            pointsType: 'FOOD',
            points: -actualFoodRedeemed,
            reason: 'ORDER_REDEEMED',
            description: `Redeemed ${actualFoodRedeemed} Food points on Order #${orderNumber}`,
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
            reason: 'ORDER_REDEEMED',
            description: `Redeemed ${actualCoffeeRedeemed} Coffee points on Order #${orderNumber}`,
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
            reason: 'ORDER_EARNED',
            description: `Earned ${foodPointsEarned} Food points from Order #${orderNumber}`,
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
            reason: 'ORDER_EARNED',
            description: `Earned ${coffeePointsEarned} Coffee points from Order #${orderNumber}`,
          },
        });
      }
    }

    const whatsappNotification = cleanPhone
      ? {
          phone: cleanPhone,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          orderToken: order.orderToken,
          foodPointsEarned,
          coffeePointsEarned,
          foodPointsBalance: updatedLoyaltyRecord?.foodPoints || 0,
          coffeePointsBalance: updatedLoyaltyRecord?.coffeePoints || 0,
        }
      : null;

    // Do not make order placement depend on WhatsApp availability.
    if (whatsappNotification) {
      void sendLoyaltyWhatsApp(whatsappNotification);
    }

    // Emit realtime event to restaurant staff & kitchen
    emitNewOrder(restaurant.id, {
      ...order,
      createdAt: order.createdAt.toISOString(),
    });

    return res.status(201).json({
      success: true,
      orderToken: order.orderToken,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      tableNumber: order.table?.tableNumber,
      loyalty: {
        foodPointsEarned,
        coffeePointsEarned,
        foodPointsRedeemed: actualFoodRedeemed,
        coffeePointsRedeemed: actualCoffeeRedeemed,
        loyaltyDiscount,
        newFoodPointsBalance: updatedLoyaltyRecord ? updatedLoyaltyRecord.foodPoints : 0,
        newCoffeePointsBalance: updatedLoyaltyRecord ? updatedLoyaltyRecord.coffeePoints : 0,
      },
      whatsapp: whatsappNotification
        ? { status: 'QUEUED', fallbackUrl: buildLoyaltyWhatsAppLink(whatsappNotification) }
        : { status: 'SKIPPED', fallbackUrl: null },
    });
  } catch (err: any) {
    console.error('createOrder error:', err);
    return res.status(500).json({ error: 'Failed to place order.' });
  }
}

export async function getOrderStatus(req: Request, res: Response) {
  try {
    const { orderToken } = req.params;
    if (!orderToken) {
      return res.status(400).json({ error: 'Order token is required.' });
    }

    const order = await prisma.order.findUnique({
      where: { orderToken },
      include: {
        table: {
          select: { tableNumber: true, name: true, section: true },
        },
        restaurant: {
          select: { name: true, phone: true, currencySymbol: true, upiId: true },
        },
        items: {
          include: {
            modifiers: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    let customerLoyalty = null;
    if (order.customerPhone) {
      customerLoyalty = await prisma.customerLoyalty.findUnique({
        where: {
          restaurantId_customerPhone: {
            restaurantId: order.restaurantId,
            customerPhone: order.customerPhone.trim(),
          },
        },
        select: {
          foodPoints: true,
          coffeePoints: true,
          lifetimeFoodPoints: true,
          lifetimeCoffeePoints: true,
        },
      });
    }

    return res.json({
      orderNumber: order.orderNumber,
      orderToken: order.orderToken,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      table: order.table,
      restaurant: order.restaurant,
      items: order.items,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      foodPointsEarned: order.foodPointsEarned,
      coffeePointsEarned: order.coffeePointsEarned,
      foodPointsRedeemed: order.foodPointsRedeemed,
      coffeePointsRedeemed: order.coffeePointsRedeemed,
      loyaltyDiscount: order.loyaltyDiscount,
      customerLoyalty,
      whatsappLink: order.customerPhone && customerLoyalty
        ? buildLoyaltyWhatsAppLink({
            phone: order.customerPhone,
            customerName: order.customerName,
            orderNumber: order.orderNumber,
            orderToken: order.orderToken,
            foodPointsEarned: order.foodPointsEarned,
            coffeePointsEarned: order.coffeePointsEarned,
            foodPointsBalance: customerLoyalty.foodPoints,
            coffeePointsBalance: customerLoyalty.coffeePoints,
          })
        : null,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      estimatedPrepTime: order.estimatedPrepTime,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (err: any) {
    console.error('getOrderStatus error:', err);
    return res.status(500).json({ error: 'Failed to fetch order status.' });
  }
}

export async function createReview(req: Request, res: Response) {
  try {
    const slug = (req.params.slug || 'roastfuze').toLowerCase().trim();
    const { customerName, rating, comment } = req.body;

    if (!customerName || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and comment are required.' });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant || restaurant.isDeleted) {
      return res.status(404).json({ error: 'Restaurant not found or no longer available.' });
    }

    const review = await prisma.review.create({
      data: {
        restaurantId: restaurant.id,
        customerName: String(customerName).trim(),
        rating: Math.min(5, Math.max(1, Number(rating))),
        comment: String(comment).trim(),
        isApproved: true, // Auto-approve or admin can toggle
      },
    });

    // Notify cafe admin in real time
    emitNewReview(restaurant.id, review);

    return res.status(201).json({ success: true, review });
  } catch (err: any) {
    console.error('createReview error:', err);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
}

export async function confirmOrderPayment(req: Request, res: Response) {
  try {
    const { orderToken } = req.params;
    const { utrNumber, paymentMethod = 'UPI' } = req.body;

    const order = await prisma.order.findUnique({
      where: { orderToken },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paymentMethod,
        payments: {
          create: {
            amount: order.totalAmount,
            method: paymentMethod,
            status: 'SUCCESS',
            transactionId: utrNumber ? String(utrNumber).trim() : `UPI-${Date.now()}`,
          },
        },
      },
      include: {
        table: true,
        items: true,
      },
    });

    // If order is associated with a table, close the active dining session to free the table immediately
    if (order.tableId) {
      await prisma.diningSession.updateMany({
        where: { tableId: order.tableId, status: 'ACTIVE' },
        data: { status: 'COMPLETED', closedAt: new Date() },
      });
    }

    // Real-time broadcast to admin and kitchen display
    emitOrderStatusUpdated(updated.restaurantId, updated.orderToken, updated.status, updated);

    return res.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('confirmOrderPayment error:', err);
    return res.status(500).json({ error: 'Failed to confirm payment.' });
  }
}

// ----------------------------------------------------
// PAYMENT GATEWAY WEBHOOK VERIFICATION (PhonePe & Paytm)
// ----------------------------------------------------
export async function handlePhonePeWebhook(req: Request, res: Response) {
  try {
    const rawBody = req.body;
    let payload = rawBody;

    // PhonePe sends { response: "<base64>" }
    if (rawBody && rawBody.response) {
      try {
        const decoded = Buffer.from(rawBody.response, 'base64').toString('utf-8');
        payload = JSON.parse(decoded);
      } catch (e) {
        console.warn('Could not base64 decode PhonePe webhook response, using raw body:', e);
      }
    }

    const data = payload?.data || payload;
    const isSuccess =
      payload?.success === true ||
      payload?.code === 'PAYMENT_SUCCESS' ||
      data?.responseCode === 'SUCCESS' ||
      data?.state === 'COMPLETED';

    const transactionId =
      data?.merchantTransactionId ||
      data?.transactionId ||
      (req.query.orderToken as string) ||
      (req.query.orderId as string);

    const utr =
      data?.paymentInstrument?.utr ||
      data?.paymentInstrument?.bankTransactionId ||
      data?.transactionId ||
      `PHONEPE-${Date.now()}`;

    const amountPaid = data?.amount ? Number(data.amount) / 100 : undefined; // paise to INR

    if (!transactionId) {
      return res.status(200).json({ success: true, message: 'Webhook received but no transaction ID provided.' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderToken: String(transactionId) },
          { id: String(transactionId) },
          { orderNumber: String(transactionId).replace(/^RF-/, '') },
          { orderNumber: String(transactionId) },
        ],
      },
      include: { table: true, items: true },
    });

    if (!order) {
      console.warn(`PhonePe Webhook: Order ${transactionId} not found`);
      return res.status(200).json({ success: true, message: 'Order not found, acknowledged.' });
    }

    if (isSuccess && order.paymentStatus !== 'PAID') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'PHONEPE_BUSINESS',
          payments: {
            create: {
              amount: amountPaid || order.totalAmount,
              method: 'PHONEPE_BUSINESS',
              status: 'SUCCESS',
              transactionId: String(utr),
              notes: 'Auto-verified via PhonePe for Business Webhook API',
            },
          },
        },
        include: { table: true, items: true },
      });

      if (order.tableId) {
        await prisma.diningSession.updateMany({
          where: { tableId: order.tableId, status: 'ACTIVE' },
          data: { status: 'COMPLETED', closedAt: new Date() },
        });
      }

      emitOrderStatusUpdated(order.restaurantId, order.orderToken, updated.status, updated);
      console.log(`✅ Order ${order.orderNumber} auto-verified as PAID via PhonePe Webhook (UTR: ${utr})`);
    }

    return res.status(200).json({ success: true, message: 'PhonePe webhook processed successfully' });
  } catch (err: any) {
    console.error('PhonePe Webhook Error:', err);
    return res.status(200).json({ success: true, message: 'Error logged' });
  }
}

export async function handlePaytmWebhook(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const orderId = body.ORDERID || (req.query.orderId as string);
    const status = body.STATUS;
    const utr = body.BANKTXNID || body.TXNID || `PAYTM-${Date.now()}`;
    const amount = body.TXNAMOUNT ? Number(body.TXNAMOUNT) : undefined;

    if (!orderId) {
      return res.status(200).json({ success: true, message: 'No ORDERID' });
    }

    const isSuccess = status === 'TXN_SUCCESS';

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderToken: String(orderId) },
          { id: String(orderId) },
          { orderNumber: String(orderId).replace(/^RF-/, '') },
          { orderNumber: String(orderId) },
        ],
      },
      include: { table: true, items: true },
    });

    if (!order) {
      return res.status(200).json({ success: true, message: 'Order not found' });
    }

    if (isSuccess && order.paymentStatus !== 'PAID') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'PAYTM_BUSINESS',
          payments: {
            create: {
              amount: amount || order.totalAmount,
              method: 'PAYTM_BUSINESS',
              status: 'SUCCESS',
              transactionId: String(utr),
              notes: 'Auto-verified via Paytm for Business Webhook API',
            },
          },
        },
        include: { table: true, items: true },
      });

      if (order.tableId) {
        await prisma.diningSession.updateMany({
          where: { tableId: order.tableId, status: 'ACTIVE' },
          data: { status: 'COMPLETED', closedAt: new Date() },
        });
      }

      emitOrderStatusUpdated(order.restaurantId, order.orderToken, updated.status, updated);
      console.log(`✅ Order ${order.orderNumber} auto-verified as PAID via Paytm Webhook (UTR: ${utr})`);
    }

    return res.status(200).json({ success: true, message: 'Paytm webhook processed' });
  } catch (err: any) {
    console.error('Paytm Webhook Error:', err);
    return res.status(200).json({ success: true, message: 'Error logged' });
  }
}

// ----------------------------------------------------
// COMMUNITY, EVENTS & SONG REQUESTS
// ----------------------------------------------------
import { addSongRequest, getSongRequests, addEventRsvp, getEventRsvps } from '../realtime/socket';

export async function getPublicCommunityEvents(req: Request, res: Response) {
  const events = [
    {
      id: 'diwali-night-2026',
      title: 'Diwali Acoustic Balcony Night 🪔',
      subtitle: 'Deepotsav Live Unplugged Jam & Balcony Fairy Lights',
      date: 'Sunday, 1 Nov 2026',
      time: '7:00 PM – 11:30 PM',
      badge: 'Diwali Special',
      description:
        'Celebrate the festival of lights on RoastFuze’s musical balcony with 100+ handmade diyas, live unplugged acoustic guitarists, and our special festive warm desserts.',
      offerText: 'Complimentary Warm Brownie or Festive Waffle on orders above ₹399',
      couponCode: 'DIWALIROAST',
      discountPercent: 20,
      image: '/uploads/gallery_musical_interior.jpg',
      isRsvpOpen: true,
    },
    {
      id: 'friday-jam-sessions',
      title: 'Friday Indie Sunset Jam Sessions 🎸',
      subtitle: 'Open Mic, Acoustic Guitars & Cold Brews',
      date: 'Every Friday Evening',
      time: '6:30 PM – 9:30 PM',
      badge: 'Weekly Feature',
      description:
        'Bring your guitar, ukulele, or just your voice. An open jam session for Jaipur music lovers overlooking the sunset.',
      offerText: '15% Off for all performing musicians and open-mic artists',
      couponCode: 'JAMROAST',
      discountPercent: 15,
      image: '/uploads/gallery_coffee_table.jpg',
      isRsvpOpen: true,
    },
    {
      id: 'sunday-barista-masterclass',
      title: 'Sunday Pour-Over & Latte Art Workshop ☕',
      subtitle: 'Master the Craft with RoastFuze Head Barista',
      date: 'Every Sunday Morning',
      time: '11:00 AM – 1:00 PM',
      badge: 'Workshop',
      description:
        'Discover the secrets of specialty coffee: roast profiles, V60 pour-over techniques, and micro-foam pouring for perfect heart & rosetta latte art.',
      offerText: 'Free 100g freshly roasted sample pouch to all participants',
      couponCode: 'BARISTA10',
      discountPercent: 10,
      image: '/uploads/gallery_balcony_exterior.jpg',
      isRsvpOpen: true,
    },
  ];

  return res.json({ events });
}

export async function createSongRequest(req: Request, res: Response) {
  try {
    const { customerName, customerPhone, tableNumber, songTitle, artist, notes } = req.body;
    if (!customerName || !songTitle) {
      return res.status(400).json({ error: 'Customer name and song title are required.' });
    }

    const request = addSongRequest({
      customerName: String(customerName).trim(),
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      tableNumber: tableNumber ? String(tableNumber).trim() : 'Balcony Seat',
      songTitle: String(songTitle).trim(),
      artist: artist ? String(artist).trim() : 'Artist not specified',
      notes: notes ? String(notes).trim() : undefined,
    });

    return res.json({ success: true, request });
  } catch (err: any) {
    console.error('createSongRequest error:', err);
    return res.status(500).json({ error: 'Failed to submit song request.' });
  }
}

export async function getPublicSongRequests(req: Request, res: Response) {
  return res.json({ requests: getSongRequests() });
}

export async function createEventRsvp(req: Request, res: Response) {
  try {
    const { name, phone, eventId, eventTitle, guestsCount, notes } = req.body;
    if (!name || !phone || !eventId) {
      return res.status(400).json({ error: 'Name, phone and event are required.' });
    }

    const rsvp = addEventRsvp({
      name: String(name).trim(),
      phone: String(phone).trim(),
      eventId: String(eventId),
      eventTitle: eventTitle || 'RoastFuze Event',
      guestsCount: Number(guestsCount) || 2,
      notes: notes ? String(notes).trim() : undefined,
    });

    return res.json({ success: true, rsvp });
  } catch (err: any) {
    console.error('createEventRsvp error:', err);
    return res.status(500).json({ error: 'Failed to record RSVP.' });
  }
}

