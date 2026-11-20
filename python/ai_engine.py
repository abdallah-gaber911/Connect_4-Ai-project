"""
Connect Four AI Engine - High-level API.
Exposes clean functions used by Pyodide / Web Workers / CLI:
- get_best_move
- get_hint
- run_benchmark
- get_tree_trace
"""
import time
import json
from typing import Dict, Any, List, Optional
from python.board import Board, ROWS, COLS, EMPTY, PLAYER, AI
from python.minimax import minimax_search
from python.alpha_beta import alpha_beta_search
from python.evaluation import score_position

# Preset depths corresponding to prompt requirements
DIFFICULTY_DEPTHS = {
    "easy": 1,
    "medium": 3,
    "hard": 5,
}


class AIEngine:
    @staticmethod
    def get_best_move(
        grid: List[List[int]],
        algorithm: str = "alpha_beta",
        depth: int = 4,
        player: int = AI,
        collect_trace: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes chosen search algorithm on board grid.
        Returns execution metrics, selected move, and evaluation score.
        """
        board = Board(grid)
        stats = {
            "nodes_visited": 0,
            "pruned_nodes": 0,
            "prune_events": 0,
        }

        # Validate that game is not already in terminal state
        if board.is_terminal_node():
            return {
                "success": False,
                "error": "Game is already in a terminal state",
            }

        start_time = time.perf_counter()

        algo_normalized = algorithm.lower().replace("-", "_").replace(" ", "_")
        trace = None

        if "minimax" in algo_normalized and "alpha" not in algo_normalized:
            algo_name = "Minimax"
            best_col, score, trace = minimax_search(
                board,
                depth,
                maximizing_player=(player == AI),
                stats=stats,
                collect_trace=collect_trace,
            )
        else:
            algo_name = "Alpha-Beta Pruning"
            best_col, score, trace = alpha_beta_search(
                board,
                depth,
                maximizing_player=(player == AI),
                stats=stats,
                collect_trace=collect_trace,
            )

        exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Fallback if no valid col found (e.g. board full)
        if best_col is None:
            valid = board.get_valid_locations()
            best_col = valid[0] if valid else None

        result = {
            "success": True,
            "selected_column": best_col,
            "evaluation_score": int(score) if abs(score) < 100000000 else int(score),
            "nodes_visited": stats["nodes_visited"],
            "pruned_nodes": stats["pruned_nodes"],
            "prune_events": stats["prune_events"],
            "search_depth": depth,
            "execution_time_ms": exec_time_ms,
            "algorithm_name": algo_name,
        }

        if collect_trace and trace:
            result["search_trace"] = trace

        return result

    @staticmethod
    def get_hint(grid: List[List[int]], algorithm: str = "alpha_beta", depth: int = 3) -> Dict[str, Any]:
        """
        Returns recommended move for the Human player (PLAYER = 1).
        """
        # Evaluates from Human perspective
        return AIEngine.get_best_move(
            grid=grid,
            algorithm=algorithm,
            depth=depth,
            player=PLAYER,
            collect_trace=False,
        )

    @staticmethod
    def run_benchmark(grid: List[List[int]], depth: int = 4) -> Dict[str, Any]:
        """
        Runs both Minimax and Alpha-Beta on the exact same board state,
        depth, and evaluation function to provide a 100% fair scientific comparison.
        """
        board_minimax = Board(grid)
        board_alphabeta = Board(grid)

        # 1. Run Minimax
        stats_mm = {"nodes_visited": 0, "pruned_nodes": 0}
        t0 = time.perf_counter()
        best_col_mm, score_mm, _ = minimax_search(
            board_minimax,
            depth=depth,
            maximizing_player=True,
            stats=stats_mm,
            collect_trace=False,
        )
        t_mm = round((time.perf_counter() - t0) * 1000, 2)

        # 2. Run Alpha-Beta
        stats_ab = {"nodes_visited": 0, "pruned_nodes": 0, "prune_events": 0}
        t1 = time.perf_counter()
        best_col_ab, score_ab, _ = alpha_beta_search(
            board_alphabeta,
            depth=depth,
            maximizing_player=True,
            stats=stats_ab,
            collect_trace=False,
        )
        t_ab = round((time.perf_counter() - t1) * 1000, 2)

        # Pruning efficiency calculation
        nodes_mm = stats_mm["nodes_visited"]
        nodes_ab = stats_ab["nodes_visited"]
        reduction_pct = round(((nodes_mm - nodes_ab) / max(nodes_mm, 1)) * 100, 1) if nodes_mm > 0 else 0.0
        speedup = round(t_mm / max(t_ab, 0.001), 2) if t_ab > 0 else 1.0

        return {
            "depth": depth,
            "minimax": {
                "algorithm": "Minimax",
                "best_move": best_col_mm,
                "score": int(score_mm),
                "nodes_visited": nodes_mm,
                "pruned_nodes": 0,
                "execution_time_ms": t_mm,
            },
            "alpha_beta": {
                "algorithm": "Alpha-Beta Pruning",
                "best_move": best_col_ab,
                "score": int(score_ab),
                "nodes_visited": nodes_ab,
                "pruned_nodes": stats_ab["pruned_nodes"],
                "prune_events": stats_ab["prune_events"],
                "execution_time_ms": t_ab,
            },
            "comparison": {
                "equivalent_decision": (best_col_mm == best_col_ab),
                "equivalent_score": (score_mm == score_ab),
                "nodes_saved": nodes_mm - nodes_ab,
                "reduction_percentage": reduction_pct,
                "speedup_factor": speedup,
            },
        }

    @staticmethod
    def get_tree_trace(grid: List[List[int]], algorithm: str = "alpha_beta", depth: int = 2) -> Dict[str, Any]:
        """
        Generates structured tree trace specifically for the AI Lab interactive visualization.
        Depth defaults to 2 (or 3) to keep the educational tree readable.
        """
        # Cap visualizer depth to 3 for performance and rendering clarity
        safe_depth = min(depth, 3)
        return AIEngine.get_best_move(
            grid=grid,
            algorithm=algorithm,
            depth=safe_depth,
            player=AI,
            collect_trace=True,
        )


# Global helper functions for easy JS / Pyodide invocation
def py_get_best_move(grid_json: str, algorithm: str, depth: int) -> str:
    grid = json.loads(grid_json)
    result = AIEngine.get_best_move(grid, algorithm=algorithm, depth=depth)
    return json.dumps(result)


def py_get_hint(grid_json: str, algorithm: str, depth: int) -> str:
    grid = json.loads(grid_json)
    result = AIEngine.get_hint(grid, algorithm=algorithm, depth=depth)
    return json.dumps(result)


def py_run_benchmark(grid_json: str, depth: int) -> str:
    grid = json.loads(grid_json)
    result = AIEngine.run_benchmark(grid, depth=depth)
    return json.dumps(result)


def py_get_tree_trace(grid_json: str, algorithm: str, depth: int) -> str:
    grid = json.loads(grid_json)
    result = AIEngine.get_tree_trace(grid, algorithm=algorithm, depth=depth)
    return json.dumps(result)
