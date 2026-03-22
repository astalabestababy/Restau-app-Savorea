const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'admin@restaurant.com';
        const password = 'admin123';

        // Check if exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('Admin user already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            user.role = 'admin';
            user.isVerified = true;
            user.isActive = true;
            await user.save();
            console.log('Admin user updated.');
        } else {
            console.log('Creating new admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                name: 'System Admin',
                email,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                isActive: true,
                phoneNumber: '09123456789',
                address: 'Restaurant HQ'
            });

            await user.save();
            console.log('Admin user created.');
        }

        console.log('-----------------------------------');
        console.log('Email: ' + email);
        console.log('Password: ' + password);
        console.log('-----------------------------------');

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

createAdmin();
