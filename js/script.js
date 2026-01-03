/* PRISMA LABS ENGINE v10.0 - DYNAMIC MEMBERS ADDON */

const app = {
    mode: 'teams',
    teams: [],
    turn: 0,
    goal: 1000,
    
    // --- AUDIO ENGINE ---
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
    tone: (f,t,d) => {
        if(app.audioCtx.state==='suspended') app.audioCtx.resume();
        const o=app.audioCtx.createOscillator(), g=app.audioCtx.createGain();
        o.type=t; o.frequency.value=f;
        g.gain.setValueAtTime(0.1, app.audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, app.audioCtx.currentTime+d);
        o.connect(g); g.connect(app.audioCtx.destination);
        o.start(); o.stop(app.audioCtx.currentTime+d);
    },
    vib: (ms) => { if(navigator.vibrate) navigator.vibrate(ms); },
    sfx: {
        tap:()=>{app.tone(800,'square',0.05); app.vib(50);},
        ok:()=>{app.tone(500,'sine',0.1);setTimeout(()=>app.tone(1000,'square',0.1),80); app.vib(80);},
        del:()=>{app.tone(150,'sawtooth',0.15); app.vib(60);},
        win:()=>{[523,659,783,1046,783,1046].forEach((n,i)=>setTimeout(()=>app.tone(n,'square',0.2),i*150)); app.vib([100,50,100,50,500]);}
    },

    init: () => {
        document.addEventListener('click', ()=>{ if(app.audioCtx.state==='suspended')app.audioCtx.resume(); }, {once:true});
        app.addRival('A');
        app.addRival('B');
        
        document.getElementById('btn-add-team').onclick = () => app.addRival();
        document.getElementById('btn-start-game').onclick = app.startGame;
        document.querySelectorAll('.num-btn').forEach(b => { if(b.dataset.val) b.onclick=()=>app.num(b.dataset.val); });
        document.getElementById('btn-undo').onclick = app.undo;
        document.getElementById('btn-ok').onclick = app.submit;
        document.getElementById('btn-revancha').onclick = () => location.reload();
    },

    setMode: (newMode) => {
        app.sfx.tap();
        app.mode = newMode;
        document.getElementById('btn-mode-teams').className = `mode-btn ${newMode==='teams'?'active':''}`;
        document.getElementById('btn-mode-solo').className = `mode-btn ${newMode==='solo'?'active':''}`;
        
        // Ocultar/Mostrar el wrapper de miembros completo
        document.querySelectorAll('.members-wrapper').forEach(el => {
            if(newMode === 'solo') el.classList.add('hidden');
            else el.classList.remove('hidden');
        });
        
        const placeholder = newMode === 'solo' ? 'Nombre del Jugador' : 'Nombre del Equipo';
        document.querySelectorAll('.team-name').forEach(el => el.placeholder = placeholder);
    },

    addRival: (forceId) => {
        app.sfx.tap();
        const list = document.getElementById('team-list');
        if(list.children.length >= 4) return;
        
        const currentIds = Array.from(list.children).map(c => c.dataset.id);
        const allIds = ['A','B','C','D'];
        let id = forceId || allIds.find(i => !currentIds.includes(i));
        if (!id) return;
        
        const div = document.createElement('div');
        div.className = 'list-item';
        div.dataset.id = id;
        
        const hiddenClass = app.mode === 'solo' ? 'hidden' : '';
        const ph = app.mode === 'solo' ? 'Nombre del Jugador' : `Nombre Equipo ${id}`;
        
        // NUEVA ESTRUCTURA HTML CON BOTÓN +
        div.innerHTML = `
            <div class="dot bg-${id}">${id}</div>
            <div class="inputs-col">
                <input type="text" class="team-name" placeholder="${ph}">
                
                <div class="members-wrapper ${hiddenClass}">
                    <div class="member-row">
                        <input type="text" class="input-member-small" placeholder="Jugador 1">
                        <button class="btn-add-member" onclick="app.addMemberField(this)">+</button>
                    </div>
                </div>

            </div>
            <button class="btn-delete-row" onclick="app.removeRival(this)">🗑️</button>
        `;
        list.appendChild(div);
    },

    // --- NUEVA FUNCIÓN: AGREGAR CAMPO DE JUGADOR ---
    addMemberField: (btn) => {
        app.sfx.tap();
        // Encontrar el contenedor de filas de miembros
        const wrapper = btn.closest('.members-wrapper');
        
        // Crear una nueva fila solo con input (sin botón +)
        const newRow = document.createElement('div');
        newRow.className = 'member-row';
        // Calculamos el número de jugador
        const count = wrapper.children.length + 1;
        newRow.innerHTML = `<input type="text" class="input-member-small" placeholder="Jugador ${count}">`;
        
        // Insertar antes de la fila que contiene el botón +
        wrapper.insertBefore(newRow, btn.parentElement);
    },

    removeRival: (btn) => {
        app.sfx.del();
        const list = document.getElementById('team-list');
        if(list.children.length > 1) btn.parentElement.remove();
        else alert("¡Debe haber al menos 1 participante!");
    },

    startGame: () => {
        app.sfx.ok();
        const rows = document.querySelectorAll('.list-item');
        app.teams = [];
        
        rows.forEach(row => {
            const nameInp = row.querySelector('.team-name');
            const id = row.dataset.id;
            let name = nameInp.value.trim();
            if(!name) name = app.mode === 'solo' ? `JUGADOR ${id}` : `EQUIPO ${id}`;
            
            // RECOLECTAR MIEMBROS
            let membersList = "";
            if(app.mode === 'teams') {
                const memberInputs = row.querySelectorAll('.input-member-small');
                let membersArray = [];
                // Juntar solo los que tengan texto
                memberInputs.forEach(mi => {
                    if(mi.value.trim() !== "") membersArray.push(mi.value.trim());
                });
                membersList = membersArray.join(", "); // Unirlos con comas
            }
            
            app.teams.push({
                name: name,
                members: membersList,
                score: 0,
                id: id
            });
        });

        app.goal = parseInt(document.getElementById('goal-points').value) || 1000;
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        app.updateUI();
    },

    updateUI: () => {
        const t = app.teams[app.turn];
        const card = document.getElementById('turn-card');
        card.className = `turn-card b-${t.id}`;
        card.innerHTML = `
            <span class="player-label bg-${t.id}">TURNO ACTUAL</span>
            <div class="player-name text-${t.id}">${t.name}</div>
            ${t.members ? `<div class="player-members">(${t.members})</div>` : ''}
            <div class="player-score">${t.score}</div>
        `;
        document.getElementById('meta-display').textContent = `META: ${app.goal}`;
        const leader = [...app.teams].sort((a,b)=>b.score-a.score)[0];
        document.getElementById('leader-display').textContent = `LÍDER: ${leader.name.substring(0,8)} (${leader.score})`;
        document.getElementById('calc-display').textContent = "0";
    },

    num: (v) => {
        app.sfx.tap();
        const d = document.getElementById('calc-display');
        if(d.textContent==='0') d.textContent='';
        if(d.textContent.length<6) d.textContent+=v;
    },
    undo: () => { app.sfx.del(); document.getElementById('calc-display').textContent="0"; },
    submit: () => {
        const pts = parseInt(document.getElementById('calc-display').textContent);
        if(!pts) return;
        app.sfx.ok();
        app.teams[app.turn].score += pts;
        if(app.teams[app.turn].score >= app.goal) {
            app.sfx.win();
            document.getElementById('winner-modal').style.display='flex';
            document.getElementById('w-name').textContent = app.teams[app.turn].name;
            document.getElementById('w-name').className = `winner-name text-${app.teams[app.turn].id}`;
            document.getElementById('w-score').textContent = `${app.teams[app.turn].score} PTS`;
        } else {
            app.turn = (app.turn + 1) % app.teams.length;
            app.updateUI();
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
