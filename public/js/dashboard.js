// Global variables
let orderItems = []; // Cart untuk form tambah pesanan
let allEquipmentData = []; // Cache equipment data
let allOrdersData = []; // TAMBAHKAN INI
let currentFilter = 'all'; // TAMBAHKAN INI
// ==================== USER INFO ====================
async function loadUserInfo() {
  try {
    const response = await fetch('/dashboard/api/user');
    const data = await response.json();

    if (data.success) {
      document.getElementById('userInfo').textContent = `👤 ${data.user.name}`;
    }
  } catch (error) {
    console.error('Error loading user info:', error);
  }
}

// ==================== ORDERS MANAGEMENT ====================
async function loadOrders() {
  try {
    const response = await fetch('/dashboard/api/orders');
    const data = await response.json();

    if (data.success) {
      allOrdersData = data.orders; // Simpan ke cache
      filterOrders(currentFilter); // Terapkan filter
      updateStats(data.orders);
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    document.getElementById('ordersTableBody').innerHTML =
      '<tr><td colspan="8" class="text-center error">Gagal memuat data</td></tr>';
  }
}
// Filter orders function
function filterOrders(filterType) {
  currentFilter = filterType;

  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  if (event && event.target) {
    event.target.classList.add('active');
  } else {
    // Set first tab active if called without event
    const firstTab = document.querySelector('.filter-tab');
    if (firstTab) firstTab.classList.add('active');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filteredOrders = allOrdersData;

  switch (filterType) {
    case 'today':
      // Orders created today
      filteredOrders = allOrdersData.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      break;

    case 'pickup':
      // Orders to be picked up today
      filteredOrders = allOrdersData.filter(order => {
        const pickupDate = new Date(order.startDate);
        pickupDate.setHours(0, 0, 0, 0);
        return pickupDate.getTime() === today.getTime();
      });
      break;

    case 'return':
      // Orders to be returned today
      filteredOrders = allOrdersData.filter(order => {
        const returnDate = new Date(order.endDate);
        returnDate.setHours(0, 0, 0, 0);
        return returnDate.getTime() === today.getTime();
      });
      break;

    case 'all':
    default:
      filteredOrders = allOrdersData;
      break;
  }

  displayOrders(filteredOrders);
}


function displayOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada pesanan</td></tr>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tbody.innerHTML = orders.map(order => {
    // Check if order is new (created today)
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    const isNewOrder = orderDate.getTime() === today.getTime();

    // Check if pickup or return is today
    const pickupDate = new Date(order.startDate);
    pickupDate.setHours(0, 0, 0, 0);
    const isPickupToday = pickupDate.getTime() === today.getTime();

    const returnDate = new Date(order.endDate);
    returnDate.setHours(0, 0, 0, 0);
    const isReturnToday = returnDate.getTime() === today.getTime();

    // Generate items preview with images
    const itemsPreview = order.items && order.items.length > 0
      ? order.items.map(item => `
          <div class="order-item-row">
            <img src="${item.equipmentImage || '/uploads/default-equipment.jpg'}" 
                 alt="${item.equipmentName}" 
                 class="order-item-img"
                 onerror="this.src='/uploads/default-equipment.jpg'">
            <div class="order-item-text">
              <strong>${item.equipmentName}</strong> × ${item.quantity}
            </div>
          </div>
        `).join('')
      : `<div class="order-item-text">${order.product || 'No items'}</div>`;

    return `
      <tr>
        <td>
          <strong>${order.orderNumber || '#' + order._id.substring(0, 8)}</strong>
          ${isNewOrder ? '<span class="new-badge">BARU</span>' : ''}
        </td>
        <td>${order.name}</td>
        <td>
          📱 ${order.phone}<br>
          ${order.email ? '📧 ' + order.email : ''}
        </td>
        <td>
          <div class="order-items-preview">
            ${itemsPreview}
          </div>
        </td>
        <td><strong>Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}</strong></td>
        <td>
          <strong>Ambil:</strong> ${formatDate(order.startDate)}
          ${isPickupToday ? '<span class="today-badge">HARI INI</span>' : ''}<br>
          <strong>Kembali:</strong> ${formatDate(order.endDate)}
          ${isReturnToday ? '<span class="today-badge">HARI INI</span>' : ''}<br>
          <small>(${order.totalDays || 1} hari)</small>
        </td>
        <td>
          <select class="status-select" onchange="updateStatus('${order._id}', this.value)">
            <option value="Menunggu Konfirmasi" ${order.status === 'Menunggu Konfirmasi' ? 'selected' : ''}>Menunggu</option>
            <option value="Dikonfirmasi" ${order.status === 'Dikonfirmasi' ? 'selected' : ''}>Dikonfirmasi</option>
            <option value="Sedang Disewa" ${order.status === 'Sedang Disewa' ? 'selected' : ''}>Sedang Disewa</option>
            <option value="Selesai" ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
            <option value="Dibatalkan" ${order.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
          </select>
        </td>
        <td>
          <button class="btn-view-details" onclick="viewOrderDetails('${order._id}')">👁️ Detail</button>
           <button class="btn-print" onclick="printReceipt('${order._id}')">🖨️ Cetak</button>
  <button class="btn-delete" onclick="deleteOrder('${order._id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}


function updateStats(orders) {
  document.getElementById('totalOrders').textContent = orders.length;
  document.getElementById('pendingOrders').textContent =
    orders.filter(o => o.status === 'Menunggu Konfirmasi').length;
  document.getElementById('confirmedOrders').textContent =
    orders.filter(o => o.status === 'Dikonfirmasi' || o.status === 'Sedang Disewa').length;
  document.getElementById('completedOrders').textContent =
    orders.filter(o => o.status === 'Selesai').length;
}

// View order details in modal
async function viewOrderDetails(orderId) {
  try {
    const response = await fetch('/dashboard/api/orders');
    const data = await response.json();

    if (data.success) {
      const order = data.orders.find(o => o._id === orderId);
      if (order) {
        showOrderDetailModal(order);
      }
    }
  } catch (error) {
    alert('❌ Gagal memuat detail pesanan');
  }
}

function showOrderDetailModal(order) {
  const modal = document.getElementById('orderDetailModal');
  const content = document.getElementById('orderDetailContent');

  const itemsHtml = order.items && order.items.length > 0
    ? order.items.map(item => `
        <div class="detail-item">
          <img src="${item.equipmentImage || '/uploads/default-equipment.jpg'}" 
               alt="${item.equipmentName}" 
               class="detail-item-image"
               onerror="this.src='/uploads/default-equipment.jpg'">
          <div style="flex:1">
            <h5>${item.equipmentName}</h5>
            <p>Harga: Rp ${(item.equipmentPrice || 0).toLocaleString('id-ID')}/hari</p>
            <p>Jumlah: ${item.quantity} unit</p>
            <p><strong>Subtotal: Rp ${(item.subtotal || 0).toLocaleString('id-ID')}</strong></p>
          </div>
        </div>
      `).join('')
    : '<p>Tidak ada item</p>';

  content.innerHTML = `
    <div class="detail-section">
      <h4>📋 Info Pesanan</h4>
      <p><strong>Nomor Pesanan:</strong> ${order.orderNumber || '-'}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Tanggal Pesan:</strong> ${formatDate(order.createdAt)}</p>
    </div>
    
    <div class="detail-section">
      <h4>👤 Data Penyewa</h4>
      <p><strong>Nama:</strong> ${order.name}</p>
      <p><strong>Telepon:</strong> ${order.phone}</p>
      <p><strong>Email:</strong> ${order.email || '-'}</p>
    </div>
    
    <div class="detail-section">
      <h4>📅 Periode Sewa</h4>
      <p><strong>Tanggal Ambil:</strong> ${formatDate(order.startDate)}</p>
      <p><strong>Tanggal Kembali:</strong> ${formatDate(order.endDate)}</p>
      <p><strong>Durasi:</strong> ${order.totalDays || 1} hari</p>
    </div>
    
    <div class="detail-section">
      <h4>🛒 Peralatan Disewa</h4>
      ${itemsHtml}
    </div>
    
    <div class="detail-section">
      <h4>💰 Total Pembayaran</h4>
      <p style="font-size:1.5rem; color: var(--color5); font-weight: bold;">
        Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}
      </p>
    </div>
    
    ${order.notes ? `
      <div class="detail-section">
        <h4>📝 Catatan</h4>
        <p>${order.notes}</p>
      </div>
    ` : ''}
<div class="detail-section">
    <h4>💰 Total Pembayaran</h4>
    <div class="total-price">
      Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}
    </div>
  </div>
  
  ${order.notes ? `
    <div class="detail-section">
      <h4>📝 Catatan</h4>
      <p>${order.notes}</p>
    </div>
  ` : ''}
  
  <!-- Tombol Cetak -->
  <div style="text-align: center; margin-top: 20px;">
    <button onclick="printReceipt('${order._id}')" class="btn-print-large">
      🖨️ Cetak Struk Pesanan
    </button>
  </div>
`;

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeOrderDetailModal() {
  const modal = document.getElementById('orderDetailModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Show form tambah pesanan
async function showAddOrderForm() {
  orderItems = []; // Reset cart
  document.getElementById('orderFormContainer').style.display = 'block';
  document.getElementById('orderForm').reset();
  document.getElementById('orderId').value = '';

  // Set minimum date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('orderStartDate').setAttribute('min', today);
  document.getElementById('orderEndDate').setAttribute('min', today);

  // Load equipment list
  await loadEquipmentForOrder();
  updateSelectedItemsList();

  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function hideOrderForm() {
  document.getElementById('orderFormContainer').style.display = 'none';
  document.getElementById('orderForm').reset();
  orderItems = [];
}

// Load equipment untuk dropdown
async function loadEquipmentForOrder() {
  try {
    const response = await fetch('/equipment/api/all');
    const data = await response.json();

    if (data.success) {
      allEquipmentData = data.equipment;
      const select = document.getElementById('selectEquipment');
      select.innerHTML = '<option value="">-- Pilih Alat --</option>';

      data.equipment.forEach(item => {
        if (item.available && item.stock > 0) {
          const option = document.createElement('option');
          option.value = item._id;
          option.textContent = `${item.name} - Rp${item.price.toLocaleString('id-ID')}/hari (Stok: ${item.stock})`;
          select.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error('Error loading equipment:', error);
  }
}

// Add item to order
function addOrderItem() {
  const selectEquipment = document.getElementById('selectEquipment');
  const quantity = parseInt(document.getElementById('selectQuantity').value);

  if (!selectEquipment.value) {
    alert('❌ Pilih peralatan terlebih dahulu');
    return;
  }

  const equipment = allEquipmentData.find(e => e._id === selectEquipment.value);

  if (!equipment) {
    alert('❌ Peralatan tidak ditemukan');
    return;
  }

  if (quantity > equipment.stock) {
    alert(`❌ Stok tidak mencukupi. Stok tersedia: ${equipment.stock}`);
    return;
  }

  // Check if already in cart
  const existingIndex = orderItems.findIndex(item => item.equipmentId === equipment._id);

  if (existingIndex >= 0) {
    orderItems[existingIndex].quantity += quantity;
  } else {
    orderItems.push({
      equipmentId: equipment._id,
      equipmentName: equipment.name,
      equipmentImage: equipment.image,
      equipmentPrice: equipment.price,
      quantity: quantity
    });
  }

  // Reset selector
  selectEquipment.value = '';
  document.getElementById('selectQuantity').value = 1;

  updateSelectedItemsList();
  calculateOrderTotal();
}

// Remove item from order
function removeOrderItem(index) {
  orderItems.splice(index, 1);
  updateSelectedItemsList();
  calculateOrderTotal();
}

// Update selected items list display
function updateSelectedItemsList() {
  const container = document.getElementById('selectedItemsList');

  if (orderItems.length === 0) {
    container.innerHTML = '<p class="text-center">Belum ada alat dipilih</p>';
    document.getElementById('orderSummaryBox').style.display = 'none';
    return;
  }

  container.innerHTML = orderItems.map((item, index) => `
    <div class="selected-item">
      <img src="${item.equipmentImage || '/uploads/default-equipment.jpg'}" 
           alt="${item.equipmentName}" 
           class="selected-item-image"
           onerror="this.src='/uploads/default-equipment.jpg'">
      <div class="selected-item-info">
        <h5>${item.equipmentName}</h5>
        <p>Rp ${item.equipmentPrice.toLocaleString('id-ID')}/hari × ${item.quantity} unit</p>
      </div>
      <button type="button" class="selected-item-remove" onclick="removeOrderItem(${index})">
        🗑️ Hapus
      </button>
    </div>
  `).join('');

  document.getElementById('orderSummaryBox').style.display = 'block';
}

// Calculate order total
// Helper function untuk hitung total days
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
// Calculate order total
function calculateOrderTotal() {
  const startDate = document.getElementById('orderStartDate')?.value;
  const endDate = document.getElementById('orderEndDate')?.value;

  let totalDays = 1;
  if (startDate && endDate) {
    totalDays = calculateRentalDays(startDate, endDate);

    // Validasi: end date tidak boleh sebelum start date
    if (totalDays < 1) {
      alert('❌ Tanggal kembali tidak boleh sebelum tanggal ambil');
      document.getElementById('orderEndDate').value = '';
      totalDays = 1;
    }

    document.getElementById('orderDuration').textContent = `${totalDays} hari`;
  }

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const dailyTotal = orderItems.reduce((sum, item) => sum + (item.equipmentPrice * item.quantity), 0);
  const totalPrice = dailyTotal * totalDays;

  document.getElementById('orderTotalItems').textContent = `${totalItems} item`;
  document.getElementById('orderTotalPrice').textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}


async function updateStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/dashboard/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Status berhasil diupdate');
      loadOrders();
    } else {
      alert('❌ Gagal update status');
    }
  } catch (error) {
    alert('❌ Terjadi kesalahan');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Yakin ingin menghapus pesanan ini?')) {
    return;
  }

  try {
    const response = await fetch(`/dashboard/api/orders/${orderId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Pesanan berhasil dihapus');
      loadOrders();
    } else {
      alert('❌ Gagal menghapus pesanan');
    }
  } catch (error) {
    alert('❌ Terjadi kesalahan');
  }
}

