const T_COLORS = { A:'#ff0055', B:'#00eaff', C:'#39ff14', D:'#ffff00', null:'#ffffff' };
const TEAMS = ['A', 'B', 'C', 'D'];
let D = { ps: [], target: 2000, active: false, turn: 0 }; 
let currentInput = "0";

// --- WAKELOCK ---
let wakeLock = null;
async function requestWakeLock() {
    if ('wakeLock' in navigator) { try { wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} }
}
document.addEventListener('visibilitychange', async () => { if (wakeLock !== null && document.visibilityState === 'visible') requestWakeLock(); });

// --- SISTEMA ---
function save() { try { localStorage.setItem('br_v1_1_pro', JSON.stringify(D)); } catch(e){} }
function load() {
    try {
        let s = localStorage.getItem('br_v1_1_pro');
        if(s) { D = JSON.parse(s); if(D.target) document.getElementById('target').value = D.target; }
        updateStartButton();
        if(D.active) switchTo('game'); else renderList();
    } catch(e) { D = { ps: [], target: 2000, active: false, turn: 0 }; }
}

function switchTo(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName).classList.add('active');
    if(screenName === 'game') { requestWakeLock(); document.getElementById('dTarget').innerText = D.target; updateUI(); }
}

function goToMenu() { switchTo('setup'); renderList(); updateStartButton(); }

function updateStartButton() {
    let btn = document.getElementById('btnMainAction');
    if(D.active) { btn.innerText = "CONTINUAR JUEGO ▶"; btn.style.background = "linear-gradient(45deg, #27ae60, #2ecc71)"; } 
    else { btn.innerText = "¡A JUGAR!"; btn.style.background = "linear-gradient(45deg, #ff0055, #ff5500)"; }
}

// --- SETUP ---
function addP() {
    let n = document.getElementById('pName'); let v = n.value.trim();
    if(v){ D.ps.push({n:v, s:0, t:null}); n.value=''; save(); renderList(); }
}
function toggleTeam(i) {
    let p = D.ps[i]; let idx = p.t ? TEAMS.indexOf(p.t) : -1; idx++; 
    p.t = idx < TEAMS.length ? TEAMS[idx] : null; save(); renderList();
}
function renderList() {
    let l = document.getElementById('playerList'); l.innerHTML='';
    D.ps.forEach((p,i)=>{
        let c = T_COLORS[p.t] || '#fff'; let tTxt = p.t || '•';
        l.innerHTML += `<div class="list-item" style="border-left-color:${c}"><div style="display:flex;align-items:center;gap:15px;"><div class="dot" style="background:${c}" onclick="toggleTeam(${i})">${tTxt}</div><span style="font-weight:bold; font-size:1.1rem">${p.n}</span></div><button onclick="delP(${i})" style="background:transparent;border:none;color:#777;font-size:1.5rem; padding:5px 15px;">✕</button></div>`;
    });
}
function delP(i){ D.ps.splice(i,1); save(); renderList(); }

function processStart() {
    if(D.ps.length === 0) return alert("Faltan jugadores");
    let val = document.getElementById('target').value; D.target = val ? parseInt(val) : 2000;
    if(!D.active) { sortPlayers(); D.active = true; D.turn = 0; }
    save(); switchTo('game');
}
function sortPlayers() {
    let sorted = []; let map = { A:[], B:[], C:[], D:[], N:[] };
    D.ps.forEach(p => { if(p.t && map[p.t]) map[p.t].push(p); else map.N.push(p); });
    let max = Math.max(map.A.length, map.B.length, map.C.length, map.D.length, map.N.length);
    for(let i=0; i<max; i++) { TEAMS.forEach(t => { if(map[t][i]) sorted.push(map[t][i]); }); }
    map.N.forEach(p => sorted.push(p)); D.ps = sorted;
}

