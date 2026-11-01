// RoastFuze Content Bridge — Connects Web Dashboard to Chrome Extension
(function () {
  'use strict';

  const h = window.location.hostname.toLowerCase();
  // Only run on RoastFuze dashboards (localhost on any port, 127.0.0.1, or asrockstudios.in)
  if (!h.includes('localhost') && !h.includes('127.0.0.1') && !h.includes('asrockstudios.in')) {
    return;
  }

  // 1. Mark DOM so React dashboard knows extension is active immediately
  document.documentElement.setAttribute('data-roastfuze-extension-installed', 'true');

  console.log('⚡ [RoastFuze Sync Bridge] Connected to portal on', window.location.origin);

  // 2. Auto-sync session token from LocalStorage right away
  function syncCredentialsFromStorage() {
    try {
      const token = localStorage.getItem('roastfuze_token');
      const parts = window.location.hostname.split('.');
      const slug = (parts.length > 2 && parts[0] !== 'admin' && parts[0] !== 'www') ? parts[0] : 'roastfuze';
      const apiEndpoint = window.location.hostname.endsWith('asrockstudios.in') && window.location.hostname !== 'roastfuze.asrockstudios.in'
        ? 'https://roastfuze.asrockstudios.in/api'
        : `${window.location.origin}/api`;

      chrome.storage.local.set({
        roastfuze_config: {
          token: token || '',
          restaurantSlug: slug,
          apiUrl: apiEndpoint,
          lastConnectedAt: Date.now()
        }
      }, () => {
        // Announce active state to page
        window.postMessage({
          type: 'ROASTFUZE_EXTENSION_READY',
          version: '1.0.1',
          connected: true,
          restaurantSlug: slug
        }, '*');
      });
    } catch (e) {
      // Ignore
    }
  }

  syncCredentialsFromStorage();
  setTimeout(syncCredentialsFromStorage, 500);

  // 3. Listen for Handshake & Commands from React Dashboard
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || !event.data.type) return;

    const data = event.data;

    // A. Dashboard Handshake: Save restaurant authentication
    if (data.type === 'ROASTFUZE_HANDSHAKE_INIT') {
      const { restaurantId, restaurantSlug, restaurantName, token, apiUrl } = data;
      const apiEndpoint = apiUrl || `${window.location.origin}/api`;

      chrome.storage.local.set({
        roastfuze_config: {
          restaurantId,
          restaurantSlug: restaurantSlug || 'roastfuze',
          restaurantName,
          token: token || localStorage.getItem('roastfuze_token') || '',
          apiUrl: apiEndpoint,
          lastConnectedAt: Date.now()
        }
      }, () => {
        document.documentElement.setAttribute('data-roastfuze-extension-installed', 'true');
        console.log('✅ [RoastFuze Sync Bridge] Handshake completed for:', restaurantSlug);
        window.postMessage({
          type: 'ROASTFUZE_HANDSHAKE_ACK',
          success: true,
          restaurantSlug
        }, '*');
      });
    }

    // B. Dashboard Ping Request
    if (data.type === 'ROASTFUZE_PING') {
      document.documentElement.setAttribute('data-roastfuze-extension-installed', 'true');
      chrome.storage.local.get(['roastfuze_config', 'swiggy_state', 'zomato_state'], (res) => {
        window.postMessage({
          type: 'ROASTFUZE_PONG',
          version: '1.0.1',
          installed: true,
          config: res.roastfuze_config || null,
          swiggy: res.swiggy_state || { connected: false },
          zomato: res.zomato_state || { connected: false }
        }, '*');
      });
    }

    // C. Test Order simulation
    if (data.type === 'ROASTFUZE_TEST_ORDER') {
      chrome.runtime.sendMessage({
        action: 'INJECT_TEST_ORDER',
        source: data.source || 'ZOMATO'
      }, (response) => {
        window.postMessage({
          type: 'ROASTFUZE_TEST_ORDER_ACK',
          response
        }, '*');
      });
    }
  });
})();
