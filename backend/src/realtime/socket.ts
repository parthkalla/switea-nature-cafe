import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export interface PushNotificationRecord {
  id: string;
  target: 'ALL' | 'SPECIFIC' | 'SUPER';
  phone?: string;
  recipientName?: string;
  title: string;
  message: string;
  url?: string;
  icon?: string;
  badge?: string;
  timestamp: string;
  sentBy?: string;
}

export interface SongRequestRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  tableNumber: string;
  songTitle: string;
  artist: string;
  notes?: string;
  status: 'PENDING' | 'PLAYING' | 'COMPLETED';
  requestedAt: string;
}

export interface EventRsvpRecord {
  id: string;
  name: string;
  phone: string;
  eventId: string;
  eventTitle: string;
  guestsCount: number;
  notes?: string;
  createdAt: string;
}

// In-memory persistent arrays for real-time community & notifications
const notificationHistory: PushNotificationRecord[] = [
  {
    id: 'notif-sample-1',
    target: 'ALL',
    title: 'Diwali Acoustic Balcony Night 🪔',
    message: 'Join us Nov 1 for live unplugged guitar, fairy lights, and complimentary desserts on orders above ₹399!',
    url: '/community',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    sentBy: 'Head Barista',
  },
];

const songRequests: SongRequestRecord[] = [
  {
    id: 'song-1',
    customerName: 'Parth',
    customerPhone: '9571714005',
    tableNumber: 'Table B01',
    songTitle: 'Iktara (Wake Up Sid)',
    artist: 'Amit Trivedi / Tochi Raina',
    notes: 'Sunset balcony acoustic vibe ❤️',
    status: 'PLAYING',
    requestedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'song-2',
    customerName: 'Aarav Sharma',
    tableNumber: 'Table B02',
    songTitle: 'Ilahi (Yeh Jawaani Hai Deewani)',
    artist: 'Arijit Singh',
    notes: 'For evening coffee',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 600000).toISOString(),
  },
];

const eventRsvps: EventRsvpRecord[] = [
  {
    id: 'rsvp-1',
    name: 'Parth Kalla',
    phone: '9571714005',
    eventId: 'diwali-night-2026',
    eventTitle: 'Diwali Acoustic Balcony Night',
    guestsCount: 4,
    notes: 'Balcony railing view requested please',
    createdAt: new Date().toISOString(),
  },
];

export function initSocketIO(server: HTTPServer, frontendUrl: string): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [frontendUrl, 'http://localhost:5170', 'http://localhost:5173', 'http://127.0.0.1:5170', '*'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Join restaurant room for staff notifications
    socket.on('join_restaurant', (restaurantId: string) => {
      socket.join(`restaurant_${restaurantId}`);
    });

    // Join order tracking room for customer updates
    socket.on('join_order', (orderToken: string) => {
      socket.join(`order_${orderToken}`);
    });

    // Join customer-specific channel by phone number
    socket.on('join_customer', (phone: string) => {
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        socket.join(`customer_${cleanPhone}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitNewOrder(restaurantId: string, order: any) {
  if (io) {
    io.to(`restaurant_${restaurantId}`).emit('new_order', order);
    io.to('restaurant_roastfuze').emit('new_order', order);
    io.emit('new_order', order);
  }
}

export function emitOrderStatusUpdated(restaurantId: string, orderToken: string, status: string, order: any) {
  if (io) {
    io.to(`restaurant_${restaurantId}`).emit('order_status_updated', { orderToken, status, order });
    io.to('restaurant_roastfuze').emit('order_status_updated', { orderToken, status, order });
    io.emit('order_status_updated', { orderToken, status, order });
    io.to(`order_${orderToken}`).emit('order_status_updated', { orderToken, status, order });

    // Also notify customer room if phone is available
    if (order.customerPhone) {
      const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
      io.to(`customer_${cleanPhone}`).emit('order_status_updated', { orderToken, status, order });
    }
  }
}

export function emitNewReview(restaurantId: string, review: any) {
  if (io) {
    io.to(`restaurant_${restaurantId}`).emit('new_review', {
      review,
      message: `⭐ New ${review.rating}-Star Review by ${review.customerName}!`,
      timestamp: new Date().toISOString(),
    });
  }
}

export function emitDeliveryPartnerAssigned(restaurantId: string, payload: any) {
  if (io) {
    io.to(`restaurant_${restaurantId}`).emit('delivery_partner_assigned', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}

// Push notification sender
export function sendPushNotification(data: Omit<PushNotificationRecord, 'id' | 'timestamp'>): PushNotificationRecord {
  const record: PushNotificationRecord = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    ...data,
    timestamp: new Date().toISOString(),
  };

  notificationHistory.unshift(record);
  if (notificationHistory.length > 100) {
    notificationHistory.pop();
  }

  if (io) {
    if (data.target === 'SPECIFIC' && data.phone) {
      const cleanPhone = data.phone.replace(/\D/g, '');
      io.to(`customer_${cleanPhone}`).emit('push_notification', record);
      // Also broadcast to order rooms if phone matches
    } else {
      // Broadcast to all connected customer clients
      io.emit('push_notification', record);
    }
    // Also notify restaurant admin room so admin dashboard updates
    io.emit('admin_notification_sent', record);
  }

  return record;
}

export function getNotificationHistory(): PushNotificationRecord[] {
  return notificationHistory;
}

// Live Community Song Requests
export function addSongRequest(data: Omit<SongRequestRecord, 'id' | 'requestedAt' | 'status'>): SongRequestRecord {
  const record: SongRequestRecord = {
    id: `song-${Date.now()}`,
    ...data,
    status: 'PENDING',
    requestedAt: new Date().toISOString(),
  };

  songRequests.unshift(record);
  if (songRequests.length > 50) {
    songRequests.pop();
  }

  if (io) {
    io.emit('new_song_request', record);
  }

  return record;
}

export function getSongRequests(): SongRequestRecord[] {
  return songRequests;
}

export function updateSongRequestStatus(id: string, status: 'PENDING' | 'PLAYING' | 'COMPLETED'): SongRequestRecord | null {
  const item = songRequests.find((s) => s.id === id);
  if (item) {
    item.status = status;
    if (io) {
      io.emit('song_request_updated', item);
    }
    return item;
  }
  return null;
}

// Live Community Event RSVPs
export function addEventRsvp(data: Omit<EventRsvpRecord, 'id' | 'createdAt'>): EventRsvpRecord {
  const record: EventRsvpRecord = {
    id: `rsvp-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  };

  eventRsvps.unshift(record);
  if (io) {
    io.emit('new_event_rsvp', record);
  }
  return record;
}

export function getEventRsvps(): EventRsvpRecord[] {
  return eventRsvps;
}
