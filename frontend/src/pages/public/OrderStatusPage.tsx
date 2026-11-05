import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ChefHat,
  Sparkles,
  Phone,
  ArrowRight,
  AlertCircle,
  Star,
  MessageSquare,
  QrCode,
  Lock,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  Store,
  Gift,
  FileText,
  Download,
  Printer,
  MessageCircle,
  Bell,
  X,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Order } from '../../types';
import { useCart } from '../../context/CartContext';
import { playAlertChime, triggerHaptic } from '../../utils/audioHelper';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Received', desc: 'Sent to RoastFuze kitchen' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Kitchen acknowledged order' },
  { key: 'PREPARING', label: 'Preparing', desc: 'Crafting fresh with care' },
  { key: 'READY', label: 'Ready', desc: 'Piping hot and plated' },
  { key: 'SERVED', label: 'Served', desc: 'Enjoy your meal on the musical balcony' },
];

export const OrderStatusPage: React.FC = () => {
  const { orderToken } = useParams<{ orderToken: string }>();
  const navigate = useNavigate();
  const { setTableSession, saveMySeatedTable } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UPI payment state
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Review state (persisted across page reloads via localStorage)
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && orderToken) {
      return Boolean(localStorage.getItem(`rf_review_${orderToken}`));
    }
    return false;
  });
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Notification permission state & interactive modal
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [inAppAlertsActive, setInAppAlertsActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rf_inapp_alerts_enabled') === 'true';
    }
    return false;
  });
  const [liveBannerToast, setLiveBannerToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });
  const [infoToast, setInfoToast] = useState<string | null>(null);

  const isSecureContextSupported = () => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && orderToken) {
      const isGranted = 'Notification' in window && Notification.permission === 'granted';
      const isDenied = 'Notification' in window && Notification.permission === 'denied';
      if (!isGranted && !isDenied) {
        const timer = setTimeout(() => {
          setShowNotifModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [orderToken]);

  const handleEnableNotificationsModal = async () => {
    // 1. Immediate melodic chime + mobile vibration feedback
    playAlertChime('success');
    triggerHaptic([160, 80, 160]);

    // 2. Mark in-app alerts active
    setInAppAlertsActive(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rf_inapp_alerts_enabled', 'true');
    }

    // 3. Request native browser notification if secure context is available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (isSecureContextSupported()) {
        try {
          const res = await Notification.requestPermission();
          if (res === 'granted') {
            setNotifGranted(true);
            new Notification('🔔 RoastFuze Alerts Active', {
              body: `Order #${order?.orderNumber || ''}: You will receive instant live updates as your coffee & food are prepared!`,
              icon: '/favicon.ico',
            });
          }
        } catch (err) {
          console.warn('Native notification permission error:', err);
        }
      } else {
        // Insecure HTTP origin (e.g. testing over local Wi-Fi IP like 192.168.x.x)
        setInfoToast('🔔 Live Sound & Vibration Alerts Active! (Lock-screen push alerts require HTTPS in production)');
        setTimeout(() => setInfoToast(null), 5000);
      }
    } else {
      setInfoToast('🔔 Live Sound & Vibration Alerts Active! You will hear a chime and feel a vibration as your order is updated.');
      setTimeout(() => setInfoToast(null), 5000);
    }

    if (orderToken) {
      localStorage.setItem(`rf_notif_asked_${orderToken}`, 'true');
    }
    setShowNotifModal(false);
  };

  const handleDismissNotifModal = () => {
    if (orderToken) {
      localStorage.setItem(`rf_notif_asked_${orderToken}`, 'true');
    }
    setShowNotifModal(false);
  };

  useEffect(() => {
    if (!orderToken) return;

    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await api.getOrderStatus(orderToken!);
        setOrder(data);
        if (data && data.customerName) {
          setReviewName(data.customerName);
        }
        if (data && data.table) {
          saveMySeatedTable({
            token: (data.table as any).token || '',
            tableNumber: data.table.tableNumber,
            name: data.table.name,
            section: data.table.section,
          });
        }
        if (data && data.customerPhone) {
          const socket = getSocket();
          socket.emit('join_customer', data.customerPhone);
        }
      } catch (err: any) {
        setError('Order not found or link has expired.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();

    // Socket.IO realtime listener
    const socket = getSocket();
    socket.emit('join_order', orderToken);

    socket.on('order_status_updated', (payload: { orderToken: string; status: any; order: Order }) => {
      if (payload.orderToken === orderToken) {
        setOrder(payload.order);

        // Sound chime & phone vibration
        playAlertChime('order');
        triggerHaptic([200, 100, 200]);

        // Drop-down floating card
        setLiveBannerToast({
          visible: true,
          title: `Order #${payload.order.orderNumber} Status Updated!`,
          message: `Your order is now: ${payload.status.replace(/_/g, ' ')}`,
        });
        setTimeout(() => setLiveBannerToast((prev) => ({ ...prev, visible: false })), 6000);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`RoastFuze Order #${payload.order.orderNumber}`, {
            body: `Status: Order is now ${payload.status}!`,
            icon: '/favicon.ico',
          });
        }
      }
    });

    socket.on('push_notification', (notif: any) => {
      playAlertChime('bell');
      triggerHaptic([180, 90, 180]);

      setLiveBannerToast({
        visible: true,
        title: notif.title || 'RoastFuze Notification',
        message: notif.message,
      });
      setTimeout(() => setLiveBannerToast((prev) => ({ ...prev, visible: false })), 6000);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notif.title, {
          body: notif.message,
          icon: notif.icon || '/favicon.ico',
        });
      }
    });

    return () => {
      socket.off('order_status_updated');
      socket.off('push_notification');
    };
  }, [orderToken]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      setReviewError('Please provide your name and a review comment.');
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewError(null);
      await api.submitReview('roastfuze', {
        customerName: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      if (orderToken) {
        localStorage.setItem(
          `rf_review_${orderToken}`,
          JSON.stringify({
            customerName: reviewName.trim(),
            rating: reviewRating,
            comment: reviewComment.trim(),
            submittedAt: new Date().toISOString(),
          })
        );
      }
      setReviewSubmitted(true);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderToken) return;
    try {
      setConfirmingPayment(true);
      await api.confirmOrderPayment(orderToken, { utrNumber: utrNumber.trim() || undefined, paymentMethod: 'UPI' });
      setPaymentConfirmed(true);
      if (order) {
        setOrder({ ...order, paymentStatus: 'PAID' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status.');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDownloadBill = () => {
    if (!order) return;
    window.open(`/bill/${order.orderToken}?print=1`, '_blank', 'noopener,noreferrer');
  };

  const handleShareOnWhatsApp = () => {
    if (!order) return;
    const billUrl = `${window.location.origin}/bill/${order.orderToken}`;
    const billLines = [
      '☕ *ROASTFUZE COFFEE BAR*',
      'Musical Balcony Cafe • Jaipur',
      '--------------------------------',
      `Namaste *${order.customerName || 'Guest'}* ji! 🙏`,
      'Thank you for dining with us!',
      '',
      `🧾 *Bill Number:* #${order.orderNumber}`,
      `💰 *Total Amount:* ₹${order.totalAmount.toFixed(2)} (${order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'} · ${order.paymentMethod === 'PAY_AT_COUNTER' ? 'Pay at Counter' : order.paymentMethod})`,
      `📍 *Seating:* ${order.table ? `${order.table.tableNumber} (${order.table.name})` : 'Takeaway / Parcel'}`,
      `📅 *Date:* ${new Date(order.createdAt).toLocaleString('en-IN')}`,
      '',
      '🔗 *View & Download Your Official Tax Bill:*',
      billUrl,
      '',
      '❤️ Hope you enjoyed the live balcony sunset & coffee at RoastFuze!',
    ].join('\n');

    const phone = (order.customerPhone || '').replace(/\D/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(billLines)}` : `https://wa.me/?text=${encodeURIComponent(billLines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-nature-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-serif text-lg font-bold text-nature-950">Fetching Order Status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-stone-400 mb-4" />
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Order Not Found</h1>
          <p className="text-xs text-stone-500 mb-6">{error || 'Please check your link or contact staff.'}</p>
          <Link to="/menu" className="bg-nature-900 text-white px-6 py-2.5 rounded-full text-xs font-bold">
            Back to Menu
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  // Dedicated customer-to-cafe WhatsApp concierge & review link
  const hostOrigin =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `http://192.168.1.18:${window.location.port || '5170'}`
      : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5170';

  const customerTrackingUrl = `${hostOrigin}/order/${order?.orderToken}`;

  const customerWhatsAppMessage = [
    `Namaste RoastFuze Coffee Bar! ☕🎶`,
    `I just placed Order *#${order?.orderNumber}* (${order?.customerName || 'Guest'}).`,
    order?.table ? `📍 Seating: Table ${order.table.tableNumber} (${order.table.name})` : '📍 Takeaway Order',
    `🔗 Track My Order: ${customerTrackingUrl}`,
    '',
    `⭐ My Custom Review & Instructions:`,
    `"Super excited for my order! Please keep me updated here on WhatsApp as well."`,
  ].join('\n');

  const customerWhatsAppUrl = `https://wa.me/919352182562?text=${encodeURIComponent(customerWhatsAppMessage)}`;

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200 relative">
      <Navbar />

      {/* Floating Live Alert Toast (Chime + Dropdown Card) */}
      {liveBannerToast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-stone-900/95 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-stone-700/60 backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{liveBannerToast.title}</p>
            <p className="text-[11px] text-stone-300 truncate">{liveBannerToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setLiveBannerToast((prev) => ({ ...prev, visible: false }))}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Info Notification Toast */}
      {infoToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700/80 backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-top duration-300 text-xs">
          <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="flex-1 leading-snug">{infoToast}</span>
          <button
            type="button"
            onClick={() => setInfoToast(null)}
            className="text-emerald-300 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Modal: Wants to get updated for your order? */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-nature-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative mx-auto w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 shadow-xs">
              <Bell className="w-8 h-8 text-amber-700 animate-bounce" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Order #{order.orderNumber} Confirmed!</span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
              Want to get updated for your order?
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Enable alerts to get instant real-time sound chimes, haptics & updates as your order progresses:
            </p>

            {/* Local Wi-Fi note */}
            {!isSecureContextSupported() && (
              <div className="mt-3 px-3.5 py-2.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-left text-[11px] text-amber-900 flex items-start gap-2">
                <span className="text-sm shrink-0">💡</span>
                <span className="leading-relaxed">
                  <strong>Local Wi-Fi Testing:</strong> Activating turns on instant melodic sound chimes, device vibration & in-app alerts! (Native lock-screen push popups require HTTPS in production).
                </span>
              </div>
            )}

            <div className="mt-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 text-left space-y-2.5 text-xs text-stone-700">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">☕</span>
                <span>Barista starts brewing in kitchen</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">🍽️</span>
                <span>Meal is plated & ready</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">✨</span>
                <span>Served at <strong>{order.table?.tableNumber || 'your table'}</strong></span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleEnableNotificationsModal}
                className="w-full bg-nature-950 hover:bg-stone-900 text-white font-bold py-3.5 px-6 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Yes, Turn On Live Alerts!</span>
              </button>

              <button
                type="button"
                onClick={handleDismissNotifModal}
                className="w-full py-2.5 text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        {/* Top Notification Status Pill */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          {notifGranted || inAppAlertsActive ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>🔔 Live Alerts Active (Sound + Vibration)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotifModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-700" />
              <span>Enable Order Alerts 🔔</span>
            </button>
          )}
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-card p-6 sm:p-10 text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-nature-700 block mb-1">
            Table Order Confirmed
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
            Order #{order.orderNumber}
          </h1>

          {order.table && (
            <p className="text-sm font-semibold text-stone-600 mb-6">
              Assigned to: <strong className="text-nature-900">{order.table.tableNumber} ({order.table.name})</strong>
            </p>
          )}

          {/* RoastFuze WhatsApp Concierge & Custom Review Card */}
          <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50 border border-emerald-200 text-left shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>RoastFuze WhatsApp Concierge & Live Updates</span>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                Cafe Desk Direct Line
              </span>
            </div>

            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Have special taste preferences, song requests for the acoustic balcony, or want to send us your feedback?
            </p>

            {(order.foodPointsEarned || order.coffeePointsEarned) ? (
              <div className="mt-2.5 inline-flex items-center gap-2 bg-white/90 border border-amber-200 text-amber-900 text-xs font-semibold px-3 py-1 rounded-xl shadow-2xs">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {order.foodPointsEarned && order.foodPointsEarned > 0 ? (
                    <>Loyalty Added: +{order.foodPointsEarned} Food Points · +{order.coffeePointsEarned || 0} Coffee Points</>
                  ) : (
                    <>Coffee Rewards Added: +{order.coffeePointsEarned || 0} Coffee Points</>
                  )}
                </span>
              </div>
            ) : null}

            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <a
                href={customerWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Us Custom Review on WhatsApp & Get Order Updates</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div className="pt-6 border-t border-stone-100">
            <div className="grid grid-cols-5 gap-2 relative">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        isPassed
                          ? 'bg-nature-900 text-white shadow-sm ring-4 ring-nature-100'
                          : 'bg-stone-200 text-stone-400'
                      } ${isCurrent ? 'scale-110 animate-pulse' : ''}`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-[11px] font-bold ${isPassed ? 'text-stone-900' : 'text-stone-400'}`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] text-stone-400 hidden sm:block mt-0.5">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pay at Counter Card */}
        {(order.paymentMethod === 'PAY_AT_COUNTER' || order.paymentMethod === 'CASH') && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-card p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Store className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-bold tracking-wider text-stone-500">
                      Payment Mode
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {order.paymentStatus === 'PAID' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAID AT COUNTER</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>PAYMENT DUE AT COUNTER</span>
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Pay at Billing Counter (Cash / Card)
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-md">
                    {order.paymentStatus === 'PAID'
                      ? `Payment of ₹${order.totalAmount.toFixed(2)} has been confirmed & received by cafe cashier.`
                      : `Please settle ₹${order.totalAmount.toFixed(2)} at the billing counter. Staff will mark this order as paid.`}
                  </p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-stone-100 sm:pl-6 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-xs text-stone-400 block">Total Due</span>
                <span className="font-serif text-2xl font-bold text-nature-950">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic UPI Payment Card (Amount Locked & Verified) */}
        {order.paymentMethod === 'UPI' && (
          order.paymentStatus === 'PAID' ? (
            <div className="bg-emerald-50/90 rounded-3xl border border-emerald-200 shadow-soft p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-base text-emerald-950">Payment Completed & Verified</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">PAID VIA UPI</span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Amount of ₹{order.totalAmount.toFixed(2)} received successfully. Thank you!
                  </p>
                </div>
              </div>

              <Link
                to={`/bill/${order.orderToken}`}
                target="_blank"
                className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Digital Bill</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-emerald-600/30 shadow-card p-6 sm:p-8 mb-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[10px] uppercase font-bold tracking-wider px-4 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UPI Secure • Amount Locked</span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Dynamic QR Display */}
                <div className="bg-cream-100 p-4 rounded-2xl border border-cream-300/80 flex flex-col items-center flex-shrink-0 shadow-inner">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-200">
                    <QRCodeSVG
                      value={`upi://pay?pa=${encodeURIComponent(
                        (order as any).restaurant?.upiId || '9352182562@upi'
                      )}&pn=${encodeURIComponent((order as any).restaurant?.name || 'RoastFuze Coffee Bar')}&am=${order.totalAmount.toFixed(
                        2
                      )}&cu=INR&tn=${encodeURIComponent(`Order ${order.orderNumber}`)}`}
                      size={160}
                      level="H"
                      fgColor="#1A3C2B"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-[11px] font-bold text-stone-700 block">Scan to Pay via Any UPI App</span>
                    <span className="text-[10px] text-stone-500">GPay • PhonePe • Paytm • BHIM • CRED</span>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="flex-1 w-full space-y-4 text-left">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-700" />
                        Amount Non-Editable
                      </span>
                      <span className="text-xs text-stone-500">Payable Bill:</span>
                    </div>
                    <div className="font-serif text-3xl font-extrabold text-nature-950 flex items-baseline gap-1">
                      <span>₹{order.totalAmount.toFixed(2)}</span>
                      <span className="text-xs font-normal text-stone-500">INR</span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Payee UPI VPA:</span>
                      <span className="font-mono font-bold text-stone-800">
                        {(order as any).restaurant?.upiId || '9352182562@upi'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyUpi((order as any).restaurant?.upiId || '9352182562@upi')}
                      className="p-1.5 text-xs text-stone-600 hover:text-nature-900 bg-white border border-stone-200 rounded-lg flex items-center gap-1 font-semibold"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Payment Actions & Verification */}
                  <div className="space-y-2">
                    {/* Mobile-Only Intent Button (Visible only on mobile devices) */}
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(
                        (order as any).restaurant?.upiId || '9352182562@upi'
                      )}&pn=${encodeURIComponent((order as any).restaurant?.name || 'RoastFuze Coffee Bar')}&am=${order.totalAmount.toFixed(
                        2
                      )}&cu=INR&tn=${encodeURIComponent(`Order ${order.orderNumber}`)}`}
                      className="md:hidden w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Google Pay / PhonePe / Paytm</span>
                    </a>

                    {/* Desktop Helper Note (Desktop users scan QR on left) */}
                    <div className="hidden md:flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 text-xs">
                      <QrCode className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Apne phone ke kisi bhi UPI app (GPay/PhonePe/Paytm) se left me diya gaya QR scan karke pay karein.</span>
                    </div>

                    {/* Payment Confirmation Trigger */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="Optional UPI UTR / Ref (12 digits)"
                        className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmPayment}
                        disabled={confirmingPayment}
                        className="bg-nature-900 hover:bg-nature-950 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {confirmingPayment ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>I Have Paid via UPI</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Itemized Snapshot */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6 sm:p-8 space-y-6">
          <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
            <span>Ordered Items</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-stone-500">
                Method: {order.paymentMethod === 'PAY_AT_COUNTER' || order.paymentMethod === 'CASH' ? 'Pay at Counter' : order.paymentMethod}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {order.paymentStatus === 'PAID' ? '● PAID' : '● PAYMENT PENDING'}
              </span>
            </div>
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-stone-800">{item.itemName}</span>
                  <span className="text-stone-500 text-xs block">Qty: {item.quantity} × ₹{item.unitPrice}</span>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <span className="text-[11px] text-stone-400 block">
                      +{item.modifiers.map((m) => m.modifierName).join(', ')}
                    </span>
                  )}
                </div>
                <span className="font-bold text-stone-900">₹{item.totalPrice}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon Discount</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {order.foodPointsRedeemed && order.foodPointsRedeemed > 0 ? (
              <div className="flex justify-between text-emerald-800">
                <span>🍔 Food Points Redeemed ({order.foodPointsRedeemed} Pts)</span>
                <span>-₹{order.foodPointsRedeemed.toFixed(2)}</span>
              </div>
            ) : null}
            {order.coffeePointsRedeemed && order.coffeePointsRedeemed > 0 ? (
              <div className="flex justify-between text-amber-800">
                <span>☕ Coffee Points Redeemed ({order.coffeePointsRedeemed} Pts)</span>
                <span>-₹{order.coffeePointsRedeemed.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>GST Tax</span>
              <span className="font-semibold text-stone-900">₹{order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-stone-100 flex justify-between text-base font-extrabold text-nature-950">
              <span>Final Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Dual / Coffee Loyalty Earned Banner */}
          {((order.foodPointsEarned && order.foodPointsEarned > 0) || (order.coffeePointsEarned && order.coffeePointsEarned > 0)) && (
            <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Loyalty Points Rewarded on this Order
                </span>
              </div>
              <div className={`grid ${order.foodPointsEarned && order.foodPointsEarned > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 text-xs`}>
                {order.foodPointsEarned && order.foodPointsEarned > 0 ? (
                  <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-200">
                    <span className="text-stone-500 text-[11px] block">🍔 Food Points</span>
                    <span className="text-sm font-extrabold text-emerald-800">+{order.foodPointsEarned} Pts</span>
                  </div>
                ) : null}
                <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200">
                  <span className="text-stone-500 text-[11px] block">☕ Coffee Points</span>
                  <span className="text-sm font-extrabold text-amber-800">+{order.coffeePointsEarned || 0} Pts</span>
                </div>
              </div>
              {order.customerLoyalty && (
                <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-stone-600">
                  <span>Current Total Balance:</span>
                  <span className="font-bold text-nature-950">
                    {order.customerLoyalty.foodPoints > 0 ? (
                      <>🍔 {order.customerLoyalty.foodPoints} Food Pts &nbsp;|&nbsp; ☕ {order.customerLoyalty.coffeePoints} Coffee Pts</>
                    ) : (
                      <>☕ {order.customerLoyalty.coffeePoints} Coffee Pts</>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Customer Official Tax Invoice & Download Bill Section (Available ONLY when SERVED) */}
          {order.status === 'SERVED' ? (
            <div className="mt-6 p-5 bg-cream-50 rounded-2xl border border-stone-200/90 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-nature-900 text-amber-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Official Tax Invoice & Bill
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Invoice #{order.orderNumber} • Includes itemized breakup & tax receipt
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>Order Served · Bill Ready</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <Link
                  to={`/bill/${order.orderToken}`}
                  target="_blank"
                  className="w-full bg-cream-200 hover:bg-cream-300 text-stone-900 text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all text-center"
                >
                  <FileText className="w-4 h-4 text-amber-800 flex-shrink-0" />
                  <span>View Digital Bill</span>
                </Link>

                <button
                  type="button"
                  onClick={handleDownloadBill}
                  className="w-full bg-nature-950 hover:bg-stone-900 text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Download className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareOnWhatsApp}
                  className="w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>WhatsApp Bill</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0 font-bold">
                  <Clock className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900">
                    Official Bill & Invoice
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Aapka official tax bill order table par <strong>Served</strong> hone ke baad yahan unlock hoga.
                  </p>
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Kitchen Status: <strong className="text-stone-900 font-bold">{order.status}</strong></span>
                </span>
                <span className="text-[10px] font-semibold text-stone-400">Unlocks once served</span>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                const tblToken = (order?.table as any)?.token;
                if (order?.table && tblToken) {
                  setTableSession(
                    tblToken,
                    {
                      tableNumber: order.table.tableNumber,
                      name: order.table.name,
                      section: order.table.section,
                    },
                    'QR'
                  );
                }
                navigate('/menu');
              }}
              className="text-xs font-bold text-nature-900 hover:text-amber-800 flex items-center gap-1.5 cursor-pointer bg-stone-100/80 hover:bg-amber-100/60 px-4 py-2 rounded-xl transition-all border border-stone-200/80"
            >
              <span>Order More Items {order?.table ? `(${order.table.tableNumber})` : ''}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <a
              href="tel:+919555495454"
              className="inline-flex items-center gap-1.5 text-xs bg-cream-200 hover:bg-cream-300 text-stone-800 font-semibold px-4 py-2 rounded-full transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Staff (+91 95554 95454)</span>
            </a>
          </div>
        </div>

        {/* Customer Experience Review Section (Exclusively unlocked once order is SERVED) */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6 sm:p-8 mt-8">
          {order.status !== 'SERVED' ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-cream-200 text-stone-600 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5 text-stone-500" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-800">
                Guest Review Unlocks After Order is Served
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Once our kitchen team delivers your meal to your table and marks it as served, you can rate your dining experience here.
              </p>
            </div>
          ) : reviewSubmitted ? (
            <div className="text-center py-6 space-y-3 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">Thank You for Your Review!</h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                Your feedback helps the RoastFuze Coffee Bar & musical balcony team maintain highest hospitality standards.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-stone-900 text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-stone-800 transition-colors"
                >
                  <span>Return to RoastFuze Home</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Order Served — Rate Your Experience</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                    How was your RoastFuze experience?
                  </h3>
                  <p className="text-xs text-stone-500">
                    Tell us about the coffee, frappes, food taste, and musical balcony atmosphere
                  </p>
                </div>

                {/* Interactive Star Rating */}
                <div className="flex items-center gap-1.5 pt-2 sm:pt-0">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeRating = hoverRating !== null ? hoverRating : reviewRating;
                    const isFilled = star <= activeRating;

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 hover:scale-125 transition-transform text-amber-400 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            isFilled ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {reviewError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                  {reviewError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Selected Rating
                  </label>
                  <div className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-700 font-semibold flex items-center justify-between">
                    <span>{reviewRating} of 5 Stars</span>
                    <span className="text-xs text-amber-600 font-bold">
                      {reviewRating === 5 && 'Outstanding ⭐⭐⭐⭐⭐'}
                      {reviewRating === 4 && 'Very Good ⭐⭐⭐⭐'}
                      {reviewRating === 3 && 'Average ⭐⭐⭐'}
                      {reviewRating <= 2 && 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Your Review / Suggestions *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="The Adrak Chai was piping hot and peri peri fries were so crunchy! The outdoor cabana seating was lovely..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white font-bold text-sm px-7 py-3 rounded-xl shadow transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4 text-nature-300" />
                  <span>{submittingReview ? 'Submitting Review...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
