import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Printer,
  ChevronRight,
  Utensils,
  Volume2,
  VolumeX,
  MessageCircle,
  UserRound,
  FileText,
  MapPin,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Order } from '../../types';
import { playAlertChime, triggerHaptic } from '../../utils/audioHelper';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.getAdminOrders(statusFilter, search);
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_restaurant', 'roastfuze');

    socket.on('new_order', (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      if (soundEnabled) {
        playAlertChime('order');
        triggerHaptic([200, 100, 200]);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🔔 New Order #${newOrder.orderNumber}!`, {
            body: `${newOrder.table ? `${newOrder.table.tableNumber} (${newOrder.table.name})` : 'Takeaway'} • ₹${newOrder.totalAmount}`,
            icon: '/favicon.ico',
          });
        }
      }
    });

    socket.on('order_status_updated', (payload: { order: Order }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.order.id ? payload.order : o))
      );
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, [soundEnabled]);

  const handleToggleAlerts = async () => {
    if (!soundEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification('🔔 RoastFuze Alerts Active', {
              body: 'Real-time order and payment notifications are now enabled!',
              icon: '/favicon.ico',
            });
          }
        } catch {}
      }
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: 'PAID' | 'PENDING') => {
    try {
      await api.updateOrderPaymentStatus(orderId, newPaymentStatus);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: newPaymentStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Payment status update failed.');
    }
  };

  const getNextStatusAction = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return { label: 'Accept Order', nextStatus: 'ACCEPTED', color: 'bg-emerald-700 hover:bg-emerald-800' };
      case 'ACCEPTED':
        return { label: 'Start Preparing', nextStatus: 'PREPARING', color: 'bg-amber-600 hover:bg-amber-700' };
      case 'PREPARING':
        return { label: 'Mark Ready', nextStatus: 'READY', color: 'bg-blue-600 hover:bg-blue-700' };
      case 'READY':
        return { label: 'Mark Served', nextStatus: 'SERVED', color: 'bg-nature-900 hover:bg-nature-950' };
      default:
        return null;
    }
  };

  const buildBillText = (order: Order) => {
    // If admin is on localhost, use LAN IP so customer's phone can open the bill link directly!
    const hostOrigin = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `http://192.168.1.18:${window.location.port || '5170'}`
      : window.location.origin;
    const billUrl = `${hostOrigin}/bill/${order.orderToken}`;
    const lines = [
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
    ];
    return lines.join('\n');
  };

  const sendBillViaWhatsApp = async (order: Order) => {
    const bill = buildBillText(order);
    try {
      await navigator.clipboard.writeText(bill);
      setWhatsappCopied(true);
      window.setTimeout(() => setWhatsappCopied(false), 3000);
    } catch (error) {
      console.warn('Clipboard unavailable:', error);
    }
    const phone = (order.customerPhone || '').replace(/\D/g, '');
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(bill)}`
      : `https://wa.me/?text=${encodeURIComponent(bill)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const printActualBill = (order: Order) => {
    window.open(`/bill/${order.orderToken}?print=1&admin=true`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Live Order Queue</h1>
            <p className="text-xs text-stone-500 mt-1">Real-time dine-in orders and kitchen status</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAlerts}
              className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold ${
                soundEnabled
                  ? 'bg-nature-50 border-nature-200 text-nature-900'
                  : 'bg-white border-stone-200 text-stone-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-nature-700" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Alerts On' : 'Alerts Muted'}</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200 shadow-soft">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-nature-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order # or table..."
              className="w-full md:w-64 pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-nature-800"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-stone-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center text-stone-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-semibold">No orders found in this filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders.map((ord) => {
                const nextAction = getNextStatusAction(ord.status);
                return (
                  <div
                    key={ord.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="font-serif text-base text-stone-900">
                          #{ord.orderNumber}
                        </strong>
                        {ord.source && ord.source !== 'DIRECT' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ord.source === 'SWIGGY' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                            {ord.source}
                          </span>
                        )}
                        <span className="text-xs font-bold text-nature-900 bg-nature-100 px-2.5 py-0.5 rounded-full">
                          {ord.table ? `${ord.table.tableNumber} (${ord.table.name})` : 'Takeaway'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.status === 'SERVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                        {/* Payment Status Pill */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {ord.paymentStatus === 'PAID' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>PAID</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>PAYMENT PENDING</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Items: <strong className="text-stone-800">{ord.items?.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}</strong></span>
                        <span>
                          • Payment: <strong className="text-stone-800">
                            {ord.paymentMethod === 'PAY_AT_COUNTER' || ord.paymentMethod === 'CASH'
                              ? 'Pay at Counter'
                              : ord.paymentMethod}
                          </strong>
                          {ord.customerName ? ` (${ord.customerName})` : ''}
                        </span>
                        <span>• Placed: {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
                      <span className="font-serif text-lg font-bold text-stone-900 mr-2">
                        ₹{ord.totalAmount}
                      </span>

                      {/* Status Next Action Button (Accept -> Preparing -> Ready -> Served) */}
                      {nextAction && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, nextAction.nextStatus)}
                          className={`${nextAction.color} text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all`}
                        >
                          {nextAction.label}
                        </button>
                      )}

                      {/* Payment Action: Mark Paid appears ONLY AFTER order is SERVED */}
                      {ord.paymentStatus === 'PAID' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePaymentStatus(ord.id, 'PENDING')}
                            className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors"
                            title="Payment not received in bank/counter? Click to revert to Unpaid."
                          >
                            Mark Unpaid
                          </button>
                        </div>
                      ) : ord.status === 'SERVED' ? (
                        <button
                          onClick={() => handleUpdatePaymentStatus(ord.id, 'PAID')}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 animate-pulse"
                          title="Order served! Confirm payment received at counter"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-stone-400 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-xl">
                          Unpaid
                        </span>
                      )}

                      {/* WhatsApp Bill: Unlocks ONLY when order is SERVED and PAID */}
                      {ord.status === 'SERVED' && ord.paymentStatus === 'PAID' && (
                        <button
                          onClick={() => sendBillViaWhatsApp(ord)}
                          className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          title="Send bill to customer on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      )}

                      {ord.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'CANCELLED')}
                          className="bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
                        title="View Details"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Details Modal / Drawer */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="font-serif font-bold text-xl text-stone-900">
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {selectedOrder.table ? `${selectedOrder.table.tableNumber} - ${selectedOrder.table.name}` : 'Takeaway Order'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-3 bg-nature-50 border border-nature-100 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs"><UserRound className="w-4 h-4 text-nature-800" /><span><strong>{selectedOrder.customerName || 'Walk-in Customer'}</strong><span className="block text-stone-500">{selectedOrder.customerPhone || 'No phone number provided'}</span></span></div>
                  <button onClick={() => setShowCustomerDetails(!showCustomerDetails)} className="text-[11px] font-bold text-nature-900 underline">{showCustomerDetails ? 'Hide details' : 'View customer details'}</button>
                </div>
                {showCustomerDetails && <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-2xl text-xs"><div><span className="text-stone-400 block">Customer</span><strong>{selectedOrder.customerName || 'Walk-in Customer'}</strong></div><div><span className="text-stone-400 block">Phone</span><strong>{selectedOrder.customerPhone || 'Not provided'}</strong></div><div><span className="text-stone-400 block">Order type</span><strong>{selectedOrder.orderType}</strong></div><div><span className="text-stone-400 block">Channel</span><strong>{selectedOrder.source || 'DIRECT'}</strong></div></div>}
                {selectedOrder.source && selectedOrder.source !== 'DIRECT' && <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold text-blue-950"><MapPin className="w-4 h-4" /> Rider & delivery tracking</div>{selectedOrder.deliveryEta ? <span className="text-[11px] font-bold text-blue-800">ETA {selectedOrder.deliveryEta} min</span> : null}</div><div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-blue-700/70 block">Rider</span><strong>{selectedOrder.riderName || 'Awaiting assignment'}</strong></div><div><span className="text-blue-700/70 block">Phone</span><strong>{selectedOrder.riderPhone || 'Not shared'}</strong></div><div><span className="text-blue-700/70 block">Vehicle</span><strong>{selectedOrder.riderVehicle || 'Not shared'}</strong></div><div><span className="text-blue-700/70 block">Drop address</span><strong>{selectedOrder.deliveryAddress || 'Not available'}</strong></div></div>{selectedOrder.deliveryLat && selectedOrder.deliveryLng ? <><iframe title="Delivery location map" className="w-full h-40 rounded-xl border border-blue-100" src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedOrder.deliveryLng - 0.02}%2C${selectedOrder.deliveryLat - 0.015}%2C${selectedOrder.deliveryLng + 0.02}%2C${selectedOrder.deliveryLat + 0.015}&layer=mapnik&marker=${selectedOrder.deliveryLat}%2C${selectedOrder.deliveryLng}`} /><a href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.deliveryLat},${selectedOrder.deliveryLng}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-800 underline">Open full map →</a></> : <p className="text-[11px] text-blue-700">Live map location will appear when the marketplace sends rider coordinates.</p>}</div>}
                <h3 className="text-xs uppercase tracking-wider font-bold text-stone-500">
                  Item Details
                </h3>
                <div className="divide-y divide-stone-100">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between text-xs">
                      <div>
                        <strong className="text-stone-800">{item.itemName}</strong>
                        <span className="text-stone-400 block">Qty: {item.quantity} × ₹{item.unitPrice}</span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <span className="text-[11px] text-stone-500 block">
                            +{item.modifiers.map((m) => m.modifierName).join(', ')}
                          </span>
                        )}
                        {item.notes && <p className="text-stone-400 italic">"{item.notes}"</p>}
                      </div>
                      <span className="font-bold text-stone-900">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between text-sm font-extrabold text-stone-900">
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>

                {/* Payment Management in Modal */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Payment Status & Method</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <strong className="text-stone-800">
                        {selectedOrder.paymentMethod === 'PAY_AT_COUNTER' || selectedOrder.paymentMethod === 'CASH'
                          ? 'Pay at Counter (Cash/Card)'
                          : selectedOrder.paymentMethod}
                      </strong>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedOrder.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {selectedOrder.paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT PENDING'}
                      </span>
                    </div>
                  </div>
                  {selectedOrder.paymentStatus !== 'PAID' ? (
                    selectedOrder.status === 'SERVED' ? (
                      <button
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'PAID')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm text-xs animate-pulse"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Paid</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl font-medium">
                        Order must be Served before marking Paid
                      </span>
                    )
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Paid
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'PENDING')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                        title="Customer marked paid but payment not received? Click to revert to Unpaid."
                      >
                        <span>Mark Unpaid (Not Received)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-end gap-2">
                {/* Send Bill via WhatsApp unlocks ONLY when order is SERVED and PAID */}
                {selectedOrder.status === 'SERVED' && selectedOrder.paymentStatus === 'PAID' ? (
                  <button
                    onClick={() => sendBillViaWhatsApp(selectedOrder)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{whatsappCopied ? 'Bill copied · Open WhatsApp' : 'Send Bill via WhatsApp'}</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-stone-500 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>WhatsApp Bill unlocks after order is <strong>Served</strong> & <strong>Paid</strong></span>
                  </div>
                )}
                <button
                  onClick={() => printActualBill(selectedOrder)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print Actual Bill</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-nature-900 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
