/**
 * AI Lab - Interactive Educational Laboratory.
 * Provides interactive search tree exploration, step-by-step Alpha-Beta debugging,
 * pruning cut-off visualizer, and academic algorithms presentation reference.
 */

class AILabManager {
    constructor() {
        this.treeTrace = null;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.stepSequence = [];
        this.isPlaying = false;
        this.playTimer = null;
        this.playSpeedMs = 800;

        this.selectedNode = null;
    }

    init() {
        this.setupLabNavigation();
        this.setupMinimaxExplorer();
        this.setupAlphaBetaExplorer();
    }

    setupLabNavigation() {
        const tabs = document.querySelectorAll('.lab-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetId = tab.dataset.target;
                document.querySelectorAll('.lab-tab-content').forEach(c => c.classList.remove('active'));
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');
            });
        });
    }

    // ==========================================
    // A. MINIMAX EXPLORER
    // ==========================================
    setupMinimaxExplorer() {
        const btnGenerateTree = document.getElementById('btn-generate-tree');
        if (btnGenerateTree) {
            btnGenerateTree.addEventListener('click', () => this.generateMinimaxTree());
        }
    }

    async generateMinimaxTree() {
        const statusEl = document.getElementById('tree-loading-indicator');
        const container = document.getElementById('tree-visualization-canvas');
        if (statusEl) statusEl.style.display = 'block';

        try {
            // Build trace from current board at depth 2 (keeps tree clean and readable for educational display)
            const grid = window.gameController ? window.gameController.grid : null;
            const res = await window.pyodideManager.getTreeTrace(grid, 'minimax', 2);

            if (res && res.success && res.search_trace) {
                this.renderMinimaxTree(res.search_trace, container);
            }
        } catch (err) {
            console.error('Error generating tree:', err);
            if (container) container.innerHTML = `<div class="lab-error">Failed to generate tree: ${err.message}</div>`;
        } finally {
            if (statusEl) statusEl.style.display = 'none';
        }
    }

    renderMinimaxTree(rootNode, container) {
        if (!container) return;
        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'tree-wrapper';

        // Root level
        const rootLevel = document.createElement('div');
        rootLevel.className = 'tree-level';
        rootLevel.innerHTML = `<div class="level-label">Level 0: Root (MAX / AI)</div>`;

        const rootNodeEl = this.createNodeCard(rootNode, true);
        rootLevel.appendChild(rootNodeEl);
        wrapper.appendChild(rootLevel);

        // Children level (Level 1: MIN / Human)
        if (rootNode.children && rootNode.children.length > 0) {
            const level1 = document.createElement('div');
            level1.className = 'tree-level';
            level1.innerHTML = `<div class="level-label">Level 1: Human Replies (MIN)</div>`;

            const childrenRow = document.createElement('div');
            childrenRow.className = 'tree-row';

            rootNode.children.forEach(child => {
                const childEl = this.createNodeCard(child, false);
                childrenRow.appendChild(childEl);
            });

            level1.appendChild(childrenRow);
            wrapper.appendChild(level1);
        }

        container.appendChild(wrapper);

        // Select root by default
        this.inspectNode(rootNode);
    }

    createNodeCard(node, isRoot = false) {
        const el = document.createElement('div');
        el.className = `tree-node-card ${node.is_max ? 'node-max' : 'node-min'} ${node.is_best ? 'node-optimal' : ''}`;
        el.dataset.nodeId = node.id;

        const roleText = node.is_max ? 'MAX' : 'MIN';
        const moveText = node.move !== null && node.move !== undefined ? `Col ${node.move + 1}` : 'Root';

        el.innerHTML = `
            <div class="node-header">
                <span class="node-role">${roleText}</span>
                <span class="node-move">${moveText}</span>
            </div>
            <div class="node-score-val">Score: ${node.score}</div>
            ${node.is_best ? '<div class="node-badge-best">★ Optimal</div>' : ''}
        `;

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.tree-node-card').forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
            this.inspectNode(node);
        });

        return el;
    }

    inspectNode(node) {
        const inspector = document.getElementById('node-inspector-panel');
        if (!inspector) return;

        const role = node.is_max ? 'MAX (AI maximizing score)' : 'MIN (Human minimizing score)';
        const move = node.move !== null && node.move !== undefined ? `Column ${node.move + 1}` : 'Initial Game State';

        inspector.innerHTML = `
            <div class="inspector-card">
                <h4>Node #${node.id} Details</h4>
                <div class="inspector-row">
                    <span>Role:</span>
                    <strong class="${node.is_max ? 'text-max' : 'text-min'}">${role}</strong>
                </div>
                <div class="inspector-row">
                    <span>Move Played:</span>
                    <strong>${move}</strong>
                </div>
                <div class="inspector-row">
                    <span>Evaluation Score:</span>
                    <strong class="text-score">${node.score}</strong>
                </div>
                <div class="inspector-row">
                    <span>Optimal Path:</span>
                    <strong>${node.is_best ? 'Yes (Chosen by Minimax)' : 'Suboptimal'}</strong>
                </div>
                <div class="inspector-row">
                    <span>Subtree Branches:</span>
                    <strong>${node.children ? node.children.length : 0} explored</strong>
                </div>
                <div class="inspector-note">
                    ${node.is_max
                        ? 'MAX player selects the child branch with the maximum evaluation score.'
                        : 'MIN player anticipates the human opponent picking the branch with the minimum score for AI.'}
                </div>
            </div>
        `;
    }

    // ==========================================
    // B. ALPHA-BETA STEP-BY-STEP PRUNING EXPLORER
    // ==========================================
    setupAlphaBetaExplorer() {
        const btnStart = document.getElementById('ab-btn-start');
        const btnNext = document.getElementById('ab-btn-next');
        const btnPrev = document.getElementById('ab-btn-prev');
        const btnAuto = document.getElementById('ab-btn-auto');
        const btnReset = document.getElementById('ab-btn-reset');
        const speedSelect = document.getElementById('ab-speed-select');

        if (btnStart) btnStart.addEventListener('click', () => this.startAlphaBetaDemo());
        if (btnNext) btnNext.addEventListener('click', () => this.stepNext());
        if (btnPrev) btnPrev.addEventListener('click', () => this.stepPrev());
        if (btnAuto) btnAuto.addEventListener('click', () => this.toggleAutoPlay());
        if (btnReset) btnReset.addEventListener('click', () => this.resetAlphaBetaDemo());

        if (speedSelect) {
            speedSelect.addEventListener('change', () => {
                this.playSpeedMs = parseInt(speedSelect.value, 10);
                if (this.isPlaying) {
                    this.pauseAutoPlay();
                    this.startAutoPlay();
                }
            });
        }
    }

    async startAlphaBetaDemo() {
        const statusEl = document.getElementById('ab-status-banner');
        if (statusEl) statusEl.textContent = 'Generating real search trace with Python...';

        try {
            const grid = window.gameController ? window.gameController.grid : null;
            const res = await window.pyodideManager.getTreeTrace(grid, 'alpha_beta', 2);

            if (res && res.success && res.search_trace) {
                this.treeTrace = res.search_trace;
                this.buildStepSequence(res.search_trace);
                this.currentStep = 0;
                this.renderAlphaBetaStep(this.currentStep);
            }
        } catch (err) {
            console.error('Error starting Alpha-Beta demo:', err);
        }
    }

    buildStepSequence(rootTrace) {
        // Flatten search trace into chronological educational steps
        const steps = [];

        steps.push({
            type: 'ROOT_START',
            node: rootTrace,
            alpha: rootTrace.alpha_in || -Infinity,
            beta: rootTrace.beta_in || Infinity,
            message: `Starting Alpha-Beta search at Root Node. Initial bounds: α = -∞, β = +∞.`,
        });

        if (rootTrace.children) {
            rootTrace.children.forEach((child, idx) => {
                steps.push({
                    type: 'EVALUATE_CHILD',
                    node: child,
                    alpha: child.alpha_in,
                    beta: child.beta_in,
                    message: `Evaluating child branch for Move Col ${child.move + 1}. Current α = ${child.alpha_in}, β = ${child.beta_in}.`,
                });

                steps.push({
                    type: 'CHILD_RESULT',
                    node: child,
                    alpha: child.alpha_out,
                    beta: child.beta_out,
                    score: child.score,
                    message: `Child Col ${child.move + 1} evaluated to Score: ${child.score}. Bounds updated: α = ${child.alpha_out}, β = ${child.beta_out}.`,
                });
            });
        }

        if (rootTrace.pruned_branches && rootTrace.pruned_branches.length > 0) {
            rootTrace.pruned_branches.forEach(pruned => {
                steps.push({
                    type: 'PRUNE_CUTOFF',
                    col: pruned.move,
                    reason: pruned.reason,
                    alpha: rootTrace.alpha_out,
                    beta: rootTrace.beta_out,
                    message: `✂️ PRUNING CONDITION TRIGGERED! Branch for Column ${pruned.move + 1} is cut off because ${pruned.reason}. Subtree skipped!`,
                });
            });
        }

        steps.push({
            type: 'COMPLETE',
            bestMove: rootTrace.move || 3,
            bestScore: rootTrace.score,
            message: `Alpha-Beta Search Complete. Selected Optimal Move: Column ${(rootTrace.children.find(c => c.is_best)?.move ?? 3) + 1} with Score ${rootTrace.score}.`,
        });

        this.stepSequence = steps;
        this.totalSteps = steps.length;
    }

    renderAlphaBetaStep(stepIndex) {
        if (!this.stepSequence || this.stepSequence.length === 0) return;
        const step = this.stepSequence[stepIndex];
        if (!step) return;

        // Update step counter
        const counterEl = document.getElementById('ab-step-counter');
        if (counterEl) counterEl.textContent = `Step ${stepIndex + 1} of ${this.totalSteps}`;

        // Update bounds HUD
        const alphaEl = document.getElementById('ab-val-alpha');
        const betaEl = document.getElementById('ab-val-beta');
        if (alphaEl) alphaEl.textContent = step.alpha === -Infinity ? '-∞' : step.alpha;
        if (betaEl) betaEl.textContent = step.beta === Infinity ? '+∞' : step.beta;

        // Update message banner
        const bannerEl = document.getElementById('ab-status-banner');
        if (bannerEl) {
            bannerEl.textContent = step.message;
            if (step.type === 'PRUNE_CUTOFF') {
                bannerEl.className = 'ab-status-banner prune-alert';
                window.soundManager.playPrune();
            } else {
                bannerEl.className = 'ab-status-banner normal';
            }
        }

        // Render graphical representation
        const stage = document.getElementById('ab-visual-stage');
        if (stage && this.treeTrace) {
            this.renderAlphaBetaStage(stage, stepIndex);
        }
    }

    renderAlphaBetaStage(stage, stepIdx) {
        stage.innerHTML = '';

        const root = this.treeTrace;
        const container = document.createElement('div');
        container.className = 'ab-branches-container';

        // Root
        const rootBox = document.createElement('div');
        rootBox.className = 'ab-node-box root-box';
        rootBox.innerHTML = `<strong>Root (MAX)</strong><div>Score: ${root.score}</div>`;
        container.appendChild(rootBox);

        // Branches row
        const branchesRow = document.createElement('div');
        branchesRow.className = 'ab-branches-row';

        if (root.children) {
            root.children.forEach(child => {
                const branchCard = document.createElement('div');
                branchCard.className = `ab-branch-card ${child.is_best ? 'best-branch' : ''}`;
                branchCard.innerHTML = `
                    <div class="branch-label">Col ${child.move + 1}</div>
                    <div class="branch-status">Explored</div>
                    <div class="branch-score">Score: ${child.score}</div>
                `;
                branchesRow.appendChild(branchCard);
            });
        }

        if (root.pruned_branches) {
            root.pruned_branches.forEach(pruned => {
                const prunedCard = document.createElement('div');
                prunedCard.className = 'ab-branch-card pruned-branch';
                prunedCard.innerHTML = `
                    <div class="branch-label">Col ${pruned.move + 1}</div>
                    <div class="branch-status strike-text">PRUNED ✂</div>
                    <div class="branch-reason">${pruned.reason}</div>
                `;
                branchesRow.appendChild(prunedCard);
            });
        }

        container.appendChild(branchesRow);
        stage.appendChild(container);
    }

    stepNext() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.renderAlphaBetaStep(this.currentStep);
        } else {
            this.pauseAutoPlay();
        }
    }

    stepPrev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderAlphaBetaStep(this.currentStep);
        }
    }

    toggleAutoPlay() {
        if (this.isPlaying) {
            this.pauseAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        this.isPlaying = true;
        const btnAuto = document.getElementById('ab-btn-auto');
        if (btnAuto) btnAuto.textContent = '⏸ Pause';

        this.playTimer = setInterval(() => {
            if (this.currentStep < this.totalSteps - 1) {
                this.stepNext();
            } else {
                this.pauseAutoPlay();
            }
        }, this.playSpeedMs);
    }

    pauseAutoPlay() {
        this.isPlaying = false;
        clearInterval(this.playTimer);
        const btnAuto = document.getElementById('ab-btn-auto');
        if (btnAuto) btnAuto.textContent = '▶ Auto Play';
    }

    resetAlphaBetaDemo() {
        this.pauseAutoPlay();
        this.currentStep = 0;
        this.renderAlphaBetaStep(0);
    }
}

window.aiLabManager = new AILabManager();
