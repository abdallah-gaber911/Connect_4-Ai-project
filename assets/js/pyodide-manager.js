/**
 * Pyodide Web Worker & Main-thread manager.
 * Dispatches AI computation to the Web Worker and provides Promise-based async API.
 */

class PyodideManager {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.callbacks = new Map();
        this.reqId = 0;
        this.onProgress = null;
    }

    async init(onProgressCallback) {
        this.onProgress = onProgressCallback;

        return new Promise((resolve, reject) => {
            try {
                if (this.onProgress) {
                    this.onProgress('Starting Python Web Worker...');
                }

                this.worker = new Worker('workers/ai-worker.js');

                this.worker.onmessage = (e) => {
                    const { type, id, data, error, message } = e.data;

                    if (type === 'INIT_PROGRESS') {
                        if (this.onProgress) this.onProgress(message);
                    } else if (type === 'INIT_SUCCESS') {
                        this.isReady = true;
                        if (this.onProgress) this.onProgress('AI Engine is Ready!');
                        resolve(true);
                    } else if (type === 'RESULT') {
                        if (this.callbacks.has(id)) {
                            const { resolve: cbResolve } = this.callbacks.get(id);
                            this.callbacks.delete(id);
                            cbResolve(data);
                        }
                    } else if (type === 'ERROR') {
                        if (this.callbacks.has(id)) {
                            const { reject: cbReject } = this.callbacks.get(id);
                            this.callbacks.delete(id);
                            cbReject(new Error(error));
                        } else {
                            console.error('Uncaught worker error:', error);
                        }
                    }
                };

                this.worker.onerror = (err) => {
                    console.error('Worker failed to launch:', err);
                    // Fall back to main thread or show error
                    reject(err);
                };

                // Send initialization payload with embedded Python code
                const pythonFiles = window.PYTHON_FILES || null;
                this.worker.postMessage({
                    type: 'INIT',
                    payload: { pythonFiles },
                });

            } catch (err) {
                console.error('Error starting worker:', err);
                reject(err);
            }
        });
    }

    _send(type, payload) {
        if (!this.isReady || !this.worker) {
            return Promise.reject(new Error('AI Engine is not ready yet. Please wait.'));
        }

        const id = ++this.reqId;
        return new Promise((resolve, reject) => {
            this.callbacks.set(id, { resolve, reject });
            this.worker.postMessage({ type, id, payload });
        });
    }

    async getBestMove(grid, algorithm = 'alpha_beta', depth = 3, player = 2) {
        return this._send('GET_BEST_MOVE', { grid, algorithm, depth, player });
    }

    async getHint(grid, algorithm = 'alpha_beta', depth = 3) {
        return this._send('GET_HINT', { grid, algorithm, depth });
    }

    async runBenchmark(grid, depth = 3) {
        return this._send('RUN_BENCHMARK', { grid, depth });
    }

    async getTreeTrace(grid, algorithm = 'alpha_beta', depth = 2) {
        return this._send('GET_TREE_TRACE', { grid, algorithm, depth });
    }
}

window.pyodideManager = new PyodideManager();
