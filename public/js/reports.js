// ==================== REPORTS & ANALYTICS ====================

// Load report statistics
async function loadReportStats() {
  try {
    showLoading('Memuat statistik laporan...');
    
    const response = await fetch('/dashboard/api/orders');
    const data = await response.json();
    
    closeLoading();
    
    if (data.success) {
      const orders = data.orders;
      calculateReportStats(orders);
    } else {
      showError('Gagal memuat data laporan');
    }
  } catch (error) {
    closeLoading();
    console.error('Error loading report stats:', error);
    showError('Gagal memuat data laporan');
  }
}

// Calculate report statistics
function calculateReportStats(orders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Today's orders
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });
  
  // Last 7 days
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  const last7DaysOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= last7Days;
  });
  
  // Last 30 days
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  const last30DaysOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= last30Days;
  });
  
  // Update count elements
  const reportTodayEl = document.getElementById('reportToday');
  const report7DaysEl = document.getElementById('report7Days');
  const report30DaysEl = document.getElementById('report30Days');
  const reportAllEl = document.getElementById('reportAll');
  
  if (reportTodayEl) reportTodayEl.textContent = todayOrders.length;
  if (report7DaysEl) report7DaysEl.textContent = last7DaysOrders.length;
  if (report30DaysEl) report30DaysEl.textContent = last30DaysOrders.length;
  if (reportAllEl) reportAllEl.textContent = orders.length;
  
  // Calculate revenue
  const totalRevenue = last30DaysOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const avgOrder = last30DaysOrders.length > 0 ? totalRevenue / last30DaysOrders.length : 0;
  
  const totalRevenueEl = document.getElementById('totalRevenue');
  const avgOrderValueEl = document.getElementById('avgOrderValue');
  
  if (totalRevenueEl) totalRevenueEl.textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
  if (avgOrderValueEl) avgOrderValueEl.textContent = `Rp ${Math.round(avgOrder).toLocaleString('id-ID')}`;
  
  // Find top equipment
  const equipmentCount = {};
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const name = item.equipmentName || 'Unknown';
        equipmentCount[name] = (equipmentCount[name] || 0) + (item.quantity || 0);
      });
    }
  });
  
  const topEquipmentEl = document.getElementById('topEquipment');
  if (topEquipmentEl) {
    if (Object.keys(equipmentCount).length > 0) {
      const topEquipment = Object.keys(equipmentCount).reduce((a, b) => 
        equipmentCount[a] > equipmentCount[b] ? a : b
      );
      topEquipmentEl.textContent = `${topEquipment} (${equipmentCount[topEquipment]}×)`;
    } else {
      topEquipmentEl.textContent = '-';
    }
  }
  
  // Find top status
  const statusCount = {};
  orders.forEach(o => {
    const status = o.status || 'Unknown';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  const topStatusEl = document.getElementById('topStatus');
  if (topStatusEl) {
    if (Object.keys(statusCount).length > 0) {
      const topStatus = Object.keys(statusCount).reduce((a, b) => 
        statusCount[a] > statusCount[b] ? a : b
      );
      topStatusEl.textContent = `${topStatus} (${statusCount[topStatus]})`;
    } else {
      topStatusEl.textContent = '-';
    }
  }
}

// Export report to CSV
function exportReport(period) {
  if (typeof allOrdersData === 'undefined' || !allOrdersData || allOrdersData.length === 0) {
    showWarning('Tidak ada data pesanan untuk diexport');
    return;
  }
  
  let filteredOrders = allOrdersData;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (period) {
    case 'today':
      filteredOrders = allOrdersData.filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      break;
      
    case 'week':
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      filteredOrders = allOrdersData.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= last7Days;
      });
      break;
      
    case 'month':
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);
      filteredOrders = allOrdersData.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= last30Days;
      });
      break;
      
    case 'all':
    default:
      filteredOrders = allOrdersData;
      break;
  }
  
  if (filteredOrders.length === 0) {
    showWarning('Tidak ada data untuk periode ini');
    return;
  }
  
  const periodNames = {
    'today': 'Hari_Ini',
    'week': '7_Hari_Terakhir',
    'month': '30_Hari_Terakhir',
    'all': 'Semua_Data'
  };
  
  const filename = `Laporan_${periodNames[period]}_${formatDateForFilename(new Date())}`;
  exportToCSV(filteredOrders, filename);
}

// Export custom date range
function exportCustomRange() {
  const startDateInput = document.getElementById('reportStartDate');
  const endDateInput = document.getElementById('reportEndDate');
  
  if (!startDateInput || !endDateInput) {
    showError('Element tanggal tidak ditemukan');
    return;
  }
  
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  
  if (!startDate || !endDate) {
    showWarning('Pilih rentang tanggal terlebih dahulu!');
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Validate date range
  if (start > end) {
    showWarning('Tanggal mulai harus lebih awal dari tanggal akhir!');
    return;
  }
  
  if (typeof allOrdersData === 'undefined' || !allOrdersData || allOrdersData.length === 0) {
    showWarning('Tidak ada data pesanan untuk diexport');
    return;
  }
  
  // Set time to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  const filteredOrders = allOrdersData.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= start && orderDate <= end;
  });
  
  if (filteredOrders.length === 0) {
    showWarning('Tidak ada data untuk rentang tanggal ini');
    return;
  }
  
  const filename = `Laporan_${formatDateForFilename(start)}_sampai_${formatDateForFilename(end)}`;
  exportToCSV(filteredOrders, filename);
}

