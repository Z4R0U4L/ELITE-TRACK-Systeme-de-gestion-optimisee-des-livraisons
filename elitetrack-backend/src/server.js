require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./config/db');
const routes = require('./routes/index');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
app.use('/api', routes);

// ─────────────────────────────────────
// Socket.io — Real-time GPS
// ─────────────────────────────────────
const connectedUsers = new Map(); // userId -> socketId

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  connectedUsers.set(user.id, socket.id);
  console.log(`Connected: ${user.name} (${user.role})`);

  // Join role-based rooms
  socket.join(user.role);
  socket.join(`user:${user.id}`);

  // ── DRIVER: share GPS location ──
  socket.on('driver:location', async ({ latitude, longitude }) => {
    if (user.role !== 'driver') return;
    try {
      // Upsert driver location
      await pool.query(
        `INSERT INTO driver_locations (driver_id, latitude, longitude, is_sharing)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (driver_id)
         DO UPDATE SET latitude = $2, longitude = $3, is_sharing = true, updated_at = NOW()`,
        [user.id, latitude, longitude]
      );

      // Broadcast to merchants room
      io.to('merchant').emit('driver:location:update', {
        driver_id: user.id,
        driver_name: user.name,
        latitude,
        longitude,
        updated_at: new Date()
      });

      // Also broadcast to clients tracking this driver's orders
      const orders = await pool.query(
        `SELECT tracking_token FROM orders WHERE driver_id = $1 AND status = 'in_progress'`,
        [user.id]
      );
      orders.rows.forEach(order => {
        io.to(`track:${order.tracking_token}`).emit('driver:location:update', {
          latitude,
          longitude,
          updated_at: new Date()
        });
      });
    } catch (err) {
      console.error('Location update error:', err.message);
    }
  });

  // ── DRIVER: toggle GPS sharing ──
  socket.on('driver:sharing', async ({ is_sharing }) => {
    if (user.role !== 'driver') return;
    await pool.query(
      `INSERT INTO driver_locations (driver_id, latitude, longitude, is_sharing)
       VALUES ($1, 0, 0, $2)
       ON CONFLICT (driver_id) DO UPDATE SET is_sharing = $2, updated_at = NOW()`,
      [user.id, is_sharing]
    );
    io.to('merchant').emit('driver:sharing:update', { driver_id: user.id, is_sharing });
  });

  // ── CLIENT: join tracking room ──
  socket.on('track:join', ({ token }) => {
    socket.join(`track:${token}`);
  });

  // ── DRIVER: confirm delivery ──
  socket.on('order:delivered', async ({ order_id }) => {
    if (user.role !== 'driver') return;
    try {
      const result = await pool.query(
        `UPDATE orders SET status = 'delivered' WHERE id = $1 AND driver_id = $2 RETURNING *, tracking_token`,
        [order_id, user.id]
      );
      if (result.rows.length) {
        const order = result.rows[0];
        // Notify merchant
        io.to('merchant').emit('order:status:update', { order_id, status: 'delivered' });
        // Notify client tracking
        io.to(`track:${order.tracking_token}`).emit('order:delivered', { order_id });
        // Save notification for merchant
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           SELECT merchant_id, 'Livraison effectuée', 'Commande ' || order_number || ' livrée avec succès', 'success'
           FROM orders WHERE id = $1`,
          [order_id]
        );
      }
    } catch (err) {
      console.error(err.message);
    }
  });

  socket.on('disconnect', async () => {
    connectedUsers.delete(user.id);
    if (user.role === 'driver') {
      await pool.query(
        `UPDATE driver_locations SET is_sharing = false WHERE driver_id = $1`,
        [user.id]
      ).catch(() => {});
      io.to('merchant').emit('driver:sharing:update', { driver_id: user.id, is_sharing: false });
    }
    console.log(`Disconnected: ${user.name}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`DelivTrack backend running on port ${PORT}`);
});
