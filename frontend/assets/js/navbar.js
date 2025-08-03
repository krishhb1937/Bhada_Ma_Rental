document.addEventListener('DOMContentLoaded', async () => {
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Get unread notification count if user is logged in
let unreadCount = 0;
if (token && user) {
  try {
    const response = await fetch('https://bhada-ma-rental.onrender.com/api/notifications/unread/count', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      unreadCount = data.unreadCount;
    }
  } catch (error) {
    console.error('Error fetching notification count:', error);
  }
}

let navbarHTML = `
  <nav class="navbar">
    <div class="nav-brand">
      <a href="index.html" class="brand-link">
      <img src="assets/images/logo.jpeg" alt="Bhadama Logo" class="logo" />
      Bhada Ma
    </a>
    </div>
    <div class="nav-links">
      ${token && user ? `
        <a href="index.html" class="nav-link">Home</a>
        <a href="dashboard.html" class="nav-link">Dashboard</a>
        <a href="conversations.html" class="nav-link">Messages</a>
        <a href="notifications.html" class="nav-link">
          Notifications
          ${unreadCount > 0 ? `<span class="notification-count">${unreadCount}</span>` : ''}
        </a>
        <a href="profile-settings.html" class="nav-link">Profile</a>
        <div class="user-info">
          <span class="user-name" style="text-decoration:underline"> ${user.name}</span>
          <span class="user-type">${user.user_type}</span>
          <button onclick="logout()" class="logout-btn">Logout</button>
        </div>
      ` : `
        <a href="index.html" class="nav-link">Home</a>
        <a href="login.html" class="nav-link auth-link">Login</a>
        <a href="register.html" class="nav-link auth-link register">Register</a>
      `}
    </div>
  </nav>
`;
// console.log("TOKEN:", token);
// console.log("USER:", user);
const navbarDiv = document.getElementById('navbar');
if (navbarDiv) {
  navbarDiv.innerHTML = navbarHTML;
} else {
  console.warn("Navbar div not found!");
}
});