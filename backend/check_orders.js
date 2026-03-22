const path = require('path');
const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        console.log(`Checking orders between ${startOfMonth.toISOString()} and ${endOfMonth.toISOString()}`);
        
        const count = await Order.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        
        const orders = await Order.find({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $ne: 'Cancelled' }
        });
        
        const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);
        
        console.log(`Monthly Orders: ${count}`);
        console.log(`Monthly Revenue: ${revenue}`);
        
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
