const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const upload = require('../config/multer');

// Helper function untuk hapus file
const deleteFile = (filePath) => {
  try {
    // Skip jika default image
    if (filePath.includes('default-equipment')) {
      return;
    }
    
    // Konversi path dari URL ke filesystem path
    const fullPath = path.join(__dirname, '../public', filePath);
    
    // Cek file exists
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted old image: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to delete file: ${filePath}`, error.message);
  }
};

// ==================== GET ALL EQUIPMENT ====================
router.get('/api/all', async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      equipment,
      count: equipment.length
    });
  } catch (error) {
    console.error('Get all equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alat',
      error: error.message
    });
  }
});

// ==================== GET EQUIPMENT BY ID ====================
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
    console.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alat',
      error: error.message
    });
  }
});

// ==================== CREATE EQUIPMENT ====================
router.post('/api/create', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    
    // Validasi
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan harga wajib diisi'
      });
    }
    
    const equipmentData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || '',
      category: category || 'Lainnya',
      stock: parseInt(stock) || 1,
      available: true
    };
    
    // Jika ada upload gambar
    if (req.file) {
      equipmentData.image = '/uploads/' + req.file.filename;
    } else {
      equipmentData.image = '/uploads/default-equipment.jpg';
    }
    
    const equipment = await Equipment.create(equipmentData);
    
    console.log(`✅ Equipment created: ${equipment.name} (${equipment._id})`);
    
    res.status(201).json({
      success: true,
      message: 'Alat berhasil ditambahkan',
      equipment
    });
  } catch (error) {
    console.error('Create equipment error:', error);
    
    // Hapus uploaded file jika error
    if (req.file) {
      deleteFile('/uploads/' + req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan alat',
      error: error.message
    });
  }
});

// ==================== UPDATE EQUIPMENT ====================
router.put('/api/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, stock, available } = req.body;
    
    // Validasi
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan harga wajib diisi'
      });
    }
    
    // Cari equipment lama
    const oldEquipment = await Equipment.findById(req.params.id);
    
    if (!oldEquipment) {
      // Hapus uploaded file jika equipment tidak ditemukan
      if (req.file) {
        deleteFile('/uploads/' + req.file.filename);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Alat tidak ditemukan'
      });
    }
    
    const updateData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || '',
      category: category || 'Lainnya',
      stock: parseInt(stock) || 0,
      available: available === 'true' || available === true
    };
    
    // Jika ada upload gambar baru
    if (req.file) {
      updateData.image = '/uploads/' + req.file.filename;
      
      // Hapus gambar lama (kecuali default)
      if (oldEquipment.image) {
        deleteFile(oldEquipment.image);
      }
    }
    
    // Update equipment
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Equipment updated: ${equipment.name} (${equipment._id})`);
    
    res.json({
      success: true,
      message: 'Alat berhasil diupdate',
      equipment
    });
  } catch (error) {
    console.error('Update equipment error:', error);
    
    // Hapus uploaded file jika error
    if (req.file) {
      deleteFile('/uploads/' + req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate alat',
      error: error.message
    });
  }
});

// ==================== DELETE EQUIPMENT ====================
router.delete('/api/:id', isAuthenticated, async (req, res) => {
  try {
    // Cari equipment dulu untuk dapatkan image path
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Alat tidak ditemukan'
      });
    }
    
    // Hapus gambar (kecuali default)
    if (equipment.image) {
      deleteFile(equipment.image);
    }
    
    // Hapus dari database
    await Equipment.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Equipment deleted: ${equipment.name} (${equipment._id})`);
    
    res.json({
      success: true,
      message: 'Alat berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus alat',
      error: error.message
    });
  }
});

module.exports = router;
