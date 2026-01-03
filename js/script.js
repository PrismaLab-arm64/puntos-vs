/* PRISMA LABS ENGINE v18.0 - TRANSFER & EDIT */

const app = {
    mode: 'teams',
    teams: [],
    turn: 0,
    goal: 1000,
    historyLog: [],
    soundEnabled: true,
    
    // --- AUDIO ---
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
    tone: (f,t,d) => {
        if(!app.soundEnabled) return;
        if(app.audioCtx.state==='suspended') app.audioCtx.resume();
        const o=app.audioCtx.createOscillator(), g=app.audioCtx.createGain();
        o.type=t; o.frequency.value=f;
        g.gain.setValueAtTime(0.1, app.audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, app.audioCtx.currentTime+d);
        o.connect(g); g.connect(app.audioCtx.destination);
        o.start(); o.stop(app.audioCtx.currentTime+d);
    },
    vib: (ms) => { if(app.soundEnabled && navigator.vibrate) navigator.vibrate(ms); },
    sfx: {
        tap:()=>{app.tone(400,'square',0.1); app.vib(30);},
        del:()=>{app.tone(150,'sawtooth',0.2); app.vib(50);},
        start:()=>{[440,554,659,880].forEach((f,i)=>setTimeout(()=>app.tone(f,'square',0.2),i*100)); app.vib([50,50,50]);},
        ok:()=>{app.tone(987,'square',0.1);setTimeout(()=>app.tone(1318,'square',0.4),80);app.vib(80);},
        win:()=>{[523,523,523,523,415,466,523,0,466,523].forEach((n,i)=>setTimeout(()=>{if(n>0)app.tone(n,'square',0.3);},i*150));app.vib([100,50,100,50,100,50,500]);}
    },

    init: () => {
        document.addEventListener('click', ()=>{ if(app.audioCtx.state==='suspended')app.audioCtx.resume(); }, {once:true});
        if ('wakeLock' in navigator) { navigator.wakeLock.request('screen').catch(err => console.log(err)); }

        // CHECK IMPORTACIÓN DE URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('data')) {
            app.loadGameFromUrl(urlParams.get('data'));
        } else {
            app.addRival(); 
            app.addRival();
        }
        
        document.getElementById('btn-add-team').onclick = () => app.addRival();
        document.getElementById('btn-start-game').onclick = () => { app.sfx.start(); app.startGame(); };
        document.querySelectorAll('.num-btn').forEach(b => { if(b.dataset.val) b.onclick=()=>app.num(b.dataset.val); });
        document.getElementById('btn-undo-calc').onclick = app.undoCalc;
        document.getElementById('btn-ok').onclick = app.submit;
    },

    // --- TRANSFERENCIA DE PARTIDA (MAGIC LINK) ---
    shareGame: () => {
        // Empaquetar estado
        const gameState = {
            t: app.teams,
            turn: app.turn,
            g: app.goal,
            h: app.historyLog,
            m: app.mode
        };
        // Convertir a Base64
        const jsonStr = JSON.stringify(gameState);
        const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
        const url = `${window.location.origin}${window.location.pathname}?data=${b64}`;
        
        // Copiar y avisar
        navigator.clipboard.writeText(url).then(() => {
            alert("🔗 ENLACE COPIADO AL PORTAPAPELES\n\nEnvíalo al otro moderador. Cuando lo abra, la partida se clonará exactamente igual.");
        });
    },

    loadGameFromUrl: (b64) => {
        try {
            const jsonStr = decodeURIComponent(escape(atob(b64)));
            const data = JSON.parse(jsonStr);
            
            // Cargar datos
            app.teams = data.t;
            app.turn = data.turn;
            app.goal = data.g;
            app.historyLog = data.h || [];
            app.mode = data.m || 'teams';
            
            // UI
            document.getElementById('import-alert').style.display = 'block';
            document.getElementById('setup-screen').classList.remove('active');
            document.getElementById('game-screen').classList.add('active');
            app.updateUI();
            
            // Limpiar URL para que no moleste al recargar
            window.history.replaceState({}, document.title, window.location.pathname);
            
        } catch (e) {
            console.error(e);
            alert("Error al cargar la partida compartida.");
            app.addRival(); app.addRival();
        }
    },

    // --- EDITAR NOMBRES EN JUEGO ---
    openEditNames: () => {
        const modal = document.getElementById('edit-modal');
        const list = document.getElementById('edit-list');
        list.innerHTML = '';
        
        app.teams.forEach((t, i) => {
            list.innerHTML += `
                <div style="margin-bottom:15px;">
                    <label class="text-${t.id}" style="font-weight:bold;">${t.id}</label>
                    <input type="text" id="edit-name-${i}" value="${t.name}" style="margin-bottom:5px;">
                    <textarea id="edit-mem-${i}" class="input-member-small" style="width:100%; height:40px;">${t.membersArray ? t.membersArray.join(', ') : ''}</textarea>
                </div>
            `;
        });
        
        document.getElementById('menu-modal').style.display = 'none'; // cerrar menu
        modal.style.display = 'flex';
    },

    saveNames: () => {
        app.teams.forEach((t, i) => {
            const newName = document.getElementById(`edit-name-${i}`).value;
            const newMems = document.getElementById(`edit-mem-${i}`).value;
            
            if(newName.trim()) t.name = newName.trim();
            if(newMems) {
                t.members = newMems.trim();
                t.membersArray = newMems.split(',').map(s=>s.trim()).filter(s=>s!=='');
            }
        });
        document.getElementById('edit-modal').style.display = 'none';
        app.updateUI();
        app.sfx.ok();
    },

    // --- FUNCIONES CORE ---
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
        app.historyLog = [];
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('winner-modal').style.display = 'none';
        document.getElementById('game-screen').classList.add('active');
        app.turn = 0;
        app.updateUI();
    },

    // MENU TOGGLE
    toggleMenu: () => {
        app.sfx.tap();
        const modal = document.getElementById('menu-modal');
        const list = document.getElementById('history-list');
        
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            // Render History
            list.innerHTML = '';
            if (app.historyLog.length === 0) {
                list.innerHTML = '<div style="text-align:center; color:#555; padding:20px;">Sin movimientos aún</div>';
            } else {
                [...app.historyLog].reverse().forEach((log) => {
                    const team = app.teams[log.teamIndex];
                    list.innerHTML += `
                        <div class="history-item">
                            <div class="h-info">
                                <span class="h-team text-${team.id}">${team.name}</span>
                                <span class="h-player">${log.playerName || ''}</span>
                            </div>
                            <span class="h-pts">+${log.points}</span>
                        </div>
                    `;
                });
            }
            modal.style.display = 'flex';
        }
    },

    toggleSound: () => {
        app.soundEnabled = !app.soundEnabled;
        document.getElementById('sound-state').innerText = app.soundEnabled ? "ON" : "OFF";
    },

    undoTurn: () => {
        if (app.historyLog.length === 0) { alert("No hay jugadas."); return; }
        app.sfx.del();
        const lastMove = app.historyLog.pop();
        const team = app.teams[lastMove.teamIndex];
        team.score -= lastMove.points;
        app.turn = lastMove.teamIndex;
        if (team.membersArray.length > 0) {
            team.currentMemberIdx = (team.currentMemberIdx - 1 + team.membersArray.length) % team.membersArray.length;
        }
        app.toggleMenu(); // Actualizar vista
        app.toggleMenu();
        app.updateUI();
    },

    updateUI: () => {
        const t = app.teams[app.turn];
        const card = document.getElementById('turn-card');
        card.className = `turn-card pulse-anim b-${t.id}`;
        
        let activePlayerText = "";
        let currentPlayerName = "";
        if(t.membersArray.length > 0) {
            currentPlayerName = t.membersArray[t.currentMemberIdx];
            activePlayerText = `<div class="player-members">Lanza: ${currentPlayerName}</div>`;
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
    
    undoCalc: () => { app.sfx.del(); document.getElementById('calc-display').textContent="0"; },
    
    submit: () => {
        let val = document.getElementById('calc-display').textContent;
        let pts = parseInt(val);
        if (isNaN(pts)) pts = 0;

        app.sfx.ok();
        document.getElementById('calc-display').textContent = "0";

        const currentTeam = app.teams[app.turn];
        let currentPlayer = "";
        if(currentTeam.membersArray.length > 0) {
            currentPlayer = currentTeam.membersArray[currentTeam.currentMemberIdx];
        }

        app.historyLog.push({
            teamIndex: app.turn,
            points: pts,
            playerName: currentPlayer,
            prevScore: currentTeam.score
        });

        currentTeam.score += pts;
        
        if(currentTeam.membersArray.length > 0) {
            currentTeam.currentMemberIdx = (currentTeam.currentMemberIdx + 1) % currentTeam.membersArray.length;
        }

        if(currentTeam.score >= app.goal) {
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
    },

    restartGame: () => {
        if(!confirm("¿Seguro de reiniciar los puntos a 0?")) return;
        app.teams.forEach(t => t.score = 0);
        app.historyLog = [];
        app.turn = 0;
        app.toggleMenu();
        app.updateUI();
        app.sfx.ok();
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
    }
};

document.addEventListener('DOMContentLoaded', app.init);
