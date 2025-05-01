import { database, auth } from '../js/firebase.js';
import { ref, remove, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
});

function deleteMessage(messageId) {
    const messageRef = ref(database, 'messages/' + messageId);
    remove(messageRef);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('sv-SE', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function createMessageCard(id, message) {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.innerHTML = `
        <div class="content">${message.text}</div>
        <div class="meta">
            <div>Sent: ${formatDate(message.timestamp)}</div>
            <div>Message ID: ${id}</div>
        </div>
        <div class="actions">
            <button class="btn btn-info" onclick="showDetails('${id}')">
                <i class="fas fa-info-circle"></i>
            </button>
            <button class="btn btn-delete" onclick="deleteMessage('${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return card;
}

function showDetails(messageId) {
    const message = allMessages[messageId];
    const modal = document.getElementById('messageModal');
    const details = document.getElementById('messageDetails');
    
    const userInfo = message.userInfo || {};
    
    details.innerHTML = `
        <h3>Message Information</h3>
        <p><strong>Content:</strong> ${message.text}</p>
        <p><strong>Sent:</strong> ${formatDate(message.timestamp)}</p>
        <p><strong>Message ID:</strong> ${messageId}</p>

        <h3>Device Information</h3>
        <p><strong>Browser:</strong> ${userInfo.userAgent || 'Not available'}</p>
        <p><strong>Platform:</strong> ${userInfo.platform || 'Not available'}</p>
        <p><strong>Language:</strong> ${userInfo.language || 'Not available'}</p>
        <p><strong>Screen Size:</strong> ${userInfo.screenSize || 'Not available'}</p>
        <p><strong>Window Size:</strong> ${userInfo.windowSize || 'Not available'}</p>
        <p><strong>Time Zone:</strong> ${userInfo.timeZone || 'Not available'}</p>
        <p><strong>Device Memory:</strong> ${userInfo.deviceMemory ? userInfo.deviceMemory + 'GB' : 'Not available'}</p>
        <p><strong>CPU Cores:</strong> ${userInfo.hardwareConcurrency || 'Not available'}</p>
        <p><strong>Touch Points:</strong> ${userInfo.touchPoints || 'Not available'}</p>
        <p><strong>Connection:</strong> ${userInfo.connectionType || 'Not available'}</p>
    `;
    
    modal.style.display = 'block';
}

// Expose functions to window object
window.showDetails = showDetails;
window.deleteMessage = deleteMessage;

// Search and filter functionality
document.getElementById('searchInput')?.addEventListener('input', filterMessages);
document.getElementById('timeFilter')?.addEventListener('change', filterMessages);

function filterMessages() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const timeFilter = document.getElementById('timeFilter').value;
    const outputDiv = document.getElementById('adminMessageOutput');
    outputDiv.innerHTML = '';

    const now = Date.now();
    const timeFilters = {
        '24h': now - 86400000,
        'week': now - 604800000,
        'month': now - 2592000000
    };

    Object.entries(allMessages)
        .filter(([id, message]) => {
            const matchesSearch = message.text.toLowerCase().includes(searchTerm);
            const matchesTime = timeFilter === 'all' || message.timestamp > timeFilters[timeFilter];
            return matchesSearch && matchesTime;
        })
        .sort(([,a], [,b]) => b.timestamp - a.timestamp)
        .forEach(([id, message]) => {
            outputDiv.appendChild(createMessageCard(id, message));
        });
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    });
});

document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('messageModal').style.display = 'none';
});

let allMessages = {};
const messagesRef = ref(database, 'messages');
onValue(messagesRef, (snapshot) => {
    allMessages = snapshot.val() || {};
    filterMessages();
});