const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const envPath = path.join(__dirname, '.env');
const envResult = require('dotenv').config({ path: envPath });
if (envResult.error) {
    console.warn('[dotenv] Could not load %s: %s', envPath, envResult.error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.get('Origin') || 'N/A'}`);
    next();
});
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Diagnostic Endpoint
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'Savorea API is running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

/** Mongo connectivity (for debugging app ↔ API ↔ Atlas) */
app.get('/api/health/db', async (req, res) => {
    const s = mongoose.connection.readyState;
    const labels = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    let menuItems = null;
    if (s === 1 && mongoose.connection.db) {
        try {
            menuItems = await mongoose.connection.db.collection('menuitems').countDocuments();
        } catch (e) {
            menuItems = -1;
        }
    }
    res.json({
        mongo: labels[s] ?? s,
        readyState: s,
        database: mongoose.connection.db?.databaseName ?? null,
        menuItems,
    });
});

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri || !String(mongoUri).trim()) {
    console.error('❌ MONGODB_URI is missing or empty. Set it in backend/.env');
    process.exit(1);
}

const mongoOptions = {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
};
if (process.env.MONGODB_DB_NAME && String(process.env.MONGODB_DB_NAME).trim()) {
    mongoOptions.dbName = process.env.MONGODB_DB_NAME.trim();
}

mongoose.connect(mongoUri, mongoOptions)
    .then(async () => {
        console.log('✅ MongoDB connected successfully');
        console.log('   Database:', mongoose.connection.db?.databaseName);
        try {
            const n = await mongoose.connection.db.collection('menuitems').countDocuments();
            console.log('   Menu items in this database:', n);
            if (n === 0) {
                console.log('   ⚠️  No menu rows here. If you used MONGODB_DB_NAME before, data may be in another DB.');
                console.log('      Seed this DB: npm run seed (with server running) or POST /api/seed');
            }
        } catch (_) { /* ignore */ }
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:');
        console.error(err.message);
        if (err.message && /replicaSet|Server selection timed out/i.test(err.message)) {
            console.error(
                '   Hint: copy the connection string from Atlas (Connect → Drivers). ' +
                'replicaSet must match your cluster; hostnames use ac-<id>-shard-00-00.'
            );
        }
    });

mongoose.connection.on('error', err => {
    console.error('🔥 Mongoose runtime error:', err);
});

// Routes
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const Order = require('./models/Order');
const Review = require('./models/Review');
const authController = require('./controllers/authController');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config/jwt');

// Auth Middleware
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

// Avatar uploads (shared: optional photo on register + authenticated profile avatar)
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, 'avatar-' + Date.now() + ext);
    }
});
const avatarUpload = multer({ storage: avatarStorage });

// Auth Routes (register uses JSON only; optional avatarBase64 string — avoids RN multipart body issues)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.put('/api/auth/profile', auth, authController.updateProfile);
app.put('/api/auth/push-token', auth, authController.updatePushToken);
app.get('/api/user/stats', auth, authController.getUserStats);

// Order Routes
app.use('/api/orders', orderRoutes);
// Review Routes
app.use('/api/reviews', reviewRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Aggregate ratings per product name from order reviews
app.get('/api/ratings', async (req, res) => {
    try {
        const { itemName } = req.query;

        if (itemName) {
            const itemReviews = await Review.find({ itemName })
                .select('itemName rating comment user userName createdAt')
                .populate('user', 'name');

            const total = itemReviews.reduce((sum, r) => sum + r.rating, 0);
            const reviewCount = itemReviews.length;
            const reviews = itemReviews.map(r => ({
                _id: r._id,
                rating: r.rating,
                comment: r.comment,
                user: r.user ? r.user._id.toString() : r.user?.toString(),
                userName: r.userName || r.user?.name || 'User',
                createdAt: r.createdAt
            }));

            return res.json({
                name: itemName,
                averageRating: reviewCount ? Number((total / reviewCount).toFixed(2)) : 0,
                reviewCount,
                reviews
            });
        }

        const reviews = await Review.find()
            .select('itemName rating comment user userName createdAt')
            .populate('user', 'name');

        const stats = {};
        reviews.forEach(r => {
            const key = r.itemName;
            if (!stats[key]) stats[key] = { total: 0, count: 0, reviews: [] };
            stats[key].total += r.rating;
            stats[key].count += 1;
            stats[key].reviews.push({
                _id: r._id,
                rating: r.rating,
                comment: r.comment,
                user: r.user ? r.user._id.toString() : r.user?.toString(),
                userName: r.userName || r.user?.name || 'User',
                createdAt: r.createdAt
            });
        });

        const result = Object.entries(stats).map(([name, s]) => ({
            name,
            averageRating: s.count ? Number((s.total / s.count).toFixed(2)) : 0,
            reviewCount: s.count,
            reviews: s.reviews
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.post('/api/seed', async (req, res) => {
    if (process.env.ENABLE_PUBLIC_SEED !== 'true') {
        return res.status(403).json({ message: 'Seed route is disabled for deployment.' });
    }

    try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const getCloudinaryUrl = (publicId) => `https://res.cloudinary.com/${cloudName}/image/upload/restaurant_menu/${publicId}.jpg`;

        const seedData = [
            // --- MAINS ---
            {
                name: 'Adobo',
                description: 'Arguably the most iconic Filipino dish, often considered the unofficial national dish. It is a savory stew of meat marinated in vinegar, soy sauce, garlic, bay leaves, and peppercorns.',
                price: 120.00,
                category: 'Main',
                  images: ['https://images.pexels.com/photos/6896058/pexels-photo-6896058.jpeg?cs=srgb&dl=pexels-eiliv-aceron-29416110-6896058.jpg&fm=jpg'],
            },
            {
                name: 'Sinigang',
                description: 'A beloved sour soup and comfort food staple. It typically features meat or seafood cooked with leafy greens, tomatoes, onions, eggplant, and okra.',
                price: 150.00,
                category: 'Main',
                  images: ['https://images.pexels.com/photos/7024389/pexels-photo-7024389.jpeg?cs=srgb&dl=pexels-gansx-7024389.jpg&fm=jpg'],
            },
            {
                name: 'Lechon',
                description: 'A whole roasted pig and the ultimate celebratory centerpiece in Filipino culture. Prepared by slowly rotating the pig over an open charcoal fire.',
                price: 550.00,
                category: 'Main',
                  images: ['https://upload.wikimedia.org/wikipedia/commons/7/7e/Lechon_Baboy_sa_Sugbo_Mercado.jpg'],
            },
            {
                name: 'Sisig',
                description: 'A legendary culinary creation from Pampanga. This savory and spicy dish is made from grilled and chopped pig cheeks and liver.',
                price: 180.00,
                category: 'Main',
                  images: ['https://images.pexels.com/photos/30355484/pexels-photo-30355484.jpeg?cs=srgb&dl=pexels-mark-john-hilario-264144764-30355484.jpg&fm=jpg'],
            },
            {
                name: 'Kare-Kare',
                description: 'A distinctive Filipino stew in a thick, savory peanut sauce. Best appreciated when paired with bagoong (sautéed shrimp paste).',
                price: 220.00,
                category: 'Main',
                  images: ['https://upload.wikimedia.org/wikipedia/commons/5/5a/Kare-kare.jpg'],
            },
            {
                name: 'Crispy Pata',
                description: 'Deep-fried pork knuckles celebrated for their incredibly crunchy exterior and tender, melt-in-your-mouth meat.',
                price: 450.00,
                category: 'Main',
                  images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Crispy_pata.jpg/960px-Crispy_pata.jpg'],
            },
            {
                name: 'Lumpia Shanghai',
                description: 'The most popular Filipino-style spring rolls. These golden, crispy treats are filled with a savory mixture of ground meat and spices.',
                price: 100.00,
                category: 'Main',
                  images: ['https://upload.wikimedia.org/wikipedia/commons/6/67/Lumpia_Shanghai%2C_May_2025.jpg'],
            },
            {
                name: 'Bicol Express',
                description: 'A famously fiery stew from the Bicol region. This creamy but spicy dish features pork cooked in rich coconut milk with shrimp paste.',
                price: 140.00,
                category: 'Main',
                  images: ['https://upload.wikimedia.org/wikipedia/commons/e/e8/Bicol_Express.jpg'],
            },
            {
                name: 'Pancit Canton',
                description: 'A classic Filipino noodle dish stir-fried with meat, seafood, and a vibrant assortment of vegetables.',
                price: 110.00,
                category: 'Main',
                  images: ['https://upload.wikimedia.org/wikipedia/commons/f/f0/Pancit_canton.jpg'],
            },
            {
                name: 'Bulalo',
                description: 'A comforting and rich beef shank soup native to the Southern Luzon region. Slow-cooked for hours until the bone marrow is tender.',
                price: 280.00,
                category: 'Main',
                  images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Bulalo_%28Beef_stew_-_Philippines%29.jpg/330px-Bulalo_%28Beef_stew_-_Philippines%29.jpg'],
            },

            // --- DESSERTS ---
            {
                name: 'Halo-Halo',
                description: 'The ultimate Filipino cold dessert, meaning "mix-mix". A vibrant layers of crushed ice, evaporated milk, and various sweets.',
                price: 95.00,
                category: 'Dessert',
                images: [getCloudinaryUrl('halohalo')],
            },
            {
                name: 'Leche Flan',
                description: 'A rich, creamy Filipino custard dessert with a luscious golden caramel glaze.',
                price: 70.00,
                category: 'Dessert',
                images: [getCloudinaryUrl('lecheflan')],
            },
            {
                name: 'Ube Halaya',
                description: 'A vibrant purple yam jam made from boiled and mashed ube, coconut milk, and butter.',
                price: 120.00,
                category: 'Dessert',
                images: [getCloudinaryUrl('ubehalaya')],
            },
            {
                name: 'Buko Pie',
                description: 'A traditional Filipino baked young coconut pie from the province of Laguna.',
                price: 150.00,
                category: 'Dessert',
                images: [getCloudinaryUrl('bukopie')],
            },
            {
                name: 'Turon',
                description: 'A beloved Filipino street food snack. Saba bananas wrapped in a lumpia wrapper and deep-fried until caramelized.',
                price: 25.00,
                category: 'Dessert',
                images: [getCloudinaryUrl('turon')],
            },
            {
                name: 'Bibingka',
                description: 'A traditional Filipino baked rice cake, especially popular during the Christmas season.',
                price: 60.00,
                category: 'Dessert',
                images: [getCloudinaryUrl('bibingka')],
            },
            {
                name: 'Sapin-Sapin',
                description: 'A visually striking and delicious layered sticky rice cake with vibrant colors.',
                price: 50.00,
                category: 'Dessert',
                images: [getCloudinaryUrl('sapinsapin')],
            },

            // --- DRINKS ---
            {
                name: 'Calamansi Juice',
                description: 'A quintessential Filipino refreshment made from the native calamansi citrus.',
                price: 40.00,
                category: 'Drink',
                images: [getCloudinaryUrl('calamansijuice')],
            },
            {
                name: 'Sago\'t Gulaman',
                description: 'A classic Filipino street-style beverage with brown sugar syrup, sago pearls, and gulaman jelly.',
                price: 35.00,
                category: 'Drink',
                images: [getCloudinaryUrl('sagogulaman')],
            },
            {
                name: 'Buko Juice',
                description: 'The pure, natural water of young green coconuts—a tropical staple.',
                price: 50.00,
                category: 'Drink',
                images: [getCloudinaryUrl('bukojuice')],
            },
            {
                name: 'Kapeng Barako',
                description: 'A strong, aromatic coffee varietal primarily grown in the provinces of Batangas and Cavite.',
                price: 45.00,
                category: 'Drink',
                images: [getCloudinaryUrl('kapengbarako')],
            },
            {
                name: 'Tsokolate',
                description: 'A traditional Filipino thick hot chocolate made from pure roasted cacao beans (tablea).',
                price: 65.00,
                category: 'Drink',
                images: [getCloudinaryUrl('tsokolate')],
            },
            {
                name: 'San Miguel Beer',
                description: 'The world-famous iconic Filipino pilsner since 1890.',
                price: 70.00,
                category: 'Drink',
                images: [getCloudinaryUrl('sanmiguel')],
            },
            {
                name: 'Lambanog',
                description: 'A potent and traditional Filipino spirit distilled from the nectar of coconut flowers.',
                price: 150.00,
                category: 'Drink',
                images: [getCloudinaryUrl('lambanog')],
            }
        ];

        await MenuItem.deleteMany({});
        await MenuItem.insertMany(seedData);
        res.json({ message: 'Database seeded with Cloudinary images for all Filipino food!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/auth/avatar', auth, avatarUpload.single('avatar'), authController.updateAvatar);
app.listen(PORT, '0.0.0.0', () => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    console.log(`Server running on port ${PORT}`);
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`Network Interface [${name}]: http://${net.address}:${PORT}`);
            }
        }
    }
});
