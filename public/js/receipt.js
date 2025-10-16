// ==================== THERMAL RECEIPT PRINTING - PREMIUM VERSION ====================

// Print thermal receipt (optimized for 58mm/80mm thermal printer)
function printThermalReceipt(orderId) {
  const order = allOrdersData.find(o => o._id === orderId);
  if (!order) {
    showError('Pesanan tidak ditemukan');
    return;
  }
  
  const printWindow = window.open('', '_blank', 'width=300,height=700');
  
  // Generate items HTML
  const itemsHtml = order.items && order.items.length > 0
    ? order.items.map((item, idx) => `
        <tr>
          <td style="padding: 2px 0; font-size: 9px;">${idx + 1}</td>
          <td style="padding: 2px 0; font-size: 9px;">${item.equipmentName}</td>
          <td style="padding: 2px 0; text-align: center; font-size: 9px;">${item.quantity}</td>
          <td style="padding: 2px 0; text-align: right; font-size: 9px;">${formatCurrency(item.subtotal)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="text-align:center; padding: 5px; font-size: 9px;">Tidak ada item</td></tr>';
  
  // Status badge styling
  const statusBadge = getStatusBadge(order.status);
  
  const html = `
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
        
        @page { 
          size: 58mm auto; 
          margin: 2mm; 
        }
        
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 9px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          padding: 3mm;
        }
        
        .receipt { 
          width: 100%; 
          max-width: 58mm; 
          margin: 0 auto; 
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
          border-bottom: 2px solid #000;
        }
        
        .logo {
          width: 35mm;
          height: auto;
          margin: 0 auto 2mm;
          display: block;
        }
        
        .company-name {
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
          margin: 1mm 0;
        }
        
        .company-info {
          font-size: 8px;
          margin: 0.5mm 0;
          color: #333;
        }
        
        .receipt-title {
          font-size: 10px;
          font-weight: bold;
          margin: 2mm 0;
          padding: 1mm 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          letter-spacing: 2px;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 1mm 2mm;
          border-radius: 2mm;
          font-size: 7px;
          font-weight: bold;
          margin: 1mm 0;
        }
        
        .status-pending { background: #fff3cd; color: #856404; border: 1px solid #856404; }
        .status-confirmed { background: #d4edda; color: #155724; border: 1px solid #155724; }
        .status-active { background: #d1ecf1; color: #0c5460; border: 1px solid #0c5460; }
        .status-completed { background: #d4edda; color: #155724; border: 1px solid #155724; }
        .status-cancelled { background: #f8d7da; color: #721c24; border: 1px solid #721c24; }
        
        /* Content */
        .section {
          margin: 2mm 0;
        }
        
        .section-title {
          font-size: 8px;
          font-weight: bold;
          margin: 1mm 0;
          border-bottom: 1px solid #333;
          padding-bottom: 0.5mm;
        }
        
        .row { 
          display: flex; 
          justify-content: space-between; 
          margin: 0.5mm 0;
          font-size: 9px;
        }
        
        .row .label {
          font-weight: 600;
          min-width: 12mm;
        }
        
        .row .value {
          text-align: right;
          flex: 1;
        }
        
        .line { 
          border-top: 1px dashed #000; 
          margin: 2mm 0; 
        }
        
        .line-solid {
          border-top: 1px solid #000;
          margin: 2mm 0;
        }
        
        /* Table */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 2mm 0; 
        }
        
        th { 
          background: #000; 
          color: #fff; 
          padding: 1mm;
          font-size: 8px;
          font-weight: bold;
          text-align: left;
        }
        
        td { 
          padding: 1mm 0.5mm;
          font-size: 9px;
          border-bottom: 1px dotted #ccc;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        /* Total */
        .total-section {
          margin-top: 2mm;
          padding-top: 2mm;
          border-top: 2px solid #000;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: bold;
          padding: 1mm 0;
          background: #f0f0f0;
          padding: 2mm;
          border-radius: 1mm;
        }
        
        /* Terms */
        .terms {
          margin: 3mm 0;
          padding: 2mm;
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 1mm;
        }
        
        .terms-title {
          font-size: 8px;
          font-weight: bold;
          margin-bottom: 1mm;
        }
        
        .terms ul {
          margin: 0;
          padding-left: 4mm;
          font-size: 7px;
          line-height: 1.5;
        }
        
        .terms li {
          margin: 0.5mm 0;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          margin-top: 3mm;
          padding-top: 2mm;
          border-top: 2px solid #000;
        }
        
        .footer-text {
          font-size: 9px;
          font-weight: bold;
          margin: 1mm 0;
        }
        
        .footer-subtitle {
          font-size: 8px;
          margin: 0.5mm 0;
        }
        
        .footer-date {
          font-size: 7px;
          color: #666;
          margin-top: 2mm;
        }
        
        /* QR Code placeholder */
        .qr-code {
          width: 20mm;
          height: 20mm;
          margin: 2mm auto;
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7px;
          color: #999;
        }
        
        /* Print specific */
        @media print {
          body { padding: 0; }
          .receipt { max-width: 100%; }
        }
        
        /* Utility classes */
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .small { font-size: 7px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        
        <!-- Header with Logo -->
        <div class="header">
          <img src="/images/logo.png" alt="Basecamp Gear" class="logo" onerror="this.style.display='none'">
          <div class="company-name">BASECAMP GEAR</div>
          <div class="company-info">Rental Alat Outdoor Terpercaya</div>
          <div class="company-info">📍 Ds. Tamansari, Kec. Licin</div>
          <div class="company-info">📱 0831-3125-1615</div>
        </div>
        
        <!-- Receipt Title -->
        <div class="receipt-title center">BUKTI PENYEWAAN</div>
        
        <!-- Order Info Section -->
        <div class="section">
          <div class="row">
            <span class="label">No. Pesanan</span>
            <span class="value bold">${order.orderNumber}</span>
          </div>
          <div class="row">
            <span class="label">Tanggal</span>
            <span class="value">${formatDateCompact(order.createdAt)}</span>
          </div>
          <div class="row">
            <span class="label">Status</span>
            <span class="value">${statusBadge}</span>
          </div>
        </div>
        
        <div class="line"></div>
        
        <!-- Customer Info Section -->
        <div class="section">
          <div class="section-title">DATA PENYEWA</div>
          <div class="row">
            <span class="label">Nama</span>
            <span class="value">${order.name}</span>
          </div>
          <div class="row">
            <span class="label">Telepon</span>
            <span class="value">${order.phone}</span>
          </div>
          ${order.email ? `
          <div class="row">
            <span class="label">Email</span>
            <span class="value small">${order.email}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="line"></div>
        
        <!-- Rental Period Section -->
        <div class="section">
          <div class="section-title">PERIODE SEWA</div>
          <div class="row">
            <span class="label">Ambil</span>
            <span class="value bold">${formatDateCompact(order.startDate)}</span>
          </div>
          <div class="row">
            <span class="label">Kembali</span>
            <span class="value bold">${formatDateCompact(order.endDate)}</span>
          </div>
          <div class="row">
            <span class="label">Durasi</span>
            <span class="value bold">${order.totalDays} Hari</span>
          </div>
        </div>
        
        <div class="line"></div>
        
        <!-- Items Table -->
        <div class="section">
          <div class="section-title">DAFTAR PERALATAN</div>
          <table>
            <thead>
              <tr>
                <th style="width: 8mm;">No</th>
                <th>Item</th>
                <th style="width: 8mm; text-align: center;">Qty</th>
                <th style="width: 15mm; text-align: right;">Harga</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        <!-- Total Section -->
        <div class="total-section">
          <div class="total-row">
            <span>TOTAL BAYAR</span>
            <span>${formatCurrency(order.totalPrice)}</span>
          </div>
        </div>
        
        ${order.notes ? `
        <div class="line"></div>
        <div class="section">
          <div class="section-title">CATATAN</div>
          <div style="font-size: 8px; padding: 1mm 0;">${order.notes}</div>
        </div>
        ` : ''}
        
        <!-- Terms & Conditions -->
        <div class="terms">
          <div class="terms-title">SYARAT & KETENTUAN:</div>
          <ul>
            <li>Tunjukkan KTP/SIM saat ambil alat</li>
            <li>Deposit akan dikembalikan jika kondisi baik</li>
            <li>Keterlambatan: denda 50% per hari</li>
            <li>Kerusakan menjadi tanggung jawab penyewa</li>
            <li>Simpan struk ini untuk pengembalian</li>
          </ul>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">TERIMA KASIH!</div>
          <div class="footer-subtitle">🏕️ Selamat Berpetualang! 🏕️</div>
          <div class="footer-date">Dicetak: ${formatDateTimeCompact(new Date())}</div>
        </div>
        
      </div>
      
      <script>
        window.onload = function() {
          // Auto print after load
          setTimeout(() => {
            window.print();
          }, 500);
          
          // Auto close after print
          window.onafterprint = function() {
            setTimeout(() => window.close(), 1000);
          };
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

// Helper: Get status badge HTML
function getStatusBadge(status) {
  const statusMap = {
    'Menunggu Konfirmasi': '<span class="status-badge status-pending">MENUNGGU</span>',
    'Dikonfirmasi': '<span class="status-badge status-confirmed">DIKONFIRMASI</span>',
    'Sedang Disewa': '<span class="status-badge status-active">AKTIF</span>',
    'Selesai': '<span class="status-badge status-completed">SELESAI</span>',
    'Dibatalkan': '<span class="status-badge status-cancelled">DIBATALKAN</span>'
  };
  return statusMap[status] || status;
}

// Helper: Format currency
function formatCurrency(amount) {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

// Helper: Format date time compact
function formatDateTimeCompact(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

console.log('🖨️ Thermal Receipt Module Loaded ✨');
