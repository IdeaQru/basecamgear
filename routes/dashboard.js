const express = require('express');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');
const RentalOrder = require('../models/RentalOrder');
const router = express.Router();

// Dashboard page (protected)
router.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

// API untuk mendapatkan data user yang login
router.get('/api/user', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

// API untuk mendapatkan semua pesanan
router.get('/api/orders', isAuthenticated, async (req, res) => {
  try {
    const orders = await RentalOrder.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pesanan'
    });
  }
});

// API untuk CREATE pesanan baru (Multiple Items)
router.post('/api/orders/create', isAuthenticated, async (req, res) => {
  try {
    const { name, phone, email, items, startDate, endDate, totalDays, totalPrice, notes, status } = req.body;
    
    // Log untuk debugging
    console.log('Received order data:', { name, phone, email, items, startDate, endDate, totalDays, totalPrice });
    
    // Validasi
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan nomor telepon wajib diisi'
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Belum ada alat yang dipilih'
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal sewa wajib diisi'
      });
    }
    
    // Generate order number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const orderNumber = `ORD-${timestamp}-${randomNum}`;
    
    // Hitung total days jika tidak dikirim
    let calculatedTotalDays = totalDays || 1;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      calculatedTotalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (calculatedTotalDays < 1) calculatedTotalDays = 1;
    }
    
    // Hitung total price jika tidak dikirim
    let calculatedTotalPrice = totalPrice || 0;
    if (!totalPrice && items.length > 0) {
      const dailyTotal = items.reduce((sum, item) => {
        return sum + ((item.equipmentPrice || 0) * (item.quantity || 1));
      }, 0);
      calculatedTotalPrice = dailyTotal * calculatedTotalDays;
    }
    
    // Pastikan semua item punya subtotal
    const itemsWithSubtotal = items.map(item => ({
      equipmentId: item.equipmentId,
      equipmentName: item.equipmentName,
      equipmentImage: item.equipmentImage || '/uploads/default-equipment.jpg',
      equipmentPrice: item.equipmentPrice || 0,
      quantity: item.quantity || 1,
      subtotal: item.subtotal || ((item.equipmentPrice || 0) * (item.quantity || 1) * calculatedTotalDays)
    }));
    
    const newOrder = await RentalOrder.create({
      orderNumber,
      name,
      phone,
      email: email || '',
      items: itemsWithSubtotal,
      startDate,
      endDate,
      totalDays: calculatedTotalDays,
      totalPrice: calculatedTotalPrice,
      notes: notes || '',
      status: status || 'Menunggu Konfirmasi'
    });
    
    console.log('Order created successfully:', newOrder._id);
    
    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil ditambahkan',
      order: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan pesanan: ' + error.message,
      error: error.message
    });
  }
});

// API untuk UPDATE status pesanan (route spesifik harus di atas :id)
router.put('/api/orders/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await RentalOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Status pesanan berhasil diupdate',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal update status'
    });
  }
});

// API untuk UPDATE pesanan lengkap (Admin)
router.put('/api/orders/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, phone, email, items, startDate, endDate, totalDays, totalPrice, notes, status } = req.body;
    
    const updateData = {
      name,
      phone,
      email,
      items,
      startDate,
      endDate,
      totalDays: parseInt(totalDays),
      totalPrice: parseFloat(totalPrice),
      notes,
      status
    };
    
    const order = await RentalOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Pesanan berhasil diupdate',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate pesanan',
      error: error.message
    });
  }
});

// API untuk DELETE pesanan
router.delete('/api/orders/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await RentalOrder.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Pesanan berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus pesanan'
    });
  }
});

module.exports = router;
