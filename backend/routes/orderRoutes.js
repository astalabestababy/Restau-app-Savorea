const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Auth Middleware (Duplicate from server.js for now or move to middleware file)
const auth = (req, res, next) => {
    const token = req.header('x-auth-token') || req.query.token;
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

router.post('/', auth, orderController.createOrder);
router.get('/myorders', auth, orderController.getMyOrders);
router.get('/:id/receipt', auth, orderController.generateReceipt);

module.exports = router;
