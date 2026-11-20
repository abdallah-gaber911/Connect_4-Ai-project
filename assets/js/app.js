/**
 * Main Application Orchestrator.
 * Initializes Pyodide WebAssembly runtime, handles loading screen,
 * binds core gaming buttons, and starts the game.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingStatusText = document.getElementById('loading-status-text');
    const loadingBarFill = document.getElementById('loading-progress-bar');

    const updateProgress = (text, percent) => {
        if (loadingStatusText) loadingStatusText.textContent = text;
        if (loadingBarFill && percent !== undefined) loadingBarFill.style.width = `${percent}%`;
    };

    updateProgress('Initializing WebAssembly Environment...', 20);

    try {
        await window.pyodideManager.init((msg) => {
            if (msg.includes('Downloading')) {
                updateProgress(msg, 45);
            } else if (msg.includes('Virtual Environment')) {
                updateProgress(msg, 70);
            } else if (msg.includes('modules')) {
                updateProgress(msg, 90);
            } else if (msg.includes('Ready')) {
                updateProgress(msg, 100);
            } else {
                updateProgress(msg);
            }
        });

        // Initialize UI and Game components
        window.gameUI.updateScoreboardDisplay();
        window.gameController.newGame();
        window.analyticsManager.init();
        window.aiLabManager.init();

        // Dismiss loading screen with smooth fade-out
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => loadingScreen.remove(), 600);
            }
        }, 500);

    } catch (err) {
        console.error('Failed to initialize AI Engine:', err);
        updateProgress(`Error initializing AI: ${err.message}. Please refresh.`, 100);
        if (loadingStatusText) {
            loadingStatusText.style.color = '#FF304F';
        }
    }

    // Bind Primary Gaming Buttons
    const btnNewGame = document.getElementById('btn-new-game');
    const btnUndo = document.getElementById('btn-undo');
    const btnHint = document.getElementById('btn-hint');
    const btnRestart = document.getElementById('btn-restart');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const btnModalPlayAgain = document.getElementById('modal-btn-play-again');

    if (btnNewGame) {
        btnNewGame.addEventListener('click', () => {
            window.soundManager.playClick();
            window.gameController.newGame();
        });
    }

    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            window.gameController.undoMove();
        });
    }

    if (btnHint) {
        btnHint.addEventListener('click', () => {
            window.gameController.requestHint();
        });
    }

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            window.soundManager.playClick();
            window.gameController.restart();
        });
    }

    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            window.soundManager.playClick();
            window.gameController.history = [];
            window.gameUI.updateHistoryList();
        });
    }

    if (btnModalPlayAgain) {
        btnModalPlayAgain.addEventListener('click', () => {
            window.soundManager.playClick();
            window.gameController.newGame();
        });
    }
});
