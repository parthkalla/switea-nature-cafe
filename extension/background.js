// RoastFuze Sync Bridge — Background Service Worker
console.log('⚡ [RoastFuze Sync Bridge] Background worker initialized.');

// In-memory queue of processed external order IDs to prevent duplicate triggers
const processedOrders = new Set();

// 1. Listen to messages from content scripts (Swiggy, Zomato, RoastFuze)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ORDER_DETECTED') {
    handleOrderDetected(request.payload, sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === 'RIDER_STATUS_UPDATE') {
    handleRiderStatusUpdate(request.payload, sendResponse);
    return true;
  }

  if (request.action === 'INJECT_TEST_ORDER') {
    injectSimulatedOrder(request.source || 'ZOMATO', sendResponse);
    return true;
  }

  if (request.action === 'PING_HEALTH') {
    chrome.storage.local.get(['roastfuze_config', 'swiggy_state', 'zomato_state'], (data) => {
      sendResponse({ status: 'ok', data });
    });
    return true;
  }
});

// 2. Push detected order from Swiggy/Zomato to RoastFuze API
async function handleOrderDetected(orderData, sendResponse) {
  try {
    const { roastfuze_config } = await chrome.storage.local.get('roastfuze_config');
    const apiUrl = roastfuze_config?.apiUrl || 'http://localhost:5170/api';
    const token = roastfuze_config?.token || '';
    const restaurantSlug = roastfuze_config?.restaurantSlug || 'roastfuze';

    const externalId = orderData.externalOrderId || `TMP-${Date.now()}`;
    if (processedOrders.has(externalId)) {
      sendResponse({ success: true, duplicate: true });
      return;
    }
    processedOrders.add(externalId);

    const endpoint = `${apiUrl}/integrations/extension/sync-order`;
    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...orderData,
          restaurantSlug
        })
      });
    } catch (fetchErr) {
      // Fallback directly to backend port 5000 if 5170 isn't reachable
      if (endpoint.includes(':5170')) {
        const directEndpoint = endpoint.replace(':5170', ':5000');
        res = await fetch(directEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            ...orderData,
            restaurantSlug
          })
        });
      } else {
        throw fetchErr;
      }
    }

    const resJson = await res.json();
    console.log(`✅ [Sync Bridge] Synced ${orderData.source} Order #${externalId} to RoastFuze:`, resJson);

    // Show desktop notification
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `⚡ New ${orderData.source} Order!`,
        message: `${orderData.customerName || 'Customer'} • ₹${orderData.totalAmount || 0} (${(orderData.items || []).length} items)`,
        priority: 2
      });
    }

    sendResponse({ success: true, result: resJson });
  } catch (err) {
    console.error('❌ [Sync Bridge] Failed to push order:', err);
    sendResponse({ success: false, error: err.message });
  }
}

// 3. Update Rider Tracking
async function handleRiderStatusUpdate(payload, sendResponse) {
  try {
    const { roastfuze_config } = await chrome.storage.local.get('roastfuze_config');
    if (!roastfuze_config || !roastfuze_config.apiUrl) return sendResponse({ success: false });

    const endpoint = `${roastfuze_config.apiUrl}/integrations/extension/rider-status`;
    await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(roastfuze_config.token ? { 'Authorization': `Bearer ${roastfuze_config.token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    sendResponse({ success: true });
  } catch (e) {
    sendResponse({ success: false, error: e.message });
  }
}

// 4. Polling for Pending Actions from RoastFuze (e.g. Chef clicked "Food Ready" on KDS)
async function pollPendingActions() {
  try {
    const { roastfuze_config } = await chrome.storage.local.get('roastfuze_config');
    if (!roastfuze_config || !roastfuze_config.apiUrl) return;

    const endpoint = `${roastfuze_config.apiUrl}/integrations/extension/pending-actions?restaurantSlug=${encodeURIComponent(roastfuze_config.restaurantSlug || 'roastfuze')}`;
    const res = await fetch(endpoint, {
      headers: {
        ...(roastfuze_config.token ? { 'Authorization': `Bearer ${roastfuze_config.token}` } : {})
      }
    });

    if (!res.ok) return;
    const { actions } = await res.json();
    if (!actions || !actions.length) return;

    for (const act of actions) {
      console.log('⚡ [Sync Bridge] Received action from KDS:', act);
      // Forward command to content script of Swiggy or Zomato tab
      const targetSource = (act.source || '').toUpperCase();
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (!tab.url) continue;
        if (
          (targetSource === 'ZOMATO' && tab.url.includes('zomato.com')) ||
          (targetSource === 'SWIGGY' && tab.url.includes('swiggy.com'))
        ) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'EXECUTE_PORTAL_COMMAND',
            payload: act
          }, async (resp) => {
            // Send ACK back to RoastFuze API
            const ackEndpoint = `${roastfuze_config.apiUrl}/integrations/extension/action-ack`;
            await fetch(ackEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(roastfuze_config.token ? { 'Authorization': `Bearer ${roastfuze_config.token}` } : {})
              },
              body: JSON.stringify({ actionId: act.id, success: resp?.success ?? true })
            });
          });
        }
      }
    }
  } catch (e) {
    // Ignore polling network hiccup
  }
}

// Poll every 3 seconds for fast realtime response
setInterval(pollPendingActions, 3000);

// 5. Test Order Simulator
async function injectSimulatedOrder(source, sendResponse) {
  const sampleItems = [
    { name: 'Cold Brew Latte Supreme', quantity: 2, price: 249 },
    { name: 'Artisanal Herb Pizza 10"', quantity: 1, price: 389 }
  ];
  const orderNum = Math.floor(1000 + Math.random() * 9000);
  const testOrder = {
    source,
    externalOrderId: `${source === 'ZOMATO' ? 'ZOM' : 'SWIG'}-${orderNum}`,
    orderNumber: `${source === 'ZOMATO' ? 'ZM' : 'SW'}-${orderNum}`,
    customerName: 'Rahul Mehra (Verified Swiggy One/Gold)',
    customerPhone: '+91 98290 12345',
    riderName: 'Vikram Singh',
    riderPhone: '+91 99887 65432',
    riderStatus: 'ASSIGNED_ON_THE_WAY',
    riderEtaMinutes: 7,
    deliveryAddress: 'Flat 402, Royal Palms, C-Scheme, Jaipur',
    items: sampleItems,
    subtotal: 887,
    taxAmount: 44.35,
    discountAmount: 100,
    totalAmount: 831.35,
    notes: 'Please keep ice on the side and make pizza extra crispy.',
    status: 'ACCEPTED'
  };

  await handleOrderDetected(testOrder, sendResponse);
}
