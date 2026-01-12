/* SUMMA - Game State Machine v1.0
 * Diseñado por Ing. John A. Skinner S.
 */

/**
 * Clase base para State Machine
 */
class GameStateMachine {
    constructor(initialState) {
        this.currentState = initialState;
        this.stateHistory = [initialState];
    }

    transition(newState) {
        this.stateHistory.push(newState);
        this.currentState = newState;
    }

    undo() {
        if (this.stateHistory.length > 1) {
            this.stateHistory.pop();
            this.currentState = this.stateHistory[this.stateHistory.length - 1];
            return this.currentState;
        }
        return null;
    }

    reset(initialState) {
        this.currentState = initialState;
        this.stateHistory = [initialState];
    }

    getState() {
        return this.currentState;
    }
}

/**
 * Máquina de estados específica para TENIS
 * Maneja: 0 -> 15 -> 30 -> 40 -> Deuce -> Ventaja -> Juego
 */
class TennisStateMachine extends GameStateMachine {
    constructor() {
        super({
            playerA: 0,
            playerB: 0,
            games: { A: 0, B: 0 },
            sets: { A: 0, B: 0 },
            displayA: '0',
            displayB: '0',
            status: 'normal', // normal, deuce, advantage
            advantage: null // null, 'A', 'B'
        });
    }

    /**
     * Convierte puntos numéricos a formato de tenis
     */
    pointsToDisplay(points) {
        const map = { 0: '0', 1: '15', 2: '30', 3: '40' };
        return map[points] || '40';
    }

    /**
     * Jugador gana un punto
     * @param {string} player - 'A' o 'B'
     */
    pointWon(player) {
        const opponent = player === 'A' ? 'B' : 'A';
        const state = { ...this.currentState };

        // Caso especial: DEUCE o VENTAJA
        if (state.status === 'deuce') {
            state.status = 'advantage';
            state.advantage = player;
            state.displayA = state.advantage === 'A' ? 'V' : '40';
            state.displayB = state.advantage === 'B' ? 'V' : '40';
        } else if (state.status === 'advantage') {
            if (state.advantage === player) {
                // Gana el juego
                return this.gameWon(player);
            } else {
                // Vuelve a deuce
                state.status = 'deuce';
                state.advantage = null;
                state.displayA = '40';
                state.displayB = '40';
            }
        } else {
            // Juego normal
            state[`player${player}`]++;
            
            const playerPoints = state[`player${player}`];
            const opponentPoints = state[`player${opponent}`];

            // Verificar si gana el juego
            if (playerPoints >= 4 && playerPoints - opponentPoints >= 2) {
                return this.gameWon(player);
            }

            // Verificar deuce (ambos en 40)
            if (playerPoints >= 3 && opponentPoints >= 3) {
                state.status = 'deuce';
                state.displayA = '40';
                state.displayB = '40';
            } else {
                state.displayA = this.pointsToDisplay(state.playerA);
                state.displayB = this.pointsToDisplay(state.playerB);
            }
        }

        this.transition(state);
        return state;
    }

    /**
     * Jugador gana un juego
     */
    gameWon(player) {
        const state = { ...this.currentState };
        state.games[player]++;
        
        // Reset puntos
        state.playerA = 0;
        state.playerB = 0;
        state.displayA = '0';
        state.displayB = '0';
        state.status = 'normal';
        state.advantage = null;

        this.transition(state);
        return state;
    }

    /**
     * Obtiene el display formateado para UI
     */
    getDisplay() {
        const state = this.currentState;
        return {
            pointsA: state.displayA,
            pointsB: state.displayB,
            gamesA: state.games.A,
            gamesB: state.games.B,
            setsA: state.sets.A,
            setsB: state.sets.B,
            status: state.status,
            advantage: state.advantage
        };
    }
}

/**
 * Máquina de estados para juegos con puntuación LINEAL (por defecto)
 */
class LinearStateMachine extends GameStateMachine {
    constructor(goal = 1000) {
        super({
            scores: {},
            goal: goal,
            winner: null
        });
    }

    addPoints(playerId, points) {
        const state = { ...this.currentState };
        if (!state.scores[playerId]) state.scores[playerId] = 0;
        
        state.scores[playerId] += points;

        // Verificar ganador
        if (state.scores[playerId] >= state.goal) {
            state.winner = playerId;
        }

        this.transition(state);
        return state;
    }

    getScore(playerId) {
        return this.currentState.scores[playerId] || 0;
    }

    setGoal(goal) {
        const state = { ...this.currentState };
        state.goal = goal;
        this.transition(state);
    }
}

/**
 * Factory para crear state machines según tipo de juego
 */
const GameStateMachineFactory = {
    /**
     * Crea una state machine según el tipo de juego
     * @param {string} gameType - 'tennis', 'linear', etc.
     * @param {Object} config - Configuración opcional
     */
    create(gameType = 'linear', config = {}) {
        switch(gameType.toLowerCase()) {
            case 'tennis':
            case 'tenis':
                return new TennisStateMachine();
            
            case 'linear':
            case 'default':
            default:
                return new LinearStateMachine(config.goal || 1000);
        }
    },

    /**
     * Lista de tipos de juegos soportados
     */
    getSupportedGames() {
        return [
            { id: 'linear', name: 'Puntuación Lineal', description: 'Sistema estándar de suma de puntos' },
            { id: 'tennis', name: 'Tenis', description: 'Sistema 0-15-30-40-Deuce-Ventaja' }
        ];
    }
};

// Exportar para uso global
window.GameStateMachine = GameStateMachine;
window.TennisStateMachine = TennisStateMachine;
window.LinearStateMachine = LinearStateMachine;
window.GameStateMachineFactory = GameStateMachineFactory;
