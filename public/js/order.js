// ==================== GLOBAL VARIABLES ====================
let cart = [];
let allEquipment = [];
let currentCategory = 'all';

// WhatsApp Configuration
const WHATSAPP_NUMBER = '6283131251615';

// ==================== MOBILE MENU TOGGLE ====================
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const toggle = document.querySelector('.mobile-menu-toggle');
  
  if (navLinks && toggle) {
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (navLinks.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  const navLinks = document.querySelector('.nav-links');
  const toggle = document.querySelector('.mobile-menu-toggle');
  
  if (navLinks && toggle && navLinks.classList.contains('active')) {
    if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
      navLinks.classList.remove('active');
      toggle.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }
});

// ==================== WHATSAPP FUNCTIONS ====================
function generateWhatsAppMessage(orderData, orderNumber) {
  const items = orderData.items.map((item, index) => 
    `${index + 1}. ${item.equipmentName} (${item.quantity}x) - Rp ${item.subtotal.toLocaleString('id-ID')}`
  ).join('\n');
  
  const message = `
🏕️ *PESANAN BARU - BASECAMP GEAR*

📋 *Detail Pesanan*
Nomor Pesanan: ${orderNumber}
Tanggal Pesan: ${new Date().toLocaleString('id-ID')}

👤 *Data Penyewa*
Nama: ${orderData.name}
Telepon: ${orderData.phone}
Email: ${orderData.email || '-'}

📅 *Periode Sewa*
Tanggal Ambil: ${formatWhatsAppDate(orderData.startDate)}
Tanggal Kembali: ${formatWhatsAppDate(orderData.endDate)}
Durasi: ${orderData.totalDays} hari

🛒 *Peralatan Disewa*
${items}

💰 *Total Pembayaran*
Rp ${orderData.totalPrice.toLocaleString('id-ID')}

${orderData.notes ? `📝 *Catatan:*\n${orderData.notes}\n\n` : ''}---
Mohon konfirmasi pesanan ini.
Terima kasih! 🙏
  `.trim();
  
  return encodeURIComponent(message);
}

function formatWhatsAppDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  window.open(url, '_blank');
}

// ==================== CATALOG FUNCTIONS ====================
async function loadEquipmentCatalog() {
  try {
    showLoadingSpinner(true);
    
    const response = await fetch('/equipment/api/all');
    const data = await response.json();
    
    if (data.success) {
      allEquipment = data.equipment;
      displayCatalog(allEquipment);
    } else {
      throw new Error(data.message || 'Gagal memuat katalog');
    }
  } catch (error) {
    console.error('Error loading catalog:', error);
    document.getElementById('equipmentCatalog').innerHTML = `
      <div class="error-state">
        <div class="error-icon">❌</div>
        <p class="error-message">Gagal memuat katalog. Silakan refresh halaman.</p>
        <button class="btn-retry" onclick="loadEquipmentCatalog()">🔄 Coba Lagi</button>
      </div>
    `;
  } finally {
    showLoadingSpinner(false);
  }
}

