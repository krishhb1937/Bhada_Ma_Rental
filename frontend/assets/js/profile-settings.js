document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  // Show payment section only for owners
  if (user.user_type === 'owner') {
    document.getElementById('paymentSection').style.display = 'block';
  }

  loadUserProfile();
  setupFileUpload();
});

async function loadUserProfile() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  try {
    const response = await fetch(`http://localhost:5000/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const profile = await response.json();
      
      // Populate form fields
      document.getElementById('name').value = profile.name || '';
      document.getElementById('email').value = profile.email || '';
      document.getElementById('phone').value = profile.phone || '';
      document.getElementById('upiId').value = profile.upi_id || '';
      
      // Show current payment info
      updatePaymentInfo(profile);
      
      // Show current QR code if exists
      if (profile.qr_code) {
        showCurrentQrCode(profile.qr_code);
      }
    } else {
      throw new Error('Failed to load profile');
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showAlert('Error loading profile. Please try again.', 'error');
  }
}

function updatePaymentInfo(profile) {
  const currentUpiId = document.getElementById('currentUpiId');
  const currentQrStatus = document.getElementById('currentQrStatus');
  
  currentUpiId.textContent = profile.upi_id || 'Not set';
  currentQrStatus.textContent = profile.qr_code ? 'Uploaded' : 'Not uploaded';
}

function showCurrentQrCode(qrCodePath) {
  const currentQrSection = document.getElementById('currentQrSection');
  const currentQrImage = document.getElementById('currentQrImage');
  
  currentQrImage.src = `http://localhost:5000${qrCodePath}`;
  currentQrSection.style.display = 'block';
}

function setupFileUpload() {
  const qrCodeFile = document.getElementById('qrCodeFile');
  const qrPreview = document.getElementById('qrPreview');
  const qrUploadSection = document.getElementById('qrUploadSection');

  // File input change handler
  qrCodeFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      previewImage(file, qrPreview);
    }
  });

  // Drag and drop handlers
  qrUploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    qrUploadSection.classList.add('dragover');
  });

  qrUploadSection.addEventListener('dragleave', () => {
    qrUploadSection.classList.remove('dragover');
  });

  qrUploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    qrUploadSection.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      qrCodeFile.files = e.dataTransfer.files;
      previewImage(file, qrPreview);
    }
  });
}

function previewImage(file, previewElement) {
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewElement.src = e.target.result;
      previewElement.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// Profile form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const formData = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value
  };

  try {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const updatedProfile = await response.json();
      
      // Update localStorage with new user data
      const currentUser = JSON.parse(localStorage.getItem('user'));
      currentUser.name = updatedProfile.name;
      currentUser.phone = updatedProfile.phone;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      showAlert('Profile updated successfully!', 'success');
    } else {
      throw new Error('Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    showAlert('Error updating profile. Please try again.', 'error');
  }
});

// Payment form submission
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const qrCodeFile = document.getElementById('qrCodeFile').files[0];
  const upiId = document.getElementById('upiId').value;

  if (!qrCodeFile && !upiId) {
    showAlert('Please provide either a ID Number or QR code image.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('upi_id', upiId);
  
  if (qrCodeFile) {
    formData.append('qr_code', qrCodeFile);
  }

  try {
    const response = await fetch('http://localhost:5000/api/auth/payment-details', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      showAlert('Payment details updated successfully!', 'success');
      
      // Update the display
      updatePaymentInfo(result);
      
      if (result.qr_code) {
        showCurrentQrCode(result.qr_code);
      }
      
      // Clear the file input
      document.getElementById('qrCodeFile').value = '';
      document.getElementById('qrPreview').style.display = 'none';
    } else {
      throw new Error('Failed to update payment details');
    }
  } catch (error) {
    console.error('Error updating payment details:', error);
    showAlert('Error updating payment details. Please try again.', 'error');
  }
});

async function removeQrCode() {
  if (!confirm('Are you sure you want to remove your QR code?')) {
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const response = await fetch('http://localhost:5000/api/auth/remove-qr-code', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showAlert('QR code removed successfully!', 'success');
      
      // Hide the current QR code section
      document.getElementById('currentQrSection').style.display = 'none';
      
      // Update payment info
      const result = await response.json();
      updatePaymentInfo(result);
    } else {
      throw new Error('Failed to remove QR code');
    }
  } catch (error) {
    console.error('Error removing QR code:', error);
    showAlert('Error removing QR code. Please try again.', 'error');
  }
}

function showAlert(message, type) {
  const alertContainer = document.getElementById('alertContainer');
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alertDiv);
  
  // Auto-remove alert after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 5000);
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
} 