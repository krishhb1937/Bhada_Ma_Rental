document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  loadNotifications();
});

async function loadNotifications() {
  const token = localStorage.getItem('token');
  const notificationsList = document.getElementById('notificationsList');

  try {
    const response = await fetch('https://bhada-ma-rental.onrender.com/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const notifications = await response.json();
      renderNotifications(notifications);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    showError('Failed to load notifications. Please try again.');
  }
}

function renderNotifications(notifications) {
  const notificationsList = document.getElementById('notificationsList');

  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-state">
        <h3>No notifications yet</h3>
        <p>You'll see notifications here when you have new activity.</p>
      </div>
    `;
    return;
  }

  const html = notifications.map(notification => {
    const isUnread = !notification.is_read;
    const timeAgo = getTimeAgo(new Date(notification.created_at));
    const typeClass = `type-${notification.type}`;
    
    return `
      <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="markAsRead('${notification._id}')">
        <div class="notification-header">
          <h4 class="notification-title">${notification.title}</h4>
          <span class="notification-time">${timeAgo}</span>
        </div>
        <p class="notification-message">${notification.message}</p>
        <span class="notification-type ${typeClass}">${notification.type.replace('_', ' ')}</span>
        <div class="notification-actions">
          ${isUnread ? '<span class="btn btn-small btn-primary">Mark as Read</span>' : ''}
          <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); deleteNotification('${notification._id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  notificationsList.innerHTML = html;
}

async function markAsRead(notificationId) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`https://bhada-ma-rental.onrender.com/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // Reload notifications to update the UI
      loadNotifications();
    } else {
      throw new Error('Failed to mark notification as read');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    alert('Failed to mark notification as read. Please try again.');
  }
}

async function markAllAsRead() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('https://bhada-ma-rental.onrender.com/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // Reload notifications to update the UI
      loadNotifications();
    } else {
      throw new Error('Failed to mark all notifications as read');
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    alert('Failed to mark all notifications as read. Please try again.');
  }
}

async function deleteNotification(notificationId) {
  const token = localStorage.getItem('token');
  
  if (!confirm('Are you sure you want to delete this notification?')) {
    return;
  }
  
  try {
    const response = await fetch(`https://bhada-ma-rental.onrender.com/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // Reload notifications to update the UI
      loadNotifications();
    } else {
      throw new Error('Failed to delete notification');
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    alert('Failed to delete notification. Please try again.');
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function showError(message) {
  const notificationsList = document.getElementById('notificationsList');
  notificationsList.innerHTML = `
    <div class="error">
      <h3>Error</h3>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="loadNotifications()">Try Again</button>
    </div>
  `;
} 