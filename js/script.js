/* L/* LÓGICA DEL MARCADOR - VERSIÓN 5.0 (AUTO-CONEXIÓN + SONIDOS) */

// --- CONFIGURACIÓN DE AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    click: () => playTone(800, 'square', 0.05),
    ok: () => { playTone(600, 'sine', 0.1); setTimeout(() => playTone(1200, 'square', 0.2), 100); },
    undo: () => playTone(150, 'sawtooth', 0.3),
    win: () => {
        const notes = [523.25, 659.25, 783.99, 1046.50]; 
        notes.forEach((n, i) => setTimeout(() => playTone(n, 'square', 0.2), i * 150));
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 500]);
    }
};

function haptic(ms = 40) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

// --- VARIABLES ---
let teams = [];
let currentTurn = 0;
let winScore = 0;
let historyStack = [];

// --- ELEMENTOS DOM ---
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const teamList = document.getElementById('team-list');
const display = document.getElementById('calc-display');
const winnerModal = document.getElementById('winner-modal');

// --- FUNCIONES ---
function addTeamField() {
    haptic();
    sfx.click();
    if (teamList.children.length >= 4) return;
    
    const div = document.createElement('div');
    div.className = 'list-item';
    const letters = ['A', 'B', 'C', 'D'];
    const index = teamList.children.length;
    
    div.innerHTML = `
        <div class="dot t-${letters[index]}">${letters[index]}</div>
        <input type="text" placeholder="Nombre Equipo ${letters[index]}" class="team-name-input" style="margin:0; width:70%;">
    `;
    teamList.appendChild(div);
}

function startGame() {
    haptic();
    sfx.ok();
    const inputs = document.querySelectorAll('.team-name-input');
    const goalInput = document.getElementById('goal-points');
    
    if (inputs.length < 1) return alert("Agrega al menos 1 equipo");
    
    teams = Array.from(inputs).map((input, i) => ({
        name: input.value.trim() || `EQUIPO ${['A','B','C','D'][i]}`,
        score: 0,
        id: ['A','B','C','D'][i]
    }));
    
    winScore = parseInt(goalInput.value) || 1000;
    
    setupScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    if (audioCtx.state === 'suspended') audioCtx.resume();
    updateTurnUI();
}

function updateTurnUI() {
    const team = teams[currentTurn];
    const turnCard = document.getElementById('turn-card');
    
    turnCard.className = `turn-card t-${team.id}`;
    turnCard.innerHTML = `
        <span class="team-badge t-${team.id}">TURNO ACTUAL</span>
        <div class="player-name">${team.name}</div>
        <div class="player-score">${team.score}</div>
    `;
    
    document.getElementById('meta-display').textContent = `META: ${winScore}`;
    const leader = [...teams].sort((a,b) => b.score - a.score)[0];
    document.getElementById('leader-display').textContent = `LÍDER: ${leader.name} (${leader.score})`;
    display.textContent = '0';
}

function addToDisplay(num) {
    haptic(30);
    sfx.click();
    if (display.textContent === '0') display.textContent = '';
    if (display.textContent.length < 6) display.textContent += num;
}

function submitScore() {
    const points = parseInt(display.textContent);
    if (!points) return;
    
    haptic(70);
    sfx.ok();
    
    historyStack.push(JSON.parse(JSON.stringify({ teams, currentTurn })));
    teams[currentTurn].score += points;
    
    if (teams[currentTurn].score >= winScore) {
        showWinner(teams[currentTurn]);
    } else {
        currentTurn = (currentTurn + 1) % teams.length;
        updateTurnUI();
    }
}

function undoLast() {
    haptic(50);
    sfx.undo();
    if (historyStack.length === 0) return;
    const last = historyStack.pop();
    teams = last.teams;
    currentTurn = last.currentTurn;
    updateTurnUI();
}

function showWinner(team) {
    sfx.win();
    document.getElementById('w-name').textContent = team.name;
    document.getElementById('w-score').textContent = `${team.score} PTS`;
    winnerModal.style.display = 'flex';
}

function resetGame() {
    location.reload();
}

// --- CONEXIÓN DE EVENTOS (LA PARTE CLAVE) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Conectar botones principales
    const btnAdd = document.querySelector('.btn-add');
    if(btnAdd) btnAdd.onclick = addTeamField;
    
    const btnStart = document.querySelector('.btn-start');
    if(btnStart) btnStart.onclick = startGame;
    
    // 2. Conectar calculadora
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.onclick = function() { addToDisplay(this.innerText); };
    });
    
    const btnOk = document.querySelector('.btn-ok');
    if(btnOk) btnOk.onclick = submitScore;
    
    const btnUndo = document.querySelector('.btn-undo');
    if(btnUndo) btnUndo.onclick = undoLast;
    
    // 3. Conectar modales
    const btnRevancha = document.querySelector('.btn-revancha');
    if(btnRevancha) btnRevancha.onclick = resetGame;

    // 4. Iniciar con 2 equipos vacíos
    addTeamField();
    addTeamField();
});
ÓGICA DEL MARCADOR - VERSIÓN 4.0 (SONIDO + VIBRACIÓN) */

