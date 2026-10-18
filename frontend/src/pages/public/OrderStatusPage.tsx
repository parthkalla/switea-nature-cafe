import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Order } from '../../types';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Received', desc: 'Sent to Switea kitchen' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Kitchen acknowledged order' },
  { key: 'PREPARING', label: 'Preparing', desc: 'Crafting fresh with care' },
  { key: 'READY', label: 'Ready', desc: 'Piping hot and plated' },
  { key: 'SERVED', label: 'Served', desc: 'Enjoy your meal in the garden' },
];

export const OrderStatusPage: React.FC = () => {
  const { orderToken } = useParams<{ orderToken: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
      }
    });

    return () => {
      socket.off('order_status_updated');
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
      await api.submitReview('switea', {
        customerName: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSubmitted(true);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
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

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
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

        {/* Itemized Snapshot */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6 sm:p-8 space-y-6">
          <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
            <span>Ordered Items</span>
            <span className="text-xs font-normal text-stone-500">Payment: {order.paymentMethod}</span>
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
                <span>Discount Applied</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST Tax</span>
              <span className="font-semibold text-stone-900">₹{order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-stone-100 flex justify-between text-base font-extrabold text-nature-950">
              <span>Final Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/menu"
              className="text-xs font-bold text-nature-900 hover:underline flex items-center gap-1"
            >
              <span>Order More Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="tel:+919555495454"
              className="inline-flex items-center gap-1.5 text-xs bg-cream-200 hover:bg-cream-300 text-stone-800 font-semibold px-4 py-2 rounded-full transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Staff (+91 95554 95454)</span>
            </a>
          </div>
        </div>

        {/* Customer Experience Review Section */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6 sm:p-8 mt-8">
          {reviewSubmitted ? (
            <div className="text-center py-6 space-y-3 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">Thank You for Your Review!</h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                Your feedback helps the Switea Nature Cafe culinary & garden service team maintain highest hospitality standards.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-nature-900 text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-nature-950 transition-colors"
                >
                  <span>Return to Switea Home</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{order.status === 'SERVED' ? 'Order Served — Rate Your Experience' : 'Leave a Guest Review'}</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                    How was your Switea experience?
                  </h3>
                  <p className="text-xs text-stone-500">
                    Tell us about the chai, food taste, and garden atmosphere
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
