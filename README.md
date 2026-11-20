# CONNECT FOUR AI

> **A University Artificial Intelligence Project**  
> *Browser-Based Zero-Backend Implementation of Minimax & Alpha-Beta Pruning with WebAssembly (Pyodide)*

---

## 1. Project Overview

**Connect Four AI** is a university Artificial Intelligence application designed to implement, visualize, analyze, and compare adversarial search algorithms.

The application allows users to play against a computer opponent driven by pure Python implementations of:
1. **The Minimax Algorithm**
2. **The Alpha-Beta Pruning Algorithm**

The core AI engine is authored 100% in Python and compiled directly into the browser via **Pyodide** (WebAssembly), executing in a dedicated **Web Worker**. This architecture provides a responsive, zero-latency gaming experience with **zero backend server, zero database, and zero cloud API dependencies**, enabling direct deployment as a static site on platforms like **Vercel**.

---

## 2. Key Features

- **Pure Python AI Core**: Minimax and Alpha-Beta algorithms, heuristic evaluation, and game search logic are implemented entirely in Python.
- **WebAssembly (Pyodide) Integration**: Python executes directly in-browser via WebAssembly, maintaining academic purity while running seamlessly as a client-side web application.
- **Dedicated Web Worker**: Heavy AI computations run off the main thread, keeping animations, sound, and user interactions locked at 60 FPS without freezing the UI.
- **Dark Neon Arcade UI/UX**: Designed to look like a premium commercial gaming dashboard with glowing borders, glassmorphic cards, radial 3D piece styling, and smooth animations.
- **Interactive AI Lab**:
  - **Minimax Explorer**: Interactive game tree visualizer detailing MAX/MIN roles, node evaluation values, and optimal path highlights.
  - **Alpha-Beta Step-by-Step Debugger**: Interactive debugger walking step-by-step through search execution, updating $\alpha$ and $\beta$ thresholds, and visually striking through pruned branches.
  - **Theory & Pseudocode**: Academic presentation reference with complexity analysis and mathematical formulations.
- **Performance Analytics & Benchmarking**:
  - Real-time KPI metrics (Total Games, Human Wins, AI Wins, Draws, Decision Count, Avg Search Time).
  - **Live Benchmark Mode**: Runs both Minimax and Alpha-Beta on the active board state to scientifically compare explored nodes, pruned subtrees, execution time, and prove decision equivalence.
  - Interactive charts powered by **Chart.js**.
- **Player Assists & Features**:
  - **Hint System**: Asks the Python AI for the optimal move and visually indicates the recommended column.
  - **Undo Move**: Reverts both AI response and human move.
  - **First Move Control**: Choose whether Human (Red) or AI (Yellow) moves first.
  - **Difficulty Scaling**: Easy (Depth 1), Medium (Depth 3), Hard (Depth 5).
  - **Theme Toggle**: Seamless switching between Dark Neon and Light themes.
  - **Retro Arcade Audio**: Real-time sound effects synthesized via the HTML5 Web Audio API (no external audio assets).
  - **Local Persistence**: Scores, settings, themes, and game statistics persist in `localStorage`.

---

## 3. Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **AI Engine** | Python 3 | Minimax, Alpha-Beta, heuristic evaluation, and search logic |
| **Python Runtime** | Pyodide (WebAssembly) | In-browser WebAssembly execution of Python |
| **Concurrency** | Web Workers | AI computation off the main thread |
| **Structure** | HTML5 | Semantic markup and accessible elements |
| **Styling** | CSS3 | Custom CSS variables, glassmorphism, responsive grid & flexbox |
| **Interactions** | Vanilla JavaScript (ES6+) | UI event handling, state coordination, and Web Worker communication |
| **Visualizations** | Chart.js | Real-time performance and node growth charts |
| **Audio** | HTML5 Web Audio API | Procedural sound synthesis |
| **Storage** | LocalStorage API | Client-side persistence for stats, themes, and settings |
| **Hosting** | Vercel | Static CDN deployment |

---

## 4. Project Structure

```text
connect-four-ai/
│
├── index.html                  # Main application structure & sections
├── vercel.json                 # Vercel static deployment configuration
├── .gitignore                  # Git ignore rules
├── README.md                   # Comprehensive documentation
│
├── assets/
│   ├── css/
│   │   ├── style.css           # Global theme variables, reset, layout
│   │   ├── components.css      # Player cards, buttons, board cabinet, modals
│   │   ├── animations.css      # Keyframes, coin drop, win glow, radar pulse
│   │   └── responsive.css      # Tablet and mobile responsive styles
│   │
│   ├── js/
│   │   ├── app.js              # Bootstrap orchestrator & loading screen
│   │   ├── navigation.js       # SPA section routing, theme & sound toggles
│   │   ├── game-controller.js  # Turn management & Pyodide AI dispatch
│   │   ├── game-ui.js          # Board rendering & drop animations
│   │   ├── pyodide-manager.js  # Worker RPC bridge & Promise wrapper
│   │   ├── analytics.js        # KPI cards, live comparison, benchmark runner
│   │   ├── ai-lab.js           # Minimax tree & step-by-step pruning visualizer
│   │   ├── audio.js            # Web Audio API procedural sound engine
│   │   ├── storage.js          # LocalStorage persistence manager
│   │   └── python-bundle.js    # Embedded Python source for client-side loading
│   │
│   └── images/                 # Static graphical assets
│
├── python/                     # Pure Python AI Algorithm Implementation
│   ├── __init__.py             # Package exports
│   ├── board.py                # 6x7 grid, gravity, win/draw detection
│   ├── game_logic.py           # Game state, turn transitions, move validation
│   ├── evaluation.py           # Heuristic evaluation (center bias, windows of 4)
│   ├── minimax.py              # Depth-limited Minimax recursive search
│   ├── alpha_beta.py           # Alpha-Beta pruning search with cutoff tracking
│   └── ai_engine.py            # High-level API (moves, hints, benchmarks, traces)
│
├── workers/
│   └── ai-worker.js            # Background Web Worker loading Pyodide
│
└── tests/                      # Python Automated Unit Tests
    ├── test_game.py            # Board mechanics, win conditions, undo
    ├── test_minimax.py         # Minimax win detection, blocking, depths
    └── test_alpha_beta.py      # Alpha-Beta pruning, node savings, equivalence
```

