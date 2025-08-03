document.getElementById('addPropertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding Property...';
    
    const formData = new FormData(form);
    const token = localStorage.getItem('token');
    
    // Validate required fields
    const title = formData.get('title');
    const price = formData.get('price');
    const location = formData.get('location');
    const property_type = formData.get('property_type');
    
    if (!title || !price || !location || !property_type) {
      alert('Please fill in all required fields: Title, Price, Location, and Property Type');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }
    
    // Validate price
    if (isNaN(price) || Number(price) <= 0) {
      alert('Please enter a valid price (positive number)');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }
  
    try {
      const res = await fetch('https://bhada-ma-rental.onrender.com/api/properties', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
  
      const data = await res.json();
      if (res.ok) {
        alert('Property added successfully!');
        form.reset();
        // Redirect to dashboard after successful addition
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        const errorMessage = data.error || data.message || 'Failed to add property';
        alert(`Error: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Error adding property:', err);
      alert('Network error. Please check your connection and try again.');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

// File validation function
function validateFiles(input) {
  const files = input.files;
  const validationDiv = document.getElementById('fileValidation');
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  let validFiles = true;
  let message = '';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check file size
    if (file.size > maxSize) {
      message += `⚠️ ${file.name} is too large (max 5MB)<br>`;
      validFiles = false;
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      message += `⚠️ ${file.name} is not a valid image file (JPG, PNG only)<br>`;
      validFiles = false;
    }
  }
  
  if (files.length > 0 && validFiles) {
    message = `✅ ${files.length} file(s) selected and valid`;
  }
  
  validationDiv.innerHTML = message;
  
  // Clear invalid files
  if (!validFiles) {
    input.value = '';
  }
}

// Form reset confirmation
function confirmReset() {
  if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
    document.getElementById('addPropertyForm').reset();
    document.getElementById('fileValidation').innerHTML = '';
  }
}