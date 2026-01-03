/* PRISMA LABS ENGINE v7.0 - AUDIO FIX + PARTICIPANTES */

// --- MOTOR DE AUDIO "DESBLOQUEABLE" ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Esta función desbloquea el audio en el PRIMER toque de pantalla
document.addEventListener('click', function() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log("Audio Desbloqueado");
        });
    }
}, { once: true }); // Se ejecuta una sola vez y se borra

const tone = (f, t, d) => {
    // Intento de rescate si el audio sigue suspendido
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = t; 
    o.frequency.value = f;
    
    // Volumen suave
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d);
    
    o.connect(g); 
    g.connect(audioCtx.destination);
    o.start(); 
    o.stop(audioCtx.currentTime + d);
};

const sfx = {
    tap: () => { tone(800, 'square', 0.05); if(navigator.vibrate) navigator.vibrate(15); },
    ok: () => { tone(500, 'sine', 0.1); setTimeout(()=>tone(1000,'square',0.1), 80); if(navigator.vibrate) navigator.vibrate(40); },
    del: () => { tone(150, 'sawtooth', 0.15); if(navigator.vibrate) navigator.vibrate(30); },
    win: () => { 
        [523,659,783,1046,783,1046].forEach((n,i)=>setTimeout(()=>tone(n,'square',0.2), i*150));
        if(navigator.vibrate) navigator.vibrate([100,50,100,50,500]);
    }
};

// --- ESTADO DEL JUEGO ---
let teams = [];
let turn = 0;
let goal = 1000;

// --- FUNCIONES ---
function init() {
    // Creamos 2 equipos vacíos por defecto
    addTeamRow('A');
    addTeamRow('B');
}

function addTeamRow(forceId = null) {
    sfx.tap();
    const list = document.getElementById('team-list');
    
    // Máximo 4 equipos (A, B, C, D)
    if(list.children.length >= 4) return;
    
    const ids = ['A','B','C','D'];
    const id = forceId || ids[list.children.length];
    
    const div = document.createElement('div');
    div.className = 'list-item';
    // AQUI ESTA EL CAMBIO: Agregamos el campo de INTEGRANTES
    div.innerHTML = `
        <div class="dot bg-${id}">${id}</div>
        <div class="inputs-col">
            <input type="text" class="team-name" data-id="${id}" placeholder="Nombre Equipo ${id} (Opcional)">
            <input type="text" class="team-members input-members" placeholder="Integrantes (Ej: Juan, Pepe...)">
        </div>
    `;
    list.appendChild(div);
}

function startGame() {
    sfx.ok();
    
    const rows = document.querySelectorAll('.list-item');
    teams = [];
    
    rows.forEach(row => {
        const nameInput = row.querySelector('.team-name');
        const memInput = row.querySelector('.team-members');
        const id = nameInput.dataset.id;
        
        // Si el usuario no escribe nombre, usamos "EQUIPO X"
        // Si escribe integrantes, los guardamos también
        teams.push({
            name: nameInput.value.trim() || `EQUIPO ${id}`,
            members: memInput.value.trim() || "", 
            score: 0,
            id: id
        });
    });

    goal = parseInt(document.getElementById('goal-points').value) || 1000;
    
    // Cambiar pantalla
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    updateUI();
}

function updateUI() {
    const t = teams[turn];
    const card = document.getElementById('turn-card');
    
    // Estilo Neón Dinámico
    card.className = `turn-card b-${t.id}`;
    
    // Mostrar Nombre y PARTICIPANTES
    card.innerHTML = `
        <span class="player-label bg-${t.id}">TURNO ACTUAL</span>
        <div class="player-name text-${t.id}">${t.name}</div>
        ${t.members ? `<div class="player-members">(${t.members})</div>` : ''}
        <div class="player-score">${t.score}</div>
    `;
    
    // Info superior
    document.getElementById('meta-display').textContent = `META: ${goal}`;
    const leader = [...teams].sort((a,b)=>b.score-a.score)[0];
    document.getElementById('leader-display').textContent = `LÍDER: ${leader.name.substring(0,8)} (${leader.score})`;
    
    // Limpiar calculadora
    document.getElementById('calc-display').textContent = "0";
}

function handleNum(val) {
    sfx.tap();
    const d = document.getElementById('calc-display');
    if(d.textContent === '0') d.textContent = '';
    if(d.textContent.length < 6) d.textContent += val;
}

function handleUndo() {
    sfx.del();
    document.getElementById('calc-display').textContent = "0";
}

function handleSubmit() {
    const pts = parseInt(document.getElementById('calc-display').textContent);
    if(!pts) return;
    
    sfx.ok();
    teams[turn].score += pts;
    
    if(teams[turn].score >= goal) {
        showWin(teams[turn]);
    } else {
        turn = (turn + 1) % teams.length;
        updateUI();
    }
}

function showWin(team) {
    sfx.win();
    const modal = document.getElementById('winner-modal');
    document.getElementById('w-name').textContent = team.name;
    document.getElementById('w-name').className = `winner-name text-${team.id}`;
    document.getElementById('w-score').textContent = `${team.score} PTS`;
    modal.style.display = 'flex';
}

// --- CONEXIONES ---
document.addEventListener('DOMContentLoaded', () => {
    // Configuración
    document.getElementById('btn-add-team').onclick = () => addTeamRow();
    document.getElementById('btn-start-game').onclick = startGame;
    
    // Teclado Numérico
    document.querySelectorAll('.num-btn').forEach(btn => {
        if(btn.dataset.val) btn.onclick = () => handleNum(btn.dataset.val);
    });
    
    document.getElementById('btn-undo').onclick = handleUndo;
    document.getElementById('btn-ok').onclick = handleSubmit;
    document.getElementById('btn-revancha').onclick = () => location.reload();
    
    // Iniciar
    init();
});
