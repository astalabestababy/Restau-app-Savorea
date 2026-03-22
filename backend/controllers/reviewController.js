const Review = require('../models/Review');
const Order = require('../models/Order');

const bannedWords = [
    'fuck','shit','bitch','asshole','bastard','puta','gago','tanga','ulol'
];

const sanitize = (text) => {
    if (!text) return '';
    let result = text;
    bannedWords.forEach(w => {
        const re = new RegExp(`\\b${w}\\b`, 'gi');
        result = result.replace(re, '*'.repeat(w.length));
    });
    return result;
};

const countWords = (text) => {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    try {
        const matches = trimmed.match(/[\p{L}\p{N}]+/gu);
        return matches ? matches.length : 0;
    } catch (e) {
        const matches = trimmed.match(/[A-Za-z0-9]+/g);
        return matches ? matches.length : 0;
    }
};

exports.createReview = async (req, res) => {
    try {
        const { orderId, itemName, rating, comment, userName } = req.body;
        if (!itemName || !rating) return res.status(400).json({ message: 'itemName and rating are required' });
        if (countWords(comment) < 3) return res.status(400).json({ message: 'Comment must be at least 3 words' });

        let order = null;
        if (orderId) {
            order = await Order.findById(orderId);
            if (!order) return res.status(404).json({ message: 'Order not found' });
            if (order.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not your order' });
            if (order.status !== 'Delivered') return res.status(400).json({ message: 'You can only review delivered orders' });
            const hasItem = order.items?.some(it => it.name === itemName);
            if (!hasItem) return res.status(400).json({ message: 'Item not found in this order' });
        } else {
            const reviewed = await Review.find({ user: req.user.id, itemName }).select('order');
            const reviewedIds = reviewed.map(r => r.order);
            order = await Order.findOne({
                user: req.user.id,
                status: 'Delivered',
                'items.name': itemName,
                _id: { $nin: reviewedIds }
            }).sort({ createdAt: -1 });
            if (!order) return res.status(409).json({ message: 'You already reviewed this item for all delivered orders' });
        }

        const existing = await Review.findOne({ user: req.user.id, order: order._id, itemName });
        if (existing) return res.status(409).json({ message: 'You already reviewed this item in this order' });

        const review = await Review.create({
            user: req.user.id,
            order: order._id,
            itemName,
            userName: userName || '',
            rating,
            comment: sanitize(comment)
        });
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

        if (rating) review.rating = rating;
        if (comment !== undefined) {
            if (countWords(comment) < 3) return res.status(400).json({ message: 'Comment must be at least 3 words' });
            review.comment = sanitize(comment);
        }
        review.updatedAt = new Date();
        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
        await Review.deleteOne({ _id: review._id });
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMyReviewForOrder = async (req, res) => {
    try {
        const { orderId, itemName } = req.query;
        if (!itemName) return res.status(400).json({ message: 'itemName is required' });
        const query = { user: req.user.id, itemName };
        if (orderId) query.order = orderId;
        const review = await Review.findOne(query);
        res.json(review || null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.listMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('order', '_id');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin
exports.adminListReviews = async (req, res) => {
    try {
        const reviews = await Review.find().populate('user', 'name email').populate('order', '_id totalAmount');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminDeleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        await Review.deleteOne({ _id: review._id });
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
