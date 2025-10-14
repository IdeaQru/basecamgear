const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const upload = require('../config/multer');

// Get all equipment
router.get('/api/all', async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alat',
      error: error.message
    });
  }
});

// Get equipment by ID
router.get('/api/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Alat tidak ditemukan'
      });
    }
    res.json({
      success: true,
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alat',
      error: error.message
    });
  }
});

// Create new equipment (Protected - Admin only)
router.post('/api/create', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    
    const equipmentData = {
      name,
      price: parseFloat(price),
      description: description || '',
      category: category || 'Lainnya',
      stock: parseInt(stock) || 1,
      available: true
    };
    
    // Jika ada upload gambar
    if (req.file) {
      equipmentData.image = '/uploads/' + req.file.filename;
    }
    
    const equipment = await Equipment.create(equipmentData);
    
    res.status(201).json({
      success: true,
      message: 'Alat berhasil ditambahkan',
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan alat',
      error: error.message
    });
  }
});

// Update equipment (Protected - Admin only)
router.put('/api/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, stock, available } = req.body;
    
    const updateData = {
      name,
      price: parseFloat(price),
      description,
      category,
      stock: parseInt(stock),
      available: available === 'true' || available === true
    };
    
    // Jika ada upload gambar baru
    if (req.file) {
      updateData.image = '/uploads/' + req.file.filename;
    }
    
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Alat tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Alat berhasil diupdate',
      equipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate alat',
      error: error.message
    });
  }
});

// Delete equipment (Protected - Admin only)
router.delete('/api/:id', isAuthenticated, async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Alat tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Alat berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus alat',
      error: error.message
    });
  }
});

module.exports = router;
