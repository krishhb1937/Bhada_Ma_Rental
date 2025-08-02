document.getElementById('addPropertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const form = e.target;
    const formData = new FormData(form);
    const token = localStorage.getItem('token');
  
    try {
      const res = await fetch('https://bhada-ma-rental.onrender.com/api/properties', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
  
      const data = await res.json();
      if (res.ok) {
        alert('Property added!');
        form.reset();
      } else {
        alert(data.message || 'Failed to add property');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  });
  