/* PRISMA LABS - ENGINE v6.0 */

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const tone = (f, t, d) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
};

const sfx = {
    tap: () => { tone(800, 'square', 0.05); if(navigator.vibrate) navigator.vibrate(20); },
    ok: () => { tone(600, 'sine', 0.1); setTimeout(()=>tone(1200,'square',0.15), 80); if(navigator.vibrate) navigator.vibrate(40); },
    del: () => { tone(150, 'sawtooth', 0.2); if(navigator.vibrate) navigator.vibrate(30); },
    win: () => { 
        [523,659,783,1046,523,659,783,1046].forEach((n,i)=>setTimeout(()=>tone(n,'square',0.2), i*120));
        if(navigator.vibrate) navigator.vibrate([100,50,100,50,500]);
    }
};

// --- GAME STATE ---
let teams = [];
let turn = 0;
let goal = 1000;

// --- FUNCIONES ---
function init() {
    // Agregar 2 equipos base al inicio
    addTeamRow('A');
    addTeamRow('B');
}

function addTeamRow(forceId = null) {
    sfx.tap();
    const list = document.getElementById('team-list');
    if(list.children.length >= 4) return;
    
    const ids = ['A','B','C','D'];
    const id = forceId || ids[list.children.length];
    
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
        <div class="dot bg-${id}">${id}</div>
        <input type="text" class="team-input" data-id="${id}" placeholder="Nombre Equipo ${id}">
    `;
    list.appendChild(div);
}

function startGame() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    sfx.ok();
    
    const inputs = document.querySelectorAll('.team-input');
    teams = [];
    
    inputs.forEach(inp => {
        if(inp.value.trim() !== "" || inputs.length > 0) {
            teams.push({
                name: inp.value.trim() || `EQUIPO ${inp.dataset.id}`,
                score: 0,
                id: inp.dataset.id
            });
        }
    });

    if(teams.length === 0) return alert("Agrega equipos");
    
    goal = parseInt(document.getElementById('goal-points').value) || 1000;
    
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    updateUI();
}

function updateUI() {
    const t = teams[turn];
    const card = document.getElementById('turn-card');
    
    // Aplicar estilos dinámicos
    card.className = `turn-card b-${t.id}`;
    card.innerHTML = `
        <span class="player-label bg-${t.id}">TURNO ACTUAL</span>
        <div class="player-name text-${t.id}">${t.name}</div>
        <div class="player-score">${t.score}</div>
    `;
    
    // Info Meta y Líder
    document.getElementById('meta-display').textContent = `META: ${goal}`;
    const leader = [...teams].sort((a,b)=>b.score-a.score)[0];
    document.getElementById('leader-display').textContent = `LÍDER: ${leader.name.substring(0,8)}.. (${leader.score})`;
    
    // Limpiar pantalla calc
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

// --- EVENT LISTENERS (CONEXIONES) ---
document.addEventListener('DOMContentLoaded', () => {
    // Botones Setup
    document.getElementById('btn-add-team').onclick = () => addTeamRow();
    document.getElementById('btn-start-game').onclick = startGame;
    
    // Botones Calculadora
    document.querySelectorAll('.num-btn').forEach(btn => {
        if(btn.dataset.val) {
            btn.onclick = () => handleNum(btn.dataset.val);
        }
    });
    
    document.getElementById('btn-undo').onclick = handleUndo;
    document.getElementById('btn-ok').onclick = handleSubmit;
    document.getElementById('btn-revancha').onclick = () => location.reload();
    
    // Inicializar
    init();
});
