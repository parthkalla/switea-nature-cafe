// RoastFuze Swiggy Partner Sync Engine
(function () {
  'use strict';

  console.log('⚡ [RoastFuze] Swiggy Partner Sync Engine injected into', window.location.href);

  // Notify extension storage that Swiggy tab is alive
  chrome.storage.local.set({
    swiggy_state: {
      connected: true,
      url: window.location.href,
      lastSeenAt: Date.now()
    }
  });

  // Inject floating status indicator badge into Swiggy portal
  function injectBadge() {
    if (document.getElementById('roastfuze-swiggy-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'roastfuze-swiggy-badge';
    badge.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; z-index: 999999; background: #0f172a; color: #fff; padding: 8px 14px; border-radius: 999px; font-family: sans-serif; font-size: 12px; font-weight: bold; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); display: flex; items-center; gap: 8px; border: 1px solid #334155; cursor: pointer;">
        <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981;"></span>
        <span>RoastFuze Sync Bridge Active</span>
      </div>
    `;
    document.body.appendChild(badge);
  }

  setTimeout(injectBadge, 2000);

  // Process and scan order cards
  const seenOrderIds = new Set();

  function scanSwiggyOrders() {
    // Look for Swiggy order cards (covering multiple versions of their dashboard DOM)
    const orderElements = document.querySelectorAll('[data-testid*="order"], .order-card, .order-item, [class*="OrderCard"]');

    orderElements.forEach((el) => {
      try {
        const text = el.innerText || '';
        // Extract order ID (e.g. #12345678 or SW-1234)
        const orderIdMatch = text.match(/(?:Order\s*#|#)\s*([A-Za-z0-9_-]+)/i);
        if (!orderIdMatch) return;

        const orderId = orderIdMatch[1].trim();
        if (seenOrderIds.has(orderId)) return;
        seenOrderIds.add(orderId);

        // Extract total amount
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
              price: 150
            });
          }
        });

        // Rider & Delivery Status check
        let riderStatus = 'ASSIGNED';
        if (/reached|arrived/i.test(text)) riderStatus = 'REACHED_OUTLET';
        if (/picked|dispatched/i.test(text)) riderStatus = 'PICKED_UP';

        const riderMatch = text.match(/(?:Rider|Delivery Partner|Valet)\s*:?\s*([A-Za-z\s]+)/i);
        const riderName = riderMatch ? riderMatch[1].trim() : 'Swiggy Delivery Partner';

        const orderPayload = {
          source: 'SWIGGY',
          externalOrderId: orderId,
          orderNumber: `SW-${orderId.slice(-4)}`,
          customerName: 'Swiggy Customer',
          riderName,
          riderStatus,
          totalAmount: totalAmount || 250,
          subtotal: totalAmount || 250,
          taxAmount: 0,
          items: items.length > 0 ? items : [{ name: 'Swiggy Online Items', quantity: 1, price: totalAmount || 250 }]
        };

        console.log('⚡ [RoastFuze Swiggy] Detected order:', orderPayload);

        chrome.runtime.sendMessage({
          action: 'ORDER_DETECTED',
          payload: orderPayload
        });
      } catch (e) {
        // Ignore single parse error
      }
    });
  }

  // MutationObserver to catch new orders immediately
  const observer = new MutationObserver(() => {
    scanSwiggyOrders();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(scanSwiggyOrders, 4000);

  // Listen for actions dispatched from RoastFuze (e.g. Chef clicks "Food Ready")
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'EXECUTE_PORTAL_COMMAND') {
      const { action, externalOrderId } = msg.payload;
      console.log('⚡ [RoastFuze Swiggy] Received command to execute:', action, externalOrderId);

      // Search for "Food Ready" or "Mark Prepared" button
      if (action === 'MARK_READY' || action === 'FOOD_READY') {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const readyBtn = buttons.find(b => /food ready|mark prepared|ready/i.test(b.innerText || ''));
        if (readyBtn) {
          readyBtn.click();
          console.log('✅ [RoastFuze Swiggy] Successfully clicked Food Ready button!');
          sendResponse({ success: true, message: 'Clicked Food Ready on Swiggy' });
          return;
        }
      }

      // Search for "Accept" button
      if (action === 'ACCEPT_ORDER') {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const acceptBtn = buttons.find(b => /accept|confirm/i.test(b.innerText || ''));
        if (acceptBtn) {
          acceptBtn.click();
          console.log('✅ [RoastFuze Swiggy] Successfully clicked Accept button!');
          sendResponse({ success: true, message: 'Clicked Accept on Swiggy' });
          return;
        }
      }

      sendResponse({ success: true, message: 'Command received by Swiggy tab' });
    }
  });
})();
