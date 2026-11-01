import crypto from 'crypto';

export type Marketplace = 'SWIGGY' | 'ZOMATO';

function expectedSecret(source: Marketplace) {
  return source === 'SWIGGY' ? process.env.SWIGGY_WEBHOOK_SECRET : process.env.ZOMATO_WEBHOOK_SECRET;
}

export function isValidMarketplaceWebhook(source: Marketplace, signature: string | undefined, rawBody: string) {
  const secret = expectedSecret(source);
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const supplied = signature.replace(/^sha256=/, '').trim();
  return supplied.length === digest.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(digest));
}

export function normaliseMarketplaceOrder(source: Marketplace, payload: any) {
  const externalOrderId = String(payload.order_id || payload.orderId || payload.id || payload.order?.id || '').trim();
  const customer = payload.customer || payload.user || {};
  const rider = payload.rider || payload.delivery_partner || payload.deliveryPartner || {};
  const delivery = payload.delivery || payload.address || {};
  const rawItems = payload.items || payload.order?.items || payload.cart?.items || [];
  const items = Array.isArray(rawItems) ? rawItems.map((item: any) => {
    const quantity = Math.max(1, Number(item.quantity || item.qty || 1));
    const unitPrice = Number(item.price || item.unit_price || item.unitPrice || 0);
    return { itemName: String(item.name || item.item_name || item.title || 'Marketplace item'), itemType: String(item.item_type || item.itemType || 'FOOD').toUpperCase() === 'COFFEE' ? 'COFFEE' : 'FOOD', unitPrice, quantity, totalPrice: Number(item.total_price || item.totalPrice || unitPrice * quantity), notes: item.notes ? String(item.notes) : null };
  }) : [];
  const subtotal = Number(payload.subtotal || payload.order?.subtotal || items.reduce((sum: number, item: any) => sum + item.totalPrice, 0));
  const taxAmount = Number(payload.tax || payload.tax_amount || 0);
  const totalAmount = Number(payload.total || payload.total_amount || payload.amount || subtotal + taxAmount);
  const externalStatus = String(payload.status || payload.order_status || payload.order?.status || 'PENDING').toUpperCase();
  return {
    source, externalOrderId, externalStatus,
    orderNumber: `${source}-${externalOrderId || crypto.randomUUID().slice(0, 8)}`,
    orderType: 'DELIVERY', customerName: customer.name || customer.customer_name || payload.customer_name || null,
    customerPhone: customer.phone || customer.mobile || payload.customer_phone || null,
    riderName: rider.name || rider.rider_name || payload.rider_name || null,
    riderPhone: rider.phone || rider.mobile || payload.rider_phone || null,
    riderVehicle: rider.vehicle || rider.vehicle_number || payload.rider_vehicle || null,
    deliveryAddress: delivery.address || delivery.full_address || payload.delivery_address || null,
    deliveryLat: Number(delivery.lat || delivery.latitude || payload.delivery_lat || 0) || null,
    deliveryLng: Number(delivery.lng || delivery.longitude || payload.delivery_lng || 0) || null,
    deliveryEta: Number(payload.eta_minutes || delivery.eta_minutes || rider.eta_minutes || 0) || null,
    notes: payload.notes || payload.order?.notes || null, subtotal, taxAmount,
    discountAmount: Number(payload.discount || payload.discount_amount || 0), totalAmount,
    paymentStatus: String(payload.payment_status || 'PAID').toUpperCase(), paymentMethod: String(payload.payment_method || source).toUpperCase(),
    status: externalStatus === 'CANCELLED' ? 'CANCELLED' : externalStatus === 'READY' ? 'READY' : 'PENDING', items,
    rawPayload: JSON.stringify(payload),
  };
}

export async function pushMarketplaceStatus(source: Marketplace, externalOrderId: string, status: string) {
  const url = source === 'SWIGGY' ? process.env.SWIGGY_ORDER_STATUS_URL : process.env.ZOMATO_ORDER_STATUS_URL;
  const token = source === 'SWIGGY' ? process.env.SWIGGY_API_TOKEN : process.env.ZOMATO_API_TOKEN;
  if (!url || !token || !externalOrderId) return { sent: false, reason: 'MARKETPLACE_API_NOT_CONFIGURED' };
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: externalOrderId, status }) });
  if (!response.ok) throw new Error(`${source} status API returned ${response.status}`);
  return { sent: true };
}
