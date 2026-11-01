// RoastFuze Zomato Merchant Sync Engine
(function () {
  'use strict';

  console.log('⚡ [RoastFuze] Zomato Merchant Sync Engine injected into', window.location.href);

  // Notify extension storage that Zomato tab is active
  chrome.storage.local.set({
    zomato_state: {
      connected: true,
      url: window.location.href,
      lastSeenAt: Date.now()
    }
  });

  // Inject floating status indicator badge into Zomato portal
  function injectBadge() {
    if (document.getElementById('roastfuze-zomato-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'roastfuze-zomato-badge';
    badge.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; z-index: 999999; background: #0f172a; color: #fff; padding: 8px 14px; border-radius: 999px; font-family: sans-serif; font-size: 12px; font-weight: bold; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); display: flex; items-center; gap: 8px; border: 1px solid #334155; cursor: pointer;">
        <span style="width: 8px; height: 8px; background: #e11d48; border-radius: 50%; box-shadow: 0 0 10px #e11d48;"></span>
        <span>RoastFuze Sync Bridge Active</span>
      </div>
    `;
    document.body.appendChild(badge);
  }

  setTimeout(injectBadge, 2000);

  const seenOrderIds = new Set();

  function scanZomatoOrders() {
    const orderElements = document.querySelectorAll('[class*="order-item"], [class*="OrderCard"], [data-testid*="order"], [class*="orderCard"]');

    orderElements.forEach((el) => {
      try {
        const text = el.innerText || '';
        // Look for Zomato order ID (#12345678 or ZOM-1234)
        const orderIdMatch = text.match(/(?:Order\s*ID|Order\s*#|#)\s*([A-Za-z0-9_-]+)/i);
        if (!orderIdMatch) return;

        const orderId = orderIdMatch[1].trim();
        if (seenOrderIds.has(orderId)) return;
        seenOrderIds.add(orderId);

        // Extract amount
        const amountMatch = text.match(/₹\s*([0-9]+(?:\.[0-9]+)?)/);
        const totalAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

        // Parse items
        const items = [];
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(line => {
          const itemMatch = line.match(/^(\d+)\s*[xX]\s*(.+)/);
          if (itemMatch) {
            items.push({
              name: itemMatch[2].trim(),
              quantity: parseInt(itemMatch[1], 10),
              price: 180
            });
          }
        });

        // Rider & Delivery Status check
        let riderStatus = 'ASSIGNED';
        if (/reached|arrived/i.test(text)) riderStatus = 'REACHED_OUTLET';
        if (/picked|dispatched/i.test(text)) riderStatus = 'PICKED_UP';

        const riderMatch = text.match(/(?:Valet|Delivery Partner|Rider)\s*:?\s*([A-Za-z\s]+)/i);
        const riderName = riderMatch ? riderMatch[1].trim() : 'Zomato Valet';

        const orderPayload = {
          source: 'ZOMATO',
          externalOrderId: orderId,
          orderNumber: `ZM-${orderId.slice(-4)}`,
          customerName: 'Zomato Customer',
          riderName,
          riderStatus,
          totalAmount: totalAmount || 280,
          subtotal: totalAmount || 280,
          taxAmount: 0,
          items: items.length > 0 ? items : [{ name: 'Zomato Online Items', quantity: 1, price: totalAmount || 280 }]
        };

        console.log('⚡ [RoastFuze Zomato] Detected order:', orderPayload);

        chrome.runtime.sendMessage({
          action: 'ORDER_DETECTED',
          payload: orderPayload
        });
      } catch (e) {
        // Ignore single parse error
      }
    });
  }

  const observer = new MutationObserver(() => {
    scanZomatoOrders();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(scanZomatoOrders, 4000);

  // Listen for actions dispatched from RoastFuze
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'EXECUTE_PORTAL_COMMAND') {
      const { action, externalOrderId } = msg.payload;
      console.log('⚡ [RoastFuze Zomato] Received command to execute:', action, externalOrderId);

      // Search for "Food Ready" button on Zomato
      if (action === 'MARK_READY' || action === 'FOOD_READY') {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const readyBtn = buttons.find(b => /food ready|prepared|mark ready/i.test(b.innerText || ''));
        if (readyBtn) {
          readyBtn.click();
          console.log('✅ [RoastFuze Zomato] Successfully clicked Food Ready button!');
          sendResponse({ success: true, message: 'Clicked Food Ready on Zomato' });
          return;
        }
      }

      // Search for "Accept" button
      if (action === 'ACCEPT_ORDER') {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const acceptBtn = buttons.find(b => /accept|confirm order/i.test(b.innerText || ''));
        if (acceptBtn) {
          acceptBtn.click();
          console.log('✅ [RoastFuze Zomato] Successfully clicked Accept button!');
          sendResponse({ success: true, message: 'Clicked Accept on Zomato' });
          return;
        }
      }

      sendResponse({ success: true, message: 'Command processed by Zomato tab' });
    }
  });
})();
