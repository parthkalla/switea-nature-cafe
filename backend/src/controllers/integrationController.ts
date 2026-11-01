import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { emitNewOrder, emitOrderStatusUpdate } from '../realtime/socket';
import { isValidMarketplaceWebhook, normaliseMarketplaceOrder, Marketplace } from '../services/marketplace';

// In-memory queue for bi-directional command dispatch (KDS -> Extension -> Swiggy/Zomato)
interface QueuedAction {
  id: string;
  restaurantId: string;
  restaurantSlug: string;
  orderId: string;
  externalOrderId?: string;
  source: 'SWIGGY' | 'ZOMATO';
  action: 'MARK_READY' | 'ACCEPT_ORDER' | 'REJECT_ORDER';
  createdAt: number;
}

export const pendingActionsQueue: QueuedAction[] = [];

export function pushActionToQueue(actionItem: {
  restaurantId: string;
  restaurantSlug: string;
  orderId: string;
  externalOrderId?: string;
  source: 'SWIGGY' | 'ZOMATO';
  action: 'MARK_READY' | 'ACCEPT_ORDER' | 'REJECT_ORDER';
}) {
  pendingActionsQueue.push({
    id: `act-${crypto.randomBytes(6).toString('hex')}`,
    ...actionItem,
    createdAt: Date.now(),
  });
}

// 1. Existing Webhook Handler
export async function receiveMarketplaceOrder(req: Request, res: Response) {
  const source = String(req.params.source || '').toUpperCase() as Marketplace;
  if (source !== 'SWIGGY' && source !== 'ZOMATO') return res.status(404).json({ error: 'Unknown marketplace.' });
  if (!isValidMarketplaceWebhook(source, req.header('x-webhook-signature') || req.header('x-signature'), JSON.stringify(req.body || {}))) {
    return res.status(401).json({ error: 'Invalid marketplace webhook signature.' });
  }
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { slug: String(req.body.restaurant_slug || 'roastfuze') } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });
    const incoming = normaliseMarketplaceOrder(source, req.body);
    if (!incoming.externalOrderId) return res.status(400).json({ error: 'Marketplace order id is required.' });
    const existing = await prisma.order.findFirst({ where: { restaurantId: restaurant.id, source, externalOrderId: incoming.externalOrderId } });
    if (existing) return res.json({ success: true, duplicate: true, orderId: existing.id });
    const order = await prisma.order.create({
      data: {
        orderNumber: incoming.orderNumber,
        orderToken: `ord-${crypto.randomBytes(12).toString('hex')}`,
        restaurantId: restaurant.id,
        orderType: incoming.orderType,
        source: incoming.source,
        externalOrderId: incoming.externalOrderId,
        externalStatus: incoming.externalStatus,
        externalPayload: incoming.rawPayload,
        customerName: incoming.customerName,
        customerPhone: incoming.customerPhone,
        riderName: incoming.riderName,
        riderPhone: incoming.riderPhone,
        riderVehicle: incoming.riderVehicle,
        deliveryAddress: incoming.deliveryAddress,
        deliveryLat: incoming.deliveryLat,
        deliveryLng: incoming.deliveryLng,
        deliveryEta: incoming.deliveryEta,
        notes: incoming.notes,
        subtotal: incoming.subtotal,
        taxAmount: incoming.taxAmount,
        discountAmount: incoming.discountAmount,
        totalAmount: incoming.totalAmount,
        paymentStatus: incoming.paymentStatus,
        paymentMethod: incoming.paymentMethod,
        status: incoming.status,
        items: { create: incoming.items }
      },
      include: { items: true, table: true }
    });
    emitNewOrder(restaurant.id, { ...order, createdAt: order.createdAt.toISOString() });
    return res.status(201).json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error) {
    console.error('Marketplace webhook error:', error);
    return res.status(500).json({ error: 'Failed to import marketplace order.' });
  }
}