// ==================== EQUIPMENT MANAGEMENT ====================
async function loadEquipment() {
  try {
    const response = await fetch('/equipment/api/all');
    const data = await response.json();

    if (data.success) {
      displayEquipment(data.equipment);
    }
  } catch (error) {
    console.error('Error loading equipment:', error);
    document.getElementById('equipmentGrid').innerHTML =
      '<p class="text-center error">Gagal memuat data alat</p>';
  }
}

function displayEquipment(equipment) {
  const grid = document.getElementById('equipmentGrid');

  if (equipment.length === 0) {
    grid.innerHTML = '<p class="text-center">Belum ada alat. Klik "Tambah Alat" untuk menambahkan.</p>';
    return;
  }

  grid.innerHTML = equipment.map(item => `
    <div class="equipment-card">
      <img src="${item.image}" alt="${item.name}" class="equipment-image" 
           onerror="this.src='/uploads/default-equipment.jpg'">
      <div class="equipment-info">
        <h4>${item.name}</h4>
        <p class="equipment-category">${item.category}</p>
        <p class="equipment-price">Rp ${item.price.toLocaleString('id-ID')}/hari</p>
        <p class="equipment-stock">Stok: ${item.stock} unit</p>
        ${item.description ? `<p class="equipment-desc">${item.description}</p>` : ''}
        <div class="equipment-actions">
          <button class="btn-edit" onclick="editEquipment('${item._id}')">✏️ Edit</button>
          <button class="btn-delete" onclick="deleteEquipment('${item._id}')">🗑️ Hapus</button>
        </div>
      </div>
    </div>
  `).join('');
}

