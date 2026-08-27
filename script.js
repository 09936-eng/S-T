// --- QUANTUM SHIFT - GAME ENGINE ---

// 1. STATE MANAGEMENT & LOCALSTORAGE
let gameState = {
    playerName: "Dr. Quantum",
    score: 0,
    energy: 100,
    unlockedWorlds: 1,
    stars: [0, 0, 0, 0, 0],
    soundEnabled: true,
    achievements: []
};

// Load saved data
function loadGame() {
    const saved = localStorage.getItem('QUANTUM_SHIFT_SAVE');
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
    updateHUD();
}

function saveGame() {
    localStorage.setItem('QUANTUM_SHIFT_SAVE', JSON.stringify(gameState));
}

// 2. AUDIO SYSTEM (Synthesizer - Works without external MP3s)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type) {
    if (!gameState.soundEnabled) return;
    if (!audioCtx) audioCtx = new AudioContext();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// 3. UI SCREEN ROUTING
function showScreen(screenId) {
    playSound('click');
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');

    const hud = document.getElementById('hud');
    if (screenId === 'screen-home') {
        hud.classList.add('hidden');
    } else {
        hud.classList.remove('hidden');
    }
    updateHUD();
}

function updateHUD() {
    document.getElementById('hud-player-name').innerText = gameState.playerName;
    document.getElementById('hud-score').innerText = gameState.score;
    document.getElementById('hud-energy').innerText = gameState.energy;

    // Update Map Statuses
    for (let i = 1; i <= 5; i++) {
        const node = document.querySelector(`.map-node[data-world="${i}"]`);
        if (node) {
            if (i <= gameState.unlockedWorlds) {
                node.classList.remove('locked');
                node.classList.add('unlocked');
                node.querySelector('.status').innerText = i < gameState.unlockedWorlds ? "COMPLETED" : "UNLOCKED";
            }
        }
    }
}

// 4. N.O.V.A. AI ASSISTANT SYSTEM
function triggerNova(text) {
    const modal = document.getElementById('nova-modal');
    document.getElementById('nova-text').innerText = text;
    modal.classList.remove('hidden');
    playSound('success');
}

// 5. SPACE BACKGROUND PARTICLES
const canvas = document.getElementById('space-bg');
const ctx = canvas.getContext('2d');
let stars = [];

function initBackground() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function renderBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
    });
    requestAnimationFrame(renderBackground);
}

// 6. MINI-GAMES LOGIC

// --- WORLD 1: THRUST CONTROL ---
let thrustPos = 0;
let thrustDir = 2;
let thrustAnimId = null;

function startWorld1() {
    showScreen('screen-world-1');
    triggerNova("N.O.V.A.: กดปุ่ม LOCK THRUST เมื่อเข็มอยู่ในโซนสีเขียวเพื่อช่วย PIX-01!");
    const indicator = document.getElementById('thrust-indicator');
    
    function animateThrust() {
        thrustPos += thrustDir;
        if (thrustPos >= 95 || thrustPos <= 0) thrustDir *= -1;
        indicator.style.left = thrustPos + '%';
        thrustAnimId = requestAnimationFrame(animateThrust);
    }
    cancelAnimationFrame(thrustAnimId);
    animateThrust();
}

document.getElementById('btn-thrust-lock').addEventListener('click', () => {
    cancelAnimationFrame(thrustAnimId);
    if (thrustPos >= 60 && thrustPos <= 85) {
        playSound('success');
        gameState.score += 100;
        if (gameState.unlockedWorlds === 1) gameState.unlockedWorlds = 2;
        saveGame();
        triggerNova("สำเร็จ! PIX-01 ถูกช่วยแล้ว ได้รับ 100 SP!");
        setTimeout(() => showScreen('screen-map'), 2000);
    } else {
        playSound('error');
        triggerNova("แรงดันไม่ถูกต้อง! ลองใหม่อีกครั้ง");
        setTimeout(startWorld1, 1500);
    }
});

