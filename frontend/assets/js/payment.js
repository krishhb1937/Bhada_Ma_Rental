document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('booking_id');

  if (!bookingId) {
    showError('Booking ID is required');
    return;
  }

  loadPaymentDetails(bookingId);
});

async function loadPaymentDetails(bookingId) {
  const token = localStorage.getItem('token');
  const paymentContent = document.getElementById('paymentContent');

  try {
    // First, try to get existing payment
    const response = await fetch(`http://localhost:5000/api/payments/booking/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const payment = await response.json();
      renderPaymentDetails(payment);
    } else if (response.status === 404) {
      // Payment doesn't exist, create one
      await createPayment(bookingId);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading payment details:', error);
    showError('Failed to load payment details. Please try again.');
  }
}

async function createPayment(bookingId) {
  const token = localStorage.getItem('token');
  const paymentContent = document.getElementById('paymentContent');

  try {
    paymentContent.innerHTML = '<div class="loading">Creating payment...</div>';

    const response = await fetch('http://localhost:5000/api/payments/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ booking_id: bookingId })
    });

    if (response.ok) {
      const result = await response.json();
      renderPaymentDetails(result.payment);
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment');
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    showError(error.message || 'Failed to create payment. Please try again.');
  }
}

function renderPaymentDetails(payment) {
  const paymentContent = document.getElementById('paymentContent');
  
  const statusClass = payment.status === 'completed' ? 'status-completed' : 'status-pending';
  const statusText = payment.status === 'completed' ? 'Payment Completed' : 'Payment Pending';

  const html = `
    <div class="payment-amount">
      ₹${payment.amount.toLocaleString()}
    </div>

    <div class="payment-status ${statusClass}">
      ${statusText}
    </div>

    <div class="qr-code-container">
      <h3>Scan QR Code to Pay</h3>
      <img src="${payment.qr_code_url}" alt="Payment QR Code" class="qr-code" />
      <p style="margin-top: 15px; color: #666;">
        Use any UPI app (Google Pay, PhonePe, Paytm) to scan this QR code
      </p>
    </div>

    <div class="payment-details">
      <div class="payment-detail">
        <span class="label">Property Owner:</span>
        <span class="value">${payment.owner_id?.name || 'N/A'}</span>
      </div>
      <div class="payment-detail">
        <span class="label">Owner Phone:</span>
        <span class="value">${payment.owner_id?.phone || 'N/A'}</span>
      </div>
      <div class="payment-detail">
        <span class="label">ID Number:</span>
        <span class="value">${payment.owner_id?.upi_id || 'Not provided'}</span>
      </div>
      <div class="payment-detail">
        <span class="label">Payment Amount:</span>
        <span class="value">₹${payment.amount.toLocaleString()}</span>
      </div>
      <div class="payment-detail">
        <span class="label">Payment Date:</span>
        <span class="value">${new Date(payment.payment_date).toLocaleDateString()}</span>
      </div>
      <div class="payment-detail">
        <span class="label">Payment Method:</span>
        <span class="value">${payment.payment_method.toUpperCase()}</span>
      </div>
    </div>

    <div class="payment-instructions">
      <h4>How to Pay:</h4>
      <ol>
        <li>Open your payment app (ESewa, Khalti, Google Pay, etc.)</li>
        <li>Tap on "Scan QR Code" or "Pay"</li>
        <li>Point your camera at the QR code above</li>
        <li>Verify the payment details and amount</li>
        <li>Enter your PIN to complete the payment</li>
        <li>Take a screenshot of the payment confirmation</li>
        <li>Click "Mark as Paid" below after successful payment</li>
      </ol>
    </div>

    <div class="payment-actions">
      ${payment.status === 'pending' ? `
        <button class="btn btn-success" onclick="markAsPaid('${payment._id}')">
          Mark as Paid
        </button>
      ` : ''}
      <a href="dashboard.html" class="btn btn-secondary">
        Back to Dashboard
      </a>
    </div>
  `;

  paymentContent.innerHTML = html;
}

async function markAsPaid(paymentId) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`http://localhost:5000/api/payments/${paymentId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        notes: 'Payment completed via QR code'
      })
    });

    if (response.ok) {
      const result = await response.json();
      alert('Payment marked as completed successfully!');
      // Reload the page to show updated status
      window.location.reload();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update payment status');
    }
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    alert(error.message || 'Failed to mark payment as paid. Please try again.');
  }
}

function showError(message) {
  const paymentContent = document.getElementById('paymentContent');
  paymentContent.innerHTML = `
    <div class="error">
      <h3>Error</h3>
      <p>${message}</p>
      <a href="dashboard.html" class="btn btn-secondary" style="margin-top: 15px;">
        Back to Dashboard
      </a>
    </div>
  `;
} 