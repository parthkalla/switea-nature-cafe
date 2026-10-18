import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { emitNewOrder } from '../realtime/socket';

export async function getLandingPage(req: Request, res: Response) {
  try {
    const slug = (req.params.slug || 'switea').toLowerCase().trim();

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

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    // Featured bestsellers
    const bestsellers = await prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        isBestseller: true,
        isAvailable: true,
      },
      take: 6,
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
    const slug = (req.params.slug || 'switea').toLowerCase().trim();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        tagLine: true,
        description: true,
        logo: true,
        coverImage: true,
        openingHours: true,
        currency: true,
        currencySymbol: true,
        taxPercent: true,
        isOrderingEnabled: true,
        isPayAtCounterOnly: true,
        isOpen: true,
        phone: true,
        address: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
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

interface CartItemInput {
  menuItemId: string;
  variantId?: string;
  modifierOptionIds?: string[];
  quantity: number;
  notes?: string;
}

export async function calculateCart(req: Request, res: Response) {
  try {
    const { restaurantSlug, items, discountCode } = req.body as {
      restaurantSlug: string;
      items: CartItemInput[];
      discountCode?: string;
    };

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug || 'switea' },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    if (!items || items.length === 0) {
      return res.json({
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        items: [],
      });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const input of items) {
      const item = await prisma.menuItem.findUnique({
        where: { id: input.menuItemId },
        include: {
          variants: true,
          modifierGroups: {
            include: { options: true },
          },
        },
      });

      if (!item || !item.isAvailable) {
        continue;
      }

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

      const itemTotal = (unitPrice + modifiersPrice) * Math.max(1, input.quantity);
      subtotal += itemTotal;

      validatedItems.push({
        menuItemId: item.id,
        name: item.name,
        variantName,
        unitPrice,
        modifiersPrice,
        modifiers: selectedModifiers,
        quantity: Math.max(1, input.quantity),
        totalPrice: itemTotal,
        notes: input.notes,
      });
    }

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

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number(((discountedSubtotal * restaurant.taxPercent) / 100).toFixed(2));
    const totalAmount = Number((discountedSubtotal + taxAmount).toFixed(2));

    return res.json({
      subtotal: Number(subtotal.toFixed(2)),
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
      paymentMethod = 'CASH',
    } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug || 'switea' },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
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
    const orderItemsData: any[] = [];

    for (const input of items) {
      const item = await prisma.menuItem.findUnique({
        where: { id: input.menuItemId },
        include: {
          variants: true,
          modifierGroups: {
            include: { options: true },
          },
        },
      });

      if (!item || !item.isAvailable) {
        return res.status(400).json({ error: `Item "${item?.name || 'Unknown'}" is currently unavailable.` });
      }

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

      orderItemsData.push({
        menuItemId: item.id,
        itemName,
        unitPrice: unitPrice + modifiersPrice,
        quantity,
        totalPrice,
        notes: input.notes || null,
        modifiers: itemModifiersData,
      });
    }

    // Apply Discount if applicable
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

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number(((discountedSubtotal * restaurant.taxPercent) / 100).toFixed(2));
    const totalAmount = Number((discountedSubtotal + taxAmount).toFixed(2));

    // Unique order number and public order token
    const count = await prisma.order.count({ where: { restaurantId: restaurant.id } });
    const orderNumber = `SW-${1001 + count}`;
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
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        notes: notes ? String(notes).trim() : null,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'RAZORPAY' ? 'PENDING' : 'PENDING',
        paymentMethod,
        items: {
          create: orderItemsData.map((oi) => ({
            menuItemId: oi.menuItemId,
            itemName: oi.itemName,
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
          select: { name: true, phone: true, currencySymbol: true },
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
    const slug = (req.params.slug || 'switea').toLowerCase().trim();
    const { customerName, rating, comment } = req.body;

    if (!customerName || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and comment are required.' });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
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

    return res.status(201).json({ success: true, review });
  } catch (err: any) {
    console.error('createReview error:', err);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
}