// --- WORLD 2: HEAT COLLAPSE (Drag & Drop) ---
let w2Temp = 45;
let w2Energy = 100;

function startWorld2() {
    showScreen('screen-world-2');
    w2Temp = 45;
    w2Energy = 100;
    updateW2UI();
    triggerNova("N.O.V.A.: ลากอุปกรณ์ปรับอุณหภูมิเมืองให้อยู่ระหว่าง 20°C - 25°C ก่อนพลังงานหมด!");
}

function updateW2UI() {
    document.getElementById('w2-temp').innerText = w2Temp;
    document.getElementById('w2-energy').innerText = w2Energy;
}

document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', e.target.getAttribute('data-type'));
    });
});

const dropzoneW2 = document.getElementById('w2-dropzone');
dropzoneW2.addEventListener('dragover', (e) => e.preventDefault());
dropzoneW2.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    
    if (w2Energy <= 0) {
        triggerNova("พลังงานหมดแล้ว!");
        return;
    }

    if (type === 'cooler') { w2Temp -= 10; w2Energy -= 20; }
    else if (type === 'heater') { w2Temp += 10; w2Energy -= 20; }
    else if (type === 'fan') { w2Temp -= 5; w2Energy -= 10; }

    playSound('click');
    updateW2UI();

    if (w2Temp >= 20 && w2Temp <= 25) {
        playSound('success');
        gameState.score += 150;
        if (gameState.unlockedWorlds === 2) gameState.unlockedWorlds = 3;
        saveGame();
        triggerNova("สมบูรณ์แบบ! ปรับอุณหภูมิเมืองอนาคตสำเร็จแล้ว!");
        setTimeout(() => showScreen('screen-map'), 2000);
    }
});

// --- WORLD 3: ROBOT VIRUS ---
let programStack = [];

document.querySelectorAll('.cmd-block').forEach(cmd => {
    cmd.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('cmd', e.target.getAttribute('data-cmd'));
    });
});

const progArea = document.getElementById('program-area');
progArea.addEventListener('dragover', (e) => e.preventDefault());
progArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const cmd = e.dataTransfer.getData('cmd');
    programStack.push(cmd);
    progArea.innerText = programStack.join(" ➔ ");
});

document.getElementById('btn-w3-run').addEventListener('click', () => {
    if (programStack.join(',') === "FORWARD,FORWARD,RIGHT") {
        playSound('success');
        gameState.score += 200;
        if (gameState.unlockedWorlds === 3) gameState.unlockedWorlds = 4;
        saveGame();
        triggerNova("โปรแกรมทำงานถูกต้อง! หุ่นยนต์ถึงเป้าหมายแล้ว!");
        setTimeout(() => showScreen('screen-map'), 2000);
    } else {
        playSound('error');
        triggerNova("เส้นทางผิดพลาด! ลองเรียงคำสั่งใหม่");
    }
});

document.getElementById('btn-w3-reset').addEventListener('click', () => {
    programStack = [];
    progArea.innerText = "วางชุดคำสั่งที่นี่...";
});

// --- WORLD 4: LOST ELEMENTS ---
let selectedElement = null;
const elementData = {
    'H': { name: "ไฮโดรเจน", type: "ก๊าซ", conductive: "ต่ำ", strong: "ต่ำ" },
    'O': { name: "ออกซิเจน", type: "ก๊าซ", conductive: "ต่ำ", strong: "ต่ำ" },
    'Cu': { name: "ทองแดง", type: "โลหะ", conductive: "สูงมาก", strong: "ปานกลาง" },
    'Si': { name: "ซิลิคอน", type: "กึ่งโลหะ", conductive: "ปานกลาง", strong: "สูง" }
};

document.querySelectorAll('.elem-card').forEach(card => {
    card.addEventListener('click', () => {
        const key = card.getAttribute('data-elem');
        selectedElement = key;
        const info = elementData[key];
        document.getElementById('elem-details').innerText = 
            `ธาตุ: ${info.name} | ประเภท: ${info.type} | การนำไฟฟ้า: ${info.conductive}`;
        document.getElementById('btn-w4-use').classList.remove('hidden');
        playSound('click');
    });
});

