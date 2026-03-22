const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const email = process.argv[2];

if (!email) {
    console.log('Please provide an email: node promote_admin.js your-email@example.com');
    process.exit(1);
}

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-app';

mongoose.connect(MONGO_URI)
    .then(async () => {
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { role: 'admin' },
            { new: true }
        );

        if (user) {
            console.log(`✅ Success! ${user.name} (${user.email}) is now an ADMIN.`);
            console.log('IMPORTANT: Logout and login again in the app to see the Admin Dashboard.');
        } else {
            console.log(`❌ User with email ${email} not found.`);
        }
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
