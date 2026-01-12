/* SUMMA ENGINE v23.1 - SISTEMA DE ACTUALIZACIÓN AUTOMÁTICA 
 * Diseñado por Ing. John A. Skinner S.
 */

const APP_VERSION = '23.1.2';

const app = {
    // --- ESTADO CORE ---
    mode: 'teams',
    teams: [],
    turn: 0,
    goal: 1000,
    historyLog: [],
    soundEnabled: true,
    oledMode: false,
    deferredPrompt: null,
    stateMachine: null,
    gameType: 'linear', // 'linear' o 'tennis'
    pendingScore: null, // Para confirmación de puntajes
    updateReady: false, // Bandera para actualización disponible
    newServiceWorker: null, // Referencia al nuevo SW
    
    // --- AUDIO SYSTEM ---
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

    // --- INICIALIZACIÓN ---
    init: async () => {
        console.log(`🚀 Inicializando SUMMA v${APP_VERSION}...`);
        
        // Mostrar splash screen durante la carga
        const splashDuration = 2500; // 2.5 segundos
        const startTime = Date.now();
        
        // 0. Registrar Service Worker (REQUERIDO PARA PWA) con sistema de actualización
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('✅ Service Worker registrado:', registration.scope);
                
                // FORZAR ACTUALIZACIÓN INMEDIATA si hay cambios
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Nueva versión del Service Worker detectada - FORZANDO ACTUALIZACIÓN');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            console.log('✅ Nueva versión activada - RECARGANDO...');
                            window.location.reload();
                        }
                    });
                });
                
                // Si ya hay una actualización esperando, activarla inmediatamente
                if (registration.waiting) {
                    console.log('⚠️ Actualización detectada - ACTIVANDO...');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                
                // Escuchar cambios de controlador
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🔄 Service Worker actualizado. Recargando en 500ms...');
                    setTimeout(() => window.location.reload(), 500);
                });
                
                // Verificar versión almacenada
                const storedVersion = localStorage.getItem('app_version');
                if (storedVersion && storedVersion !== APP_VERSION) {
                    console.log(`📦 Versión antigua detectada: ${storedVersion} → ${APP_VERSION}`);
                    localStorage.setItem('app_version', APP_VERSION);
                    // Limpiar caches viejos
                    if ('caches' in window) {
                        caches.keys().then(keys => {
                            keys.forEach(key => {
                                if (!key.includes(APP_VERSION)) {
                                    console.log('🗑️ Eliminando cache antiguo:', key);
                                    caches.delete(key);
                                }
                            });
                        });
                    }
                } else {
                    localStorage.setItem('app_version', APP_VERSION);
                }
                
            } catch (err) {
                console.error('❌ Error registrando Service Worker:', err);
            }
        } else {
            console.warn('⚠️ Service Worker no soportado en este navegador');
        }
        
        // 1. Inicializar IndexedDB
        try {
            await DB.init();
            console.log('✅ Persistencia IndexedDB lista');
        } catch (err) {
            console.error('❌ Error inicializando DB:', err);
        }

        // 2. Inicializar Wake Lock
        try {
            await WakeLockManager.init();
            console.log('✅ Wake Lock Manager listo');
        } catch (err) {
            console.error('❌ Error inicializando Wake Lock:', err);
        }

        // 3. Cargar configuración guardada
        await app.loadConfig();

        // 4. Intentar restaurar partida anterior
        const savedState = await DB.loadGameState();
        if (savedState && !window.location.search.includes('data')) {
            // Esperar a que termine el splash antes de mostrar el prompt
            await app.waitForSplash(startTime, splashDuration);
            
            const shouldRestore = confirm('¿Deseas continuar la partida anterior?');
            if (shouldRestore) {
                await app.restoreGameState(savedState);
            } else {
                await DB.clearGameState();
                app.addRival(); 
                app.addRival();
            }
        } else {
            // CHECK URL IMPORT
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('data')) {
                app.loadGameFromCode(urlParams.get('data'));
            } else {
                app.addRival(); 
                app.addRival();
            }
        }

        // 5. Audio context activation
        document.addEventListener('click', ()=>{ 
            if(app.audioCtx.state==='suspended') app.audioCtx.resume(); 
        }, {once:true});

        // 6. PWA Installation prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 Evento beforeinstallprompt recibido');
            e.preventDefault();
            app.deferredPrompt = e;
            const btnInstall = document.getElementById('btn-install-app');
            if (btnInstall) {
                btnInstall.style.display = 'block';
                console.log('✅ Botón de instalación mostrado');
            } else {
                console.error('❌ No se encontró btn-install-app');
            }
        });

        // Listener del botón de instalación (debe esperar a que exista el botón)
        const setupInstallButton = () => {
            const btnInstall = document.getElementById('btn-install-app');
            if (btnInstall) {
                btnInstall.onclick = async () => {
                    console.log('🔘 Click en botón de instalación');
                    if (!app.deferredPrompt) {
                        console.error('❌ No hay deferredPrompt disponible');
                        alert('La instalación no está disponible en este momento.');
                        return;
                    }
                    
                    try {
                        app.sfx.ok();
                        console.log('📲 Mostrando prompt de instalación...');
                        await app.deferredPrompt.prompt();
                        
                        const choiceResult = await app.deferredPrompt.userChoice;
                        console.log('👤 Respuesta del usuario:', choiceResult.outcome);
                        
                        if (choiceResult.outcome === 'accepted') {
                            console.log('✅ Usuario aceptó instalar');
                            btnInstall.style.display = 'none';
                        } else {
                            console.log('❌ Usuario rechazó la instalación');
                        }
                    } catch (err) {
                        console.error('❌ Error al instalar:', err);
                        alert('Error al instalar la aplicación: ' + err.message);
                    } finally {
                        app.deferredPrompt = null;
                    }
                };
                console.log('✅ Listener del botón de instalación configurado');
            }
        };
        
        // Configurar botón cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupInstallButton);
        } else {
            setupInstallButton();
        }

        // 7. Event listeners
        document.getElementById('btn-add-team').onclick = () => app.addRival();
        document.getElementById('btn-start-game').onclick = () => { app.sfx.start(); app.startGame(); };
        document.querySelectorAll('.num-btn').forEach(b => { 
            if(b.dataset.val) b.onclick=()=>app.num(b.dataset.val); 
        });
        document.getElementById('btn-undo-calc').onclick = app.undoCalc;
        document.getElementById('btn-ok').onclick = app.submit;

        // 8. Ocultar splash screen después del tiempo mínimo
        await app.waitForSplash(startTime, splashDuration);
        app.hideSplashScreen();

        console.log('✅ App inicializada correctamente');
    },

    /**
     * Espera el tiempo necesario para que el splash screen complete su duración mínima
     */
    waitForSplash: async (startTime, minDuration) => {
        const elapsed = Date.now() - startTime;
        const remaining = minDuration - elapsed;
        
        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    },

    /**
     * Oculta el splash screen con animación
     */
    hideSplashScreen: () => {
        const splash = document.getElementById('splash-screen');
        splash.classList.add('fade-out');
        
        // Remover después de la animación
        setTimeout(() => {
            splash.classList.remove('active', 'fade-out');
            splash.style.display = 'none';
            
            // Mostrar la pantalla de setup
            document.getElementById('setup-screen').classList.add('active');
        }, 500); // Duración de la animación fade-out
    },

    /**
     * Muestra notificación de actualización disponible
     */
    showUpdateNotification: () => {
        console.log('📢 Mostrando notificación de actualización');
        
        // Crear el toast de actualización si no existe
        let toast = document.getElementById('update-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'update-toast';
            toast.className = 'update-toast';
            toast.innerHTML = `
                <div class="update-toast-content">
                    <div class="update-icon">🔄</div>
                    <div class="update-text">
                        <strong>Nueva versión disponible</strong>
                        <span>v${APP_VERSION} lista para instalar</span>
                    </div>
                    <button id="btn-update-now" class="btn-update-now">
                        Actualizar
                    </button>
                    <button id="btn-update-later" class="btn-update-later">
                        ✕
                    </button>
                </div>
            `;
            document.body.appendChild(toast);
            
            // Event listeners para los botones
            document.getElementById('btn-update-now').onclick = () => {
                app.applyUpdate();
            };
            
            document.getElementById('btn-update-later').onclick = () => {
                toast.classList.remove('show');
                console.log('⏭️ Actualización pospuesta');
            };
        }
        
        // Mostrar el toast con animación
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
    },

    /**
     * Aplica la actualización del Service Worker
     */
    applyUpdate: () => {
        if (!app.newServiceWorker) {
            console.error('❌ No hay Service Worker nuevo disponible');
            return;
        }
        
        console.log('🔄 Aplicando actualización...');
        
        // Enviar mensaje al Service Worker para que se active
        app.newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Ocultar el toast
        const toast = document.getElementById('update-toast');
        if (toast) {
            toast.classList.remove('show');
        }
    },

    // --- PERSISTENCIA ---
    async saveGameState() {
        const state = {
            mode: app.mode,
            teams: app.teams,
            turn: app.turn,
            goal: app.goal,
            historyLog: app.historyLog,
            gameType: app.gameType
        };
        
        try {
            await DB.saveGameState(state);
        } catch (err) {
            console.error('❌ Error guardando estado:', err);
        }
    },

    async restoreGameState(state) {
        if (!state) return false;
        
        app.mode = state.mode || 'teams';
        app.teams = state.teams || [];
        app.turn = state.turn || 0;
        app.goal = state.goal || 1000;
        app.historyLog = state.historyLog || [];
        app.gameType = state.gameType || 'linear';
        
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        app.updateUI();
        
        console.log('✅ Partida restaurada');
        return true;
    },

    async loadConfig() {
        const soundEnabled = await DB.loadConfig('soundEnabled', true);
        const oledMode = await DB.loadConfig('oledMode', false);
        
        app.soundEnabled = soundEnabled;
        app.oledMode = oledMode;
        
        if (oledMode) {
            document.body.classList.add('oled-mode');
            const oledState = document.getElementById('oled-state');
            if (oledState) oledState.textContent = 'ON';
        }
        
        const soundState = document.getElementById('sound-state');
        if (soundState) soundState.textContent = soundEnabled ? 'ON' : 'OFF';
    },

    async saveConfig(key, value) {
        try {
            await DB.saveConfig(key, value);
        } catch (err) {
            console.error('❌ Error guardando config:', err);
        }
    },

    // --- FUNCIONES DE MENÚ ---
    editGoal: () => {
        app.sfx.tap();
        const newGoal = prompt("Nueva meta de puntos:", app.goal);
        if (newGoal && !isNaN(newGoal) && newGoal > 0) {
            app.goal = parseInt(newGoal);
            app.updateUI(); 
            app.toggleMenu(); 
            app.sfx.ok();
            app.saveGameState();
        }
    },

    toggleSound: () => { 
        app.soundEnabled = !app.soundEnabled; 
        document.getElementById('sound-state').innerText = app.soundEnabled ? "ON" : "OFF"; 
        app.saveConfig('soundEnabled', app.soundEnabled);
    },

    toggleOLEDMode: () => {
        app.oledMode = !app.oledMode;
        document.body.classList.toggle('oled-mode', app.oledMode);
        document.getElementById('oled-state').innerText = app.oledMode ? "ON" : "OFF";
        app.saveConfig('oledMode', app.oledMode);
        app.sfx.tap();
    },

    openShareModal: () => {
        app.sfx.tap();
        const miniTeams = app.teams.map(t => ({ n: t.name, s: t.score, i: t.id, m: t.membersArray }));
        const miniState = { 
            t: miniTeams, 
            tu: app.turn, 
            g: app.goal, 
            h: app.historyLog.map(l => ({ ti: l.teamIndex, p: l.points, pn: l.playerName })), 
            mo: app.mode 
        };
        const jsonStr = JSON.stringify(miniState);
        const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
        const fullUrl = `${window.location.origin}${window.location.pathname}?data=${b64}`;
        
        document.getElementById('qrcode').innerHTML = "";
        try { 
            new QRCode(document.getElementById("qrcode"), { 
                text: fullUrl, 
                width: 180, 
                height: 180, 
                colorDark : "#000000", 
                colorLight : "#ffffff", 
                correctLevel : QRCode.CorrectLevel.L 
            }); 
        } catch(e) { 
            document.getElementById('qrcode').innerText = "QR offline."; 
        }
        
        document.getElementById('share-code-text').value = b64;
        document.getElementById('menu-modal').style.display = 'none';
        document.getElementById('share-modal').style.display = 'flex';
    },

    copyCodeToClipboard: () => {
        const copyText = document.getElementById("share-code-text");
        copyText.select(); 
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        alert("¡Código copiado!");
    },

    manualImport: () => {
        const code = document.getElementById('manual-code-input').value.trim();
        if(!code) return alert("Pega un código.");
        app.loadGameFromCode(code); 
        app.toggleMenu();
    },

    loadGameFromCode: (b64) => {
        try {
            const jsonStr = decodeURIComponent(escape(atob(b64)));
            const data = JSON.parse(jsonStr);
            app.teams = data.t.map(t => ({ 
                name: t.n, 
                score: t.s, 
                id: t.i, 
                membersArray: t.m || [], 
                members: (t.m || []).join(', '), 
                currentMemberIdx: 0 
            }));
            app.turn = data.tu; 
            app.goal = data.g; 
            app.mode = data.mo || 'teams';
            app.historyLog = (data.h || []).map(l => ({ 
                teamIndex: l.ti, 
                points: l.p, 
                playerName: l.pn 
            }));
            
            document.getElementById('import-alert').style.display = 'block';
            document.getElementById('setup-screen').classList.remove('active');
            document.getElementById('game-screen').classList.add('active');
            app.updateUI();
            window.history.replaceState({}, document.title, window.location.pathname);
            app.sfx.ok();
        } catch (e) { 
            console.error(e); 
            alert("Código inválido."); 
        }
    },

    openEditNames: () => {
        const modal = document.getElementById('edit-modal');
        const list = document.getElementById('edit-list');
        list.innerHTML = '';
        app.teams.forEach((t, i) => {
            list.innerHTML += `<div style="margin-bottom:15px;">
                <label class="text-${t.id}" style="font-weight:bold;">${t.id}</label>
                <input type="text" id="edit-name-${i}" value="${t.name}" style="margin-bottom:5px;">
                <textarea id="edit-mem-${i}" class="input-member-small" style="width:100%; height:40px;">${t.membersArray ? t.membersArray.join(', ') : ''}</textarea>
            </div>`;
        });
        document.getElementById('menu-modal').style.display = 'none'; 
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
        app.saveGameState();
    },

    toggleMenu: () => {
        app.sfx.tap(); 
        const modal = document.getElementById('menu-modal'); 
        const list = document.getElementById('history-list'); 
        document.getElementById('menu-goal-display').innerText = app.goal;
        
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            list.innerHTML = '';
            if (app.historyLog.length === 0) {
                list.innerHTML = '<div style="text-align:center; color:#555; padding:20px;">Sin movimientos</div>';
            } else { 
                [...app.historyLog].reverse().forEach((log) => { 
                    const team = app.teams[log.teamIndex]; 
                    list.innerHTML += `<div class="history-item">
                        <div class="h-info">
                            <span class="h-team text-${team.id}">${team.name}</span>
                            <span class="h-player">${log.playerName || ''}</span>
                        </div>
                        <span class="h-pts">+${log.points}</span>
                    </div>`; 
                }); 
            }
            modal.style.display = 'flex';
        }
    },

    undoTurn: () => {
        if (app.historyLog.length === 0) { 
            alert("No hay jugadas."); 
            return; 
        }
        app.sfx.del(); 
        const lastMove = app.historyLog.pop(); 
        const team = app.teams[lastMove.teamIndex]; 
        team.score -= lastMove.points; 
        app.turn = lastMove.teamIndex;
        
        if (team.membersArray.length > 0) {
            team.currentMemberIdx = (team.currentMemberIdx - 1 + team.membersArray.length) % team.membersArray.length;
        }
        
        app.toggleMenu(); 
        app.toggleMenu(); 
        app.updateUI();
        app.saveGameState();
    },

    // --- SETUP DE JUEGO ---
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
        
        div.innerHTML = `<div class="dot bg-${styleId}">${id}</div>
            <div class="inputs-col">
                <input type="text" class="team-name" placeholder="${ph}" value="${valName}">
                <div class="members-wrapper ${hiddenClass}">
                    <div class="member-row">
                        <input type="text" class="input-member-small" placeholder="Participante 1" value="${valMembers[0] || ''}">
                        <button class="btn-add-member" onclick="app.addMemberField(this)">+</button>
                    </div>
                </div>
            </div>
            <button class="btn-delete-row" onclick="app.removeRival(this)">🗑️</button>`;
        
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
        if(list.children.length > 1) {
            btn.parentElement.remove(); 
        } else {
            alert("¡Debe haber al menos 1 participante!"); 
        }
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
        app.saveGameState();
    },

    // --- JUEGO ACTIVO ---
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
        
        card.innerHTML = `<span class="player-label bg-${t.id}">TURNO ACTUAL</span>
            <div class="player-name text-${t.id}">${t.name}</div>
            ${activePlayerText}
            <div class="player-score">${t.score}</div>`;
        
        document.getElementById('meta-display').textContent = `META: ${app.goal}`;
        document.getElementById('calc-display').textContent = "0";
    },

    num: (v) => { 
        app.sfx.tap(); 
        const d = document.getElementById('calc-display'); 
        if(d.textContent==='0') d.textContent=''; 
        if(d.textContent.length<6) d.textContent+=v; 
    },

    undoCalc: () => { 
        app.sfx.del(); 
        document.getElementById('calc-display').textContent="0"; 
    },

    submit: () => {
        let val = document.getElementById('calc-display').textContent; 
        let pts = parseInt(val); 
        if (isNaN(pts)) pts = 0;
        
        const currentTeam = app.teams[app.turn]; 
        let currentPlayer = ""; 
        
        if(currentTeam.membersArray.length > 0) {
            currentPlayer = currentTeam.membersArray[currentTeam.currentMemberIdx];
        }
        
        // Guardar datos temporales para la confirmación
        app.pendingScore = {
            points: pts,
            teamIndex: app.turn,
            team: currentTeam,
            playerName: currentPlayer,
            prevScore: currentTeam.score,
            newScore: currentTeam.score + pts
        };
        
        // Mostrar modal de confirmación (incluso para 0 puntos)
        app.showConfirmModal();
    },

    showConfirmModal: () => {
        app.sfx.tap();
        const pending = app.pendingScore;
        const modal = document.getElementById('confirm-score-modal');
        
        // Actualizar información del equipo
        const teamName = document.getElementById('confirm-team-name');
        teamName.textContent = pending.team.name;
        teamName.className = `confirm-team-name text-${pending.team.id}`;
        
        // Actualizar información del jugador
        const playerName = document.getElementById('confirm-player-name');
        if (pending.playerName) {
            playerName.textContent = `Lanza: ${pending.playerName}`;
            playerName.style.display = 'block';
        } else {
            playerName.style.display = 'none';
        }
        
        // Actualizar label según si es 0 o no
        const confirmLabel = document.querySelector('.confirm-label');
        const confirmPoints = document.getElementById('confirm-points');
        const confirmHint = document.querySelector('.confirm-hint');
        
        if (pending.points === 0) {
            // Mensaje especial para 0 puntos (paso de turno)
            confirmLabel.textContent = 'Sin puntos en este turno:';
            confirmPoints.textContent = '0';
            confirmPoints.style.color = '#ffff00'; // Amarillo para indicar paso
            confirmHint.textContent = 'Confirma para pasar el turno sin sumar puntos';
        } else {
            // Mensaje normal para puntos
            confirmLabel.textContent = 'Puntos a agregar:';
            confirmPoints.textContent = `+${pending.points}`;
            confirmPoints.style.color = '#00eaff'; // Cyan normal
            confirmHint.textContent = 'Verifica que el puntaje sea correcto antes de confirmar';
        }
        
        // Actualizar preview de puntajes
        document.getElementById('confirm-score-before').textContent = pending.prevScore;
        document.getElementById('confirm-score-after').textContent = pending.newScore;
        
        // Mostrar modal
        modal.style.display = 'flex';
    },

    confirmScoreSubmit: () => {
        app.sfx.ok();
        const pending = app.pendingScore;
        
        // Limpiar display de calculadora
        document.getElementById('calc-display').textContent = "0";
        
        // Aplicar puntos
        app.historyLog.push({ 
            teamIndex: pending.teamIndex, 
            points: pending.points, 
            playerName: pending.playerName, 
            prevScore: pending.prevScore 
        });
        
        pending.team.score += pending.points;
        
        // Avanzar al siguiente jugador si aplica
        if(pending.team.membersArray.length > 0) {
            pending.team.currentMemberIdx = (pending.team.currentMemberIdx + 1) % pending.team.membersArray.length;
        }
        
        // Guardar estado después de confirmar
        app.saveGameState();
        
        // Ocultar modal
        document.getElementById('confirm-score-modal').style.display = 'none';
        
        // Verificar victoria o continuar
        if(pending.team.score >= app.goal) {
            app.showVictoryScreen(); 
        } else { 
            app.turn = (app.turn + 1) % app.teams.length; 
            app.updateUI(); 
        }
        
        // Limpiar datos pendientes
        app.pendingScore = null;
    },

    cancelScoreSubmit: () => {
        app.sfx.del();
        
        // Ocultar modal
        document.getElementById('confirm-score-modal').style.display = 'none';
        
        // No limpiar el display para que el usuario pueda corregir
        // El valor se queda en la calculadora para editar
        
        // Limpiar datos pendientes
        app.pendingScore = null;
    },

    showVictoryScreen: async () => {
        const winner = app.teams[app.turn]; 
        const modal = document.getElementById('winner-modal'); 
        app.sfx.win();
        
        document.getElementById('w-name').textContent = winner.name; 
        document.getElementById('w-name').className = `winner-name text-${winner.id}`; 
        document.getElementById('w-score').textContent = `${winner.score} PTS`;
        
        modal.style.display = 'flex';
        
        // Limpiar estado guardado al terminar partida
        await DB.clearGameState();
    },

    restartGame: () => { 
        if(!confirm("¿Seguro de reiniciar?")) return; 
        
        app.teams.forEach(t => t.score = 0); 
        app.historyLog = []; 
        app.turn = 0; 
        
        app.toggleMenu(); 
        app.updateUI(); 
        app.sfx.ok();
        app.saveGameState();
    },

    rematch: (type) => {
        app.sfx.ok(); 
        let nextTeams = [...app.teams];
        
        if(type === 'top2') { 
            if(nextTeams.length < 2) return alert("Minimo 2 equipos."); 
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', app.init);
