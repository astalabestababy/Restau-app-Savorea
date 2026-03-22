const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    category: {
        type: String, // e.g., 'Main', 'Dessert', 'Drink'
        required: false,
        default: 'Main'
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

MenuItemSchema.virtual('image').get(function() {
    return (this.images && this.images.length > 0) ? this.images[0] : '';
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
