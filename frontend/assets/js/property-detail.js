document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('id');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
  
    fetch(`http://localhost:5000/api/properties/${propertyId}`)
      .then(res => res.json())
      .then(property => {
        let images = property.photos.map(photo => `<img src="http://localhost:5000${photo}" height="300">`).join('');
        document.getElementById('propertyDetail').innerHTML = `
          <h2>${property.title}</h2>
          ${images}
          <p><b>Location:</b> ${property.location}</p>
          <p><b>Price:</b> Rs. ${property.price}</p>
          <p><b>Type:</b> ${property.property_type}</p>
          <p><b>Bedrooms:</b> ${property.bedrooms} | <b>Bathrooms:</b> ${property.bathrooms}</p>
          <p><b>Description:</b> ${property.description}</p>
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
        const res = await fetch('http://localhost:5000/api/bookings', {
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
  