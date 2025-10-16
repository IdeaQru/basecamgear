// ==================== EQUIPMENT MANAGEMENT ====================

// Load all equipment
async function loadEquipment() {
  try {
    const response = await fetch('/equipment/api/all');
    const data = await response.json();
    
    if (data.success) {
      // Update global variable dari dashboard.js
      if (typeof allEquipmentData !== 'undefined') {
        allEquipmentData = data.equipment;
      }
      displayEquipment(data.equipment);
    } else {
      showError('Gagal memuat data peralatan');
    }
  } catch (error) {
    console.error('Error loading equipment:', error);
    showError('Gagal memuat data peralatan');
    
    const grid = document.getElementById('equipmentGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="loading-state">
          <p style="color: #dc3545;">❌ Gagal memuat data peralatan</p>
        </div>
      `;
    }
  }
}

// Display equipment
function displayEquipment(equipment) {
  const grid = document.getElementById('equipmentGrid');
  
  if (!grid) return;
  
  if (equipment.length === 0) {
    grid.innerHTML = `
      <div class="loading-state">
        <span style="font-size: 3rem;">📦</span>
        <p>Belum ada peralatan</p>
        <p style="font-size: 0.9rem; color: var(--color4); margin-top: 0.5rem;">
          Klik tombol "Tambah Alat" untuk menambah peralatan baru
        </p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = equipment.map(item => `
    <div class="equipment-card-modern">
      <img src="${item.image || '/uploads/default-equipment.jpg'}" 
           alt="${item.name}" 
           class="equipment-image-modern"
           onerror="this.src='/uploads/default-equipment.jpg'">
      <div class="equipment-info-modern">
        <span class="equipment-category-modern">${item.category}</span>
        <h4>${item.name}</h4>
        <p class="equipment-price-modern">Rp ${item.price.toLocaleString('id-ID')}/hari</p>
        <p class="equipment-stock-modern">
          📦 Stok: <strong>${item.stock}</strong> unit
          ${item.available ? '<span style="color: #28a745;">✅ Tersedia</span>' : '<span style="color: #dc3545;">❌ Tidak Tersedia</span>'}
        </p>
        ${item.description ? `<p class="equipment-desc-modern">${item.description}</p>` : ''}
        <div class="equipment-actions-modern">
          <button class="btn-edit-modern" onclick="editEquipment('${item._id}')">
            ✏️ Edit
          </button>
          <button class="btn-delete-modern" onclick="deleteEquipment('${item._id}')">
            🗑️ Hapus
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Show add equipment form
function showAddEquipmentForm() {
  const formContainer = document.getElementById('equipmentFormContainer');
  if (formContainer) {
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Reset form
    document.getElementById('equipmentForm').reset();
    document.getElementById('equipmentId').value = '';
    
    // Clear file name display
    const fileName = document.getElementById('fileName');
    if (fileName) {
      fileName.textContent = 'Belum ada file dipilih';
      fileName.classList.remove('selected');
    }
    
    // Clear preview
    clearFileInputPreview();
  }
}

// Hide equipment form
function hideEquipmentForm() {
  const formContainer = document.getElementById('equipmentFormContainer');
  if (formContainer) {
    formContainer.style.display = 'none';
    document.getElementById('equipmentForm').reset();
    clearFileInputPreview();
  }
}

// Edit equipment
async function editEquipment(id) {
  try {
    const response = await fetch(`/equipment/api/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const equipment = data.equipment;
      
      // Show form
      showAddEquipmentForm();
      
      // Fill form with equipment data
      document.getElementById('equipmentId').value = equipment._id;
      document.getElementById('equipmentName').value = equipment.name;
      document.getElementById('equipmentPrice').value = equipment.price;
      document.getElementById('equipmentCategory').value = equipment.category;
      document.getElementById('equipmentStock').value = equipment.stock;
      document.getElementById('equipmentDescription').value = equipment.description || '';
      
      // Show current image preview if exists
      if (equipment.image) {
        showImagePreview(equipment.image, 'Gambar saat ini');
      }
    } else {
      showError('Gagal memuat data peralatan');
    }
  } catch (error) {
    console.error('Error editing equipment:', error);
    showError('Gagal memuat data peralatan');
  }
}

// Delete equipment
async function deleteEquipment(id) {
  const confirmed = await showConfirm(
    'Hapus Peralatan?',
    'Apakah Anda yakin ingin menghapus peralatan ini? Tindakan ini tidak dapat dibatalkan.'
  );
  
  if (!confirmed) return;
  
  try {
    showLoading('Menghapus peralatan...');
    
    const response = await fetch(`/equipment/api/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    closeLoading();
    
    if (data.success) {
      showSuccess('Peralatan berhasil dihapus!');
      loadEquipment();
    } else {
      showError(data.message || 'Gagal menghapus peralatan');
    }
  } catch (error) {
    closeLoading();
    console.error('Error deleting equipment:', error);
    showError('Terjadi kesalahan saat menghapus peralatan');
  }
}

// Submit equipment form - FIXED VERSION
async function submitEquipmentForm(event) {
  event.preventDefault();
  
  console.log('🔍 Form submitted');
  
  const equipmentId = document.getElementById('equipmentId').value;
  
  // Ambil langsung dari form element
  const form = event.target;
  const formData = new FormData(form);
  
  // Debug FormData
  console.log('📋 FormData entries:');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  // Validate image
  const imageFile = formData.get('image');
  console.log('🖼️ Image from FormData:', imageFile);
  
  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    console.log('✅ Valid image file detected');
    
    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      showWarning('Ukuran file terlalu besar! Maksimal 5MB');
      return;
    }
    
    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      showWarning('File harus berupa gambar (JPG, PNG, GIF)');
      return;
    }
  } else {
    console.log('⚠️ No valid image file in FormData');
  }
  
  try {
    const isEdit = equipmentId ? true : false;
    showLoading(isEdit ? 'Mengupdate peralatan...' : 'Menambah peralatan...');
    
    const url = isEdit ? `/equipment/api/${equipmentId}` : '/equipment/api/create';
    const method = isEdit ? 'PUT' : 'POST';
    
    console.log('🚀 Sending request:', method, url);
    
    const response = await fetch(url, {
      method: method,
      body: formData
    });
    
    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response data:', data);
    
    closeLoading();
    
    if (data.success) {
      console.log('✅ Success!');
      console.log('🖼️ Saved image:', data.equipment?.image);
      
      showSuccess(isEdit ? 'Peralatan berhasil diupdate!' : 'Peralatan berhasil ditambahkan!');
      hideEquipmentForm();
      loadEquipment();
    } else {
      showError(data.message || 'Gagal menyimpan peralatan');
    }
  } catch (error) {
    closeLoading();
    console.error('❌ Error:', error);
    showError('Terjadi kesalahan saat menyimpan peralatan');
  }
}

// Setup file input preview
function setupFileInputPreview() {
  const fileInput = document.getElementById('equipmentImage');
  const fileName = document.getElementById('fileName');
  
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      console.log('📁 File input changed:', file);
      
      // Update file name display
      if (fileName) {
        if (file) {
          fileName.textContent = file.name;
          fileName.classList.add('selected');
        } else {
          fileName.textContent = 'Belum ada file dipilih';
          fileName.classList.remove('selected');
        }
      }
      
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showWarning('File harus berupa gambar (JPG, PNG, GIF)');
          this.value = '';
          clearFileInputPreview();
          return;
        }
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showWarning('Ukuran file terlalu besar! Maksimal 5MB');
          this.value = '';
          clearFileInputPreview();
          return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
          showImagePreview(e.target.result, file.name);
        };
        reader.readAsDataURL(file);
      } else {
        clearFileInputPreview();
      }
    });
  }
}

// Show image preview
function showImagePreview(imageSrc, fileName = '') {
  const fileInputContainer = document.querySelector('.file-input-container');
  if (!fileInputContainer) return;
  
  // Remove existing preview
  clearFileInputPreview();
  
  // Create preview element
  const previewDiv = document.createElement('div');
  previewDiv.className = 'image-preview-container';
  
  previewDiv.innerHTML = `
    <img src="${imageSrc}" 
         alt="Preview" 
         class="preview-image">
    ${fileName ? `<p class="preview-info">📷 ${fileName}</p>` : ''}
    <button type="button" onclick="clearFileInputPreview()" class="btn-remove-preview">
      🗑️ Hapus Gambar
    </button>
  `;
  
  fileInputContainer.appendChild(previewDiv);
}

// Clear file input preview
// Clear file input preview - SIMPLE VERSION
function clearFileInputPreview() {
  // JANGAN clear input file saat preview dihapus
  // Hanya clear saat form di-reset atau ditutup
  const preview = document.querySelector('.image-preview-container');
  if (preview) {
    preview.remove();
  }
  
  // JANGAN ini: fileInput.value = '';
  // Biarkan file tetap ada di input
}

// Dan update hideEquipmentForm():
function hideEquipmentForm() {
  const formContainer = document.getElementById('equipmentFormContainer');
  if (formContainer) {
    formContainer.style.display = 'none';
    
    // Reset form (ini akan clear semua input termasuk file)
    const form = document.getElementById('equipmentForm');
    form.reset();
    
    // Clear preview
    const preview = document.querySelector('.image-preview-container');
    if (preview) preview.remove();
    
    // Reset file name display
    const fileName = document.getElementById('fileName');
    if (fileName) {
      fileName.textContent = 'Belum ada file dipilih';
      fileName.classList.remove('selected');
    }
  }
}


// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Setup equipment form submit handler
  const equipmentForm = document.getElementById('equipmentForm');
  if (equipmentForm) {
    equipmentForm.addEventListener('submit', submitEquipmentForm);
  }
  
  // Setup file input preview
  setupFileInputPreview();
  
  console.log('⚙️ Equipment Module Loaded ✨');
});