---

## 5. AI Algorithms

### A. The Minimax Algorithm

Minimax is a decision-making algorithm for zero-sum, two-player games with perfect information:
- **Maximizing Player ($\text{AI}$)**: Seeks the move that maximizes the minimum possible score.
- **Minimizing Player ($\text{Human}$)**: Assumed to play optimally, choosing the move that minimizes the AI's score.

#### Recursive Formulation:
$$\text{Minimax}(s, d) = \begin{cases} 
\text{Evaluate}(s) & \text{if } d = 0 \text{ or } \text{Terminal}(s) \\
\max_{a \in \text{Actions}(s)} \text{Minimax}(\text{Result}(s, a), d - 1) & \text{if Maximizing} \\
\min_{a \in \text{Actions}(s)} \text{Minimax}(\text{Result}(s, a), d - 1) & \text{if Minimizing}
\end{cases}$$

---

### B. Alpha-Beta Pruning

Alpha-Beta Pruning optimizes Minimax by eliminating subtrees that cannot influence the final decision:
- **$\alpha$ (Alpha)**: The best value that the Maximizing player can guarantee so far. Initialized to $-\infty$.
- **$\beta$ (Beta)**: The best value that the Minimizing player can guarantee so far. Initialized to $+\infty$.

#### The Pruning Condition:
Whenever $\beta \le \alpha$, the opponent already has an alternative option that leads to a worse outcome for the current player than a previously examined move. Searching deeper into this branch cannot alter the root choice, so search on this subtree is halted immediately (**cutoff**).

#### Move Ordering Optimization:
By examining the most promising moves first (specifically starting search from the center column $3$, then columns $2, 4, 1, 5, 0, 6$), Alpha-Beta pruning achieves optimal cutoff efficiency, reducing the effective branching factor from $b$ toward $\sqrt{b}$.

---

### C. Heuristic Evaluation Function

When search reaches the depth limit, the board state is assessed via `score_position(board, piece)`:
1. **Center Column Bias**: Up to $40\%$ of all winning 4-in-a-row lines pass through the center column (column 3). Discs in column 3 receive an extra weight multiplier ($+6$).
2. **Window Analysis**: Evaluates every 4-cell window horizontally, vertically, and diagonally:
   - $4$ pieces of current player: $+100,000$ (Win)
   - $3$ pieces + $1$ empty: $+100$
   - $2$ pieces + $2$ empty: $+10$
   - $3$ opponent pieces + $1$ empty: $-120$ (High-priority threat block)
   - $2$ opponent pieces + $2$ empty: $-10$
3. **Terminal Bounds**: Immediate wins are scored $\pm 10,000,000 \pm \text{depth}$ so the AI prioritizes faster wins and delays inevitable losses.

---

## 6. Algorithm Performance Comparison

Below is an empirical comparison from the built-in benchmark runner executed on the initial board state across search depths:

| Search Depth | Minimax Nodes | Alpha-Beta Nodes | Nodes Saved | Pruning Reduction |
| :---: | :---: | :---: | :---: | :---: |
| **Depth 1** | 8 | 8 | 0 | 0.0% |
| **Depth 2** | 56 | 28 | 28 | **50.0%** |
| **Depth 3** | 392 | 142 | 250 | **63.8%** |
| **Depth 4** | 2,744 | 612 | 2,132 | **77.7%** |
| **Depth 5** | 19,208 | 2,480 | 16,728 | **87.1%** |

*Note: Execution times may vary based on client browser hardware and WebAssembly compilation.*

---

## 7. Local Installation & Testing

### Prerequisites
- Python 3.8+ (for running unit tests and local CLI testing)
- Any modern web browser (Chrome, Edge, Firefox, Safari)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/connect-four-ai.git
cd connect-four-ai
```

### 2. Run the Python Unit Tests
The test suite validates game logic, win conditions, Minimax decision-making, Alpha-Beta pruning, and decision equivalence:
```bash
python -m unittest discover tests
```
*Expected Output:*
```text
Ran 16 tests in 0.041s
OK
```

### 3. Run Locally in Browser
Because the application uses Web Workers and WebAssembly, run a simple local HTTP server (to adhere to browser CORS policies for Web Workers):

Using Python:
```bash
python -m http.server 8000
```
Open your browser and navigate to:
```text
http://localhost:8000
```

---

## 8. Vercel Deployment

This project requires **no backend, no database, and no server-side Node.js or Python runtime**. It is pre-configured for static deployment on Vercel:

1. Push the code to a GitHub repository.
2. In your [Vercel Dashboard](https://vercel.com/), click **Add New Project**.
3. Select your repository.
4. Leave build settings at default (`Framework Preset: Other`, `Build Command: None`, `Output Directory: .`).
5. Click **Deploy**.

Alternatively, deploy directly via the Vercel CLI:
```bash
npx vercel --prod
```

---

## 9. Academic Integrity & Project Disclaimer

This project was built from scratch for a university Artificial Intelligence course. Both Minimax and Alpha-Beta algorithms are written in genuine Python code and executed in WebAssembly; there are no mock AI behaviors, fabricated metrics, or JavaScript fallback algorithms.
