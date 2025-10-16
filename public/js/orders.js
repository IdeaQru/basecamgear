// ==================== ORDER MANAGEMENT - DASHBOARD ADMIN ====================

// Global variables
let orderItems = [];
let allOrdersData = [];
let currentFilter = 'all';

// ==================== LOAD & DISPLAY ORDERS ====================

// Load all orders
async function loadOrders() {
  try {
    const response = await fetch('/dashboard/api/orders');
    const data = await response.json();

    if (data.success) {
      allOrdersData = data.orders;
      filterOrders(currentFilter);
      updateStats(data.orders);
      updateFilterCounts();
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">
            <div class="loading-state">
              <p style="color: #dc3545;">❌ Gagal memuat data pesanan</p>
            </div>
          </td>
        </tr>
      `;
    }
  }
}

// Filter orders
function filterOrders(filterType) {
  currentFilter = filterType;

  document.querySelectorAll('.filter-tab-modern').forEach(tab => {
    tab.classList.remove('active');
  });
  
  if (event && event.target) {
    const clickedTab = event.target.closest('.filter-tab-modern');
    if (clickedTab) clickedTab.classList.add('active');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filteredOrders = allOrdersData;

  switch (filterType) {
    case 'today':
      filteredOrders = allOrdersData.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      break;

    case 'pickup':
      filteredOrders = allOrdersData.filter(order => {
        const pickupDate = new Date(order.startDate);
        pickupDate.setHours(0, 0, 0, 0);
        return pickupDate.getTime() === today.getTime();
      });
      break;

    case 'return':
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

// Update filter counts
function updateFilterCounts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = {
    all: allOrdersData.length,
    today: allOrdersData.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length,
    pickup: allOrdersData.filter(order => {
      const pickupDate = new Date(order.startDate);
      pickupDate.setHours(0, 0, 0, 0);
      return pickupDate.getTime() === today.getTime();
    }).length,
    return: allOrdersData.filter(order => {
      const returnDate = new Date(order.endDate);
      returnDate.setHours(0, 0, 0, 0);
      return returnDate.getTime() === today.getTime();
    }).length
  };

  if (document.getElementById('filterAllCount')) 
    document.getElementById('filterAllCount').textContent = counts.all;
  if (document.getElementById('filterTodayCount')) 
    document.getElementById('filterTodayCount').textContent = counts.today;
  if (document.getElementById('filterPickupCount')) 
    document.getElementById('filterPickupCount').textContent = counts.pickup;
  if (document.getElementById('filterReturnCount')) 
    document.getElementById('filterReturnCount').textContent = counts.return;
  if (document.getElementById('ordersBadge')) 
    document.getElementById('ordersBadge').textContent = counts.all;
}

// Display orders in table
function displayOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">
          <div class="loading-state">
            <span style="font-size: 3rem;">📦</span>
            <p>Tidak ada pesanan</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tbody.innerHTML = orders.map(order => {
    const isNewOrder = new Date(order.createdAt).setHours(0,0,0,0) === today.getTime();
    const isPickupToday = new Date(order.startDate).setHours(0,0,0,0) === today.getTime();
    const isReturnToday = new Date(order.endDate).setHours(0,0,0,0) === today.getTime();

    const itemsPreview = order.items && order.items.length > 0
      ? order.items.slice(0, 2).map(item => `
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <img src="${item.equipmentImage || '/uploads/default-equipment.jpg'}" 
                 style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;"
                 onerror="this.src='/uploads/default-equipment.jpg'">
            <span style="font-size: 0.9rem;"><strong>${item.equipmentName}</strong> × ${item.quantity}</span>
          </div>
        `).join('') + (order.items.length > 2 ? `<small>+${order.items.length - 2} lainnya</small>` : '')
      : '<small>Tidak ada item</small>';

    return `
      <tr>
        <td>
          <strong>${order.orderNumber || '#' + order._id.substring(0, 8)}</strong>
          ${isNewOrder ? '<br><span class="trend-new">BARU</span>' : ''}
        </td>
        <td>${order.name}</td>
        <td>📱 ${order.phone}${order.email ? '<br>📧 ' + order.email : ''}</td>
        <td>${itemsPreview}</td>
        <td><strong>Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}</strong></td>
        <td>
          <strong>Ambil:</strong> ${formatDate(order.startDate)}
          ${isPickupToday ? '<br><span class="trend-new">HARI INI</span>' : ''}<br>
          <strong>Kembali:</strong> ${formatDate(order.endDate)}
          ${isReturnToday ? '<br><span class="trend-new">HARI INI</span>' : ''}<br>
          <small>(${order.totalDays || 1} hari)</small>
        </td>
        <td>
          <select class="status-dropdown" onchange="updateStatus('${order._id}', this.value)">
            <option value="Menunggu Konfirmasi" ${order.status === 'Menunggu Konfirmasi' ? 'selected' : ''}>⏳ Menunggu</option>
            <option value="Dikonfirmasi" ${order.status === 'Dikonfirmasi' ? 'selected' : ''}>✅ Dikonfirmasi</option>
            <option value="Sedang Disewa" ${order.status === 'Sedang Disewa' ? 'selected' : ''}>🚚 Sedang Disewa</option>
            <option value="Selesai" ${order.status === 'Selesai' ? 'selected' : ''}>🎉 Selesai</option>
            <option value="Dibatalkan" ${order.status === 'Dibatalkan' ? 'selected' : ''}>❌ Dibatalkan</option>
          </select>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-detail" onclick="viewOrderDetails('${order._id}')">👁️ Detail</button>
            <button class="btn-action btn-print" onclick="printThermalReceipt('${order._id}')">🖨️ Cetak</button>
            <button class="btn-action btn-delete-action" onclick="deleteOrder('${order._id}')">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Update statistics
function updateStats(orders) {
  document.getElementById('totalOrders').textContent = orders.length;
  document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'Menunggu Konfirmasi').length;
  document.getElementById('confirmedOrders').textContent = orders.filter(o => o.status === 'Dikonfirmasi' || o.status === 'Sedang Disewa').length;
  document.getElementById('completedOrders').textContent = orders.filter(o => o.status === 'Selesai').length;
}

// ==================== ORDER ACTIONS ====================

// Update order status
async function updateStatus(orderId, newStatus) {
  try {
    showLoading('Mengupdate status...');
    
    const response = await fetch(`/dashboard/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();
    closeLoading();

    if (data.success) {
      showSuccess('Status berhasil diupdate!');
      loadOrders();
    } else {
      showError(data.message || 'Gagal update status');
    }
  } catch (error) {
    closeLoading();
    showError('Terjadi kesalahan saat update status');
  }
}

// Delete order
async function deleteOrder(orderId) {
  const confirmed = await showConfirm('Hapus Pesanan?', 'Tindakan ini tidak dapat dibatalkan.');
  if (!confirmed) return;

  try {
    showLoading('Menghapus pesanan...');
    
    const response = await fetch(`/dashboard/api/orders/${orderId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    closeLoading();

    if (data.success) {
      showSuccess('Pesanan berhasil dihapus!');
      loadOrders();
    } else {
      showError(data.message || 'Gagal menghapus pesanan');
    }
  } catch (error) {
    closeLoading();
    showError('Terjadi kesalahan saat menghapus pesanan');
  }
}

// View order details
function viewOrderDetails(orderId) {
  const order = allOrdersData.find(o => o._id === orderId);
  if (!order) {
    showError('Pesanan tidak ditemukan');
    return;
  }
  
  showOrderDetailModal(order);
}

// Show order detail modal
function showOrderDetailModal(order) {
  const modal = document.getElementById('orderDetailModal');
  const content = document.getElementById('orderDetailContent');

  if (!modal || !content) return;

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
    
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="printThermalReceipt('${order._id}')" class="btn-action btn-print" style="padding: 1rem 2rem;">
        🖨️ Cetak Struk
      </button>
    </div>
  `;

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// ==================== ORDER FORM ====================

// Show add order form
function showAddOrderForm() {
  const formContainer = document.getElementById('orderFormContainer');
  if (formContainer) {
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('orderForm').reset();
    orderItems = [];
    updateSelectedItemsList();
    loadEquipmentForOrder();
  }
}

// Hide order form
function hideOrderForm() {
  const formContainer = document.getElementById('orderFormContainer');
  if (formContainer) formContainer.style.display = 'none';
  orderItems = [];
}

// Load equipment for order form
async function loadEquipmentForOrder() {
  try {
    const response = await fetch('/equipment/api/all');
    const data = await response.json();
    
    if (data.success) {
      allEquipmentData = data.equipment;
      
      const selectEl = document.getElementById('selectEquipment');
      if (selectEl) {
        selectEl.innerHTML = '<option value="">-- Pilih Alat --</option>' +
          data.equipment
            .filter(e => e.available && e.stock > 0)
            .map(e => `<option value="${e._id}">${e.name} - Rp ${e.price.toLocaleString('id-ID')}/hari</option>`)
            .join('');
      }
    }
  } catch (error) {
    showError('Gagal memuat daftar peralatan');
  }
}

// Submit order form
async function submitOrderForm(event) {
  event.preventDefault();
  
  if (orderItems.length === 0) {
    showWarning('Tambahkan minimal 1 peralatan!');
    return;
  }
  
  const startDate = document.getElementById('orderStartDate').value;
  const endDate = document.getElementById('orderEndDate').value;
  
  if (!startDate || !endDate) {
    showWarning('Tanggal sewa harus diisi!');
    return;
  }
  
  const totalDays = calculateRentalDays(startDate, endDate);
  if (totalDays < 1) {
    showError('Tanggal tidak valid!');
    return;
  }
  
  const dailyTotal = orderItems.reduce((sum, item) => sum + (item.equipmentPrice * item.quantity), 0);
  const totalPrice = dailyTotal * totalDays;
  console.log('📅 Rental Period:');
  console.log('  Start:', startDate);
  console.log('  End:', endDate);
  console.log('  Total Days (calculated):', totalDays);
  console.log('  Daily Total:', dailyTotal);
  console.log('  Total Price:', totalPrice);
  const orderData = {
    name: document.getElementById('orderName').value.trim(),
    phone: document.getElementById('orderPhone').value.trim(),
    email: document.getElementById('orderEmail').value.trim(),
    items: orderItems.map(item => ({
      ...item,
      subtotal: item.equipmentPrice * item.quantity * totalDays
    })),
    startDate,
    endDate,
    totalDays,
    totalPrice,
    status: document.getElementById('orderStatus').value,
    notes: document.getElementById('orderNotes').value.trim()
  };
  
  try {
    showLoading('Menyimpan pesanan...');
    
    const response = await fetch('/dashboard/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    closeLoading();
    
    if (data.success) {
      showSuccess('Pesanan berhasil ditambahkan!');
      hideOrderForm();
      loadOrders();
    } else {
      showError(data.message || 'Gagal menambahkan pesanan');
    }
  } catch (error) {
    closeLoading();
    showError('Terjadi kesalahan saat menyimpan pesanan');
  }
}

