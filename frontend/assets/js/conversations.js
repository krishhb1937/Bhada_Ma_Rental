document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  const conversationsContainer = document.getElementById('conversationsContainer');

  // Fetch conversations
  fetch('https://bhada-ma-rental.onrender.com/api/messages/conversations', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(conversations => {
      console.log('Conversations:', conversations);
      renderConversations(conversations);
    })
    .catch(error => {
      console.error('Error fetching conversations:', error);
      conversationsContainer.innerHTML = '<div class="no-conversations">Error loading conversations. Please try again.</div>';
    });

  function renderConversations(conversations) {
    if (!conversations || conversations.length === 0) {
      conversationsContainer.innerHTML = '<div class="no-conversations">No conversations yet. Start messaging property owners or renters!</div>';
      return;
    }

    const html = conversations.map(conv => {
      const otherUser = conv._id.otherUser;
      const property = conv._id.property;
      const lastMessage = conv.lastMessage;
      const messageCount = conv.messageCount;
      
      const otherUserName = otherUser ? otherUser.name : 'Unknown User';
      const propertyTitle = property ? property.title : 'Unknown Property';
      const lastMessageText = lastMessage ? lastMessage.message_text : 'No messages';
      const lastMessageTime = lastMessage ? new Date(lastMessage.sent_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const lastMessageDate = lastMessage ? new Date(lastMessage.sent_date).toLocaleDateString() : '';
      
      // Check if the last message is unread and from the other user
      const isUnread = lastMessage && 
                      lastMessage.sender_id && 
                      lastMessage.sender_id._id !== user._id && 
                      !lastMessage.is_read;

      const initials = otherUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      return `
        <div class="conversation-item" onclick="openChat('${property._id}', '${otherUser._id}')">
          <div class="conversation-avatar">
            ${initials}
          </div>
          <div class="conversation-content">
            <div class="conversation-header">
              <div class="conversation-name">${otherUserName}</div>
              <div class="conversation-time">
                ${lastMessageTime} • ${lastMessageDate}
                ${isUnread ? '<div class="unread-badge">!</div>' : ''}
              </div>
            </div>
            <div class="conversation-preview">${lastMessageText}</div>
            <div class="conversation-property">${propertyTitle}</div>
          </div>
        </div>
      `;
    }).join('');

    conversationsContainer.innerHTML = html;
  }
});

// Function to open chat (called from onclick)
function openChat(propertyId, userId) {
  window.location.href = `messaging.html?id=${propertyId}&user=${userId}`;
} 