function showAddEquipmentForm() {
  document.getElementById('equipmentFormContainer').style.display = 'block';
  document.getElementById('equipmentForm').reset();
  document.getElementById('equipmentId').value = '';
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function hideEquipmentForm() {
  document.getElementById('equipmentFormContainer').style.display = 'none';
  document.getElementById('equipmentForm').reset();
}

async function editEquipment(id) {
  try {
    const response = await fetch(`/equipment/api/${id}`);
    const data = await response.json();

    if (data.success) {
      const equipment = data.equipment;
      document.getElementById('equipmentId').value = equipment._id;
      document.getElementById('equipmentName').value = equipment.name;
      document.getElementById('equipmentPrice').value = equipment.price;
      document.getElementById('equipmentCategory').value = equipment.category;
      document.getElementById('equipmentStock').value = equipment.stock;
      document.getElementById('equipmentDescription').value = equipment.description || '';

      document.getElementById('equipmentFormContainer').style.display = 'block';
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  } catch (error) {
    alert('❌ Gagal memuat data alat');
  }
}

async function deleteEquipment(id) {
  if (!confirm('Yakin ingin menghapus alat ini?')) {
    return;
  }

  try {
    const response = await fetch(`/equipment/api/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Alat berhasil dihapus');
      loadEquipment();
    } else {
      alert('❌ Gagal menghapus alat');
    }
  } catch (error) {
    alert('❌ Terjadi kesalahan');
  }
}

// ==================== FORM HANDLERS ====================
document.addEventListener('DOMContentLoaded', () => {
  // Handle order form submit
  // Handle order form submit
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (orderItems.length === 0) {
        alert('❌ Belum ada alat yang dipilih');
        return;
      }

      const startDate = document.getElementById('orderStartDate').value;
      const endDate = document.getElementById('orderEndDate').value;

      if (!startDate || !endDate) {
        alert('❌ Tanggal sewa wajib diisi');
        return;
      }

      // Gunakan helper function
      const totalDays = calculateRentalDays(startDate, endDate);

      if (totalDays < 1) {
        alert('❌ Tanggal tidak valid');
        return;
      }

      const dailyTotal = orderItems.reduce((sum, item) => sum + (item.equipmentPrice * item.quantity), 0);
      const totalPrice = dailyTotal * totalDays;

      const formData = {
        name: document.getElementById('orderName').value,
        phone: document.getElementById('orderPhone').value,
        email: document.getElementById('orderEmail').value || '',
        items: orderItems.map(item => ({
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          equipmentImage: item.equipmentImage || '/uploads/default-equipment.jpg',
          equipmentPrice: item.equipmentPrice,
          quantity: item.quantity,
          subtotal: item.equipmentPrice * item.quantity * totalDays
        })),
        startDate,
        endDate,
        totalDays,
        totalPrice,
        notes: document.getElementById('orderNotes').value || '',
        status: document.getElementById('orderStatus').value || 'Menunggu Konfirmasi'
      };

      console.log('Sending order data:', formData);

      try {
        const response = await fetch('/dashboard/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.success) {
          alert(`✅ Pesanan berhasil ditambahkan!\nNomor Pesanan: ${data.order.orderNumber}`);
          hideOrderForm();
          loadOrders();
        } else {
          alert('❌ ' + data.message);
          console.error('Error details:', data);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan saat menyimpan pesanan');
      }
      
    });

  setTimeout(() => {
    loadReportStats();
  }, 1000);
  }


  // Handle equipment form submit
  const equipmentForm = document.getElementById('equipmentForm');
  if (equipmentForm) {
    equipmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData();
      const equipmentId = document.getElementById('equipmentId').value;

      formData.append('name', document.getElementById('equipmentName').value);
      formData.append('price', document.getElementById('equipmentPrice').value);
      formData.append('category', document.getElementById('equipmentCategory').value);
      formData.append('stock', document.getElementById('equipmentStock').value);
      formData.append('description', document.getElementById('equipmentDescription').value);

      const imageFile = document.getElementById('equipmentImage').files[0];
      if (imageFile) {
        formData.append('image', imageFile);
      }

      try {
        const url = equipmentId ? `/equipment/api/${equipmentId}` : '/equipment/api/create';
        const method = equipmentId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          alert(`✅ Alat berhasil ${equipmentId ? 'diupdate' : 'ditambahkan'}`);
          hideEquipmentForm();
          loadEquipment();
        } else {
          alert('❌ ' + data.message);
        }
      } catch (error) {
        alert('❌ Terjadi kesalahan saat menyimpan data');
      }
    });
  }

  // Auto-update endDate minimum
  const startDateInput = document.getElementById('orderStartDate');
  const endDateInput = document.getElementById('orderEndDate');
  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', function () {
      endDateInput.setAttribute('min', this.value);
      calculateOrderTotal();
    });
  }

  // Close modal when clicking outside
  window.onclick = function (event) {
    const modal = document.getElementById('orderDetailModal');
    if (event.target === modal) {
      closeOrderDetailModal();
    }
  };

  // Initial load
  loadUserInfo();
  loadOrders();
  loadEquipment();

  // Auto refresh orders every 30 seconds
  setInterval(loadOrders, 30000);
});
// Print receipt function
// Print receipt function - Compact Version
function printReceipt(orderId) {
  const order = allOrdersData.find(o => o._id === orderId);
  if (!order) {
    alert('❌ Pesanan tidak ditemukan');
    return;
  }
  
  // Create print window
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  
  const itemsHtml = order.items && order.items.length > 0
    ? order.items.map((item, index) => `
        <tr>
          <td style="padding: 4px 2px; font-size: 11px;">${index + 1}</td>
          <td style="padding: 4px 2px; font-size: 11px;">
            ${item.equipmentName}<br>
            <small style="color: #666;">@ Rp ${(item.equipmentPrice || 0).toLocaleString('id-ID')}/hr</small>
          </td>
          <td style="padding: 4px 2px; text-align: center; font-size: 11px;">${item.quantity}</td>
          <td style="padding: 4px 2px; text-align: right; font-size: 11px;">Rp ${(item.subtotal || 0).toLocaleString('id-ID')}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="text-align: center; padding: 5px; font-size: 11px;">Tidak ada item</td></tr>';
  
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Struk - ${order.orderNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          padding: 10px;
          background: white;
        }
        
        .receipt {
          max-width: 80mm;
          margin: 0 auto;
          padding: 10px;
          border: 1px solid #ddd;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 2px dashed #333;
        }
        
        .logo {
          max-width: 60px;
          height: auto;
          margin-bottom: 5px;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin: 3px 0;
        }
        
        .company-info {
          font-size: 10px;
          color: #555;
          margin: 2px 0;
        }
        
        .receipt-title {
          font-size: 13px;
          font-weight: bold;
          text-align: center;
          margin: 8px 0;
          padding: 4px;
          background: #f0f0f0;
          border-radius: 3px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 11px;
        }
        
        .info-label {
          font-weight: 600;
        }
        
        .separator {
          border-top: 1px dashed #999;
          margin: 8px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        
        .items-table th {
          background: #333;
          color: white;
          padding: 4px 2px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
        }
        
        .items-table td {
          padding: 4px 2px;
          border-bottom: 1px solid #eee;
          font-size: 11px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 4px;
          font-size: 14px;
          font-weight: bold;
          background: #333;
          color: white;
          margin-top: 8px;
          border-radius: 3px;
        }
        
        .notes {
          background: #f9f9f9;
          padding: 6px;
          margin: 8px 0;
          font-size: 10px;
          border-left: 3px solid #333;
        }
        
        .terms {
          font-size: 9px;
          margin: 8px 0;
          padding: 6px;
          background: #fafafa;
          border-radius: 3px;
        }
        
        .terms ul {
          margin: 4px 0 0 12px;
          padding: 0;
        }
        
        .terms li {
          margin: 2px 0;
        }
        
        .footer {
          text-align: center;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 2px dashed #333;
          font-size: 10px;
          color: #666;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 9px;
        }
        
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d4edda; color: #155724; }
        .status-active { background: #d1ecf1; color: #0c5460; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        
        @media print {
          body {
            padding: 0;
          }
          
          .receipt {
            border: none;
            max-width: 100%;
          }
          
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          <img src="/images/logo.png" alt="Logo" class="logo">
          <div class="company-name">BASECAMP GEAR</div>
          <div class="company-info">Rental Alat Outdoor</div>
          <div class="company-info">WA: 0831-3125-1615</div>
        </div>
        
        <!-- Receipt Title -->
        <div class="receipt-title">BUKTI PENYEWAAN</div>
        
        <!-- Order Info -->
        <div class="info-row">
          <span class="info-label">No. Pesanan</span>
          <span>${order.orderNumber || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal</span>
          <span>${formatDateCompact(order.createdAt)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="status-badge status-${getStatusClass(order.status)}">${order.status}</span>
        </div>
        
        <div class="separator"></div>
        
        <!-- Customer Info -->
        <div class="info-row">
          <span class="info-label">Nama</span>
          <span>${order.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Telepon</span>
          <span>${order.phone}</span>
        </div>
        
        <div class="separator"></div>
        
        <!-- Rental Period -->
        <div class="info-row">
          <span class="info-label">Ambil</span>
          <span>${formatDateCompact(order.startDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Kembali</span>
          <span>${formatDateCompact(order.endDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Durasi</span>
          <span><strong>${order.totalDays || 1} Hari</strong></span>
        </div>
        
        <div class="separator"></div>
        
        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 20px;">No</th>
              <th>Nama Alat</th>
              <th style="width: 30px; text-align: center;">Qty</th>
              <th style="width: 80px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <!-- Total -->
        <div class="total-row">
          <span>TOTAL</span>
          <span>Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}</span>
        </div>
        
        ${order.notes ? `
        <div class="notes">
          <strong>Catatan:</strong> ${order.notes}
        </div>
        ` : ''}
        
        <!-- Terms -->
        <div class="terms">
          <strong>Ketentuan:</strong>
          <ul>
            <li>Tunjukkan KTP/SIM saat ambil alat</li>
            <li>Deposit dikembalikan jika kondisi baik</li>
            <li>Telat kembali: denda 50%/hari</li>
            <li>Kerusakan tanggung jawab penyewa</li>
          </ul>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <strong>Terima Kasih!</strong><br>
          Selamat Berpetualang 🏕️<br>
          <small>${formatDateCompact(new Date())}</small>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
}

// Helper function untuk format tanggal compact
function formatDateCompact(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Helper function untuk status class (tetap sama)
function getStatusClass(status) {
  const statusMap = {
    'Menunggu Konfirmasi': 'pending',
    'Dikonfirmasi': 'confirmed',
    'Sedang Disewa': 'active',
    'Selesai': 'completed',
    'Dibatalkan': 'cancelled'
  };
  return statusMap[status] || 'pending';
}

// ==================== REPORTS MANAGEMENT ====================
function loadReportStats() {
  if (!allOrdersData || allOrdersData.length === 0) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const week = new Date(today);
  week.setDate(week.getDate() - 7);
  
  const month = new Date(today);
  month.setDate(month.getDate() - 30);
  
  // Count orders by period
  const todayOrders = allOrdersData.filter(o => {
    const orderDate = new Date(o.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
  
  const weekOrders = allOrdersData.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= week;
  });
  
  const monthOrders = allOrdersData.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= month;
  });
  
  document.getElementById('reportToday').textContent = todayOrders.length;
  document.getElementById('report7Days').textContent = weekOrders.length;
  document.getElementById('report30Days').textContent = monthOrders.length;
  document.getElementById('reportAll').textContent = allOrdersData.length;
  
  // Calculate revenue
  const totalRevenue = monthOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  document.getElementById('totalRevenue').textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
  
  const avgOrderValue = monthOrders.length > 0 ? totalRevenue / monthOrders.length : 0;
  document.getElementById('avgOrderValue').textContent = `Rp ${Math.round(avgOrderValue).toLocaleString('id-ID')}`;
  
  // Top equipment
  const equipmentCount = {};
  allOrdersData.forEach(order => {
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        equipmentCount[item.equipmentName] = (equipmentCount[item.equipmentName] || 0) + item.quantity;
      });
    }
  });
  
  const topEquip = Object.entries(equipmentCount).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('topEquipment').textContent = topEquip ? `${topEquip[0]} (${topEquip[1]}x)` : '-';
  
  // Top status
  const statusCount = {};
  allOrdersData.forEach(order => {
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;
  });
  
  const topStat = Object.entries(statusCount).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('topStatus').textContent = topStat ? `${topStat[0]} (${topStat[1]})` : '-';
}

// Export report to CSV
function exportReport(period) {
  let orders = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch(period) {
    case 'today':
      orders = allOrdersData.filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      break;
      
    case 'week':
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      orders = allOrdersData.filter(o => new Date(o.createdAt) >= week);
      break;
      
    case 'month':
      const month = new Date(today);
      month.setDate(month.getDate() - 30);
      orders = allOrdersData.filter(o => new Date(o.createdAt) >= month);
      break;
      
    case 'all':
      orders = allOrdersData;
      break;
  }
  
  if (orders.length === 0) {
    alert('❌ Tidak ada data untuk periode ini');
    return;
  }
  
  generateCSV(orders, period);
}

// Export custom date range
function exportCustomRange() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;
  
  if (!startDate || !endDate) {
    alert('❌ Pilih tanggal mulai dan akhir');
    return;
  }
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  const orders = allOrdersData.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= start && orderDate <= end;
  });
  
  if (orders.length === 0) {
    alert('❌ Tidak ada data untuk periode ini');
    return;
  }
  
  generateCSV(orders, `custom_${startDate}_${endDate}`);
}

// Generate CSV file
// Generate CSV file - Fixed Version
function generateCSV(orders, period) {
  // Fungsi untuk escape CSV value
  function escapeCSV(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Convert to string
    let str = String(value);
    
    // Remove newlines and extra spaces
    str = str.replace(/[\n\r]+/g, ' ').trim();
    
    // Escape double quotes
    str = str.replace(/"/g, '""');
    
    // Wrap in quotes if contains comma, quote, or special chars
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str}"`;
    }
    
    return str;
  }
  
  // CSV Header
  const headers = [
    'No Pesanan',
    'Tanggal Pesan',
    'Nama Penyewa',
    'Telepon',
    'Email',
    'Tanggal Ambil',
    'Tanggal Kembali',
    'Durasi (Hari)',
    'Nama Alat',
    'Qty',
    'Harga per Item',
    'Subtotal',
    'Total Harga',
    'Status',
    'Catatan'
  ];
  
  // CSV Rows - Expand items to separate rows
  const rows = [];
  
  orders.forEach(order => {
    if (order.items && order.items.length > 0) {
      // Jika ada multiple items, buat row untuk setiap item
      order.items.forEach((item, itemIndex) => {
        rows.push([
          itemIndex === 0 ? (order.orderNumber || order._id.substring(0, 8)) : '', // Order number hanya di row pertama
          itemIndex === 0 ? formatDateCSV(order.createdAt) : '',
          itemIndex === 0 ? order.name : '',
          itemIndex === 0 ? order.phone : '',
          itemIndex === 0 ? (order.email || '-') : '',
          itemIndex === 0 ? formatDateCSV(order.startDate) : '',
          itemIndex === 0 ? formatDateCSV(order.endDate) : '',
          itemIndex === 0 ? (order.totalDays || 1) : '',
          item.equipmentName,
          item.quantity,
          item.equipmentPrice || 0,
          item.subtotal || 0,
          itemIndex === 0 ? (order.totalPrice || 0) : '', // Total hanya di row pertama
          itemIndex === 0 ? order.status : '',
          itemIndex === 0 ? (order.notes || '-') : ''
        ]);
      });
    } else {
      // Jika tidak ada items array (old format)
      rows.push([
        order.orderNumber || order._id.substring(0, 8),
        formatDateCSV(order.createdAt),
        order.name,
        order.phone,
        order.email || '-',
        formatDateCSV(order.startDate),
        formatDateCSV(order.endDate),
        order.totalDays || 1,
        order.product || '-',
        order.quantity || 1,
        order.totalPrice || 0,
        order.totalPrice || 0,
        order.totalPrice || 0,
        order.status,
        order.notes || '-'
      ]);
    }
  });
  
  // Build CSV content
  const csvLines = [];
  
  // Add header
  csvLines.push(headers.map(h => escapeCSV(h)).join(','));
  
  // Add rows
  rows.forEach(row => {
    csvLines.push(row.map(cell => escapeCSV(cell)).join(','));
  });
  
  const csvContent = csvLines.join('\r\n');
  
  // Add BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = `Laporan_Pesanan_${period}_${formatDateForFilename(new Date())}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Revoke object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
  
  alert(`✅ Laporan berhasil di-export!\nFile: ${filename}\nTotal: ${orders.length} pesanan`);
}

// Format date for CSV (simplified)
function formatDateCSV(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Format date for filename
function formatDateForFilename(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${year}${month}${day}`;
}

// ==================== TABS MANAGEMENT ====================
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (tabName === 'orders') {
    document.getElementById('ordersTab').classList.add('active');
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
  } else if (tabName === 'equipment') {
    document.getElementById('equipmentTab').classList.add('active');
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
  } else if (tabName === 'reports') {
    document.getElementById('reportsTab').classList.add('active');
    document.querySelector('.tab-btn:nth-child(3)').classList.add('active');
    loadReportStats(); // Load stats saat tab dibuka
  }
}


// ==================== HELPER FUNCTIONS ====================
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}
