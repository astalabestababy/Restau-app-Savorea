const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const inspectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const collection = db.collection('menuitems');
        const items = await collection.find({}).toArray();
        console.log(JSON.stringify(items.slice(0, 1), null, 2));
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

inspectDb();
