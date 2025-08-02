// document.addEventListener('DOMContentLoaded', () => {
//   const token = localStorage.getItem('token');
//   const user = JSON.parse(localStorage.getItem('user'));

//   const params = new URLSearchParams(window.location.search);
//   const propertyId = params.get('id');
//   const otherUserId = params.get('user');
//   // if (!propertyId || !otherUserId) {
//   //   alert("Invalid message link");
//   //   window.location.href = "dashboard.html";
//   // }
//   if (!propertyId || !otherUserId || otherUserId === 'undefined') {
//     alert("Invalid or missing chat info.");
//     window.location.href = "dashboard.html";
//   }
//   console.log("Property ID:", propertyId);
//   console.log("Other User ID:", otherUserId);


//   const chatBox = document.getElementById('chatBox');
//   const form = document.getElementById('msgForm');
//   const input = document.getElementById('msgInput');

//   const roomId = `${propertyId}_${[user._id, otherUserId].sort().join('_')}`; // unique chatroom ID
//   const socket = io('https://bhada-ma-rental.onrender.com');

//   // Join room
//   socket.emit('joinRoom', { roomId });

//   // Fetch previous messages
//   fetch(`https://bhada-ma-rental.onrender.com/api/messages/${propertyId}/${otherUserId}`, {
//     headers: { Authorization: `Bearer ${token}` }
//   })
//     .then(res => res.json())
//     .then(messages => {
//       if (Array.isArray(messages)) {
//         renderMessages(messages);
//       } else {
//         console.error('Expected message array but got:', messages);
//       }
//     });

//   // On message received
//   socket.on('receiveMessage', (msg) => {
//     renderMessages([msg], true);
//   });

//   // Send message
//   form.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const text = input.value.trim();
//     if (!text) return;

//     const msgData = {
//       sender_id: user._id,
//       receiver_id: otherUserId,
//       property_id: propertyId,
//       message_text: text,
//       roomId
//     };

//     socket.emit('sendMessage', msgData);
//     input.value = '';
//   });

//   function renderMessages(messages, append = false) {
//     if (!Array.isArray(messages)) {
//       console.error("Expected array, got:", messages);
//       return;
//     }
//     const html = messages.map(m => `
//       <div style="margin: 5px 0; text-align: ${m.sender_id === user._id ? 'right' : 'left'}">
//         <span style="background: ${m.sender_id === user._id ? '#acf' : '#eee'}; padding: 5px; border-radius: 5px">
//           ${m.message_text}
//         </span>
//       </div>
//     `).join('');

//     if (append) {
//       chatBox.innerHTML += html;
//     } else {
//       chatBox.innerHTML = html;
//     }