// --- JUEGO ---
function updateUI() {
    if(!D.ps[D.turn]) D.turn = 0; 
    let p = D.ps[D.turn]; if(!p) return;
    let score = p.s; if(p.t) score = D.ps.filter(x => x.t === p.t).reduce((a,b) => a+b.s, 0);
    let card = document.getElementById('activeCard'); let badge = document.getElementById('acBadge'); let bg = document.getElementById('dynamicBG');
    let color = T_COLORS[p.t] || '#fff';
    
    card.className = "turn-card pop"; card.style.borderColor = color;
    badge.innerText = p.t ? "EQUIPO " + p.t : "INDIVIDUAL"; badge.style.background = color;
    document.getElementById('acName').innerText = p.n; document.getElementById('acName').style.color = '#fff';
    document.getElementById('acScore').innerText = score; document.getElementById('acScore').style.color = color;
    bg.style.background = `radial-gradient(circle at center, ${color}33 0%, #000 80%)`;
    updateBtnState(color);
    setTimeout(()=>card.classList.remove('pop'), 150); updateLeader();
}

function nextTurn() { D.turn++; if(D.turn >= D.ps.length) D.turn=0; currentInput="0"; updateScreen(); save(); updateUI(); }
function typeNum(n) { if(currentInput==="0") currentInput=String(n); else if(currentInput.length<5) currentInput+=n; updateScreen(); }
function updateScreen() { document.getElementById('calcScreen').innerText = currentInput; let p = D.ps[D.turn]; let color = T_COLORS[p.t] || '#fff'; updateBtnState(color); }
function updateBtnState(color) {
    let btn = document.getElementById('btnAction');
    if(currentInput === "0") { btn.innerText = "PASAR"; btn.style.background = "#333"; btn.style.color = "#888"; btn.style.boxShadow = "none"; } 
    else { btn.innerText = "OK"; btn.style.background = color; btn.style.color = "#000"; btn.style.boxShadow = `0 0 15px ${color}`; }
}

function actionBtn() {
    let pts = parseInt(currentInput); if (pts === 0) { nextTurn(); return; }
    let p = D.ps[D.turn]; p.s += pts; 
    try { if(navigator.vibrate) navigator.vibrate(50); } catch(e){}
    let total = p.t ? D.ps.filter(x=>x.t===p.t).reduce((a,b)=>a+b.s,0) : p.s;
    if(total >= D.target) {
        document.getElementById('winModal').style.display='flex';
        document.getElementById('wName').innerText = p.t ? "EQUIPO "+p.t : p.n;
        document.getElementById('wScore').innerText = total;
        try { if(navigator.vibrate) navigator.vibrate([100,50,100,50,200]); } catch(e){}
        startConf();
    } else { nextTurn(); }
}

function undo() {
    let pts = parseInt(currentInput); if(pts===0)return;
    let p = D.ps[D.turn]; p.s -= pts; if(p.s<0)p.s=0;
    currentInput="0"; updateScreen(); save(); updateUI();
}

function updateLeader() {
    let max=-1, who="-"; let done=[];
    D.ps.forEach(p=>{
        let sc=p.s; let nm=p.n;
        if(p.t){ if(done.includes(p.t))return; sc=D.ps.filter(x=>x.t===p.t).reduce((a,b)=>a+b.s,0); nm="EQ "+p.t; done.push(p.t); }
        if(sc>max){max=sc;who=nm;}
    });
    document.getElementById('leader').innerText = max>0 ? `${who} (${max})` : "-";
}

function rematch() {
    if(confirm("¿Reiniciar puntajes a 0? (Se mantienen los equipos)")) {
        D.ps.forEach(p => p.s = 0);
        D.turn = 0; D.active = true; currentInput = "0";
        save(); updateUI(); updateScreen();
        document.getElementById('winModal').style.display = 'none';
    }
}

function fullReset(){ 
    if(confirm("¿Borrar todo y salir?")) { localStorage.removeItem('br_v1_1_pro'); location.reload(); } 
}
function closeWin() { document.getElementById('winModal').style.display = 'none'; }

const canvas = document.getElementById('confetti'); const ctx = canvas.getContext('2d');
function startConf() { canvas.width=window.innerWidth; canvas.height=window.innerHeight; let ps=[]; for(let i=0;i<90;i++) ps.push({x:Math.random()*canvas.width, y:Math.random()*-canvas.height, c:'hsl('+Math.random()*360+',100%,50%)', s:2+Math.random()*4}); function loop(){ if(document.getElementById('winModal').style.display!='flex'){ctx.clearRect(0,0,canvas.width,canvas.height);return;} ctx.clearRect(0,0,canvas.width,canvas.height); ps.forEach(p=>{ p.y+=p.s; if(p.y>canvas.height)p.y=-10; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,6.28); ctx.fill() }); requestAnimationFrame(loop);} loop();}

window.onload = load;
