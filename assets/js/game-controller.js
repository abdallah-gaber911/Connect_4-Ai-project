/**
 * Connect Four Game Controller.
 * Manages game state, human/AI turns, move history, and communication with Pyodide.
 */

class GameController {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.EMPTY = 0;
        this.PLAYER = 1; // Human (Red)
        this.AI = 2;     // Computer (Yellow)

        this.grid = this.createEmptyGrid();
        this.currentTurn = this.PLAYER;
        this.isAiThinking = false;
        this.isGameOver = false;
        this.winner = null;
        this.winningCoords = null;
        this.history = []; // [{ player, row, col, moveNumber }]
        this.lastAiMetrics = null;

        // Settings
        this.firstMove = 'human';
        this.algorithm = 'alpha_beta';
        this.difficulty = 'medium'; // easy: 1, medium: 3, hard: 5

        this.depthMap = {
            easy: 1,
            medium: 3,
            hard: 5,
        };
    }

    createEmptyGrid() {
        return Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(this.EMPTY));
    }

    loadSettings() {
        const settings = window.storageManager.getSettings();
        this.firstMove = settings.firstMove || 'human';
        this.algorithm = settings.algorithm || 'alpha_beta';
        this.difficulty = settings.difficulty || 'medium';
    }

    getSearchDepth() {
        return this.depthMap[this.difficulty] || 3;
    }

    newGame() {
        this.loadSettings();
        this.grid = this.createEmptyGrid();
        this.isGameOver = false;
        this.isAiThinking = false;
        this.winner = null;
        this.winningCoords = null;
        this.history = [];
        this.currentTurn = this.firstMove === 'ai' ? this.AI : this.PLAYER;

        if (window.gameUI) {
            window.gameUI.renderBoard();
            window.gameUI.updateTurnStatus();
            window.gameUI.updateHistoryList();
            window.gameUI.hideGameOverModal();
            window.gameUI.clearHint();
        }

        if (this.currentTurn === this.AI) {
            this.triggerAiMove();
        }
    }

    restart() {
        // Keeps same settings, restarts current board
        this.newGame();
    }

    isValidMove(col) {
        if (col < 0 || col >= this.COLS) return false;
        return this.grid[0][col] === this.EMPTY;
    }

    getNextOpenRow(col) {
        for (let r = this.ROWS - 1; r >= 0; r--) {
            if (this.grid[r][col] === this.EMPTY) {
                return r;
            }
        }
        return -1;
    }

    async handleHumanClick(col) {
        if (this.isGameOver || this.isAiThinking || this.currentTurn !== this.PLAYER) {
            return;
        }

        if (!this.isValidMove(col)) {
            return;
        }

        window.gameUI.clearHint();

        const row = this.getNextOpenRow(col);
        this.executeMove(row, col, this.PLAYER);
        window.soundManager.playDrop();

        await window.gameUI.animatePieceDrop(row, col, this.PLAYER);

        const outcome = this.checkGameOutcome();
        if (outcome) {
            this.handleOutcome(outcome);
            return;
        }

        this.currentTurn = this.AI;
        window.gameUI.updateTurnStatus();

        await this.triggerAiMove();
    }

    executeMove(row, col, player) {
        this.grid[row][col] = player;
        this.history.push({
            moveNumber: this.history.length + 1,
            player,
            row,
            col,
        });
        window.gameUI.updateHistoryList();
    }

    async triggerAiMove() {
        if (this.isGameOver) return;

        this.isAiThinking = true;
        window.gameUI.updateTurnStatus();

        try {
            const depth = this.getSearchDepth();
            const result = await window.pyodideManager.getBestMove(
                this.grid,
                this.algorithm,
                depth,
                this.AI
            );

            if (!result || !result.success || result.selected_column === undefined) {
                console.error('AI returned invalid result:', result);
                this.isAiThinking = false;
                window.gameUI.updateTurnStatus();
                return;
            }

            this.lastAiMetrics = result;
            window.storageManager.recordAiDecision(result.execution_time_ms);

            const col = result.selected_column;
            const row = this.getNextOpenRow(col);

            if (row === -1) {
                console.error(`AI selected full column ${col}`);
                this.isAiThinking = false;
                return;
            }

            this.executeMove(row, col, this.AI);
            window.soundManager.playAiMove();

            await window.gameUI.animatePieceDrop(row, col, this.AI);

            window.gameUI.updateAiMetricsCard(result);
            if (window.analyticsManager) {
                window.analyticsManager.updateLiveComparison(result);
            }

            const outcome = this.checkGameOutcome();
            if (outcome) {
                this.handleOutcome(outcome);
                return;
            }

            this.currentTurn = this.PLAYER;
        } catch (err) {
            console.error('AI Move Error:', err);
            window.gameUI.showStatusMessage('AI Error: ' + err.message);
        } finally {
            this.isAiThinking = false;
            window.gameUI.updateTurnStatus();
        }
    }

    async requestHint() {
        if (this.isGameOver || this.isAiThinking || this.currentTurn !== this.PLAYER) {
            return;
        }

        window.gameUI.showStatusMessage('Computing Hint with Python AI...');
        try {
            const depth = Math.max(this.getSearchDepth(), 3);
            const hintResult = await window.pyodideManager.getHint(this.grid, this.algorithm, depth);

            if (hintResult && hintResult.success && hintResult.selected_column !== undefined) {
                const hintCol = hintResult.selected_column;
                window.gameUI.highlightHintColumn(hintCol, hintResult.evaluation_score);
                window.soundManager.playClick();
            }
        } catch (err) {
            console.error('Hint error:', err);
        } finally {
            window.gameUI.updateTurnStatus();
        }
    }

    undoMove() {
        if (this.isAiThinking || this.history.length === 0) {
            return;
        }

        window.gameUI.clearHint();

        // If human played last and game is over, undo 1 move.
        // In normal play, undo AI move AND human move so it's back to Human turn!
        if (this.history.length >= 2 && this.currentTurn === this.PLAYER) {
            const aiMove = this.history.pop();
            this.grid[aiMove.row][aiMove.col] = this.EMPTY;

            const humanMove = this.history.pop();
            this.grid[humanMove.row][humanMove.col] = this.EMPTY;
        } else {
            const lastMove = this.history.pop();
            this.grid[lastMove.row][lastMove.col] = this.EMPTY;
        }

        this.isGameOver = false;
        this.winner = null;
        this.winningCoords = null;
        this.currentTurn = this.PLAYER;

        window.soundManager.playClick();
        window.gameUI.renderBoard();
        window.gameUI.updateTurnStatus();
        window.gameUI.updateHistoryList();
        window.gameUI.hideGameOverModal();
    }

    checkGameOutcome() {
        const playerWin = this.checkWin(this.PLAYER);
        if (playerWin) {
            return { status: 'win', winner: this.PLAYER, coords: playerWin };
        }

        const aiWin = this.checkWin(this.AI);
        if (aiWin) {
            return { status: 'win', winner: this.AI, coords: aiWin };
        }

        const isFull = this.grid[0].every(cell => cell !== this.EMPTY);
        if (isFull) {
            return { status: 'draw', winner: null, coords: null };
        }

        return null;
    }

    checkWin(piece) {
        // Horizontal
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS - 3; c++) {
                if (this.grid[r][c] === piece &&
                    this.grid[r][c + 1] === piece &&
                    this.grid[r][c + 2] === piece &&
                    this.grid[r][c + 3] === piece) {
                    return [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]];
                }
            }
        }

        // Vertical
        for (let c = 0; c < this.COLS; c++) {
            for (let r = 0; r < this.ROWS - 3; r++) {
                if (this.grid[r][c] === piece &&
                    this.grid[r + 1][c] === piece &&
                    this.grid[r + 2][c] === piece &&
                    this.grid[r + 3][c] === piece) {
                    return [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]];
                }
            }
        }

        // Positive diagonal (/)
        for (let r = 3; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS - 3; c++) {
                if (this.grid[r][c] === piece &&
                    this.grid[r - 1][c + 1] === piece &&
                    this.grid[r - 2][c + 2] === piece &&
                    this.grid[r - 3][c + 3] === piece) {
                    return [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]];
                }
            }
        }

        // Negative diagonal (\)
        for (let r = 0; r < this.ROWS - 3; r++) {
            for (let c = 0; c < this.COLS - 3; c++) {
                if (this.grid[r][c] === piece &&
                    this.grid[r + 1][c + 1] === piece &&
                    this.grid[r + 2][c + 2] === piece &&
                    this.grid[r + 3][c + 3] === piece) {
                    return [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]];
                }
            }
        }

        return null;
    }

    handleOutcome(outcome) {
        this.isGameOver = true;
        this.winner = outcome.winner;
        this.winningCoords = outcome.coords;

        window.storageManager.recordGameResult(this.winner);
        window.gameUI.updateScoreboardDisplay();

        if (outcome.status === 'win') {
            window.gameUI.highlightWinningCells(outcome.coords);
            if (this.winner === this.PLAYER) {
                window.soundManager.playWin();
                window.gameUI.showGameOverModal('Victory!', 'You defeated the AI!', 'human');
            } else {
                window.soundManager.playDraw();
                window.gameUI.showGameOverModal('Defeat!', 'The AI prevailed this time.', 'ai');
            }
        } else {
            window.soundManager.playDraw();
            window.gameUI.showGameOverModal('Draw Game!', 'The board is completely full.', 'draw');
        }

        window.gameUI.updateTurnStatus();
        if (window.analyticsManager) {
            window.analyticsManager.updateDashboard();
        }
    }
}

window.gameController = new GameController();
