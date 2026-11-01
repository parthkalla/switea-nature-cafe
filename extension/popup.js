document.addEventListener('DOMContentLoaded', () => {
  const rfDot = document.getElementById('rf-dot');
  const rfName = document.getElementById('rf-name');
  const rfStatus = document.getElementById('rf-status');

  const swiggyDot = document.getElementById('swiggy-dot');
  const swiggyStatus = document.getElementById('swiggy-status');

  const zomatoDot = document.getElementById('zomato-dot');
  const zomatoStatus = document.getElementById('zomato-status');

  const btnTestOrder = document.getElementById('btn-test-order');
  const btnOpenDashboard = document.getElementById('btn-open-dashboard');

  // Query open tabs & storage to determine live status
  function updateUI() {
    chrome.tabs.query({}, (allTabs) => {
      const swiggyOpen = (allTabs || []).some(t => t.url && t.url.includes('swiggy.com'));
      const zomatoOpen = (allTabs || []).some(t => t.url && t.url.includes('zomato.com'));
      const roastfuzeOpen = (allTabs || []).some(t => t.url && (t.url.includes('localhost') || t.url.includes('asrockstudios.in')));

      chrome.storage.local.get(['roastfuze_config', 'swiggy_state', 'zomato_state'], (res) => {
        // 1. RoastFuze Portal State
        if (roastfuzeOpen || (res.roastfuze_config && res.roastfuze_config.token)) {
          rfDot.className = 'dot green';
          rfName.innerText = res.roastfuze_config?.restaurantName || res.roastfuze_config?.restaurantSlug || 'RoastFuze Portal';
          rfStatus.innerText = 'Connected';
          rfStatus.style.color = '#10b981';
        } else {
          rfDot.className = 'dot red';
          rfStatus.innerText = 'Not Connected';
          rfStatus.style.color = '#ef4444';
        }

        // 2. Swiggy State
        if (swiggyOpen) {
          swiggyDot.className = 'dot green';
          swiggyStatus.innerText = 'Listening';
          swiggyStatus.style.color = '#10b981';
        } else {
          swiggyDot.className = 'dot orange';
          swiggyStatus.innerText = 'Tab Closed';
          swiggyStatus.style.color = '#94a3b8';
        }

        // 3. Zomato State
        if (zomatoOpen) {
          zomatoDot.className = 'dot green';
          zomatoStatus.innerText = 'Listening';
          zomatoStatus.style.color = '#10b981';
        } else {
          zomatoDot.className = 'dot orange';
          zomatoStatus.innerText = 'Tab Closed';
          zomatoStatus.style.color = '#94a3b8';
        }
      });
    });
  }

  updateUI();

  // Test Order Button
  btnTestOrder.addEventListener('click', () => {
    btnTestOrder.innerText = 'Sending to Kitchen...';
    btnTestOrder.disabled = true;

    chrome.runtime.sendMessage({
      action: 'INJECT_TEST_ORDER',
      source: 'ZOMATO'
    }, (resp) => {
      btnTestOrder.innerText = '✅ Order Injected into KDS!';
      setTimeout(() => {
        btnTestOrder.innerText = '⚡ Send Test Zomato Order to KDS';
        btnTestOrder.disabled = false;
      }, 2000);
    });
  });

  // Open Dashboard Button
  btnOpenDashboard.addEventListener('click', () => {
    chrome.storage.local.get(['roastfuze_config'], (res) => {
      const url = res.roastfuze_config?.apiUrl
        ? res.roastfuze_config.apiUrl.replace('/api', '/admin/orders')
        : 'http://localhost:5170/admin/orders';
      chrome.tabs.create({ url });
    });
  });
});
