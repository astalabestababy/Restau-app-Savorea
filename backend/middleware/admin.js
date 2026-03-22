const jwt = require('jsonwebtoken');
const User = require('../models/User');

const admin = async (req, res, next) => {
    try {
        // req.user is set by the auth middleware
        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated.' });
        }

        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error in admin middleware' });
    }
};

module.exports = admin;
