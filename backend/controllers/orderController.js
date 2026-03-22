const Order = require('../models/Order');
const PDFDocument = require('pdfkit');

exports.createOrder = async (req, res) => {
    try {
        const { items, totalAmount, address, paymentMethod } = req.body;
        const newOrder = new Order({
            user: req.user.id,
            items,
            totalAmount,
            address,
            paymentMethod: paymentMethod || 'COD'
        });

        const order = await newOrder.save();
        res.status(201).json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.generateReceipt = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${order._id}.pdf`);

        doc.pipe(res);

        // --- Styling Constants ---
        const primaryColor = '#D72323'; // Restaurant Theme Red
        const secondaryColor = '#444444';
        const lineColor = '#E0E0E0';
        
        // --- Header Section ---
        doc.rect(0, 0, 612, 100).fill(primaryColor); // Top Banner Background
        
        doc.fontSize(24)
           .fillColor('white')
           .font('Helvetica-Bold')
           .text('Savorea', 50, 40, { align: 'left' });
           
        doc.fontSize(10)
           .font('Helvetica')
           .text('OFFICIAL RECEIPT', 50, 70, { align: 'left' });

        doc.fontSize(10)
           .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 40, { align: 'right' });
        doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`, 400, 55, { align: 'right' });
        doc.text(`Order ID: #${order._id.toString().slice(-6).toUpperCase()}`, 400, 70, { align: 'right' });

        doc.moveDown(4); // Move past the header banner

        // --- Customer Info ---
        doc.fillColor(secondaryColor);
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 130);
        doc.fontSize(10).font('Helvetica')
           .text(order.user.name, 50, 150)
           .text(order.user.email, 50, 165)
           .text(order.address, 50, 180);

        // --- Payment Info ---
        doc.fontSize(12).font('Helvetica-Bold').text('Payment Details:', 350, 130);
        doc.fontSize(10).font('Helvetica')
           .text(`Method: ${order.paymentMethod}`, 350, 150)
           .text(`Status: ${order.status}`, 350, 165);

        // --- Items Table ---
        const tableTop = 230;
        const itemX = 50;
        const qtyX = 320;
        const priceX = 390;
        const totalX = 490;

        // Table Header Background
        doc.rect(50, tableTop - 10, 500, 25).fill('#F5F5F5');
        
        // Table Headers
        doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(10);
        doc.text('ITEM DESCRIPTION', itemX + 10, tableTop);
        doc.text('QTY', qtyX, tableTop, { align: 'center', width: 40 });
        doc.text('PRICE', priceX, tableTop, { align: 'right', width: 60 });
        doc.text('TOTAL', totalX, tableTop, { align: 'right', width: 60 });

        // Table Rows
        let y = tableTop + 30;
        doc.font('Helvetica').fontSize(10);
        
        order.items.forEach((item, i) => {
            // Check for page break
            if (y > 700) {
                doc.addPage();
                y = 50; // Reset y for new page
            }

            // Alternating row color
            if (i % 2 === 0) {
                doc.rect(50, y - 5, 500, 20).fill('#FAFAFA');
            }
            
            doc.fillColor(secondaryColor);
            doc.text(item.name, itemX + 10, y);
            doc.text(item.quantity.toString(), qtyX, y, { align: 'center', width: 40 });
            doc.text(item.price.toFixed(2), priceX, y, { align: 'right', width: 60 });
            doc.text((item.quantity * item.price).toFixed(2), totalX, y, { align: 'right', width: 60 });
            
            y += 25;
        });

        // Line before totals
        doc.moveTo(50, y).lineTo(550, y).strokeColor(lineColor).stroke();
        y += 15;

        // --- Totals Section ---
        const totalSectionX = 350;
        
        // Check if totals fit on page
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
        
        doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor);
        doc.text('GRAND TOTAL', totalSectionX, y);
        doc.text(`P ${order.totalAmount.toFixed(2)}`, totalSectionX + 100, y, { align: 'right', width: 100 });

        y += 40; // Add spacing before footer

        // --- Footer ---
        // Ensure footer fits
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        doc.moveTo(50, y).lineTo(550, y).strokeColor(lineColor).stroke();
        y += 15;
        
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#888888');
        doc.text('Thank you for dining with us!', 50, y, { align: 'center', width: 500 });
        doc.text('For questions, contact support@savorea.com', 50, y + 15, { align: 'center', width: 500 });
        doc.text('This is a computer-generated document. No signature required.', 50, y + 30, { align: 'center', width: 500 });

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
