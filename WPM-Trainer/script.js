import quotes from './quotes.js';

function cleanQuote(text) {
    return text
        .replace(/[^a-zA-Z0-9\s.,]/g, '')  // Remove all special characters except periods and commas
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
}

function getRandomQuotes(count = 10) {
    const shuffled = [...quotes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(quote => cleanQuote(quote.text));
}

const textToType = document.querySelector('.text-to-type');
const resultDiv = document.getElementById('result');
const timerDiv = document.getElementById('timer');
const wpmDiv = document.getElementById('wpm');
const accuracyDiv = document.getElementById('accuracy');
const keys = document.querySelectorAll(".key");
const shiftKey = document.getElementById("shift");
const deleteKey = document.getElementById("delete");
const spacebar = document.getElementById("space");
const doneButton = document.getElementById("done");
const endButton = document.getElementById("end");
let targetText = '';
let currentInput = '';
let startTime = null;
let timerInterval = null;
let isTestActive = false;
let texts = [];
let shift = false;
let capsLock = false;
let lastShiftTime = 0;
let totalKeystrokes = 0;
let correctKeystrokes = 0;

function initializeTexts() {
    texts = getRandomQuotes();
    startNewTest();
}

function getRandomText() {
    return texts[Math.floor(Math.random() * texts.length)];
}

function startNewTest() {
    targetText = getRandomText();
    currentInput = '';
    startTime = null;
    isTestActive = true;
    clearInterval(timerInterval);
    timerDiv.textContent = 'Time: 0s';
    wpmDiv.textContent = 'WPM: 0';
    totalKeystrokes = 0;
    correctKeystrokes = 0;
    updateAccuracy();
    
    textToType.innerHTML = targetText.split('').map(char => {
        let displayChar = char === ' ' ? '-' : char;
        return `<span class="char untyped" data-char="${char}">${displayChar}</span>`;
    }).join('');
    
    updateDisplay();
    textToType.focus();
}

function calculateWPM(timeInSeconds, wordCount) {
    return Math.round((wordCount / timeInSeconds) * 60);
}

function updateTimer() {
    if (!startTime || !isTestActive) return;
    
    const currentTime = (Date.now() - startTime) / 1000;
    timerDiv.textContent = `Time: ${Math.floor(currentTime)}s`;
    
    const wordsTyped = currentInput.trim().split(/\s+/).length;
    const wpm = calculateWPM(currentTime, wordsTyped);
    wpmDiv.textContent = `WPM: ${wpm}`;
}

function updateAccuracy() {
    const accuracy = totalKeystrokes === 0 ? 0 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
    accuracyDiv.textContent = `ACC: ${accuracy}%`;
    return accuracy;
}

function updateDisplay() {
    const chars = textToType.querySelectorAll('.char');
    
    for (let i = 0; i < targetText.length; i++) {
        const charElement = chars[i];
        if (i < currentInput.length) {
            const isCorrect = currentInput[i] === targetText[i];
            charElement.className = 'char ' + (isCorrect ? 'correct' : 'incorrect');
            
            // Only count new keystrokes
            if (i === currentInput.length - 1) {
                totalKeystrokes++;
                if (isCorrect) correctKeystrokes++;
                updateAccuracy();
                
                charElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
            }
        } else {
            charElement.className = 'char untyped';
        }
    }
         

    if (!startTime && currentInput.length > 0) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }

    if (currentInput === targetText) {
        endTest();
    }
}

document.addEventListener('keydown', (e) => {
    if (!isTestActive) return;
    
    if (e.key === 'Backspace') {
        currentInput = currentInput.slice(0, -1);
        updateDisplay();
        return;
    }

    if (e.key.length === 1 && currentInput.length < targetText.length) {
        currentInput += e.key;
        updateDisplay();
    }
});

function endTest() {
    isTestActive = false;
    clearInterval(timerInterval);
    const finalTime = (Date.now() - startTime) / 1000;
    const wordsTyped = currentInput.trim().split(/\s+/).length;
    const finalWPM = calculateWPM(finalTime, wordsTyped);
    const finalAccuracy = updateAccuracy();
    
    const currentQuote = quotes.find(q => cleanQuote(q.text) === targetText);
    
    resultDiv.innerHTML = `
        <div class="stats-final">
            <div class="stat-item">Time: ${Math.floor(finalTime)}s</div>
            <div class="stat-item">WPM: ${finalWPM}</div>
            <div class="stat-item">ACC: ${finalAccuracy}%</div>
        </div>
        <div class="quote-complete">
            <div class="quote-text">"${currentQuote.text}"</div>
            <div class="quote-author">― ${currentQuote.author}</div>
        </div>
    `;
}

endButton.addEventListener('click', () => {
    isTestActive = false;
    clearInterval(timerInterval);
    const currentQuote = quotes.find(q => cleanQuote(q.text) === targetText);
    
    resultDiv.innerHTML = `
        <div class="quote-ended">
            <div class="quote-text">"${currentQuote.text}"</div>
            <div class="quote-author">― ${currentQuote.author}</div>
            <div class="end-message">Test ended.</div>
        </div>
    `;
});

function updateKeyDisplay() {
    keys.forEach(key => {
        const char = key.textContent.trim();
        if (/^[a-zA-Z]$/.test(char)) {
            key.textContent = (shift || capsLock) ? char.toUpperCase() : char.toLowerCase();
        }
    });
}

function handleKeyPress(key) {
    if (!isTestActive) return;
    
    const char = key.textContent.trim();
    
    if (key === shiftKey) {
        const now = Date.now();
        if (now - lastShiftTime < 300) {
            capsLock = !capsLock;
            shiftKey.classList.toggle("caps-lock", capsLock);
            shift = false;
        } else {
            shift = true;
        }
        lastShiftTime = now;
        updateKeyDisplay();
        return;
    }

    if (key === spacebar && currentInput.length < targetText.length) {
        currentInput += " ";
        updateDisplay();
        return;
    }

    if (key === deleteKey) {
        currentInput = currentInput.slice(0, -1);
        updateDisplay();
        return;
    }

    if (currentInput.length < targetText.length) {
        let output = (/^[a-zA-Z]$/.test(char)) ? (shift || capsLock ? char.toUpperCase() : char.toLowerCase()) : char;
        currentInput += output;
        updateDisplay();
    }

    if (shift && !capsLock) {
        shift = false;
        updateKeyDisplay();
    }
}

doneButton.addEventListener('click', endTest);

keys.forEach(key => {
    key.addEventListener("click", () => handleKeyPress(key));
});

initializeTexts();