function showLoadingSpinner(show) {
  const catalog = document.getElementById('equipmentCatalog');
  if (show && catalog) {
    catalog.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Memuat katalog...</p>
      </div>
    `;
  }
}

function displayCatalog(equipment) {
  const catalog = document.getElementById('equipmentCatalog');
  
  if (!catalog) return;
  
  if (equipment.length === 0) {
    catalog.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p class="empty-message">Tidak ada alat tersedia untuk kategori ini.</p>
      </div>
    `;
    return;
  }
  
  catalog.innerHTML = equipment.map((item, index) => {
    const isOutOfStock = !item.available || item.stock === 0;
    const stockStatus = isOutOfStock 
      ? '<span class="stock-badge out-of-stock">❌ Habis</span>' 
      : '<span class="stock-badge in-stock">✅ Tersedia</span>';
    
    return `
      <div class="catalog-card" data-category="${item.category}">
        <img src="${item.image}" alt="${item.name}" class="catalog-image" 
             onerror="this.src='/uploads/default-equipment.jpg'" loading="lazy">
        <div class="catalog-content">
          <div class="catalog-header">
            <span class="catalog-category">${item.category}</span>
            ${stockStatus}
          </div>
          <h4>${item.name}</h4>
          <p class="catalog-price">Rp ${item.price.toLocaleString('id-ID')}<span class="price-unit">/hari</span></p>
          <p class="catalog-stock">📦 Stok: <strong>${item.stock} unit</strong></p>
          ${item.description ? `<p class="catalog-description">${item.description}</p>` : ''}
          
          ${!isOutOfStock ? `
            <div class="quantity-selector">
              <button type="button" onclick="decreaseQty(${index})" aria-label="Kurangi jumlah">−</button>
              <input type="number" id="qty-${index}" value="1" min="1" max="${item.stock}" readonly aria-label="Jumlah ${item.name}">
              <button type="button" onclick="increaseQty(${index})" aria-label="Tambah jumlah">+</button>
            </div>
            
            <button class="btn-add-cart" onclick="addToCart('${item._id}', ${index})" aria-label="Tambah ${item.name} ke keranjang">
              <span class="btn-cart-icon">🛒</span>
              <span class="btn-cart-text">Tambah ke Keranjang</span>
            </button>
          ` : `
            <button class="btn-add-cart" disabled aria-label="Stok habis">
              <span class="btn-cart-icon">❌</span>
              <span class="btn-cart-text">Stok Habis</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(category) {
  currentCategory = category;
  
  const filtered = category === 'all' 
    ? allEquipment 
    : allEquipment.filter(item => item.category === category);
  
  displayCatalog(filtered);
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Smooth scroll to catalog
  const catalog = document.getElementById('equipmentCatalog');
  if (catalog) {
    catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // Add haptic feedback on mobile
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(10);
  }
}

// ==================== QUANTITY CONTROLS ====================
function increaseQty(index) {
  const input = document.getElementById(`qty-${index}`);
  if (!input) return;
  
  const max = parseInt(input.getAttribute('max'));
  const currentValue = parseInt(input.value);
  
  if (currentValue < max) {
    input.value = currentValue + 1;
    
    // Add visual feedback
    input.style.transform = 'scale(1.1)';
    setTimeout(() => {
      input.style.transform = 'scale(1)';
    }, 200);
    
    // Haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  } else {
    // Show toast when reaching max
    showToast(`Maksimal ${max} unit`, 'warning');
  }
}

function decreaseQty(index) {
  const input = document.getElementById(`qty-${index}`);
  if (!input) return;
  
  const currentValue = parseInt(input.value);
  
  if (currentValue > 1) {
    input.value = currentValue - 1;
    
    // Add visual feedback
    input.style.transform = 'scale(0.9)';
    setTimeout(() => {
      input.style.transform = 'scale(1)';
    }, 200);
    
    // Haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  }
}

// ==================== CART FUNCTIONS ====================
function addToCart(equipmentId, index) {
  const equipment = allEquipment.find(e => e._id === equipmentId);
  const quantityInput = document.getElementById(`qty-${index}`);
  
  if (!equipment || !quantityInput) {
    showToast('❌ Alat tidak ditemukan', 'error');
    return;
  }
  
  const quantity = parseInt(quantityInput.value);
  
  // Check stock availability
  if (quantity > equipment.stock) {
    showToast(`⚠️ Stok ${equipment.name} tidak mencukupi`, 'warning');
    return;
  }
  
  // Check if item already in cart
  const existingIndex = cart.findIndex(item => item.equipmentId === equipmentId);
  
  if (existingIndex >= 0) {
    const newQuantity = cart[existingIndex].quantity + quantity;
    if (newQuantity > equipment.stock) {
      showToast(`⚠️ Maksimal ${equipment.stock} unit untuk ${equipment.name}`, 'warning');
      return;
    }
    cart[existingIndex].quantity = newQuantity;
    showToast(`✅ ${equipment.name} (+${quantity}) ditambahkan`, 'success');
  } else {
    cart.push({
      equipmentId: equipment._id,
      equipmentName: equipment.name,
      equipmentImage: equipment.image,
      equipmentPrice: equipment.price,
      quantity: quantity
    });
    showToast(`✅ ${equipment.name} (${quantity}x) ditambahkan!`, 'success');
  }
  
  // Reset quantity input
  quantityInput.value = 1;
  
  // Haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate([10, 50, 10]);
  }
  
  // Add animation to button
  if (event && event.currentTarget) {
    const btn = event.currentTarget;
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 600);
  }
  
  updateCart();
}

function updateCart() {
  const cartSection = document.getElementById('cartSection');
  const cartItems = document.getElementById('cartItems');
  
  if (!cartSection || !cartItems) return;
  
  if (cart.length === 0) {
    cartSection.style.display = 'none';
    return;
  }
  
  cartSection.style.display = 'block';
  
  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.equipmentImage}" alt="${item.equipmentName}" class="cart-item-image"
           onerror="this.src='/uploads/default-equipment.jpg'" loading="lazy">
      <div class="cart-item-info">
        <h5>${item.equipmentName}</h5>
        <p class="cart-item-price">Rp ${item.equipmentPrice.toLocaleString('id-ID')}/hari</p>
        <p class="cart-item-qty">Jumlah: <strong>${item.quantity} unit</strong></p>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${index})" 
              aria-label="Hapus ${item.equipmentName}">
        🗑️
      </button>
    </div>
  `).join('');
  
  calculateTotal();
  
  // Smooth scroll to cart
  setTimeout(() => {
    cartSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function removeFromCart(index) {
  if (index < 0 || index >= cart.length) return;
  
  const itemName = cart[index].equipmentName;
  
  // Add confirmation on mobile
  if (window.innerWidth <= 768) {
    if (!confirm(`Hapus ${itemName} dari keranjang?`)) {
      return;
    }
  }
  
  cart.splice(index, 1);
  updateCart();
  showToast(`🗑️ ${itemName} dihapus`, 'success');
  
  // Haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
}

function clearCart() {
  if (cart.length === 0) return;
  
  if (confirm('Kosongkan semua keranjang?')) {
    cart = [];
    updateCart();
    showToast('🗑️ Keranjang dikosongkan', 'success');
  }
}

// ==================== CALCULATION FUNCTIONS ====================
function calculateRentalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 0 ? 1 : diffDays;
}

function updateDurationDisplay() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  const durationDisplay = document.getElementById('durationDisplay');
  
  if (!durationDisplay) return;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      durationDisplay.textContent = '❌ Tanggal tidak valid';
      durationDisplay.style.color = '#dc3545';
      return;
    }
    
    const days = calculateRentalDays(startDate, endDate);
    durationDisplay.textContent = `${days} Hari`;
    durationDisplay.style.color = '#28a745';
  } else {
    durationDisplay.textContent = 'Pilih tanggal';
    durationDisplay.style.color = 'var(--color4)';
  }
}

function calculateTotal() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  let totalDays = 1;
  if (startDate && endDate) {
    totalDays = calculateRentalDays(startDate, endDate);
    if (totalDays < 1) totalDays = 1;
    updateDurationDisplay();
  }
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const dailyTotal = cart.reduce((sum, item) => sum + (item.equipmentPrice * item.quantity), 0);
  const totalPrice = dailyTotal * totalDays;
  
  const totalItemsEl = document.getElementById('totalItems');
  const rentalDurationEl = document.getElementById('rentalDuration');
  const totalPriceEl = document.getElementById('totalPrice');
  
  if (totalItemsEl) totalItemsEl.textContent = `${totalItems} item`;
  if (rentalDurationEl) rentalDurationEl.textContent = `${totalDays} hari`;
  if (totalPriceEl) totalPriceEl.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}

// ==================== CHECKOUT FUNCTIONS ====================
function showCheckoutForm() {
  if (cart.length === 0) {
    showToast('❌ Keranjang masih kosong', 'error');
    return;
  }
  
  const checkoutSection = document.getElementById('checkoutSection');
  if (!checkoutSection) return;
  
  checkoutSection.style.display = 'block';
  checkoutSection.scrollIntoView({ behavior: 'smooth' });
  
  const today = new Date().toISOString().split('T')[0];
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput) startDateInput.setAttribute('min', today);
  if (endDateInput) endDateInput.setAttribute('min', today);
}

function hideCheckoutForm() {
  const checkoutSection = document.getElementById('checkoutSection');
  if (checkoutSection) {
    checkoutSection.style.display = 'none';
  }
}

// ==================== MODAL FUNCTIONS ====================
function showSuccessModalWithWhatsApp(orderNumber, waMessage) {
  const modal = document.getElementById('successModal');
  const modalOrderNumber = document.getElementById('modalOrderNumber');
  
  if (!modal || !modalOrderNumber) return;
  
  modalOrderNumber.textContent = orderNumber;
  
  const modalActions = document.getElementById('modalActions');
  if (modalActions) {
    const escapedMessage = waMessage.replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    modalActions.innerHTML = `
      <button class="btn-whatsapp" onclick='openWhatsApp("${escapedMessage}")'>
        📱 Konfirmasi via WhatsApp
      </button>
      <button class="btn-primary" onclick="closeSuccessModal()">OK, Mengerti</button>
      <a href="/" class="btn-secondary">Kembali ke Beranda</a>
    `;
  }
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Auto redirect to WhatsApp after 2 seconds
  setTimeout(() => openWhatsApp(waMessage), 2000);
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.remove('show');
  }
  
  document.body.style.overflow = 'auto';
  
  cart = [];
  updateCart();
  hideCheckoutForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==================== FORM VALIDATION ====================
function validateForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return false;
  
  const customerName = document.getElementById('customerName')?.value.trim();
  const customerPhone = document.getElementById('customerPhone')?.value.trim();
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  const agreeTerms = document.getElementById('agreeTerms')?.checked;
  
  if (!customerName) {
    showToast('❌ Nama harus diisi', 'error');
    return false;
  }
  
  if (!customerPhone) {
    showToast('❌ Nomor WhatsApp harus diisi', 'error');
    return false;
  }
  
  if (!/^[0-9]{10,13}$/.test(customerPhone)) {
    showToast('❌ Nomor WhatsApp tidak valid (10-13 digit)', 'error');
    return false;
  }
  
  if (!startDate || !endDate) {
    showToast('❌ Tanggal sewa harus dipilih', 'error');
    return false;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) {
    showToast('❌ Tanggal kembali harus setelah tanggal ambil', 'error');
    return false;
  }
  
  if (!agreeTerms) {
    showToast('❌ Anda harus menyetujui syarat dan ketentuan', 'error');
    return false;
  }
  
  return true;
}

// ==================== FORM SUBMISSION ====================
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Mengirim...</span>';
  
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const totalDays = calculateRentalDays(startDate, endDate);
  
  const dailyTotal = cart.reduce((sum, item) => sum + (item.equipmentPrice * item.quantity), 0);
  const totalPrice = dailyTotal * totalDays;
  
  const orderData = {
    name: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('customerPhone').value.trim(),
    email: document.getElementById('customerEmail').value.trim() || '',
    items: cart.map(item => ({
      ...item,
      subtotal: item.equipmentPrice * item.quantity * totalDays
    })),
    startDate,
    endDate,
    totalDays,
    totalPrice,
    notes: document.getElementById('notes').value.trim() || ''
  };
  
  const messageDiv = document.getElementById('message');
  
  try {
    const response = await fetch('/order/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      const waMessage = generateWhatsAppMessage(orderData, data.order.orderNumber);
      showSuccessModalWithWhatsApp(data.order.orderNumber, waMessage);
      
      // Reset form
      const form = document.getElementById('checkoutForm');
      if (form) form.reset();
      
      // Show success toast
      showToast('✅ Pesanan berhasil dikirim!', 'success');
    } else {
      if (messageDiv) {
        messageDiv.className = 'message error';
        messageDiv.textContent = `❌ ${data.message}`;
        messageDiv.style.display = 'block';
      }
      showToast(data.message, 'error');
    }
  } catch (error) {
    console.error('Order error:', error);
    if (messageDiv) {
      messageDiv.className = 'message error';
      messageDiv.textContent = '❌ Terjadi kesalahan sistem. Silakan coba lagi.';
      messageDiv.style.display = 'block';
    }
    showToast('❌ Terjadi kesalahan sistem', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Kirim Pesanan</span>';
  }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
  // Load catalog on page load
  loadEquipmentCatalog();
  
  // Checkout form submission
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Auto-update endDate minimum when startDate changes
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', function() {
      endDateInput.setAttribute('min', this.value);
      
      // Auto-set endDate to startDate + 1 day if not set or invalid
      if (!endDateInput.value || new Date(endDateInput.value) < new Date(this.value)) {
        const nextDay = new Date(this.value);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateInput.value = nextDay.toISOString().split('T')[0];
      }
      
      calculateTotal();
      updateDurationDisplay();
    });
    
    endDateInput.addEventListener('change', function() {
      calculateTotal();
      updateDurationDisplay();
    });
  }
  
  // Close modal on overlay click
  const modalOverlay = document.querySelector('.modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeSuccessModal);
  }
  
  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('successModal');
      if (modal && modal.classList.contains('show')) {
        closeSuccessModal();
      }
    }
  });
  
  // Phone number auto-format
  const phoneInput = document.getElementById('customerPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      // Remove non-numeric characters
      this.value = this.value.replace(/[^0-9]/g, '');
      
      // Limit to 13 digits
      if (this.value.length > 13) {
        this.value = this.value.slice(0, 13);
      }
    });
  }
  
  // Prevent form submission on Enter key in quantity inputs
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.type === 'number') {
      e.preventDefault();
    }
  });
  
  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // Handle window resize for responsive adjustments
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Close mobile menu on desktop
      if (window.innerWidth > 768) {
        const navLinks = document.querySelector('.nav-links');
        const toggle = document.querySelector('.mobile-menu-toggle');
        if (navLinks && toggle) {
          navLinks.classList.remove('active');
          toggle.classList.remove('active');
          document.body.style.overflow = 'auto';
        }
      }
    }, 250);
  });
  
  // Detect if user is offline
  window.addEventListener('offline', () => {
    showToast('⚠️ Tidak ada koneksi internet', 'warning');
  });
  
  window.addEventListener('online', () => {
    showToast('✅ Koneksi internet kembali', 'success');
  });
  
  // Prevent accidental page leave when cart has items
  window.addEventListener('beforeunload', (e) => {
    if (cart.length > 0) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
});

// ==================== UTILITY FUNCTIONS ====================
// Format currency
function formatCurrency(amount) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// Format date
function formatDate(dateString) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ==================== SERVICE WORKER (Optional PWA Support) ====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

