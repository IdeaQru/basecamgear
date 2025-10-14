// Global Variables
let cart = [];
let allEquipment = [];

// WhatsApp Configuration
const WHATSAPP_NUMBER = '6283131251615';

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
    const response = await fetch('/equipment/api/all');
    const data = await response.json();
    
    if (data.success) {
      allEquipment = data.equipment;
      displayCatalog(allEquipment);
    }
  } catch (error) {
    console.error('Error loading catalog:', error);
    document.getElementById('equipmentCatalog').innerHTML = 
      '<p class="text-center error">Gagal memuat katalog. Silakan refresh halaman.</p>';
  }
}

function displayCatalog(equipment) {
  const catalog = document.getElementById('equipmentCatalog');
  
  if (equipment.length === 0) {
    catalog.innerHTML = '<p class="text-center">Tidak ada alat tersedia saat ini.</p>';
    return;
  }
  
  catalog.innerHTML = equipment.map((item, index) => `
    <div class="catalog-card" data-category="${item.category}">
      <img src="${item.image}" alt="${item.name}" class="catalog-image" 
           onerror="this.src='/uploads/default-equipment.jpg'">
      <div class="catalog-content">
        <span class="catalog-category">${item.category}</span>
        <h4>${item.name}</h4>
        <p class="catalog-price">Rp ${item.price.toLocaleString('id-ID')}/hari</p>
        <p class="catalog-stock">📦 Stok: ${item.stock} unit ${item.available ? '✅' : '❌'}</p>
        ${item.description ? `<p class="catalog-description">${item.description}</p>` : ''}
        
        <div class="quantity-selector">
          <button type="button" onclick="decreaseQty(${index})" aria-label="Kurangi">-</button>
          <input type="number" id="qty-${index}" value="1" min="1" max="${item.stock}" readonly>
          <button type="button" onclick="increaseQty(${index})" aria-label="Tambah">+</button>
        </div>
        
        <button class="btn-add-cart" onclick="addToCart('${item._id}', ${index})" 
                ${!item.available || item.stock === 0 ? 'disabled' : ''}>
          ${!item.available || item.stock === 0 ? '❌ Stok Habis' : '🛒 Tambah ke Keranjang'}
        </button>
      </div>
    </div>
  `).join('');
}