// Export to CSV function
function exportToCSV(orders, filename) {
  if (!orders || orders.length === 0) {
    showWarning('Tidak ada data untuk diexport');
    return;
  }
  
  try {
    // CSV Header
    let csv = 'No. Pesanan,Tanggal Pesan,Nama Penyewa,Telepon,Email,Tanggal Ambil,Tanggal Kembali,Durasi (hari),Peralatan,Jumlah Item,Total Harga,Status,Catatan\n';
    
    // CSV Rows
    orders.forEach(order => {
      // Format items
      const items = order.items && Array.isArray(order.items)
        ? order.items.map(i => `${i.equipmentName || 'Unknown'} (${i.quantity || 0})`).join('; ')
        : 'Tidak ada item';
      
      const itemCount = order.items && Array.isArray(order.items)
        ? order.items.reduce((sum, i) => sum + (i.quantity || 0), 0)
        : 0;
      
      // Escape and format values
      const orderNumber = escapeCSV(order.orderNumber || order._id?.substring(0, 8) || '-');
      const createdAt = formatDateForCSV(order.createdAt);
      const name = escapeCSV(order.name || '-');
      const phone = escapeCSV(order.phone || '-');
      const email = escapeCSV(order.email || '-');
      const startDate = formatDateForCSV(order.startDate);
      const endDate = formatDateForCSV(order.endDate);
      const totalDays = order.totalDays || 1;
      const itemsFormatted = escapeCSV(items);
      const totalPrice = order.totalPrice || 0;
      const status = escapeCSV(order.status || '-');
      const notes = escapeCSV(order.notes || '-');
      
      csv += `"${orderNumber}","${createdAt}","${name}","${phone}","${email}","${startDate}","${endDate}","${totalDays}","${itemsFormatted}","${itemCount}","${totalPrice}","${status}","${notes}"\n`;
    });
    
    // Create and download file
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess(`Export berhasil! File: ${filename}.csv`);
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showError('Gagal mengexport data');
  }
}

// Helper function to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // Replace double quotes with two double quotes
  return stringValue.replace(/"/g, '""');
}

// Helper function to format date for CSV
function formatDateForCSV(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// Helper function to format date for filename
function formatDateForFilename(date) {
  if (!date) return 'unknown';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
}

// Print all reports (advanced feature)
function printReports(period) {
  let filteredOrders = [];
  
  if (typeof allOrdersData === 'undefined' || !allOrdersData || allOrdersData.length === 0) {
    showWarning('Tidak ada data pesanan untuk dicetak');
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (period) {
    case 'today':
      filteredOrders = allOrdersData.filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      break;
      
    case 'week':
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      filteredOrders = allOrdersData.filter(o => new Date(o.createdAt) >= last7Days);
      break;
      
    case 'month':
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);
      filteredOrders = allOrdersData.filter(o => new Date(o.createdAt) >= last30Days);
      break;
      
    default:
      filteredOrders = allOrdersData;
      break;
  }
  
  if (filteredOrders.length === 0) {
    showWarning('Tidak ada data untuk dicetak');
    return;
  }
  
  printReportTable(filteredOrders, period);
}

// Print report table
function printReportTable(orders, period) {
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  
  const periodNames = {
    'today': 'Hari Ini',
    'week': '7 Hari Terakhir',
    'month': '30 Hari Terakhir',
    'all': 'Semua Data'
  };
  
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalItems = orders.reduce((sum, o) => {
    return sum + (o.items ? o.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0);
  }, 0);
  
  const rowsHTML = orders.map((order, index) => {
    const items = order.items && Array.isArray(order.items)
      ? order.items.map(i => `${i.equipmentName || 'Unknown'} (${i.quantity || 0})`).join(', ')
      : '-';
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.orderNumber || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDateForCSV(order.createdAt)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.name || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.phone || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 0.85em;">${items}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.status || '-'}</td>
      </tr>
    `;
  }).join('');
  
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Penyewaan - ${periodNames[period]}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { font-size: 14px; color: #666; }
        .summary { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #606C38; color: white; padding: 10px; text-align: left; font-size: 12px; }
        td { padding: 8px; border: 1px solid #ddd; font-size: 11px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        @media print {
          body { padding: 10px; }
          @page { size: landscape; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BASECAMP GEAR</h1>
        <p>Laporan Penyewaan - ${periodNames[period]}</p>
        <p>Dicetak: ${formatDateForCSV(new Date())}</p>
      </div>
      
      <div class="summary">
        <div class="summary-row">
          <strong>Total Pesanan:</strong>
          <span>${orders.length}</span>
        </div>
        <div class="summary-row">
          <strong>Total Item:</strong>
          <span>${totalItems}</span>
        </div>
        <div class="summary-row">
          <strong>Total Pendapatan:</strong>
          <span>Rp ${totalRevenue.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>No. Pesanan</th>
            <th>Tanggal</th>
            <th>Nama</th>
            <th>Telepon</th>
            <th>Peralatan</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Basecamp Gear - Rental Alat Outdoor</p>
        <p>📱 0831-3125-1615 | 📍 Dusun Jambu, Desa Tamansari, Kecamatan Licin</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  showInfo('Membuka jendela cetak laporan...');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Reports Module Loaded ✨');
});
