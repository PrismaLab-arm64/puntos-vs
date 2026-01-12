/* SUMMA - Robust Wake Lock Manager v1.0
 * Diseñado por Ing. John A. Skinner S.
 */

const WakeLockManager = {
    wakeLock: null,
    isSupported: false,
    statusIndicator: null,
    retryAttempts: 0,
    maxRetries: 3,

    /**
     * Inicializa el sistema de Wake Lock
     */
    async init() {
        this.isSupported = 'wakeLock' in navigator;
        
        if (!this.isSupported) {
            console.warn('⚠️ Wake Lock API no soportada en este navegador');
            this.showStatusIndicator('unsupported');
            return false;
        }

        // Crear indicador visual de estado
        this.createStatusIndicator();

        // Intentar adquirir el wake lock
        await this.requestWakeLock();

        // Escuchar cambios de visibilidad para re-adquirir
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('🔄 App visible nuevamente, re-adquiriendo wake lock...');
                this.requestWakeLock();
            }
        });

        // Listener para cambios de batería (si está disponible)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.15 && battery.charging === false) {
                        console.warn('⚠️ Batería baja, liberando wake lock');
                        this.releaseWakeLock();
                        this.showStatusIndicator('battery-low');
                    }
                });

                battery.addEventListener('chargingchange', () => {
                    if (battery.charging && !this.wakeLock) {
                        console.log('🔌 Cargando, re-adquiriendo wake lock');
                        this.requestWakeLock();
                    }
                });
            });
        }

        return true;
    },

    /**
     * Solicita el Wake Lock
     */
    async requestWakeLock() {
        if (!this.isSupported) return false;

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('🔒 Wake Lock adquirido');
            this.retryAttempts = 0;
            this.showStatusIndicator('active');

            // Listener para cuando se libera el wake lock
            this.wakeLock.addEventListener('release', () => {
                console.log('🔓 Wake Lock liberado');
                this.showStatusIndicator('released');
                
                // Intentar re-adquirir si fue liberado involuntariamente
                if (document.visibilityState === 'visible' && this.retryAttempts < this.maxRetries) {
                    this.retryAttempts++;
                    setTimeout(() => {
                        console.log(`🔄 Reintento ${this.retryAttempts}/${this.maxRetries}`);
                        this.requestWakeLock();
                    }, 1000);
                }
            });

            return true;
        } catch (err) {
            console.error('❌ Error adquiriendo Wake Lock:', err);
            this.showStatusIndicator('error');
            
            // Notificar al usuario según el tipo de error
            if (err.name === 'NotAllowedError') {
                console.warn('⚠️ Wake Lock denegado por el usuario o política del navegador');
            }
            
            return false;
        }
    },

    /**
     * Libera el Wake Lock manualmente
     */
    async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('🔓 Wake Lock liberado manualmente');
                this.showStatusIndicator('released');
            } catch (err) {
                console.error('❌ Error liberando Wake Lock:', err);
            }
        }
    },

    /**
     * Crea el indicador visual de estado en la UI
     */
    createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'wakelock-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            z-index: 9999;
            transition: all 0.3s ease;
            pointer-events: none;
            opacity: 0;
        `;
        document.body.appendChild(indicator);
        this.statusIndicator = indicator;
    },

    /**
     * Actualiza el indicador visual según el estado
     * @param {string} status - Estado: 'active', 'released', 'error', 'battery-low', 'unsupported'
     */
    showStatusIndicator(status) {
        if (!this.statusIndicator) return;

        const styles = {
            active: {
                icon: '🔒',
                bg: 'rgba(0, 234, 255, 0.2)',
                border: '2px solid #00eaff',
                opacity: '0.7'
            },
            released: {
                icon: '🔓',
                bg: 'rgba(255, 85, 85, 0.2)',
                border: '2px solid #ff5555',
                opacity: '0.9'
            },
            error: {
                icon: '⚠️',
                bg: 'rgba(255, 204, 0, 0.2)',
                border: '2px solid #ffcc00',
                opacity: '0.9'
            },
            'battery-low': {
                icon: '🔋',
                bg: 'rgba(255, 85, 85, 0.2)',
                border: '2px solid #ff5555',
                opacity: '0.9'
            },
            unsupported: {
                icon: '❌',
                bg: 'rgba(136, 136, 136, 0.2)',
                border: '2px solid #888',
                opacity: '0.5'
            }
        };

        const style = styles[status] || styles.released;
        
        this.statusIndicator.textContent = style.icon;
        this.statusIndicator.style.background = style.bg;
        this.statusIndicator.style.border = style.border;
        this.statusIndicator.style.opacity = style.opacity;

        // Auto-ocultar después de 3 segundos si está activo
        if (status === 'active') {
            setTimeout(() => {
                if (this.statusIndicator) {
                    this.statusIndicator.style.opacity = '0';
                }
            }, 3000);
        }
    },

    /**
     * Obtiene el estado actual del Wake Lock
     */
    getStatus() {
        return {
            isSupported: this.isSupported,
            isActive: this.wakeLock !== null,
            wakeLock: this.wakeLock
        };
    }
};

// Exportar para uso global
window.WakeLockManager = WakeLockManager;
