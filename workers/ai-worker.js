/**
 * Web Worker for Pyodide AI Engine Execution.
 * Executes Python Minimax and Alpha-Beta algorithms off the main thread
 * ensuring the UI remains 60fps responsive without any freezing.
 */

/* global importScripts, loadPyodide */

let pyodide = null;
let isReady = false;

self.onmessage = async (e) => {
    const { type, id, payload } = e.data;

    try {
        if (type === 'INIT') {
            await initializePyodide(payload ? payload.pythonFiles : null);
            self.postMessage({ type: 'INIT_SUCCESS' });
            return;
        }

        if (!isReady || !pyodide) {
            throw new Error('Pyodide AI Engine is not yet initialized.');
        }

        let result = null;
        const gridJson = JSON.stringify(payload.grid);

        switch (type) {
            case 'GET_BEST_MOVE': {
                const pyCode = `py_get_best_move('''${gridJson}''', '${payload.algorithm}', ${payload.depth})`;
                const raw = pyodide.runPython(pyCode);
                result = JSON.parse(raw);
                break;
            }
            case 'GET_HINT': {
                const pyCode = `py_get_hint('''${gridJson}''', '${payload.algorithm}', ${payload.depth})`;
                const raw = pyodide.runPython(pyCode);
                result = JSON.parse(raw);
                break;
            }
            case 'RUN_BENCHMARK': {
                const pyCode = `py_run_benchmark('''${gridJson}''', ${payload.depth})`;
                const raw = pyodide.runPython(pyCode);
                result = JSON.parse(raw);
                break;
            }
            case 'GET_TREE_TRACE': {
                const pyCode = `py_get_tree_trace('''${gridJson}''', '${payload.algorithm}', ${payload.depth})`;
                const raw = pyodide.runPython(pyCode);
                result = JSON.parse(raw);
                break;
            }
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        self.postMessage({ type: 'RESULT', id, data: result });
    } catch (err) {
        console.error('Error in Pyodide Web Worker:', err);
        self.postMessage({ type: 'ERROR', id, error: err.message || String(err) });
    }
};

async function initializePyodide(pythonFiles) {
    self.postMessage({ type: 'INIT_PROGRESS', message: 'Downloading WebAssembly Python Runtime (Pyodide)...' });

    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');

    self.postMessage({ type: 'INIT_PROGRESS', message: 'Initializing Pyodide WebAssembly Virtual Environment...' });
    pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
    });

    self.postMessage({ type: 'INIT_PROGRESS', message: 'Setting up Python AI modules (Minimax, Alpha-Beta, Heuristics)...' });

    // Mount python files into Pyodide virtual filesystem
    try {
        pyodide.FS.mkdirTree('/home/pyodide/python');
    } catch (e) {
        // Directory may already exist
    }

    if (pythonFiles) {
        for (const [filename, content] of Object.entries(pythonFiles)) {
            pyodide.FS.writeFile(`/home/pyodide/python/${filename}`, content);
        }
    }

    // Set up import path and load ai_engine functions
    const setupScript = `
import sys
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')

from python.ai_engine import (
    py_get_best_move,
    py_get_hint,
    py_run_benchmark,
    py_get_tree_trace
)
`;
    pyodide.runPython(setupScript);

    isReady = true;
    self.postMessage({ type: 'INIT_PROGRESS', message: 'AI Engine Ready!' });
}