document.getElementById('btn-w4-use').addEventListener('click', () => {
    if (selectedElement === 'Cu') {
        playSound('success');
        gameState.score += 150;
        if (gameState.unlockedWorlds === 4) gameState.unlockedWorlds = 5;
        saveGame();
        triggerNova("ถูกต้อง! ทองแดงมีคุณสมบัตินำไฟฟ้าดีที่สุด ซ่อมสายไฟสำเร็จ!");
        setTimeout(() => showScreen('screen-map'), 2000);
    } else {
        playSound('error');
        triggerNova("ธาตุนี้ไม่อาจนำไฟฟ้าได้ดีพอสำหรับวงจรนี้!");
    }
});

// --- WORLD 5: LAST GREEN PLANET ---
let bioState = { ox: 20, wat: 20, tmp: 80, hp: 30 };

function updateBioUI() {
    document.getElementById('bio-ox').innerText = bioState.ox;
    document.getElementById('bio-wat').innerText = bioState.wat;
    document.getElementById('bio-tmp').innerText = bioState.tmp;
    document.getElementById('bio-hp').innerText = bioState.hp;

    if (bioState.ox >= 40 && bioState.wat >= 40 && bioState.tmp <= 50) {
        bioState.hp = 100;
        document.getElementById('bio-plant').style.transform = 'scale(1.4)';
        playSound('success');
        gameState.score += 500;
        saveGame();
        triggerNova("ยินดีด้วย! คุณรักษาสมดุลระบบนิเวศจำลองและจบเกม QUANTUM SHIFT สำเร็จ!");
    }
}

function adjustBio(type, val) {
    playSound('click');
    bioState[type] += val;
    updateBioUI();
}

// 7. EVENT LISTENERS & INITIALIZATION
window.addEventListener('load', () => {
    initBackground();
    renderBackground();
    loadGame();

    // Home Buttons
    document.getElementById('btn-start').addEventListener('click', () => showScreen('screen-map'));
    document.getElementById('btn-profile').addEventListener('click', () => showScreen('screen-profile'));
    document.getElementById('btn-achievements').addEventListener('click', () => showScreen('screen-achievements'));
    document.getElementById('btn-how-to').addEventListener('click', () => showScreen('screen-howto'));

    // Navigation Back Buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => showScreen('screen-map'));
    });

    // Map Node Clicking
    document.querySelectorAll('.map-node').forEach(node => {
        node.addEventListener('click', () => {
            const world = parseInt(node.getAttribute('data-world'));
            if (world <= gameState.unlockedWorlds) {
                if (world === 1) startWorld1();
                if (world === 2) startWorld2();
                if (world === 3) showScreen('screen-world-3');
                if (world === 4) showScreen('screen-world-4');
                if (world === 5) showScreen('screen-world-5');
            } else {
                playSound('error');
                triggerNova("ด่านนี้ยังถูกล็อกอยู่! ต้องผ่านด่านก่อนหน้าเพื่อปลดล็อก");
            }
        });
    });

    // Profile Save
    document.getElementById('btn-save-profile').addEventListener('click', () => {
        gameState.playerName = document.getElementById('player-name-input').value || "Dr. Quantum";
        saveGame();
        triggerNova("บันทึกโปรไฟล์เรียบร้อยแล้ว!");
        showScreen('screen-home');
    });

    // Sound Toggle
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
        gameState.soundEnabled = !gameState.soundEnabled;
        document.getElementById('btn-sound-toggle').innerText = gameState.soundEnabled ? "🔊" : "🔇";
    });

    // Close NOVA Modal
    document.getElementById('nova-close-btn').addEventListener('click', () => {
        document.getElementById('nova-modal').classList.add('hidden');
    });
});
