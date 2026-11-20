/**
 * Game UI Rendering and Micro-Interactions.
 * Controls board rendering, coin drop animations, preview piece,
 * winning animations, game over modal, and HUD metric displays.
 */

class GameUI {
    constructor() {
        this.boardContainer = document.getElementById('board-grid');
        this.previewPiece = document.getElementById('preview-piece');
        this.statusPill = document.getElementById('game-status-pill');
        this.historyList = document.getElementById('game-history-list');
        this.gameOverModal = document.getElementById('game-over-modal');

        this.currentHintCol = null;
        this.hoverCol = 3; // Default center column

        this.initEventListeners();
    }

    initEventListeners() {
        const boardWrapper = document.getElementById('board-wrapper');
        if (!boardWrapper) return;

        // Hover tracking for floating coin preview
        boardWrapper.addEventListener('mousemove', (e) => this.handleBoardMouseMove(e));
        boardWrapper.addEventListener('mouseleave', () => this.handleBoardMouseLeave());

        // Column click
        boardWrapper.addEventListener('click', (e) => this.handleBoardClick(e));

        // Touch support for mobile
        boardWrapper.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.handleBoardMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                });
            }
        }, { passive: true });
    }

    renderBoard() {
        if (!this.boardContainer) return;
        this.boardContainer.innerHTML = '';

        const grid = window.gameController.grid;
        const rows = window.gameController.ROWS;
        const cols = window.gameController.COLS;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                const slot = document.createElement('div');
                slot.className = 'cell-slot empty';
                slot.id = `cell-${r}-${c}`;

                const pieceVal = grid[r][c];
                if (pieceVal === window.gameController.PLAYER) {
                    slot.classList.remove('empty');
                    slot.classList.add('piece-human');
                } else if (pieceVal === window.gameController.AI) {
                    slot.classList.remove('empty');
                    slot.classList.add('piece-ai');
                }

                cell.appendChild(slot);
                this.boardContainer.appendChild(cell);
            }
        }
    }

    handleBoardMouseMove(e) {
        if (window.gameController.isGameOver || window.gameController.isAiThinking) {
            this.hidePreview();
            return;
        }

        const rect = this.boardContainer.getBoundingClientRect();
        const colWidth = rect.width / window.gameController.COLS;
        const x = e.clientX - rect.left;
        let col = Math.floor(x / colWidth);

        if (col < 0) col = 0;
        if (col >= window.gameController.COLS) col = window.gameController.COLS - 1;

        this.hoverCol = col;
        this.updatePreview(col);
    }

    handleBoardMouseLeave() {
        this.hidePreview();
    }

    updatePreview(col) {
        if (!this.previewPiece) return;
        if (!window.gameController.isValidMove(col)) {
            this.previewPiece.classList.add('preview-invalid');
        } else {
            this.previewPiece.classList.remove('preview-invalid');
        }

        const rect = this.boardContainer.getBoundingClientRect();
        const colWidth = rect.width / window.gameController.COLS;
        const leftPos = col * colWidth + (colWidth / 2);

        this.previewPiece.style.left = `${leftPos}px`;
        this.previewPiece.style.opacity = '1';
        this.previewPiece.className = 'preview-piece piece-human';
    }

    hidePreview() {
        if (this.previewPiece) {
            this.previewPiece.style.opacity = '0';
        }
    }

    handleBoardClick(e) {
        const rect = this.boardContainer.getBoundingClientRect();
        const colWidth = rect.width / window.gameController.COLS;
        const x = e.clientX - rect.left;
        let col = Math.floor(x / colWidth);

        if (col >= 0 && col < window.gameController.COLS) {
            window.gameController.handleHumanClick(col);
        }
    }

    async animatePieceDrop(row, col, player) {
        this.hidePreview();

        const slot = document.getElementById(`cell-${row}-${col}`);
        if (!slot) return;

        // Visual drop coin animation element
        const dropCoin = document.createElement('div');
        dropCoin.className = `falling-coin ${player === 1 ? 'piece-human' : 'piece-ai'}`;

        const rect = this.boardContainer.getBoundingClientRect();
        const colWidth = rect.width / 7;
        const rowHeight = rect.height / 6;

        const startX = col * colWidth + (colWidth / 2);
        const startY = -rowHeight;
        const targetY = row * rowHeight + (rowHeight / 2);

        dropCoin.style.left = `${startX}px`;
        dropCoin.style.top = `${startY}px`;

        this.boardContainer.appendChild(dropCoin);

        // Fall animation duration based on row distance
        const duration = 120 + row * 45;

        const animation = dropCoin.animate([
            { transform: `translate(-50%, -50%) translateY(0)`, easing: 'cubic-bezier(0.5, 0.05, 0.9, 0.3)' },
            { transform: `translate(-50%, -50%) translateY(${targetY - startY}px)`, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' }
        ], {
            duration: duration,
            fill: 'forwards'
        });

        await animation.finished;

        // Update target slot
        slot.classList.remove('empty');
        slot.classList.add(player === 1 ? 'piece-human' : 'piece-ai');
        slot.classList.add('piece-landed');
        setTimeout(() => slot.classList.remove('piece-landed'), 300);

        dropCoin.remove();
    }

    highlightWinningCells(coords) {
        if (!coords) return;
        coords.forEach(([r, c]) => {
            const slot = document.getElementById(`cell-${r}-${c}`);
            if (slot) {
                slot.classList.add('winning-cell');
            }
        });
    }

    highlightHintColumn(col, score) {
        this.clearHint();
        this.currentHintCol = col;

        // Highlight column cells
        for (let r = 0; r < window.gameController.ROWS; r++) {
            const cell = document.querySelector(`.board-cell[data-row="${r}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('hint-column');
            }
        }

        // Show hint banner
        const hintBadge = document.getElementById('hint-notification');
        if (hintBadge) {
            hintBadge.innerHTML = `<strong>AI Suggestion:</strong> Column ${col + 1} (Score: ${score > 0 ? '+' : ''}${score})`;
            hintBadge.classList.add('visible');
        }
    }

    clearHint() {
        if (this.currentHintCol !== null) {
            document.querySelectorAll('.hint-column').forEach(el => el.classList.remove('hint-column'));
            this.currentHintCol = null;
        }
        const hintBadge = document.getElementById('hint-notification');
        if (hintBadge) {
            hintBadge.classList.remove('visible');
        }
    }

    updateTurnStatus() {
        const gc = window.gameController;
        const cardHuman = document.getElementById('card-player-human');
        const cardAi = document.getElementById('card-player-ai');
        const statusPill = document.getElementById('game-status-pill');

        if (gc.isGameOver) {
            if (gc.winner === gc.PLAYER) {
                statusPill.innerHTML = '<span class="status-dot dot-win"></span> YOU WON!';
                statusPill.className = 'status-pill win-human';
            } else if (gc.winner === gc.AI) {
                statusPill.innerHTML = '<span class="status-dot dot-loss"></span> AI WON!';
                statusPill.className = 'status-pill win-ai';
            } else {
                statusPill.innerHTML = '<span class="status-dot dot-draw"></span> MATCH DRAW';
                statusPill.className = 'status-pill draw';
            }
            if (cardHuman) cardHuman.classList.remove('active-turn');
            if (cardAi) cardAi.classList.remove('active-turn');
            return;
        }

        if (gc.isAiThinking) {
            statusPill.innerHTML = '<span class="status-dot dot-thinking animate-ping"></span> AI Thinking...';
            statusPill.className = 'status-pill ai-thinking';
            if (cardHuman) cardHuman.classList.remove('active-turn');
            if (cardAi) cardAi.classList.add('active-turn');
        } else if (gc.currentTurn === gc.PLAYER) {
            statusPill.innerHTML = '<span class="status-dot dot-human"></span> YOUR TURN';
            statusPill.className = 'status-pill human-turn';
            if (cardHuman) cardHuman.classList.add('active-turn');
            if (cardAi) cardAi.classList.remove('active-turn');
        } else {
            statusPill.innerHTML = '<span class="status-dot dot-ai"></span> AI TURN';
            statusPill.className = 'status-pill ai-turn';
            if (cardHuman) cardHuman.classList.remove('active-turn');
            if (cardAi) cardAi.classList.add('active-turn');
        }
    }

    showStatusMessage(msg) {
        const statusPill = document.getElementById('game-status-pill');
        if (statusPill) {
            statusPill.innerHTML = `<span class="status-dot dot-thinking"></span> ${msg}`;
        }
    }

    updateAiMetricsCard(metrics) {
        if (!metrics) return;

        const elAlgo = document.getElementById('metric-algo');
        const elDepth = document.getElementById('metric-depth');
        const elNodes = document.getElementById('metric-nodes');
        const elPruned = document.getElementById('metric-pruned');
        const elTime = document.getElementById('metric-time');
        const elMove = document.getElementById('metric-move');
        const elScore = document.getElementById('metric-score');

        if (elAlgo) elAlgo.textContent = metrics.algorithm_name || 'Alpha-Beta';
        if (elDepth) elDepth.textContent = `Depth ${metrics.search_depth}`;
        if (elNodes) elNodes.textContent = metrics.nodes_visited.toLocaleString();
        if (elPruned) elPruned.textContent = (metrics.pruned_nodes || 0).toLocaleString();
        if (elTime) elTime.textContent = `${metrics.execution_time_ms} ms`;
        if (elMove) elMove.textContent = `Column ${metrics.selected_column + 1}`;
        if (elScore) {
            const sc = metrics.evaluation_score;
            elScore.textContent = `${sc > 0 ? '+' : ''}${sc}`;
            elScore.className = `metric-value ${sc > 0 ? 'text-win' : sc < 0 ? 'text-loss' : ''}`;
        }
    }

    updateHistoryList() {
        if (!this.historyList) return;
        const history = window.gameController.history;

        if (history.length === 0) {
            this.historyList.innerHTML = '<div class="history-empty">No moves played yet. Drop a coin to start!</div>';
            return;
        }

        this.historyList.innerHTML = '';
        // Render in reverse order so latest move is on top
        for (let i = history.length - 1; i >= 0; i--) {
            const item = history[i];
            const isHuman = item.player === window.gameController.PLAYER;

            const rowEl = document.createElement('div');
            rowEl.className = 'history-item';

            rowEl.innerHTML = `
                <div class="history-badge ${isHuman ? 'badge-human' : 'badge-ai'}">
                    #${item.moveNumber}
                </div>
                <div class="history-details">
                    <span class="history-player ${isHuman ? 'text-human' : 'text-ai'}">
                        ${isHuman ? 'You' : 'AI'}
                    </span>
                    <span class="history-action">played Column ${item.col + 1}</span>
                </div>
                <div class="history-piece-preview ${isHuman ? 'piece-human' : 'piece-ai'}"></div>
            `;
            this.historyList.appendChild(rowEl);
        }
    }

    updateScoreboardDisplay() {
        const stats = window.storageManager.get('stats') || { humanWins: 0, aiWins: 0, draws: 0 };
        const humanWinEl = document.getElementById('human-win-count');
        const aiWinEl = document.getElementById('ai-win-count');
        const drawsEl = document.getElementById('draw-count') || document.getElementById('stat-draws');

        if (humanWinEl) humanWinEl.textContent = stats.humanWins;
        if (aiWinEl) aiWinEl.textContent = stats.aiWins;
        if (drawsEl) drawsEl.textContent = stats.draws;
    }

    showGameOverModal(title, subtitle, type) {
        if (!this.gameOverModal) return;

        const titleEl = document.getElementById('modal-title');
        const subEl = document.getElementById('modal-subtitle');
        const iconEl = document.getElementById('modal-icon');

        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = subtitle;

        if (iconEl) {
            if (type === 'human') {
                iconEl.innerHTML = '🏆';
                iconEl.className = 'modal-trophy win-human';
            } else if (type === 'ai') {
                iconEl.innerHTML = '🤖';
                iconEl.className = 'modal-trophy win-ai';
            } else {
                iconEl.innerHTML = '🤝';
                iconEl.className = 'modal-trophy draw';
            }
        }

        this.gameOverModal.classList.add('visible');
    }

    hideGameOverModal() {
        if (this.gameOverModal) {
            this.gameOverModal.classList.remove('visible');
        }
    }
}

window.gameUI = new GameUI();
