const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama alat wajib diisi'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Harga sewa wajib diisi'],
    min: 0
  },
  image: {
    type: String,
    default: '/uploads/default-equipment.jpg'
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Tenda', 'Carrier', 'Sleeping Bag', 'Kompor', 'Aksesoris', 'Lainnya'],
    default: 'Lainnya'
  },
  stock: {
    type: Number,
    default: 1,
    min: 0
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Equipment', equipmentSchema);
