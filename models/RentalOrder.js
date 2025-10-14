const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  equipmentName: {
    type: String,
    required: true
  },
  equipmentImage: {
    type: String,
    default: '/uploads/default-equipment.jpg'
  },
  equipmentPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const rentalOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  items: [orderItemSchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Menunggu Konfirmasi', 'Dikonfirmasi', 'Sedang Disewa', 'Selesai', 'Dibatalkan'],
    default: 'Menunggu Konfirmasi'
  }
}, {
  timestamps: true
});

// Generate order number sebelum save
rentalOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    this.orderNumber = `ORD-${timestamp}-${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('RentalOrder', rentalOrderSchema);
