// ==================== GLOBAL VARIABLES ====================
let allEquipmentData = [];

// ==================== SWEETALERT2 HELPER FUNCTIONS ====================
function showSuccess(message) {
  Swal.fire({
    icon: 'success',
    title: 'Berhasil!',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#606C38',
    timer: 3000,
    timerProgressBar: true
  });
}

function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#dc3545'
  });
}

function showWarning(message) {
  Swal.fire({
    icon: 'warning',
    title: 'Perhatian!',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#ffc107'
  });
}

function showInfo(message) {
  Swal.fire({
    icon: 'info',
    title: 'Informasi',
    text: message,
    confirmButtonText: 'OK',
    confirmButtonColor: '#17a2b8'
  });
}

async function showConfirm(title, message) {
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Lanjutkan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#606C38',
    cancelButtonColor: '#dc3545',
    reverseButtons: true
  });
  
  return result.isConfirmed;
}

function showLoading(message = 'Memproses...') {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
}

function closeLoading() {
  Swal.close();
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const toggle = document.querySelector('.mobile-menu-toggle');
  
  if (navLinks && toggle) {
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');
    
    if (navLinks.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }
}

// ==================== USER INFO ====================
async function loadUserInfo() {
  try {
    const response = await fetch('/dashboard/api/user');
    const data = await response.json();

    if (data.success) {
      const userName = document.querySelector('.user-name');
      if (userName) {
        userName.textContent = data.user.name;
      }
    }
  } catch (error) {
    console.error('Error loading user info:', error);
  }
}

// ==================== DATE DISPLAY ====================
function updateTodayDate() {
  const todayEl = document.getElementById('todayDate');
  if (todayEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('id-ID', options);
    todayEl.textContent = today;
  }
}

// ==================== HELPER FUNCTIONS ====================
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

function formatDateCompact(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}


// ==================== HELPER FUNCTIONS ====================

function calculateRentalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Reset time to 00:00:00
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Hitung selisih hari
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Jika tanggal sama (15-15) atau beda 1 hari (14-15), tetap 1 hari
  // Jika lebih dari 1 hari (14-16), maka 2 hari, dst
  return diffDays === 0 ? 1 : diffDays;
}




// ==================== TABS MANAGEMENT ====================
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  if (tabName === 'orders') {
    document.getElementById('ordersTab').classList.add('active');
    document.querySelector('[data-tab="orders"]').classList.add('active');
    if (typeof loadOrders === 'function') loadOrders();
  } else if (tabName === 'equipment') {
    document.getElementById('equipmentTab').classList.add('active');
    document.querySelector('[data-tab="equipment"]').classList.add('active');
    if (typeof loadEquipment === 'function') loadEquipment();
  } else if (tabName === 'reports') {
    document.getElementById('reportsTab').classList.add('active');
    document.querySelector('[data-tab="reports"]').classList.add('active');
    if (typeof loadReportStats === 'function') loadReportStats();
  }
}

// ==================== ORDER FORM FUNCTIONS ====================
function addOrderItem() {
  const selectEl = document.getElementById('selectEquipment');
  const qtyEl = document.getElementById('selectQuantity');
  
  if (!selectEl.value) {
    showWarning('Pilih peralatan terlebih dahulu!');
    return;
  }
  
  const equipmentId = selectEl.value;
  const quantity = parseInt(qtyEl.value);
  
  const equipment = allEquipmentData.find(e => e._id === equipmentId);
  
  if (!equipment) {
    showError('Peralatan tidak ditemukan');
    return;
  }
  
  if (quantity > equipment.stock) {
    showWarning(`Stok tidak mencukupi! Tersedia: ${equipment.stock} unit`);
    return;
  }
  
  // Check if already exists
  const existingIndex = orderItems.findIndex(item => item.equipmentId === equipmentId);
  
  if (existingIndex >= 0) {
    orderItems[existingIndex].quantity += quantity;
    showInfo(`Jumlah ${equipment.name} ditambahkan`);
  } else {
    orderItems.push({
      equipmentId: equipment._id,
      equipmentName: equipment.name,
      equipmentImage: equipment.image,
      equipmentPrice: equipment.price,
      quantity: quantity
    });
    showSuccess(`${equipment.name} ditambahkan ke pesanan`);
  }
  
  updateSelectedItemsList();
  calculateOrderTotal();
  
  // Reset form
  selectEl.value = '';
  qtyEl.value = 1;
}

