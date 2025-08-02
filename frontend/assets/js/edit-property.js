checkAuth();

const propertyId = new URLSearchParams(window.location.search).get('id');
const form = document.getElementById('editPropertyForm');
const loadingMessage = document.getElementById('loadingMessage');
const token = localStorage.getItem('token');

if (!propertyId) {
  alert('Property ID is required');
  window.location.href = 'dashboard.html';
}

// Load property data to pre-fill
fetch(`http://localhost:5000/api/properties/${propertyId}`)
  .then(res => {
    if (!res.ok) {
      throw new Error('Failed to load property');
    }
    return res.json();
  })
  .then(data => {
    // Hide loading message and show form
    loadingMessage.style.display = 'none';
    form.style.display = 'block';
    
    // Pre-fill form fields
    form.title.value = data.title || '';
    form.description.value = data.description || '';
    form.price.value = data.price || '';
    form.location.value = data.location || '';
    form.property_type.value = data.property_type || 'villa';
    form.bedrooms.value = data.bedrooms || '';
    form.bathrooms.value = data.bathrooms || '';
  })
  .catch(error => {
    console.error('Error loading property:', error);
    loadingMessage.innerHTML = '<div class="error">Failed to load property details. Please try again.</div>';
  });

// Update on submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Updating...';
  
  const formData = new FormData(form);
  const updatedData = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`http://localhost:5000/api/properties/${propertyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });

    const data = await res.json();
    if (res.ok) {
      alert('Property updated successfully!');
      window.location.href = 'dashboard.html';
    } else {
      alert(data.message || data.error || 'Update failed');
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
