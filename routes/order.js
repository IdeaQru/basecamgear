const express = require('express');
const path = require('path');
const RentalOrder = require('../models/RentalOrder');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'order.html'));
});

router.post('/submit', async (req, res) => {
  try {
    const { name, phone, email, items, startDate, endDate, totalDays, totalPrice, notes } = req.body;
    
    if (!name || !phone || !items || items.length === 0 || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data tidak lengkap. Pastikan semua field wajib terisi.' 
      });
    }
    
    // Generate order number manually
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const orderNumber = `ORD-${timestamp}-${randomNum}`;
    
    const newOrder = await RentalOrder.create({
      orderNumber, // Tambahkan ini
      name,
      phone,
      email: email || '',
      items,
      startDate,
      endDate,
      totalDays: parseInt(totalDays),
      totalPrice: parseFloat(totalPrice),
      notes: notes || '',
      status: 'Menunggu Konfirmasi'
    });
    
    res.json({ 
      success: true, 
      message: 'Pesanan berhasil diterima!',
      order: newOrder
    });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan pesanan: ' + error.message
    });
  }
});

module.exports = router;
