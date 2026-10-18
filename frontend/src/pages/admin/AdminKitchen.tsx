import React, { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Order } from '../../types';

export const AdminKitchen: React.FC = () => {
  const [queue, setQueue] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKitchenQueue = async () => {
    try {
      const res = await api.getKitchenQueue();
      setQueue(res.queue || []);
    } catch (err) {
      console.error('Kitchen queue error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenQueue();

    const socket = getSocket();
    socket.on('new_order', () => {
      fetchKitchenQueue();
    });
    socket.on('order_status_updated', () => {
      fetchKitchenQueue();
    });

    // Refresh every 30s for timer accuracy
    const timer = setInterval(() => {
      fetchKitchenQueue();
    }, 30000);

    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
      clearInterval(timer);
    };
  }, []);

  const handleMarkReady = async (orderId: string) => {
    try {
      await api.updateOrderStatus(orderId, 'READY');
      fetchKitchenQueue();
    } catch (err) {
      alert('Failed to update kitchen status.');
    }
  };

  const getElapsedMinutes = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    return Math.floor(diffMs / 60000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-amber-600" />
              <span>Kitchen Display System (KDS)</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">Live active preparation queue for chef & cooks</p>
          </div>

          <button
            onClick={fetchKitchenQueue}
            className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400">Loading kitchen orders...</div>
        ) : queue.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 p-8 shadow-soft">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
            <h2 className="font-serif text-2xl font-bold text-stone-900">All Orders Prepped!</h2>
            <p className="text-xs text-stone-500 mt-1">Kitchen queue is currently clear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queue.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsed > 15;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl border shadow-soft p-6 flex flex-col justify-between transition-all ${
                    isUrgent ? 'border-red-300 ring-2 ring-red-100' : 'border-stone-200'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-stone-100 mb-4">
                      <div>
                        <span className="text-xs font-bold text-nature-700 uppercase tracking-wide block">
                          #{order.orderNumber}
                        </span>
                        <h2 className="font-serif text-xl font-extrabold text-stone-900">
                          {order.table ? order.table.tableNumber : 'Takeaway'}
                        </h2>
                        {order.table && (
                          <span className="text-xs text-stone-500">{order.table.name}</span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed}m ago</span>
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3 divide-y divide-stone-100">
                      {order.items?.map((item) => (
                        <div key={item.id} className="pt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-base text-stone-900">
                              {item.quantity}x {item.itemName}
                            </span>
                          </div>

                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.modifiers.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="text-[11px] bg-nature-50 border border-nature-200 text-nature-950 font-semibold px-2 py-0.5 rounded-md"
                                >
                                  {m.modifierName}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-xs font-bold text-amber-900 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-6 mt-4 border-t border-stone-100">
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-2xl text-sm shadow transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                      <span>Plated / Mark Ready</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
