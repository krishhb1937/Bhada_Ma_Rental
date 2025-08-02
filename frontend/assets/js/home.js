const form = document.getElementById('searchForm');
const list = document.getElementById('propertyList');

// Initial fetch (all properties)
fetchProperties();

// On form submit
form.addEventListener('submit', function(e) {
  e.preventDefault();
  const query = new URLSearchParams(new FormData(form)).toString();
  fetchProperties(query);
});

function fetchProperties(query = '') {
  // Show loading state
  list.innerHTML = '<div class="loading">Discovering luxury properties...</div>';
  
  fetch(`https://bhada-ma-rental.onrender.com/api/properties?${query}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        list.innerHTML = `
          <div class="no-properties">
            <h3>No properties found</h3>
            <p>Try adjusting your search criteria or browse our complete collection.</p>
          </div>`;
        return;
      }

      list.innerHTML = data.map(p => createPropertyCard(p)).join('');
    })
    .catch(err => {
      console.error(err);
      list.innerHTML = `
        <div class="error">
          <h3>Error loading properties</h3>
          <p>Please try again later or contact our support team.</p>
        </div>`;
    });
}

function createPropertyCard(property) {
  const imageUrl = property.photos && property.photos[0] 
    ? `https://bhada-ma-rental.onrender.com${property.photos[0]}` 
    : null;
  
  const statusClass = property.status === 'available' ? 'status-available' : 'status-occupied';
  const statusText = property.status === 'available' ? 'Available' : 'Occupied';
  
  return `
    <div class="property-card">
      <div class="property-image">
        ${imageUrl 
          ? `<img src="${imageUrl}" alt="${property.title}" style="width: 100%; height: 100%; object-fit: cover;">` 
          : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #E0C097 0%, #FFD700 100%); color: #212121; font-size: 1.2rem; font-weight: 500;">
              ${property.property_type || 'Luxury Villa'}
            </div>`
        }
      </div>
      <div class="property-content">
        <h3 class="property-title">${property.title}</h3>
        <div class="property-location">
          <span>📍</span>
          <span>${property.location}</span>
        </div>
        <div class="property-price">₹${property.price?.toLocaleString() || 'Contact for pricing'}</div>
        <p class="property-description">${property.description || 'Experience luxury living at its finest with this exceptional property.'}</p>
        <div class="property-details">
          <span class="property-type">${property.property_type || 'Villa'}</span>
          <span class="property-status ${statusClass}">${statusText}</span>
        </div>
        <a href="property-detail.html?id=${property._id}" class="property-btn">View Details</a>
      </div>
    </div>
  `;
}

// Add smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll to properties section when search is submitted
  form.addEventListener('submit', function() {
    setTimeout(() => {
      document.querySelector('.featured-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 500);
  });
  
  // Add loading animation to search button
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  }
});

// Add CSS for additional property card styles
const additionalStyles = `
  <style>
    .property-details {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    
    .property-type {
      background: #E0C097;
      color: #212121;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .property-status {
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-available {
      background: #d4edda;
      color: #155724;
    }
    
    .status-occupied {
      background: #f8d7da;
      color: #721c24;
    }
    
    .no-properties {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
    
    .no-properties h3 {
      color: #212121;
      margin-bottom: 1rem;
    }
  </style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);