// --- CONFIGURACIÓN DE AUDIO (SINTETIZADOR ARCADE) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// SONIDOS PREDEFINIDOS
const sfx = {
    click: () => playTone(800, 'square', 0.1),
    ok: () => { playTone(600, 'sine', 0.1); setTimeout(() => playTone(1200, 'square', 0.2), 100); },
    undo: () => playTone(150, 'sawtooth', 0.3),
    win: () => {
        // Melodía de Victoria (Fanfarria tipo Final Fantasy corta)
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C E G C G C
        const times = [0, 150, 300, 450, 600, 800];
        notes.forEach((note, i) => {
            setTimeout(() => playTone(note, 'square', 0.2), times[i]);
        });
        // Vibración épica
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 500]);
    }
};

// VIBRACIÓN HÁPTICA
function haptic(ms = 40) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

// --- VARIABLES DEL JUEGO ---
let teams = [];
let currentTurn = 0;
let winScore = 0;
let historyStack = []; // Para el botón deshacer

// --- ELEMENTOS DEL DOM ---
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const teamList = document.getElementById('team-list');
const turnCard = document.getElementById('turn-card');
const display = document.getElementById('calc-display');
const winnerModal = document.getElementById('winner-modal');

// --- FUNCIONES DE SETUP ---
function addTeamField() {
    haptic();
    sfx.click();
    if (teamList.children.length >= 4) return; 
    
    const div = document.createElement('div');
    div.className = 'list-item';
    const letters = ['A', 'B', 'C', 'D'];
    const index = teamList.children.length;
    
    div.innerHTML = `
        <div class="dot t-${letters[index]}">${letters[index]}</div>
        <input type="text" placeholder="Nombre Equipo ${letters[index]}" class="team-name-input" style="margin:0; width:70%;">
    `;
    teamList.appendChild(div);
}

function startGame() {
    haptic();
    const inputs = document.querySelectorAll('.team-name-input');
    const goalInput = document.getElementById('goal-points').value;
    
    // Validar
    if (inputs.length < 1) return alert("Agrega al menos 1 equipo");
    
    teams = Array.from(inputs).map((input, i) => ({
        name: input.value.trim() || `EQUIPO ${['A','B','C','D'][i]}`,
        score: 0,
        id: ['A','B','C','D'][i]
    }));
    
    winScore = parseInt(goalInput) || 1000; // Por defecto 1000 si está vacío
    
    // Cambiar pantalla
    setupScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // Iniciar Audio (Navegadores requieren interacción previa)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    updateTurnUI();
}

// --- LÓGICA DEL JUEGO ---
function updateTurnUI() {
    const team = teams[currentTurn];
    
    // Actualizar Tarjeta Grande
    turnCard.className = `turn-card t-${team.id}`; // Asigna color del equipo
    turnCard.innerHTML = `
        <span class="team-badge t-${team.id}">TURNO ACTUAL</span>
        <div class="player-name">${team.name}</div>
        <div class="player-score">${team.score}</div>
    `;
    
    // Actualizar Info Header
    document.getElementById('meta-display').textContent = `META: ${winScore}`;
    
    // Buscar Líder
    const leader = [...teams].sort((a,b) => b.score - a.score)[0];
    document.getElementById('leader-display').textContent = `LÍDER: ${leader.name} (${leader.score})`;
    
    // Limpiar calculadora
    display.textContent = '0';
}

function addToDisplay(num) {
    haptic(30);
    sfx.click();
    if (display.textContent === '0') display.textContent = '';
    if (display.textContent.length < 6) {
        display.textContent += num;
    }
}

function submitScore() {
    const points = parseInt(display.textContent);
    if (!points) return; // Si es 0 o vacío no hace nada
    
    haptic(70);
    sfx.ok(); // Sonido de confirmación
    
    // Guardar estado para Deshacer
    historyStack.push(JSON.parse(JSON.stringify({ teams, currentTurn })));
    
    // Sumar puntos
    teams[currentTurn].score += points;
    
    // Verificar Victoria
    if (teams[currentTurn].score >= winScore) {
        showWinner(teams[currentTurn]);
    } else {
        // Pasar turno (cíclico)
        currentTurn = (currentTurn + 1) % teams.length;
        updateTurnUI();
    }
}

function undoLast() {
    haptic(50);
    sfx.undo();
    if (historyStack.length === 0) return;
    
    const lastState = historyStack.pop();
    teams = lastState.teams;
    currentTurn = lastState.currentTurn;
    updateTurnUI();
}

function showWinner(team) {
    sfx.win(); // ¡FANFARRIA!
    document.getElementById('w-name').textContent = team.name;
    document.getElementById('w-score').textContent = `${team.score} PUNTOS`;
    winnerModal.style.display = 'flex';
    
    // Efecto visual simple (fondo parpadea)
    let flash = 0;
    const interval = setInterval(() => {
        winnerModal.style.backgroundColor = flash % 2 ? 'rgba(0,0,0,0.95)' : 'rgba(50,50,0,0.95)';
        flash++;
        if(flash > 10) clearInterval(interval);
    }, 200);
}

function resetGame() {
    location.reload(); // La forma más segura de reiniciar todo limpia
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    addTeamField(); // Agregar Equipo A por defecto
    addTeamField(); // Agregar Equipo B por defecto
});