function removeOrderItem(index) {
  const itemName = orderItems[index].equipmentName;
  orderItems.splice(index, 1);
  updateSelectedItemsList();
  calculateOrderTotal();
  showInfo(`${itemName} dihapus dari pesanan`);
}

function updateSelectedItemsList() {
  const listEl = document.getElementById('selectedItemsList');
  const summaryBox = document.getElementById('orderSummaryBox');
  
  if (!listEl) return;
  
  if (orderItems.length === 0) {
    listEl.innerHTML = `
      <div class="empty-items">
        <span class="empty-icon">📦</span>
        <p>Belum ada alat dipilih</p>
      </div>
    `;
    if (summaryBox) summaryBox.style.display = 'none';
    return;
  }
  
  listEl.innerHTML = orderItems.map((item, index) => `
    <div class="selected-item-modern">
      <img src="${item.equipmentImage || '/uploads/default-equipment.jpg'}" 
           alt="${item.equipmentName}" 
           class="selected-item-image-modern"
           onerror="this.src='/uploads/default-equipment.jpg'">
      <div class="selected-item-info-modern">
        <h5>${item.equipmentName}</h5>
        <p>Harga: Rp ${item.equipmentPrice.toLocaleString('id-ID')}/hari</p>
        <p>Jumlah: ${item.quantity} unit</p>
      </div>
      <button type="button" class="btn-remove-item-modern" onclick="removeOrderItem(${index})">🗑️</button>
    </div>
  `).join('');
  
  if (summaryBox) summaryBox.style.display = 'block';
}

function calculateOrderTotal() {
  const startDate = document.getElementById('orderStartDate').value;
  const endDate = document.getElementById('orderEndDate').value;
  
  let totalDays = 1;
  
  if (startDate && endDate) {
    totalDays = calculateRentalDays(startDate, endDate);
    if (totalDays < 1) {
      showWarning('Tanggal kembali harus setelah tanggal ambil');
      totalDays = 1;
    }
  }
  
  const durationEl = document.getElementById('orderDuration');
  if (durationEl) {
    durationEl.textContent = `${totalDays} hari`;
  }
  
  const dailyTotal = orderItems.reduce((sum, item) => {
    return sum + (item.equipmentPrice * item.quantity);
  }, 0);
  
  const totalPrice = dailyTotal * totalDays;
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalItemsEl = document.getElementById('orderTotalItems');
  const totalPriceEl = document.getElementById('orderTotalPrice');
  
  if (totalItemsEl) totalItemsEl.textContent = totalItems;
  if (totalPriceEl) totalPriceEl.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}

// ==================== MODAL FUNCTIONS ====================
function closeOrderDetailModal() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) {
    modal.classList.remove('show');
  }
  document.body.style.overflow = 'auto';
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Load initial data
  loadUserInfo();
  updateTodayDate();
  
  // Load orders if orders module exists
  if (typeof loadOrders === 'function') {
    loadOrders();
  }
  
  // Setup order form if exists
  const orderForm = document.getElementById('orderForm');
  if (orderForm && typeof submitOrderForm === 'function') {
    orderForm.addEventListener('submit', submitOrderForm);
  }
  
  // Auto refresh orders every 30 seconds
  if (typeof loadOrders === 'function') {
    setInterval(loadOrders, 30000);
  }
  
  // Modal overlay click handler
  const modalOverlay = document.querySelector('.modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeOrderDetailModal);
  }
  
  // Mobile menu auto-close on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
      const navLinks = document.querySelector('.nav-links');
      const toggle = document.querySelector('.mobile-menu-toggle');
      if (navLinks && toggle) {
        navLinks.classList.remove('active');
        toggle.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    }
  });
  
  // Escape key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('orderDetailModal');
      if (modal && modal.classList.contains('show')) {
        closeOrderDetailModal();
      }
    }
  });
  
  console.log('🏕️ Dashboard Core Module Loaded ✨');
});
