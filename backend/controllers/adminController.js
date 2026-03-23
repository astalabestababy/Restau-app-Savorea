const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Promo = require('../models/Promo');
const Notification = require('../models/Notification');
const { Expo } = require('expo-server-sdk');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const expo = new Expo();

/** Expo requires batched sends; returns count of messages accepted (not delivery guarantees). */
async function deliverExpoPushMessages(messages) {
    if (!messages.length) return 0;
    const chunks = expo.chunkPushNotifications(messages);
    let accepted = 0;
    for (const chunk of chunks) {
        try {
            await expo.sendPushNotificationsAsync(chunk);
            accepted += chunk.length;
        } catch (err) {
            console.error('Expo push batch error:', err);
        }
    }
    return accepted;
}

function buildPromoPayloadDoc(doc) {
    return JSON.stringify({
        _id: doc._id?.toString(),
        title: doc.title,
        description: doc.description,
        discountPercent: doc.discountPercent != null ? Number(doc.discountPercent) : 0,
        imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
        expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
    });
}

function getUserPushTokens(user) {
    const tokens = [];

    if (Array.isArray(user?.pushDevices)) {
        for (const device of user.pushDevices) {
            if (typeof device?.token === 'string' && device.token.trim()) {
                tokens.push(device.token.trim());
            }
        }
    }

    if (Array.isArray(user?.pushTokens)) {
        for (const token of user.pushTokens) {
            if (typeof token === 'string' && token.trim()) {
                tokens.push(token.trim());
            }
        }
    }

    if (typeof user?.pushToken === 'string' && user.pushToken.trim()) {
        tokens.push(user.pushToken.trim());
    }

    return [...new Set(tokens)];
}

async function usersWithPushTokens() {
    return User.find({
        role: 'user',
        isActive: true,
        $or: [
            { pushToken: { $exists: true, $nin: [null, ''] } },
            { pushTokens: { $exists: true, $ne: [] } },
            { pushDevices: { $exists: true, $ne: [] } },
        ],
    });
}

async function createNotificationForUser(userId, type, title, body, data = {}) {
    const notification = new Notification({
        user: userId,
        type,
        title,
        body,
        data,
    });

    await notification.save();
    return notification;
}

// Legacy sendPromotion - for backward compatibility with existing routes
exports.sendPromotion = async (req, res) => {
    try {
        const { title, description, discountPercent = 0 } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description required' });
        }

        const users = await usersWithPushTokens();
        const promoPayload = JSON.stringify({
            title,
            description,
            discountPercent: Number(discountPercent) || 0,
            imageUrls: [],
            expiresAt: null,
        });

        const messages = [];
        for (const user of users) {
            const messageBody = `${description}${discountPercent > 0 ? ` Save ${discountPercent}% on your next order.` : ''}`;
            const notification = await createNotificationForUser(
                user._id,
                'promo',
                title,
                messageBody,
                {
                    type: 'promo',
                    promo: {
                        title,
                        description,
                        discountPercent: Number(discountPercent) || 0,
                        imageUrls: [],
                        expiresAt: null,
                    }
                }
            );

            for (const token of getUserPushTokens(user)) {
                if (!Expo.isExpoPushToken(token)) continue;
                messages.push({
                    to: token,
                    sound: 'default',
                    title: `New promo: ${title}`,
                    body: messageBody,
                    data: {
                        type: 'promo',
                        notificationId: notification._id.toString(),
                        promoPayload,
                    },
                });
            }
        }

        const sent = await deliverExpoPushMessages(messages);
        console.log(`Legacy promo push sent to ${sent} devices`);

        res.json({ message: 'Promotion sent', notificationsSent: sent });
    } catch (err) {
        console.error('Send promotion error:', err);
        res.status(500).json({ message: err.message });
    }
};

