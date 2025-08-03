document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('id');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
  
    fetch(`https://bhada-ma-rental.onrender.com/api/properties/${propertyId}`)
      .then(res => res.json())
      .then(property => {
        // Create image gallery with proper styling
        let imagesHTML = '';
        if (property.photos && property.photos.length > 0) {
          imagesHTML = `
            <div class="property-gallery">
                             ${property.photos.map((photo, index) => `
                 <div class="gallery-item">
                   <div class="image-loading" id="loading-${index}">Loading...</div>
                   <img src="https://bhada-ma-rental.onrender.com${photo}" 
                        alt="${property.title} - Image ${index + 1}" 
                        onclick="openImageModal('https://bhada-ma-rental.onrender.com${photo}')"
                        onload="document.getElementById('loading-${index}').style.display='none'; this.classList.remove('loading');"
                        onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGM0UwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiMyMTIxMjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5GgIEltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+'; this.style.cursor='default'; this.onclick=null; document.getElementById('loading-${index}').style.display='none';"
                        class="loading"
                        style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; cursor: pointer; transition: transform 0.3s ease;">
                 </div>
               `).join('')}
            </div>
          `;
        } else {
          imagesHTML = `
            <div class="no-image-placeholder" style="width: 100%; height: 300px; background: linear-gradient(135deg, #E0C097 0%, #FFD700 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #212121; font-size: 1.5rem; font-weight: 500;">
              📸 No Images Available
            </div>
          `;
        }

        document.getElementById('propertyDetail').innerHTML = `
          <div class="property-header-info">
            <h2 style="font-family: 'Playfair Display', serif; color: #212121; margin-bottom: 1rem;">${property.title}</h2>
            <div class="property-meta" style="display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
              <span style="background: #FFD700; color: #212121; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600;">₹${property.price?.toLocaleString() || 'Contact for pricing'}</span>
              <span style="background: #E0C097; color: #212121; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600;">${property.property_type || 'Property'}</span>
              <span style="background: #212121; color: #FAF3E0; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600;">📍 ${property.location}</span>
            </div>
          </div>
          
          ${imagesHTML}
          
          <div class="property-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin: 2rem 0;">
            <div class="detail-card" style="background: #FAF3E0; padding: 1.5rem; border-radius: 12px; border: 1px solid #E0C097;">
              <h4 style="color: #212121; margin-bottom: 0.5rem;">🏠 Property Details</h4>
              <p><strong>Type:</strong> ${property.property_type || 'Not specified'}</p>
              <p><strong>Bedrooms:</strong> ${property.bedrooms || 0}</p>
              <p><strong>Bathrooms:</strong> ${property.bathrooms || 0}</p>
              <p><strong>Status:</strong> <span style="color: ${property.status === 'available' ? '#28a745' : '#dc3545'}; font-weight: 600;">${property.status === 'available' ? 'Available' : 'Rented'}</span></p>
            </div>
            
            <div class="detail-card" style="background: #FAF3E0; padding: 1.5rem; border-radius: 12px; border: 1px solid #E0C097;">
              <h4 style="color: #212121; margin-bottom: 0.5rem;">📍 Location</h4>
              <p><strong>Address:</strong> ${property.location}</p>
              <p><strong>Price:</strong> ₹${property.price?.toLocaleString() || 'Contact for pricing'}</p>
            </div>
          </div>
          
          <div class="property-description" style="background: #FFFFFF; padding: 2rem; border-radius: 12px; border: 1px solid #E0C097; margin: 2rem 0;">
            <h4 style="color: #212121; margin-bottom: 1rem;">📝 Description</h4>
            <p style="line-height: 1.6; color: #666;">${property.description || 'No description available for this property.'}</p>
          </div>
        `;
  
        if (user && user.user_type === 'renter') {
          document.getElementById('bookingSection').style.display = 'block';

          if (property.owner_id && property.owner_id._id) {
            const messageLink = document.createElement('a');
            messageLink.href = `messaging.html?id=${property._id}&user=${property.owner_id._id}`;
            messageLink.textContent = '💬 Message Owner';
            messageLink.style.display = 'inline-block';
            messageLink.style.marginTop = '10px';
        
            document.getElementById('bookingSection').appendChild(messageLink);
          }
  //         document.getElementById('propertyDetail').innerHTML += `
  //         ${property.owner_id && property.owner_id._id 
  //           ? `<a href="messages.html?id=${property._id}&user=${property.owner_id._id}">Message Owner</a>` 
  //           : '<p><i>Owner info unavailable.</i></p>'}          
  // `;

        }

      });
  
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const move_in_date = form.move_in_date.value;
      const total_amount = form.total_amount.value;
  
      try {
        const res = await fetch('https://bhada-ma-rental.onrender.com/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            property_id: propertyId,
            move_in_date,
            total_amount
          })
        });
  
        const data = await res.json();
        if (res.ok) {
          alert('Booking request sent!');
          form.reset();
        } else {
          alert(data.message || 'Booking failed');
        }
      } catch (err) {
        console.error(err);
        alert('Error occurred during booking');
      }
    });
  });

// Image modal function
function openImageModal(imageSrc) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    cursor: pointer;
  `;
  
  const img = document.createElement('img');
  img.src = imageSrc;
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 8px;
  `;
  
  modal.appendChild(img);
  document.body.appendChild(modal);
  
  modal.onclick = () => {
    document.body.removeChild(modal);
  };
}

// Add CSS for property gallery
const style = document.createElement('style');
style.textContent = `
  .property-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
  }
  
  .gallery-item {
    position: relative;
    overflow: hidden;
  }
  
  .gallery-item img {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .gallery-item img:hover {
    transform: scale(1.05);
  }
  
  .gallery-item img.loading {
    opacity: 0.7;
  }
  
  .image-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #666;
    font-size: 0.9rem;
  }
  
  @media (max-width: 768px) {
    .property-gallery {
      grid-template-columns: 1fr;
    }
    
    .property-meta {
      flex-direction: column;
      gap: 1rem !important;
    }
  }
`;
document.head.appendChild(style);