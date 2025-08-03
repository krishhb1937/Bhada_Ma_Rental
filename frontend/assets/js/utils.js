function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      alert('You must login first');
      window.location.href = 'login.html';
      return false;
    }
    
    // Check if token is expired (basic check)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenData.exp && tokenData.exp < currentTime) {
        alert('Your session has expired. Please login again.');
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      // If token parsing fails, redirect to login
      localStorage.clear();
      window.location.href = 'login.html';
      return false;
    }
    
    return true;
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Utility function to show loading state
function showLoading(element, text = 'Loading...') {
    if (element) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.textContent = text;
    }
}

// Utility function to hide loading state
function hideLoading(element) {
    if (element && element.dataset.originalText) {
        element.disabled = false;
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
    }
}

// Utility function to handle API errors
function handleApiError(error, defaultMessage = 'Something went wrong') {
    console.error('API Error:', error);
    
    if (error.response) {
        // Server responded with error status
        const data = error.response.data;
        return data.error || data.message || `Error ${error.response.status}: ${defaultMessage}`;
    } else if (error.request) {
        // Network error
        return 'Network error. Please check your connection and try again.';
    } else {
        // Other error
        return defaultMessage;
    }
}
  