// sendPromotion replaced by createPromo with auto-notification
// DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // 1. Monthly Orders (All orders created this month)
        const monthlyOrdersCount = await Order.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // 2. Monthly Revenue (Sum of non-cancelled orders this month)
        const monthlyOrders = await Order.find({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $ne: 'Cancelled' }
        });

        const monthlyRevenue = monthlyOrders.reduce((total, order) => total + order.totalAmount, 0);

        // 3. Total Users
        const totalUsers = await User.countDocuments({ role: 'user' });

        // 4. Total Menu Items
        const totalMenuItems = await MenuItem.countDocuments();

        // 5. Pending Orders
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });

        // 6. Total Orders
        const totalOrders = await Order.countDocuments();

        res.json({
            monthlyOrders: monthlyOrdersCount,
            monthlyRevenue: monthlyRevenue,
            totalUsers: totalUsers,
            totalMenuItems: totalMenuItems,
            pendingOrders: pendingOrders,
            totalOrders: totalOrders
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const { period } = req.query; // 'daily' (last 7 days) or 'monthly' (last 12 months)
        const now = new Date();
        let analyticsData = [];

        if (period === 'monthly') {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
                
                const orders = await Order.find({
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                });

                const revenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
                
                analyticsData.push({
                    label: start.toLocaleString('default', { month: 'short' }),
                    revenue: revenue,
                    orders: orders.length
                });
            }
        } else {
            // Default: Last 7 days
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                
                const start = new Date(d.setHours(0,0,0,0));
                const end = new Date(d.setHours(23,59,59,999));

                const orders = await Order.find({
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                });

                const revenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
                
                analyticsData.push({
                    label: start.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue...
                    revenue: revenue,
                    orders: orders.length
                });
            }
        }

        res.json(analyticsData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// USER MANAGEMENT
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ORDER MANAGEMENT
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Find the current order
        const currentOrder = await Order.findById(req.params.id);
        if (!currentOrder) return res.status(404).json({ message: 'Order not found' });
        
        // Check restrictions
        if (currentOrder.status === 'Delivered' && status !== 'Cancelled' && status !== 'Delivered') {
            return res.status(400).json({ message: 'Cannot change status from Delivered except to Cancelled or Delivered' });
        }
        if (currentOrder.status === 'Cancelled' && status !== 'Out for Delivery' && status !== 'Delivered') {
            return res.status(400).json({ message: 'Cannot change status from Cancelled except to Out for Delivery or Delivered' });
        }
        
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user');
        
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const orderCode = order._id.toString().slice(-6).toUpperCase();
        const notificationTitle = 'Order status updated';
        const notificationBody = `Order #${orderCode} is now ${status}.`;
        const notification = await createNotificationForUser(
            order.user._id,
            'order-status',
            notificationTitle,
            notificationBody,
            {
                type: 'order-status',
                orderId: order._id.toString(),
                orderCode,
                status,
            }
        );

        // Send Push Notification
        const userTokens = getUserPushTokens(order.user);
        console.log('Order user:', order.user ? { name: order.user.name, pushTokens: userTokens.length } : 'null');
        if (userTokens.length > 0) {
            console.log('Valid push tokens:', userTokens.filter(token => Expo.isExpoPushToken(token)).length);
        }
        const validTokens = userTokens.filter(token => Expo.isExpoPushToken(token));
        if (validTokens.length > 0) {
            const messages = validTokens.map(token => ({
                to: token,
                sound: 'default',
                title: notificationTitle,
                body: notificationBody,
                data: {
                    type: 'order-status',
                    notificationId: notification._id.toString(),
                    orderId: order._id.toString(),
                    orderCode,
                    status,
                },
            }));

            try {
                const ticket = await deliverExpoPushMessages(messages);
                console.log('Push notification sent:', ticket);
            } catch (error) {
                console.error('Error sending push notification:', error);
            }
        } else {
            console.log('Push notification not sent: no valid push token');
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// MENU MANAGEMENT
exports.createMenuItem = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'menu_items',
                    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
                });
                imageUrls.push(result.secure_url);
                // Clean up local file after upload
                fs.unlinkSync(file.path);
            }
        } else if (req.body.images) {
            imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        } else if (req.body.image) {
             imageUrls = [req.body.image];
        }

        const newItem = new MenuItem({ 
            name, 
            description, 
            price, 
            category, 
            images: imageUrls 
        });
        
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMenuItem = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        let updateData = { name, description, price, category };
        
        let imageUrls = [];

        // 1. Handle existing images (sent as strings/URLs)
        if (req.body.existingImages) {
             imageUrls = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
        }
        
        // 2. Handle new uploaded files
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'menu_items',
                    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
                });
                imageUrls.push(result.secure_url);
                // Clean up local file
                fs.unlinkSync(file.path);
            }
        }
        
        // If no existingImages and no files, maybe check for legacy 'image' or 'images' body
        if (imageUrls.length === 0) {
            if (req.body.images) {
                imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            } else if (req.body.image) {
                imageUrls = [req.body.image];
            }
        }

        updateData.images = imageUrls;

        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPromos = async (req, res) => {
    try {
        const promos = await Promo.find({}).sort({ createdAt: -1 });
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPublicPromos = async (req, res) => {
    try {
        const now = new Date();
        const promos = await Promo.find({
            active: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gte: now } },
            ],
        }).sort({ createdAt: -1 });

        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createPromo = async (req, res) => {
    try {
        const { title, description, discountPercent, imageUrls = [], expiresAt } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description required' });
        }

        const promoData = {
            title,
            description,
            imageUrls: Array.isArray(imageUrls) ? imageUrls : [imageUrls],
            expiresAt: expiresAt ? new Date(expiresAt) : undefined
        };
        if (discountPercent !== undefined && discountPercent !== null && discountPercent !== '') {
            promoData.discountPercent = parseFloat(discountPercent);
        }
        const promo = new Promo(promoData);
        await promo.save();

        const users = await usersWithPushTokens();
        const promoPayload = buildPromoPayloadDoc(promo);
        const discountLine =
            promo.discountPercent > 0 ? ` Save ${promo.discountPercent}% now!` : '';

        const messages = [];
        for (const user of users) {
            const notificationTitle = `New promo: ${promo.title}`;
            const notificationBody = `${promo.description}${discountLine}`;
            const notification = await createNotificationForUser(
                user._id,
                'promo',
                notificationTitle,
                notificationBody,
                {
                    type: 'promo',
                    promoId: promo._id.toString(),
                    promo: promo.toObject(),
                }
            );

            for (const token of getUserPushTokens(user)) {
                if (!Expo.isExpoPushToken(token)) continue;
                messages.push({
                    to: token,
                    sound: 'default',
                    title: notificationTitle,
                    body: notificationBody,
                    data: {
                        type: 'promo',
                        notificationId: notification._id.toString(),
                        promoId: promo._id.toString(),
                        promoPayload,
                    },
                });
            }
        }

        const sent = await deliverExpoPushMessages(messages);
        console.log(`Promo push sent to ${sent} devices`);

        res.status(201).json({ ...promo.toObject(), notificationsSent: sent });
    } catch (err) {
        console.error('Create promo error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
