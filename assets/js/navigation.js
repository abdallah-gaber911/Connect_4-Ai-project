/**
 * Navigation, Section Routing, Themes, and Settings event bindings.
 */

class NavigationManager {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.setupNavigationLinks();
        this.setupThemeToggle();
        this.setupSoundToggle();
        this.setupGameSettingsControls();
        this.applyStoredTheme();
    }

    setupNavigationLinks() {
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.dataset.section;
                this.navigateTo(targetSection);
            });
        });

        // Hash change navigation support
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (['home', 'ai-lab', 'analytics', 'how-to-play'].includes(hash)) {
                this.navigateTo(hash);
            }
        });
    }

    navigateTo(sectionId) {
        this.currentSection = sectionId;
        window.location.hash = sectionId;

        // Update active nav indicators
        document.querySelectorAll('.nav-item').forEach(link => {
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Switch visible section
        document.querySelectorAll('.page-section').forEach(sec => {
            if (sec.id === `section-${sectionId}`) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        // Trigger section-specific refreshes
        if (sectionId === 'analytics' && window.analyticsManager) {
            window.analyticsManager.updateDashboard();
        } else if (sectionId === 'ai-lab' && window.aiLabManager) {
            window.aiLabManager.generateMinimaxTree();
        }

        window.soundManager.playClick();
    }

    setupThemeToggle() {
        const btnTheme = document.getElementById('btn-toggle-theme');
        if (!btnTheme) return;

        btnTheme.addEventListener('click', () => {
            const currentTheme = document.body.dataset.theme || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.dataset.theme = newTheme;
            window.storageManager.set('theme', newTheme);
            this.updateThemeButtonIcon(newTheme);
            window.soundManager.playClick();
        });
    }

    applyStoredTheme() {
        const stored = window.storageManager.get('theme') || 'dark';
        document.body.dataset.theme = stored;
        this.updateThemeButtonIcon(stored);
    }

    updateThemeButtonIcon(theme) {
        const iconEl = document.getElementById('theme-icon');
        if (iconEl) {
            iconEl.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }

    setupSoundToggle() {
        const btnSound = document.getElementById('btn-toggle-sound');
        if (!btnSound) return;

        const updateSoundIcon = () => {
            const iconEl = document.getElementById('sound-icon');
            if (iconEl) {
                iconEl.textContent = window.soundManager.enabled ? '🔊' : '🔇';
            }
        };

        updateSoundIcon();

        btnSound.addEventListener('click', () => {
            window.soundManager.toggle();
            updateSoundIcon();
        });
    }

    setupGameSettingsControls() {
        // First Move Toggle: You vs Computer
        const firstMoveInputs = document.querySelectorAll('input[name="first-move"]');
        firstMoveInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const settings = window.storageManager.getSettings();
                settings.firstMove = e.target.value;
                window.storageManager.saveSettings(settings);
                window.soundManager.playClick();
            });
        });

        // Algorithm Selection: Alpha-Beta vs Minimax
        const algoInputs = document.querySelectorAll('input[name="algorithm-choice"]');
        algoInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const settings = window.storageManager.getSettings();
                settings.algorithm = e.target.value;
                window.storageManager.saveSettings(settings);
                window.soundManager.playClick();
            });
        });

        // Difficulty Selection: Easy (depth 1), Medium (depth 3), Hard (depth 5)
        const diffInputs = document.querySelectorAll('input[name="difficulty-choice"]');
        diffInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const settings = window.storageManager.getSettings();
                settings.difficulty = e.target.value;
                window.storageManager.saveSettings(settings);
                window.soundManager.playClick();
            });
        });

        // Sync inputs with stored settings
        const current = window.storageManager.getSettings();
        const fmInput = document.querySelector(`input[name="first-move"][value="${current.firstMove}"]`);
        if (fmInput) fmInput.checked = true;

        const algoInput = document.querySelector(`input[name="algorithm-choice"][value="${current.algorithm}"]`);
        if (algoInput) algoInput.checked = true;

        const diffInput = document.querySelector(`input[name="difficulty-choice"][value="${current.difficulty}"]`);
        if (diffInput) diffInput.checked = true;
    }
}

window.navigationManager = new NavigationManager();
