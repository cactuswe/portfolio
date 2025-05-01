import { database } from './firebase.js';
import { ref, push, onValue, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { engine, render, createPhysicsMessage, updatePhysicsSize } from './physics.js';

let trackingEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
  const consent = localStorage.getItem('cookieConsent');
  const banner = document.getElementById('cookie-consent');
  const acceptBtn = document.getElementById('cookie-accept');

  if (consent === 'accepted') {
    banner.style.display = 'none';
    trackingEnabled = true;
  } else {
    banner.style.display = 'flex';
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      banner.style.display = 'none';
      trackingEnabled = true;
    });
  }
});

let cooldown = 60000;
let lastMessageSent = parseInt(localStorage.getItem('lastMessageSent')) || 0;
let timerInterval;

function updateCooldownDisplay() {
    const timeLeft = cooldown - (Date.now() - lastMessageSent);
    const secondsLeft = Math.ceil(timeLeft / 1000);
    
    if (timeLeft > 0) {
        document.querySelector("#text").placeholder = `Please wait ${secondsLeft} seconds...`;
    } else {
        document.querySelector("#text").placeholder = "Write message here...";
        clearInterval(timerInterval);
    }
}

async function submitMessage(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const textInput = document.querySelector("#text");
    const value = textInput.value.trim();

    if (!value || Date.now() - lastMessageSent < cooldown) {
        return false;
    }

    try {
        const submitButton = document.querySelector('.messageInput button');
        submitButton.disabled = true;

        let userInfo = trackingEnabled ? {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform || 'unknown',
            vendor: navigator.vendor || 'unknown',
            timestamp: Date.now()
        } : {};

        const messagesRef = ref(database, 'messages');
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key;
        const timestamp = Date.now();

        const messageData = {
            text: value,
            timestamp: timestamp,
            userInfo: userInfo
        };

        await update(ref(database, `messages/${messageId}`), messageData);

        textInput.value = "";
        textInput.blur();  
        window.scrollTo(0, 0);

        lastMessageSent = timestamp;
        localStorage.setItem('lastMessageSent', lastMessageSent.toString());
        updateCooldownDisplay();

        const formRect = form.getBoundingClientRect();
        createPhysicsMessage(
            value,
            formRect.left + formRect.width / 2,
            window.innerHeight - 80,
            messageId,
            null,
            timestamp,
            true
        );

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Could not send message. Please try again.');
    } finally {
        const submitButton = document.querySelector('.messageInput button');
        if (submitButton) submitButton.disabled = false;
    }

    return false;
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    else if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], { month: 'long', day: 'numeric' }) + 
               ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    else {
        return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) +
               ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

const messagesRef = ref(database, 'messages');
onValue(messagesRef, (snapshot) => {
    const messages = snapshot.val();
    
    if (messages) {
        const screenScale = Math.min(window.innerWidth / 1920, 1);
        
        const sortedMessages = Object.entries(messages)
            .sort(([,a], [,b]) => b.timestamp - a.timestamp)
            .slice(0, 15);
        
        const spawnArea = {
            minX: window.innerWidth * 0.1,
            maxX: window.innerWidth * 0.9,
            minY: window.innerHeight * 0.1,
            maxY: window.innerHeight * 0.7 
        };

        sortedMessages.forEach(([id, message], index) => {
            const existingMessage = document.querySelector(`[data-message-id="${id}"]`);
            if (!existingMessage) {
                setTimeout(() => {
                    const randomX = spawnArea.minX + Math.random() * (spawnArea.maxX - spawnArea.minX);
                    const randomY = spawnArea.minY + Math.random() * (spawnArea.maxY - spawnArea.minY);

                    const physicsMessage = createPhysicsMessage(
                        message.text,
                        randomX,
                        randomY,
                        id,
                        null,
                        message.timestamp,
                        false
                    );

                    const angle = Math.random() * Math.PI * 2;
                    const initialSpeed = 1 + Math.random() * 2;
                    
                    Matter.Body.setVelocity(physicsMessage, {
                        x: Math.cos(angle) * initialSpeed,
                        y: Math.sin(angle) * initialSpeed
                    });

                    Matter.Body.setAngularVelocity(physicsMessage, (Math.random() - 0.5) * 0.01);

                }, index * 100);
            }
        });
    }
});

function initializeCooldown() {
    const timeLeft = cooldown - (Date.now() - lastMessageSent);
    if (timeLeft > 0) {
        timerInterval = setInterval(updateCooldownDisplay, 1000);
        updateCooldownDisplay();
    }
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updatePhysicsSize, 250);
});

function initializeForm() {
    const form = document.getElementById('messageForm');
    if (form) {
        form.removeEventListener('submit', submitMessage);
        
        form.addEventListener('submit', submitMessage, { 
            passive: false,
            capture: true 
        });

        const submitButton = form.querySelector('button');
        const textInput = form.querySelector('#text');

        submitButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (textInput.value.trim()) {
                submitMessage(e);
            }
        }, { passive: false });

        textInput.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });

        initializeCooldown();
    }
}

document.addEventListener('DOMContentLoaded', initializeForm);
if (document.readyState === 'complete') {
    initializeForm();
}