const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reviewController = require('../controllers/reviewController');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        let ext = path.extname(file.originalname);
        if (!ext) {
            if (file.mimetype === 'image/jpeg') ext = '.jpg';
            else if (file.mimetype === 'image/png') ext = '.png';
            else ext = '.jpg'; // Default to jpg
        }
        cb(null, 'menu-' + Date.now() + ext);
    }
});

const upload = multer({ storage: storage });

// Reuse auth middleware logic since it's in server.js but not exported
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

const adminMiddleware = require('../middleware/admin');

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(adminMiddleware);

// Dashboard Stats
router.get('/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// Review Management
router.get('/reviews', reviewController.adminListReviews);
router.delete('/reviews/:id', reviewController.adminDeleteReview);

// Promotions / Notifications
router.get('/promos', adminController.getPromos);
router.post('/promos', adminController.createPromo);
router.post('/notify/promo', adminController.sendPromotion); // Manual notify (legacy)

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Menu Management
router.post('/menu', upload.array('images', 5), adminController.createMenuItem);
router.put('/menu/:id', upload.array('images', 5), adminController.updateMenuItem);
router.delete('/menu/:id', adminController.deleteMenuItem);

module.exports = router;
