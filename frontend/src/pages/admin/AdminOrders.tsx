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
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Order } from '../../types';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    socket.emit('join_restaurant', 'switea');

    socket.on('new_order', (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      if (soundEnabled) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        } catch {}
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
              onClick={() => setSoundEnabled(!soundEnabled)}
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
                      <div className="flex items-center gap-3">
                        <strong className="font-serif text-base text-stone-900">
                          #{ord.orderNumber}
                        </strong>
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
                      </div>

                      <div className="text-xs text-stone-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Items: <strong className="text-stone-800">{ord.items?.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}</strong></span>
                        <span>• Payment: <strong className="text-stone-800">{ord.paymentMethod}</strong></span>
                        <span>• Placed: {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <span className="font-serif text-lg font-bold text-stone-900 mr-2">
                        ₹{ord.totalAmount}
                      </span>

                      {nextAction && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, nextAction.nextStatus)}
                          className={`${nextAction.color} text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all`}
                        >
                          {nextAction.label}
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
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket</span>
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
