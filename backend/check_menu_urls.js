const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkMenuUrls = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const menuItems = await MenuItem.find({});
        console.log(`\n--- Menu Items (${menuItems.length}) ---`);
        menuItems.forEach(item => {
            console.log(`- ${item.name} (${item.category}): ${item.images && item.images.length > 0 ? item.images[0] : 'No image URL'}`);
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkMenuUrls();
