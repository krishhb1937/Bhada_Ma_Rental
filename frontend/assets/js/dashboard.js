const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Update user info display with proper styling
document.getElementById('userInfo').innerHTML = `
  <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
  <div class="user-name">${user.name}</div>
  <div class="user-type">${user.user_type}</div>
`;

if (user.user_type === 'owner') {
  document.getElementById('ownerSection').style.display = 'block';

  // Get owner properties
  fetch('http://localhost:5000/api/properties', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const myProps = data.filter(p => p.owner_id._id === user._id || p.owner_id === user._id);
      document.getElementById('myProperties').innerHTML = myProps.map(p => `
        <div class="booking-card">
          <div class="booking-image">
            ${p.photos[0] ? `<img src="http://localhost:5000${p.photos[0]}" alt="${p.title}">` : '<div class="no-image">No Image</div>'}
          </div>
          <div class="booking-content">
            <h4 class="booking-title">${p.title}</h4>
            <p class="booking-location">📍 ${p.location}</p>
            <p class="booking-price">₹${p.price.toLocaleString()}</p>
            <div class="booking-actions">
              <a href="property-detail.html?id=${p._id}" class="btn btn-primary">View Details</a>
              <button onclick="editProperty('${p._id}')" class="btn btn-secondary">Edit</button>
              <button onclick="deleteProperty('${p._id}')" class="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      `).join('');
    });

  // Get booking requests
  fetch('http://localhost:5000/api/bookings/owner', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const bookingsHtml = data.map(b => `
        <div class="booking-card" data-booking-id="${b._id}">
          <div class="booking-content">
            <h4 class="booking-title">${b.property_id?.title || 'Property'}</h4>
            <div class="booking-details">
              <p><strong>Renter:</strong> ${b.renter_id?.name || 'N/A'}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${b.status}">${b.status}</span></p>
              <p><strong>Move In:</strong> ${new Date(b.move_in_date).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> ₹${b.total_amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div class="booking-actions">
              ${b.status === 'pending' ? `
                <button onclick="updateBooking('${b._id}', 'confirmed')" class="btn btn-success">Confirm</button>
                <button onclick="updateBooking('${b._id}', 'rejected')" class="btn btn-danger">Reject</button>
              ` : ''}
              ${
                b.owner_id && b.owner_id._id
                  ? `<a href="messaging.html?id=${b.property_id._id}&user=${b.renter_id._id}" class="btn btn-chat">💬 Chat with Renter</a>`
                  : ''
              }
            </div>
          </div>
        </div>
      `).join('');
      document.getElementById('bookingRequests').innerHTML = bookingsHtml;
    });

  // Load payment history for owners
  fetch('http://localhost:5000/api/payments/user', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const paymentHtml = data.map(payment => `
        <div class="booking-card">
          <div class="booking-content">
            <h4 class="booking-title">${payment.booking_id?.property_id?.title || 'Property'}</h4>
            <div class="booking-details">
              <p><strong>Renter:</strong> ${payment.renter_id?.name || 'N/A'}</p>
              <p><strong>Amount:</strong> ₹${payment.amount.toLocaleString()}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${payment.status}">${payment.status.toUpperCase()}</span></p>
              <p><strong>Date:</strong> ${new Date(payment.payment_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      `).join('');
      document.getElementById('ownerPaymentHistory').innerHTML = paymentHtml || '<div class="empty-state"><h4>No Payment History</h4><p>No payments have been made yet.</p></div>';
    })
    .catch(err => {
      console.error('Error loading payment history:', err);
      document.getElementById('ownerPaymentHistory').innerHTML = '<div class="empty-state"><h4>Error</h4><p>Failed to load payment history.</p></div>';
    });

} else {
  document.getElementById('renterSection').style.display = 'block';

  // Renter - View own bookings
  fetch('http://localhost:5000/api/bookings/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const html = data.map(b => `
        <div class="booking-card">
          <div class="booking-content">
            <h4 class="booking-title">${b.property_id?.title || 'Property'}</h4>
            <div class="booking-details">
              <p><strong>Status:</strong> <span class="status-badge status-${b.status}">${b.status}</span></p>
              <p><strong>Move In:</strong> ${new Date(b.move_in_date).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> ₹${b.total_amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div class="booking-actions">
              <a href="messaging.html?id=${b.property_id._id}&user=${b.property_id.owner_id._id}" class="btn btn-chat">💬 Chat with Owner</a>
              ${b.status === 'confirmed' ? `
                <button onclick="goToPayment('${b._id}')" class="btn btn-pay">💳 Pay Now</button>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('');
      document.getElementById('myBookings').innerHTML = html || '<div class="empty-state"><h4>No Bookings</h4><p>You haven\'t made any bookings yet.</p><a href="index.html" class="empty-state-btn">Browse Properties</a></div>';
    });

  // Load payment history
  fetch('http://localhost:5000/api/payments/user', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const paymentHtml = data.map(payment => `
        <div class="booking-card">
          <div class="booking-content">
            <h4 class="booking-title">${payment.booking_id?.property_id?.title || 'Property'}</h4>
            <div class="booking-details">
              <p><strong>Amount:</strong> ₹${payment.amount.toLocaleString()}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${payment.status}">${payment.status.toUpperCase()}</span></p>
              <p><strong>Date:</strong> ${new Date(payment.payment_date).toLocaleDateString()}</p>
            </div>
            <div class="booking-actions">
              ${payment.status === 'pending' ? `
                <button onclick="goToPayment('${payment.booking_id._id}')" class="btn btn-pay">💳 Pay Now</button>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('');
      document.getElementById('paymentHistory').innerHTML = paymentHtml || '<div class="empty-state"><h4>No Payment History</h4><p>No payments have been made yet.</p></div>';
    })
    .catch(err => {
      console.error('Error loading payment history:', err);
      document.getElementById('paymentHistory').innerHTML = '<div class="empty-state"><h4>Error</h4><p>Failed to load payment history.</p></div>';
    });
}

// Update booking status (owner)
function updateBooking(id, status) {
    fetch(`http://localhost:5000/api/bookings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(() => {
        // Remove the card from DOM directly
        const card = document.querySelector(`[data-booking-id="${id}"]`);
        if (card) card.remove();
      })
      .catch(err => {
        console.error(err);
        alert('Failed to update booking');
      });
  }

function deleteProperty(id) {
    const confirmDelete = confirm('Are you sure you want to delete this property?');
    if (!confirmDelete) return;
  
    fetch(`http://localhost:5000/api/properties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        alert('Property deleted');
        location.reload();
      })
      .catch(err => {
        console.error(err);
        alert('Delete failed');
      });
  }
  
  function editProperty(id) {
  window.location.href = `edit-property.html?id=${id}`;
}

function goToPayment(bookingId) {
  window.location.href = `payment.html?booking_id=${bookingId}`;
}
  
