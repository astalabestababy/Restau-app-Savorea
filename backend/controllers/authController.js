const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const emailService = require('../services/emailService');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Register User (JSON body; optional avatarBase64 — avoids React Native multipart losing text fields)
exports.register = async (req, res) => {
    try {
        const { name, email, password, avatarBase64 } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check user
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Create verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        user = new User({
            name,
            email,
            password,
            verificationCode
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(String(password), salt);

        if (avatarBase64 && typeof avatarBase64 === 'string' && avatarBase64.length > 0) {
            let tmpPath = null;
            try {
                const buf = Buffer.from(avatarBase64, 'base64');
                if (buf.length > 6 * 1024 * 1024) {
                    return res.status(400).json({ message: 'Profile image is too large (max 6MB)' });
                }
                const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
                if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                tmpPath = path.join(uploadsDir, `reg-${Date.now()}.jpg`);
                fs.writeFileSync(tmpPath, buf);
                const result = await cloudinary.uploader.upload(tmpPath, {
                    folder: 'avatars',
                    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
                });
                user.avatar = result.secure_url;
            } catch (uploadErr) {
                console.error('Register avatar upload:', uploadErr);
            } finally {
                try {
                    if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
                } catch (e) { /* ignore */ }
            }
        }

        await user.save();

        // Send Real Email
        const emailSent = await emailService.sendVerificationEmail(email, verificationCode);

        // Fallback LOG TO TERMINAL (In case email fails or for quick debugging)
        console.log('-----------------------------------------');
        console.log(`NEW USER REGISTERED: ${email}`);
        console.log(`VERIFICATION CODE: [ ${verificationCode} ]`);
        console.log(`EMAIL SENT STATUS: ${emailSent ? 'SUCCESS' : 'FAILED'}`);
        console.log('-----------------------------------------');

        res.status(201).json({
            message: emailSent
                ? 'User registered. Please check your email for the verification code.'
                : 'User registered. (Email failed to send, check console for code).',
            email: user.email
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Verify Code
exports.verify = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.isActive) return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
        if (user.verificationCode !== code) return res.status(400).json({ message: 'Invalid code' });

        user.isVerified = true;
        user.verificationCode = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Email verified successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                address: user.address,
                phoneNumber: user.phoneNumber,
                role: user.role,
                isActive: user.isActive,
                avatar: user.avatar ?? null
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        if (!user.isActive) return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
        if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email first', email: user.email });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                address: user.address,
                phoneNumber: user.phoneNumber,
                role: user.role,
                isActive: user.isActive,
                avatar: user.avatar ?? null
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, address, phoneNumber } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (address) user.address = address;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Push Token
exports.updatePushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.pushToken = pushToken;
        await user.save();
        
        res.json({ message: 'Push token updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get User Stats
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Total Orders
        const totalOrders = await Order.countDocuments({ user: userId });

        // Pending Orders
        const pendingOrders = await Order.countDocuments({ user: userId, status: 'Pending' });

        // Completed Orders (Delivered or Cancelled? Assuming Delivered as completed)
        const completedOrders = await Order.countDocuments({ user: userId, status: 'Delivered' });

        // Total Spent (sum of delivered orders)
        const completedOrderList = await Order.find({ user: userId, status: 'Delivered' });
        const totalSpent = completedOrderList.reduce((total, order) => total + order.totalAmount, 0);

        res.json({
            totalOrders,
            pendingOrders,
            completedOrders,
            totalSpent
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Avatar (file upload handled by multer in server)
exports.updateAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars',
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
        });

        user.avatar = result.secure_url;
        await user.save();

        // Clean up local file
        fs.unlinkSync(req.file.path);

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
