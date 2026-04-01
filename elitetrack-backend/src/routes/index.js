const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, me } = require('../controllers/authController');
const { getOrders, getDriverOrders, createOrder, assignDriver, updateStatus, trackOrder, getStats } = require('../controllers/orderController');
const { getDrivers, createDriver, toggleDriver, getNotifications, markNotificationsRead } = require('../controllers/userController');

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', auth(), me);

// Orders
router.get('/orders', auth(['merchant']), getOrders);
router.get('/orders/stats', auth(['merchant']), getStats);
router.get('/orders/driver', auth(['driver']), getDriverOrders);
router.post('/orders', auth(['merchant']), createOrder);
router.patch('/orders/:id/assign', auth(['merchant']), assignDriver);
router.patch('/orders/:id/status', auth(['merchant', 'driver']), updateStatus);
router.get('/orders/track/:token', trackOrder); // public

// Users / Drivers
router.get('/users/drivers', auth(['merchant']), getDrivers);
router.post('/users/drivers', auth(['merchant']), createDriver);
router.patch('/users/drivers/:id/toggle', auth(['merchant']), toggleDriver);
router.get('/users/notifications', auth(), getNotifications);
router.patch('/users/notifications/read', auth(), markNotificationsRead);

module.exports = router;
