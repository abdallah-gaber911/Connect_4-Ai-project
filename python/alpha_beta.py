"""
Alpha-Beta Pruning Algorithm Implementation for Connect Four.
Optimizes Minimax by cutting off branches that cannot influence the final decision.
Maintains alpha (best score for MAX) and beta (best score for MIN).
"""
import math
from typing import Tuple, Optional, Dict, Any, List
from python.board import Board, ROWS, COLS, EMPTY, PLAYER, AI
from python.evaluation import score_position

WIN_SCORE = 10000000


def alpha_beta_search(
    board: Board,
    depth: int,
    alpha: float = -math.inf,
    beta: float = math.inf,
    maximizing_player: bool = True,
    stats: Optional[Dict[str, Any]] = None,
    collect_trace: bool = False,
    node_id_counter: Optional[List[int]] = None,
    parent_id: Optional[int] = None,
    move_col: Optional[int] = None,
) -> Tuple[Optional[int], float, Optional[Dict[str, Any]]]:
    """
    Alpha-Beta Pruning search with visited and pruned node counting.
    Returns: (best_column, best_score, trace_dict)
    """
    if stats is None:
        stats = {
            "nodes_visited": 0,
            "pruned_nodes": 0,
            "prune_events": 0,
        }
    stats["nodes_visited"] += 1

    current_node_id = None
    node_trace = None
    if collect_trace:
        if node_id_counter is None:
            node_id_counter = [0]
        current_node_id = node_id_counter[0]
        node_id_counter[0] += 1
        node_trace = {
            "id": current_node_id,
            "parent_id": parent_id,
            "depth": depth,
            "move": move_col,
            "is_max": maximizing_player,
            "alpha_in": alpha,
            "beta_in": beta,
            "alpha_out": alpha,
            "beta_out": beta,
            "score": None,
            "children": [],
            "pruned_branches": [],
            "is_best": False,
            "pruned": False,
        }

    valid_locations = board.get_valid_locations()
    is_terminal = board.is_terminal_node()

    if depth == 0 or is_terminal:
        if is_terminal:
            if board.winning_move(AI):
                score = WIN_SCORE + depth
            elif board.winning_move(PLAYER):
                score = -WIN_SCORE - depth
            else:
                score = 0
        else:
            score = score_position(board, AI)

        if node_trace:
            node_trace["score"] = score
            node_trace["alpha_out"] = alpha
            node_trace["beta_out"] = beta
        return None, score, node_trace

    if maximizing_player:
        max_eval = -math.inf
        best_col = valid_locations[0] if valid_locations else None

        for idx, col in enumerate(valid_locations):
            row = board.get_next_open_row(col)
            board.drop_piece(row, col, AI)

            _, eval_score, child_trace = alpha_beta_search(
                board,
                depth - 1,
                alpha,
                beta,
                False,
                stats,
                collect_trace,
                node_id_counter,
                current_node_id,
                col,
            )

            board.drop_piece(row, col, EMPTY)

            if node_trace and child_trace:
                node_trace["children"].append(child_trace)

            if eval_score > max_eval:
                max_eval = eval_score
                best_col = col

            alpha = max(alpha, eval_score)

            if beta <= alpha:
                # Alpha-Beta Pruning Cut-off
                remaining = len(valid_locations) - (idx + 1)
                stats["pruned_nodes"] += remaining
                stats["prune_events"] += 1

                if node_trace:
                    # Record pruned branches for educational visualization
                    for pruned_col in valid_locations[idx + 1:]:
                        node_trace["pruned_branches"].append({
                            "move": pruned_col,
                            "reason": f"β ({beta}) ≤ α ({alpha})",
                        })
                break

        if node_trace:
            node_trace["score"] = max_eval
            node_trace["alpha_out"] = alpha
            node_trace["beta_out"] = beta
            for child in node_trace["children"]:
                if child.get("move") == best_col and child.get("score") == max_eval:
                    child["is_best"] = True

        return best_col, max_eval, node_trace

    else:  # Minimizing player
        min_eval = math.inf
        best_col = valid_locations[0] if valid_locations else None

        for idx, col in enumerate(valid_locations):
            row = board.get_next_open_row(col)
            board.drop_piece(row, col, PLAYER)

            _, eval_score, child_trace = alpha_beta_search(
                board,
                depth - 1,
                alpha,
                beta,
                True,
                stats,
                collect_trace,
                node_id_counter,
                current_node_id,
                col,
            )

            board.drop_piece(row, col, EMPTY)

            if node_trace and child_trace:
                node_trace["children"].append(child_trace)

            if eval_score < min_eval:
                min_eval = eval_score
                best_col = col

            beta = min(beta, eval_score)

            if beta <= alpha:
                # Alpha-Beta Pruning Cut-off
                remaining = len(valid_locations) - (idx + 1)
                stats["pruned_nodes"] += remaining
                stats["prune_events"] += 1

                if node_trace:
                    for pruned_col in valid_locations[idx + 1:]:
                        node_trace["pruned_branches"].append({
                            "move": pruned_col,
                            "reason": f"β ({beta}) ≤ α ({alpha})",
                        })
                break

        if node_trace:
            node_trace["score"] = min_eval
            node_trace["alpha_out"] = alpha
            node_trace["beta_out"] = beta
            for child in node_trace["children"]:
                if child.get("move") == best_col and child.get("score") == min_eval:
                    child["is_best"] = True

        return best_col, min_eval, node_trace
