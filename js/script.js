/* PRISMA LABS ENGINE v16.0 - ZERO POINTS ALLOWED */

const app = {
    mode: 'teams',
    teams: [],
    turn: 0,
    goal: 1000,
    
    // --- AUDIO ENGINE ---
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
    
    tone: (f, type, duration, vol = 0.1) => {
        if(app.audioCtx.state === 'suspended') app.audioCtx.resume();
        const o = app.audioCtx.createOscillator();
        const g = app.audioCtx.createGain();
        o.type = type; 
        o.frequency.setValueAtTime(f, app.audioCtx.currentTime);
        g.gain.setValueAtTime(vol, app.audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, app.audioCtx.currentTime + duration);
        o.connect(g); g.connect(app.audioCtx.destination);
        o.start(); o.stop(app.audioCtx.currentTime + duration);
    },

    vib: (ms) => { if(navigator.vibrate) navigator.vibrate(ms); },

    // --- EFECTOS ---
    sfx: {
        tap: () => { app.tone(400, 'square', 0.1); app.vib(30); },
        del: () => { app.tone(150, 'sawtooth', 0.2); app.vib(50); }, // Sonido simple de borrar
        start: () => {
            [440, 554, 659, 880].forEach((f, i) => setTimeout(() => app.tone(f, 'square', 0.2), i * 100));
            app.vib([50, 50, 50]);
        },
        ok: () => {
            app.tone(987, 'square', 0.1); 
            setTimeout(() => app.tone(1318, 'square', 0.4), 80); 
            app.vib(80);
        },
        win: () => {
            const melody = [523, 523, 523, 523, 415, 466, 523, 0, 466, 523];
            const rhythm = [150, 150, 150, 400, 400, 400, 300, 100, 150, 800];
            let time = 0;
            melody.forEach((note, i) => {
                setTimeout(() => { if (note > 0) app.tone(note, 'square', 0.3); }, time);
                time += rhythm[i];
            });
            app.vib([100, 50, 100, 50, 100, 50, 500]);
        }
    },

    init: () => {
        document.addEventListener('click', ()=>{ if(app.audioCtx.state==='suspended')app.audioCtx.resume(); }, {once:true});
        app.addRival(); 
        app.addRival();
        
        document.getElementById('btn-add-team').onclick = () => app.addRival();
        document.getElementById('btn-start-game').onclick = () => { app.sfx.start(); app.startGame(); };
        document.querySelectorAll('.num-btn').forEach(b => { if(b.dataset.val) b.onclick=()=>app.num(b.dataset.val); });
        document.getElementById('btn-undo').onclick = app.undo;
        document.getElementById('btn-ok').onclick = app.submit;
    },

    setMode: (newMode) => {
        app.sfx.tap();
        app.mode = newMode;
        document.getElementById('btn-mode-teams').className = `mode-btn ${newMode==='teams'?'active':''}`;
        document.getElementById('btn-mode-solo').className = `mode-btn ${newMode==='solo'?'active':''}`;
        document.querySelectorAll('.members-wrapper').forEach(el => {
            if(newMode === 'solo') el.classList.add('hidden');
            else el.classList.remove('hidden');
        });
        const placeholder = newMode === 'solo' ? 'Nombre del Jugador' : 'Nombre del Equipo';
        document.querySelectorAll('.team-name').forEach(el => el.placeholder = placeholder);
    },

    addRival: (data = null) => {
        if(!data) app.sfx.tap();
        const list = document.getElementById('team-list');
        const count = list.children.length + 1; 
        const id = count; 
        const styleLetters = ['A','B','C','D'];
        const styleId = styleLetters[(count - 1) % 4]; 
        
        const div = document.createElement('div');
        div.className = 'list-item';
        div.dataset.style = styleId; 
        
        const hiddenClass = app.mode === 'solo' ? 'hidden' : '';
        const ph = app.mode === 'solo' ? `Jugador ${id}` : `Equipo ${id}`;
        
        const valName = data ? data.name : '';
        const valMembers = data ? data.membersArray : [];

        div.innerHTML = `
            <div class="dot bg-${styleId}">${id}</div>
            <div class="inputs-col">
                <input type="text" class="team-name" placeholder="${ph}" value="${valName}">
                <div class="members-wrapper ${hiddenClass}">
                    <div class="member-row">
                        <input type="text" class="input-member-small" placeholder="Participante 1" value="${valMembers[0] || ''}">
                        <button class="btn-add-member" onclick="app.addMemberField(this)">+</button>
                    </div>
                </div>
            </div>
            <button class="btn-delete-row" onclick="app.removeRival(this)">🗑️</button>
        `;
        list.appendChild(div);

        if(valMembers.length > 1) {
            const btnPlus = div.querySelector('.btn-add-member');
            for(let i=1; i<valMembers.length; i++) {
                app.addMemberField(btnPlus, valMembers[i]);
            }
        }
    },

    addMemberField: (btn, value = '') => {
        if(!value) app.sfx.tap();
        const wrapper = btn.closest('.members-wrapper');
        const newRow = document.createElement('div');
        newRow.className = 'member-row';
        const count = wrapper.children.length + 1;
        newRow.innerHTML = `<input type="text" class="input-member-small" placeholder="Participante ${count}" value="${value}">`;
        wrapper.insertBefore(newRow, btn.parentElement);
    },

    removeRival: (btn) => {
        app.sfx.del();
        const list = document.getElementById('team-list');
        if(list.children.length > 1) btn.parentElement.remove();
        else alert("¡Debe haber al menos 1 participante!");
    },

    startGame: () => {
        const rows = document.querySelectorAll('.list-item');
        app.teams = [];
        rows.forEach((row, index) => {
            const nameInp = row.querySelector('.team-name');
            const styleId = row.dataset.style;
            const realId = index + 1;
            let name = nameInp.value.trim();
            if(!name) name = app.mode === 'solo' ? `JUGADOR ${realId}` : `EQUIPO ${realId}`;
            
            let membersArray = [];
            if(app.mode === 'teams') {
                const memberInputs = row.querySelectorAll('.input-member-small');
                memberInputs.forEach(mi => {
                    if(mi.value.trim() !== "") membersArray.push(mi.value.trim());
                });
            }
            app.teams.push({
                name: name,
                membersArray: membersArray,
                currentMemberIdx: 0, 
                score: 0,
                id: styleId 
            });
        });

        app.goal = parseInt(document.getElementById('goal-points').value) || 1000;
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('winner-modal').style.display = 'none';
        document.getElementById('game-screen').classList.add('active');
        app.turn = 0;
        app.updateUI();
    },

    rematch: (type) => {
        app.sfx.ok();
        let nextTeams = [...app.teams];
        if(type === 'top2') {
            if(nextTeams.length < 2) return alert("Se necesitan al menos 2 equipos.");
            nextTeams.sort((a,b) => b.score - a.score);
            nextTeams = nextTeams.slice(0, 2);
        }
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('winner-modal').style.display = 'none';
        document.getElementById('setup-screen').classList.add('active');
        const list = document.getElementById('team-list');
        list.innerHTML = ''; 
        nextTeams.forEach(teamData => {
            teamData.score = 0;
            app.addRival(teamData);
        });
    },

    updateUI: () => {
        const t = app.teams[app.turn];
        const card = document.getElementById('turn-card');
        card.className = `turn-card pulse-anim b-${t.id}`;
        
        let activePlayerText = "";
        if(t.membersArray.length > 0) {
            const memberName = t.membersArray[t.currentMemberIdx];
            activePlayerText = `<div class="player-members">Lanza: ${memberName}</div>`;
        } else if (app.mode === 'teams') {
            activePlayerText = `<div class="player-members" style="opacity:0.5">(Sin lista)</div>`;
        }

        card.innerHTML = `
            <span class="player-label bg-${t.id}">TURNO ACTUAL</span>
            <div class="player-name text-${t.id}">${t.name}</div>
            ${activePlayerText}
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
    
    // --- LÓGICA DE ENVÍO DE PUNTOS ---
    submit: () => {
        // Leemos el valor, si está vacío o es raro, asumimos 0
        let val = document.getElementById('calc-display').textContent;
        let pts = parseInt(val);
        if (isNaN(pts)) pts = 0;

        // AQUÍ ESTABA EL ERROR: Antes había un "if(!pts) return" que bloqueaba el 0.
        // Ya lo quitamos. Ahora el código sigue fluyendo.

        app.sfx.ok(); // Sonará "moneda" confirmando el pase
        
        app.teams[app.turn].score += pts;
        
        // Rotar jugador dentro del equipo
        const t = app.teams[app.turn];
        if(t.membersArray.length > 0) {
            t.currentMemberIdx = (t.currentMemberIdx + 1) % t.membersArray.length;
        }

        if(app.teams[app.turn].score >= app.goal) {
            app.showVictoryScreen();
        } else {
            app.turn = (app.turn + 1) % app.teams.length;
            app.updateUI();
        }
    },

    showVictoryScreen: () => {
        const winner = app.teams[app.turn];
        const modal = document.getElementById('winner-modal');
        app.sfx.win();
        document.getElementById('w-name').textContent = winner.name;
        document.getElementById('w-name').className = `winner-name text-${winner.id}`;
        document.getElementById('w-score').textContent = `${winner.score} PTS`;
        modal.style.display = 'flex';
    }
};

document.addEventListener('DOMContentLoaded', app.init);
