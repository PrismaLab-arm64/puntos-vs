/* SUMMA - IndexedDB Persistence Layer v1.0
 * Diseñado por Ing. John A. Skinner S.
 */

const DB = {
    name: 'PuntosVS_DB',
    version: 1,
    storeName: 'gameState',
    db: null,

    /**
     * Inicializa la base de datos IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);
            
            request.onerror = () => {
                console.error('Error abriendo IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear object store si no existe
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName);
                    console.log('📦 Object store creado:', this.storeName);
                }
            };
        });
    },

    /**
     * Guarda el estado completo del juego de forma transaccional
     * @param {Object} gameState - Estado completo del juego
     */
    async saveGameState(gameState) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            
            // Añadir timestamp para tracking
            const stateWithMeta = {
                ...gameState,
                savedAt: Date.now(),
                version: '2.0'
            };
            
            const request = objectStore.put(stateWithMeta, 'currentGame');
            
            request.onsuccess = () => {
                console.log('💾 Estado guardado:', new Date().toLocaleTimeString());
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('❌ Error guardando estado:', request.error);
                reject(request.error);
            };
            
            transaction.oncomplete = () => {
                console.log('✅ Transacción completada');
            };
        });
    },

    /**
     * Recupera el estado guardado del juego
     */
    async loadGameState() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get('currentGame');
            
            request.onsuccess = () => {
                const state = request.result;
                if (state) {
                    console.log('📂 Estado recuperado:', new Date(state.savedAt).toLocaleString());
                    resolve(state);
                } else {
                    console.log('ℹ️ No hay estado guardado');
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                console.error('❌ Error cargando estado:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Elimina el estado guardado (útil al finalizar partida)
     */
    async clearGameState() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete('currentGame');
            
            request.onsuccess = () => {
                console.log('🗑️ Estado eliminado');
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('❌ Error eliminando estado:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Guarda configuración de usuario
     */
    async saveConfig(key, value) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.put(value, `config_${key}`);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Carga configuración de usuario
     */
    async loadConfig(key, defaultValue = null) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(`config_${key}`);
            
            request.onsuccess = () => {
                resolve(request.result !== undefined ? request.result : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }
};

// Exportar para uso global
window.DB = DB;
