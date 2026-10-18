import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer, frontendUrl: string): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
  }
}

export function emitOrderStatusUpdated(restaurantId: string, orderToken: string, status: string, order: any) {
  if (io) {
    io.to(`restaurant_${restaurantId}`).emit('order_status_updated', { orderToken, status, order });
    io.to(`order_${orderToken}`).emit('order_status_updated', { orderToken, status, order });
  }
}
