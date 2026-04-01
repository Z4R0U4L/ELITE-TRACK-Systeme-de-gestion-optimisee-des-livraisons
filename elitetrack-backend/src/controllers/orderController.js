const pool = require('../config/db');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const generateOrderNumber = () => {
  return 'CMD-' + Date.now().toString().slice(-6);
};

const sendTrackingEmail = async (order) => {
  if (!order.client_email) return;
  try {
    const trackingUrl = `${process.env.FRONTEND_URL}/track/${order.tracking_token}`;
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: order.client_email,
      subject: `Votre commande ${order.order_number} est en cours de livraison`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f5f6fa;border-radius:16px;">
          <div style="background:#1A1F2E;padding:16px 24px;border-radius:10px;margin-bottom:24px;">
            <span style="color:#CC0000;font-size:20px;font-weight:800;">ELITE TRACK</span>
          </div>
          <h2 style="color:#1A1F2E;margin-bottom:8px;">Votre commande est en route !</h2>
          <p style="color:#6B7280;margin-bottom:24px;">Bonjour <strong>${order.client_name}</strong>,</p>
          <p style="color:#374151;margin-bottom:8px;">
            Votre commande <strong style="color:#CC0000;">${order.order_number}</strong> 
            a été assignée à un livreur et est en cours de livraison.
          </p>
          <p style="color:#374151;margin-bottom:28px;">
            Adresse : <strong>${order.delivery_address}</strong>
          </p>
          <a href="${trackingUrl}" 
             style="display:inline-block;background:#CC0000;color:white;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
            📍 Suivre ma livraison en temps réel
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin-top:28px;">
            Ce lien est unique pour votre commande. Aucun compte requis.
          </p>
        </div>
      `
    });
    if (error) console.error('Resend error:', error);
    else console.log('Tracking email sent to', order.client_email);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// GET /api/orders - merchant gets their orders
const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT o.*, u.name as driver_name, u.phone as driver_phone
      FROM orders o
      LEFT JOIN users u ON o.driver_id = u.id
      WHERE o.merchant_id = $1
    `;
    const params = [req.user.id];
    if (status) { query += ` AND o.status = $2`; params.push(status); }
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM orders WHERE merchant_id = $1', [req.user.id]);
    res.json({ orders: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/driver - driver gets assigned orders
const getDriverOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM orders WHERE driver_id = $1 AND status IN ('assigned','in_progress')
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/orders - create order
const createOrder = async (req, res) => {
  const { client_name, client_phone, client_email, delivery_address, delivery_lat, delivery_lng, notes } = req.body;
  if (!client_name || !delivery_address) {
    return res.status(400).json({ message: 'Client name and address required' });
  }
  try {
    const order_number = generateOrderNumber();
    const result = await pool.query(
      `INSERT INTO orders (order_number, merchant_id, client_name, client_phone, client_email,
        delivery_address, delivery_lat, delivery_lng, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [order_number, req.user.id, client_name, client_phone, client_email,
       delivery_address, delivery_lat, delivery_lng, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/orders/:id/assign - assign driver
const assignDriver = async (req, res) => {
  const { driver_id } = req.body;
  const { id } = req.params;
  try {
    const driver = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [driver_id, 'driver']);
    if (!driver.rows.length) return res.status(404).json({ message: 'Driver not found' });

    const result = await pool.query(
      `UPDATE orders SET driver_id = $1, status = 'assigned'
       WHERE id = $2 AND merchant_id = $3 RETURNING *`,
      [driver_id, id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Order not found' });

    const order = result.rows[0];

    // Notify driver in DB
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Nouvelle livraison', 'Commande ${order.order_number} vous a été assignée', 'assignment')`,
      [driver_id]
    );

    // Send tracking email to client
    await sendTrackingEmail(order);

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/orders/:id/status - update status (driver or merchant)
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const allowed = ['in_progress', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    let query, params;
    if (req.user.role === 'driver') {
      query = `UPDATE orders SET status = $1 WHERE id = $2 AND driver_id = $3 RETURNING *`;
      params = [status, id, req.user.id];
    } else {
      query = `UPDATE orders SET status = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`;
      params = [status, id, req.user.id];
    }
    const result = await pool.query(query, params);
    if (!result.rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/track/:token - public tracking (no auth)
const trackOrder = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_number, o.client_name, o.delivery_address, o.status,
              o.delivery_lat, o.delivery_lng, o.created_at,
              u.name as driver_name, u.phone as driver_phone,
              dl.latitude as driver_lat, dl.longitude as driver_lng, dl.updated_at as location_updated
       FROM orders o
       LEFT JOIN users u ON o.driver_id = u.id
       LEFT JOIN driver_locations dl ON o.driver_id = dl.driver_id
       WHERE o.tracking_token = $1`,
      [req.params.token]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/stats - merchant stats
const getStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_total,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'delivered' AND DATE(updated_at) = CURRENT_DATE) as delivered_today,
        COUNT(*) FILTER (WHERE status = 'delivered') as total_delivered
       FROM orders WHERE merchant_id = $1`,
      [req.user.id]
    );
    const drivers = await pool.query(
      `SELECT COUNT(DISTINCT driver_id) as active_drivers
       FROM orders WHERE merchant_id = $1 AND status = 'in_progress'`,
      [req.user.id]
    );
    res.json({ ...result.rows[0], ...drivers.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOrders, getDriverOrders, createOrder, assignDriver, updateStatus, trackOrder, getStats };
