const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

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

router.use(auth);

router.get('/my', reviewController.listMyReviews);
router.get('/', reviewController.getMyReviewForOrder); // ?itemName=
router.post('/', reviewController.createReview);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