// 2. Chrome Extension: Inbound Order Sync
export async function syncExtensionOrder(req: Request, res: Response) {
  try {
    const {
      source,
      externalOrderId,
      orderNumber,
      customerName,
      customerPhone,
      riderName,
      riderPhone,
      riderStatus,
      riderEtaMinutes,
      deliveryAddress,
      items = [],
      subtotal = 0,
      taxAmount = 0,
      discountAmount = 0,
      totalAmount = 0,
      notes,
      isDemo = false,
      restaurantSlug = 'roastfuze'
    } = req.body;

    const isDemoOrder = Boolean(
      isDemo ||
      String(externalOrderId || '').startsWith('TEST-') ||
      String(notes || '').includes('[DEMO]') ||
      String(customerName || '').includes('(Zomato Gold)') ||
      String(customerName || '').includes('(Swiggy One)')
    );

    const normSource = String(source || 'ZOMATO').toUpperCase();
    if (normSource !== 'SWIGGY' && normSource !== 'ZOMATO') {
      return res.status(400).json({ error: 'Source must be SWIGGY or ZOMATO' });
    }

    let targetSlug = String(restaurantSlug || 'roastfuze').trim();
    if (targetSlug === 'localhost' || targetSlug === '127.0.0.1' || !targetSlug) {
      targetSlug = 'roastfuze';
    }

    let restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { slug: targetSlug },
          { id: targetSlug }
        ],
        isDeleted: false
      }
    });

    if (!restaurant) {
      restaurant = await prisma.restaurant.findFirst({
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' }
      });
    }

    if (!restaurant) {
      return res.status(404).json({ error: 'No active restaurant found in system.' });
    }

    const extId = String(externalOrderId || `EXT-${Date.now()}`);

    // Idempotency check: Don't duplicate if already exists
    const existing = await prisma.order.findFirst({
      where: {
        restaurantId: restaurant.id,
        source: normSource,
        externalOrderId: extId
      }
    });

    if (existing) {
      return res.json({ success: true, duplicate: true, orderId: existing.id, orderNumber: existing.orderNumber });
    }

    const displayOrderNum = orderNumber || `${normSource === 'ZOMATO' ? 'ZM' : 'SW'}-${extId.slice(-4)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber: displayOrderNum,
        orderToken: `ord-${crypto.randomBytes(12).toString('hex')}`,
        restaurantId: restaurant.id,
        orderType: 'DELIVERY',
        source: normSource,
        isDemo: isDemoOrder,
        externalOrderId: extId,
        externalStatus: riderStatus || 'ASSIGNED',
        externalPayload: JSON.stringify(req.body),
        customerName: customerName || `${normSource} Online Customer`,
        customerPhone: customerPhone || '+91 98000 00000',
        riderName: riderName || (normSource === 'ZOMATO' ? 'Zomato Valet' : 'Swiggy Rider'),
        riderPhone: riderPhone || null,
        deliveryAddress: deliveryAddress || 'Online Delivery Address',
        deliveryEta: riderEtaMinutes || 15,
        notes: notes || null,
        subtotal: Number(subtotal) || Number(totalAmount) || 250,
        taxAmount: Number(taxAmount) || 0,
        discountAmount: Number(discountAmount) || 0,
        totalAmount: Number(totalAmount) || 250,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        status: 'ACCEPTED',
        items: {
          create: items.map((i: any) => ({
            itemName: i.name || i.itemName || 'Special Online Dish',
            quantity: Number(i.quantity) || 1,
            unitPrice: Number(i.price) || Number(i.unitPrice) || 150,
            totalPrice: (Number(i.quantity) || 1) * (Number(i.price) || Number(i.unitPrice) || 150),
            notes: i.instructions || i.notes || null
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Realtime notification to KDS & Admin Orders
    emitNewOrder(restaurant.id, {
      ...order,
      createdAt: order.createdAt.toISOString()
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: `Successfully synchronized ${normSource} order to kitchen.`
    });
  } catch (err: any) {
    console.error('syncExtensionOrder error:', err);
    return res.status(500).json({ error: err.message || 'Failed to sync extension order.' });
  }
}

// 3. Queue Action from RoastFuze KDS (Chef clicks Food Ready)
export async function queueExtensionAction(req: Request, res: Response) {
  try {
    const { orderId, action } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true }
    });

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.source !== 'SWIGGY' && order.source !== 'ZOMATO') {
      return res.status(400).json({ error: 'Order is not from Swiggy or Zomato.' });
    }

    const actionItem: QueuedAction = {
      id: `act-${crypto.randomBytes(6).toString('hex')}`,
      restaurantId: order.restaurantId,
      restaurantSlug: order.restaurant.slug,
      orderId: order.id,
      externalOrderId: order.externalOrderId || undefined,
      source: order.source as 'SWIGGY' | 'ZOMATO',
      action: action || 'MARK_READY',
      createdAt: Date.now()
    };

    pendingActionsQueue.push(actionItem);
    return res.json({ success: true, actionId: actionItem.id, queued: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// 4. Extension polls pending actions
export async function getPendingActions(req: Request, res: Response) {
  const slug = String(req.query.restaurantSlug || '');
  const now = Date.now();
  // Filter out actions older than 2 minutes
  const validActions = pendingActionsQueue.filter(a => now - a.createdAt < 120000);

  const matched = slug
    ? validActions.filter(a => a.restaurantSlug === slug)
    : validActions;

  return res.json({ actions: matched });
}

// 5. Extension ACKs completed action
export async function ackAction(req: Request, res: Response) {
  const { actionId } = req.body;
  const idx = pendingActionsQueue.findIndex(a => a.id === actionId);
  if (idx !== -1) {
    pendingActionsQueue.splice(idx, 1);
  }
  return res.json({ success: true });
}

// 6. Update Delivery Rider Live Status
export async function updateRiderStatus(req: Request, res: Response) {
  try {
    const { externalOrderId, riderStatus, riderName, riderPhone, deliveryEta } = req.body;
    if (!externalOrderId) return res.status(400).json({ error: 'externalOrderId required.' });

    const order = await prisma.order.findFirst({
      where: { externalOrderId: String(externalOrderId) }
    });

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        externalStatus: riderStatus || order.externalStatus,
        ...(riderName ? { riderName } : {}),
        ...(riderPhone ? { riderPhone } : {}),
        ...(deliveryEta ? { deliveryEta: Number(deliveryEta) } : {})
      }
    });

    emitOrderStatusUpdate(order.restaurantId, updated.id, updated.status, updated.externalStatus || undefined);
    return res.json({ success: true, order: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