//     chatBox.scrollTop = chatBox.scrollHeight;
//   }
// });

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Debug: Check if user and token exist
  console.log('Token:', token);
  console.log('User:', user);

  if (!token || !user) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('id');
  const otherUserId = params.get('user');
  
  console.log("Property ID:", propertyId);
  console.log("Other User ID:", otherUserId);

  if (!propertyId || !otherUserId || otherUserId === 'undefined') {
    alert("Invalid or missing chat info.");
    window.location.href = "dashboard.html";
    return;
  }

  const chatBox = document.getElementById('chatBox');
  const form = document.getElementById('msgForm');
  const input = document.getElementById('msgInput');

  const roomId = `${propertyId}_${[user._id, otherUserId].sort().join('_')}`; // unique chatroom ID
  const socket = io('https://bhada-ma-rental.onrender.com', {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
  });

  // Join room
  socket.emit('joinRoom', { roomId });

  // Mark messages as read when entering chat
  markMessagesAsRead();

  // Fetch previous messages
  console.log('Fetching messages from:', `https://bhada-ma-rental.onrender.com/api/messages/${propertyId}/${otherUserId}`);
  
  fetch(`https://bhada-ma-rental.onrender.com/api/messages/${propertyId}/${otherUserId}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      console.log('Response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(messages => {
      console.log('Received messages:', messages);
      renderMessages(messages);
    })
    .catch(error => {
      console.error('Error fetching messages:', error);
      chatBox.innerHTML = '<div style="color: red;">Error loading messages. Please try again.</div>';
    });

  // On message received
  socket.on('receiveMessage', (msg) => {
    console.log('Received new message:', msg);
    renderMessages([msg], true);
    markMessagesAsRead();
  });

  // Handle message errors
  socket.on('messageError', (error) => {
    console.error('Message error:', error);
    alert(`Message error: ${error.error}`);
  });

  // Send message
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Disable form while sending
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const msgData = {
      sender_id: user._id,
      receiver_id: otherUserId,
      property_id: propertyId,
      message_text: text,
      roomId
    };

    console.log('Sending message:', msgData);
    socket.emit('sendMessage', msgData);
    input.value = '';

    // Re-enable form after a short delay
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }, 1000);
  });

  // Mark messages as read function
  function markMessagesAsRead() {
    fetch(`https://bhada-ma-rental.onrender.com/api/messages/read/${propertyId}/${otherUserId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log('Messages marked as read:', data);
    })
    .catch(error => {
      console.error('Error marking messages as read:', error);
    });
  }

  function renderMessages(messages, append = false) {
    if (!Array.isArray(messages)) {
      console.error("Expected array, got:", messages);
      return;
    }
    
    if (messages.length === 0) {
      if (!append) {
        chatBox.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No messages yet. Start the conversation!</div>';
      }
      return;
    }

    const html = messages.map(m => {
      const isOwnMessage = m.sender_id === user._id || (m.sender_id && m.sender_id._id === user._id);
      const senderName = m.sender_id && m.sender_id.name ? m.sender_id.name : 'Unknown User';
      const messageTime = new Date(m.sent_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const messageDate = new Date(m.sent_date).toLocaleDateString();
      
      return `
        <div style="margin: 8px 0; text-align: ${isOwnMessage ? 'right' : 'left'}">
          <div style="display: flex; justify-content: ${isOwnMessage ? 'flex-end' : 'flex-start'}; align-items: flex-end;">
            ${!isOwnMessage ? `<div style="font-size: 0.8em; color: #666; margin-right: 8px;">${senderName}</div>` : ''}
            <div style="max-width: 70%;">
              <div style="background: ${isOwnMessage ? '#007bff' : '#f1f1f1'}; 
                          color: ${isOwnMessage ? 'white' : 'black'}; 
                          padding: 8px 12px; 
                          border-radius: 15px; 
                          display: inline-block;
                          word-wrap: break-word;">
                ${m.message_text}
              </div>
              <div style="font-size: 0.7em; color: #666; margin-top: 2px; text-align: ${isOwnMessage ? 'right' : 'left'}">
                ${messageTime} • ${messageDate}
                ${isOwnMessage ? `<span style="margin-left: 5px;">${m.is_read ? '✓✓' : '✓'}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (append) {
      chatBox.innerHTML += html;
    } else {
      chatBox.innerHTML = html;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Auto-scroll to bottom when new messages arrive
  const observer = new MutationObserver(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  observer.observe(chatBox, { childList: true, subtree: true });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.textContent = `Connection lost: ${error.message}`;
    statusDiv.className = 'connection-status disconnected';
    statusDiv.style.display = 'block';
  });

  socket.on('connect', () => {
    console.log('Connected to server successfully');
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.textContent = 'Connected';
    statusDiv.className = 'connection-status connected';
    statusDiv.style.display = 'block';
    
    // Hide status after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.textContent = `Disconnected: ${reason}`;
    statusDiv.className = 'connection-status disconnected';
    statusDiv.style.display = 'block';
  });

  // Debug connection attempts
  socket.on('connecting', () => {
    console.log('Attempting to connect to server...');
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.textContent = 'Connecting...';
    statusDiv.className = 'connection-status disconnected';
    statusDiv.style.display = 'block';
  });
});