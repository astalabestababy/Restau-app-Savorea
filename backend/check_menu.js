const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkMenu = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const menuItems = await MenuItem.find({});
        console.log(`\n--- Menu Items (${menuItems.length}) ---`);
        if (menuItems.length > 0) {
            console.log('First 5 items:');
            menuItems.slice(0, 5).forEach(item => {
                console.log(`- ${item.name} (${item.category}): P${item.price}`);
            });
        } else {
            console.log('No menu items found.');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkMenu();
