type LoyaltyWhatsAppPayload = {
  phone: string;
  customerName?: string | null;
  orderNumber: string;
  orderToken: string;
  foodPointsEarned: number;
  coffeePointsEarned: number;
  foodPointsBalance: number;
  coffeePointsBalance: number;
};

function digitsOnly(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export function buildLoyaltyWhatsAppLink(payload: LoyaltyWhatsAppPayload) {
  const phone = digitsOnly(payload.phone);
  let baseUrl = process.env.FRONTEND_URL || 'http://localhost:5170';
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    baseUrl = baseUrl.replace(/localhost|127\.0\.0\.1/, '192.168.1.18');
  }
  const orderUrl = `${baseUrl.replace(/\/$/, '')}/order/${payload.orderToken}`;
  const text = [
    `Hi ${payload.customerName || 'there'}! Thanks for ordering at RoastFuze Coffee Bar - Musical Balcony Cafe.`,
    `Order ${payload.orderNumber} confirmed.`,
    `🍔 Food points earned: +${payload.foodPointsEarned} | Balance: ${payload.foodPointsBalance}`,
    `☕ Coffee points earned: +${payload.coffeePointsEarned} | Balance: ${payload.coffeePointsBalance}`,
    `Track your order: ${orderUrl}`,
  ].join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Sends a WhatsApp Cloud API template when credentials are configured.
 * The wa.me link remains available as a safe fallback for local/dev setups.
 */
export async function sendLoyaltyWhatsApp(payload: LoyaltyWhatsAppPayload) {
  const fallbackUrl = buildLoyaltyWhatsAppLink(payload);
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'switea_loyalty_update';
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!accessToken || !phoneNumberId) {
    return { sent: false, fallbackUrl, reason: 'WHATSAPP_NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: digitsOnly(payload.phone),
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: payload.customerName || 'there' },
              { type: 'text', text: payload.orderNumber },
              { type: 'text', text: String(payload.foodPointsEarned) },
              { type: 'text', text: String(payload.foodPointsBalance) },
              { type: 'text', text: String(payload.coffeePointsEarned) },
              { type: 'text', text: String(payload.coffeePointsBalance) },
            ],
          }],
        },
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp Cloud API error:', await response.text());
      return { sent: false, fallbackUrl, reason: 'WHATSAPP_API_ERROR' };
    }

    const data = await response.json() as { messages?: Array<{ id?: string }> };
    return { sent: true, messageId: data.messages?.[0]?.id || null, fallbackUrl };
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { sent: false, fallbackUrl, reason: 'WHATSAPP_NETWORK_ERROR' };
  }
}
