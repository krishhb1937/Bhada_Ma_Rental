function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must login first');
      window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
  