function filterCategory(category) {
  const filtered = category === 'all' 
    ? allEquipment 
    : allEquipment.filter(item => item.category === category);
  
  displayCatalog(filtered);
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

// ==================== QUANTITY CONTROLS ====================
function increaseQty(index) {
  const input = document.getElementById(`qty-${index}`);
  const max = parseInt(input.getAttribute('max'));
  if (parseInt(input.value) < max) {
    input.value = parseInt(input.value) + 1;
  }
}

function decreaseQty(index) {
  const input = document.getElementById(`qty-${index}`);
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
}

// ==================== CART FUNCTIONS ====================
function addToCart(equipmentId, index) {
  const equipment = allEquipment.find(e => e._id === equipmentId);
  const quantity = parseInt(document.getElementById(`qty-${index}`).value);
  
  // Check if item already in cart
  const existingIndex = cart.findIndex(item => item.equipmentId === equipmentId);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
    showToast(`${equipment.name} (${quantity}x) ditambahkan ke keranjang`, 'success');
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
  
  updateCart();
}

function updateCart() {
  const cartSection = document.getElementById('cartSection');
  const cartItems = document.getElementById('cartItems');
  
  if (cart.length === 0) {
    cartSection.style.display = 'none';
    return;
  }
  
  cartSection.style.display = 'block';
  
  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.equipmentImage}" alt="${item.equipmentName}" class="cart-item-image"
           onerror="this.src='/uploads/default-equipment.jpg'">
      <div class="cart-item-info">
        <h5>${item.equipmentName}</h5>
        <p>Rp ${item.equipmentPrice.toLocaleString('id-ID')}/hari × ${item.quantity} unit</p>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${index})" aria-label="Hapus">🗑️</button>
    </div>
  `).join('');
  
  calculateTotal();
  cartSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function removeFromCart(index) {
  const itemName = cart[index].equipmentName;
  cart.splice(index, 1);
  updateCart();
  showToast(`${itemName} dihapus dari keranjang`, 'success');
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

// Update duration display in real-time
function updateDurationDisplay() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  const durationDisplay = document.getElementById('durationDisplay');
  
  if (startDate && endDate) {
    const days = calculateRentalDays(startDate, endDate);
    durationDisplay.textContent = `${days} Hari`;
    durationDisplay.style.color = '#28a745';
  } else {
    durationDisplay.textContent = 'Pilih tanggal';
    durationDisplay.style.color = 'white';
  }
}

// Update calculateTotal function
function calculateTotal() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  let totalDays = 1;
  if (startDate && endDate) {
    totalDays = calculateRentalDays(startDate, endDate);
    if (totalDays < 1) totalDays = 1;
    updateDurationDisplay(); // Add this line
  }
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const dailyTotal = cart.reduce((sum, item) => sum + (item.equipmentPrice * item.quantity), 0);
  const totalPrice = dailyTotal * totalDays;
  
  document.getElementById('totalItems').textContent = `${totalItems} item`;
  document.getElementById('rentalDuration').textContent = `${totalDays} hari`;
  document.getElementById('totalPrice').textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}

// ==================== CHECKOUT FUNCTIONS ====================
function showCheckoutForm() {
  if (cart.length === 0) {
    showToast('Keranjang masih kosong', 'error');
    return;
  }
  
  document.getElementById('checkoutSection').style.display = 'block';
  document.getElementById('checkoutSection').scrollIntoView({ behavior: 'smooth' });
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').setAttribute('min', today);
  document.getElementById('endDate').setAttribute('min', today);
}

function hideCheckoutForm() {
  document.getElementById('checkoutSection').style.display = 'none';
}

// ==================== MODAL FUNCTIONS ====================
function showSuccessModalWithWhatsApp(orderNumber, waMessage) {
  const modal = document.getElementById('successModal');
  document.getElementById('modalOrderNumber').textContent = orderNumber;
  
  const modalActions = document.getElementById('modalActions');
  const escapedMessage = waMessage.replace(/'/g, "\\'").replace(/"/g, '\\"');
  
  modalActions.innerHTML = `
    <button class="btn-whatsapp" onclick='openWhatsApp("${escapedMessage}")'>
      📱 Konfirmasi via WhatsApp
    </button>
    <button class="btn-primary" onclick="closeSuccessModal()">OK, Mengerti</button>
    <a href="/" class="btn-secondary">Kembali ke Beranda</a>
  `;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  cart = [];
  updateCart();
  hideCheckoutForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==================== FORM SUBMISSION ====================
document.addEventListener('DOMContentLoaded', () => {
  const checkoutForm = document.getElementById('checkoutForm');
  
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      submitBtn.textContent = '⏳ Mengirim...';
      
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      const totalDays = calculateRentalDays(startDate, endDate);
      
      const dailyTotal = cart.reduce((sum, item) => sum + (item.equipmentPrice * item.quantity), 0);
      const totalPrice = dailyTotal * totalDays;
      
      const orderData = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value,
        items: cart.map(item => ({
          ...item,
          subtotal: item.equipmentPrice * item.quantity * totalDays
        })),
        startDate,
        endDate,
        totalDays,
        totalPrice,
        notes: document.getElementById('notes').value
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
          checkoutForm.reset();
          
          // Auto redirect to WhatsApp after 2 seconds
          setTimeout(() => openWhatsApp(waMessage), 2000);
        } else {
          messageDiv.className = 'error';
          messageDiv.textContent = `❌ ${data.message}`;
          showToast(data.message, 'error');
        }
      } catch (error) {
        console.error('Order error:', error);
        messageDiv.className = 'error';
        messageDiv.textContent = '❌ Terjadi kesalahan sistem. Silakan coba lagi.';
        showToast('Terjadi kesalahan sistem', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = '🚀 Kirim Pesanan';
      }
    });
  }
  
  // Auto-update endDate minimum
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', function() {
      endDateInput.setAttribute('min', this.value);
      calculateTotal();
    });
  }
  
  // Close modal on overlay click
  const modalOverlay = document.querySelector('.modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeSuccessModal);
  }
  
  // Load catalog on page load
  loadEquipmentCatalog();
});
