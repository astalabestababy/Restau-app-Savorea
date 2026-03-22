const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const admins = await User.find({ role: 'admin' });
        console.log('\n--- Admin Accounts ---');
        if (admins.length > 0) {
            admins.forEach(admin => {
                console.log(`Email: ${admin.email}, Name: ${admin.name}, ID: ${admin._id}`);
            });
        } else {
            console.log('No admin accounts found.');
        }

        const users = await User.find({});
        console.log('\n--- All Users ---');
        users.forEach(user => {
            console.log(`Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkAdmin();
