"""
Minimax Algorithm Implementation for Connect Four.
Performs an exhaustive depth-limited search across the game tree.
Maximizing player is AI (piece=AI), Minimizing player is Human (piece=PLAYER).
"""
import math
from typing import Tuple, Optional, Dict, Any, List
from python.board import Board, ROWS, COLS, EMPTY, PLAYER, AI
from python.evaluation import score_position

WIN_SCORE = 10000000


def minimax_search(
    board: Board,
    depth: int,
    maximizing_player: bool,
    stats: Optional[Dict[str, Any]] = None,
    collect_trace: bool = False,
    node_id_counter: Optional[List[int]] = None,
    parent_id: Optional[int] = None,
    move_col: Optional[int] = None,
) -> Tuple[Optional[int], float, Optional[Dict[str, Any]]]:
    """
    Minimax search with visited node counting and optional tree trace collection.
    Returns: (best_column, best_score, trace_dict)
    """
    if stats is None:
        stats = {"nodes_visited": 0, "pruned_nodes": 0}
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
            "score": None,
            "children": [],
            "is_best": False,
            "pruned": False,
        }

    valid_locations = board.get_valid_locations()
    is_terminal = board.is_terminal_node()

    # Terminal or depth limit reached
    if depth == 0 or is_terminal:
        if is_terminal:
            if board.winning_move(AI):
                score = WIN_SCORE + depth  # Prefer faster win
            elif board.winning_move(PLAYER):
                score = -WIN_SCORE - depth  # Prefer delayed loss
            else:
                score = 0  # Draw
        else:
            score = score_position(board, AI)

        if node_trace:
            node_trace["score"] = score
        return None, score, node_trace

    if maximizing_player:
        max_eval = -math.inf
        best_col = valid_locations[0] if valid_locations else None

        for col in valid_locations:
            row = board.get_next_open_row(col)
            board.drop_piece(row, col, AI)

            _, eval_score, child_trace = minimax_search(
                board,
                depth - 1,
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

        if node_trace:
            node_trace["score"] = max_eval
            # Mark optimal child
            for child in node_trace["children"]:
                if child.get("move") == best_col and child.get("score") == max_eval:
                    child["is_best"] = True

        return best_col, max_eval, node_trace

    else:  # Minimizing player
        min_eval = math.inf
        best_col = valid_locations[0] if valid_locations else None

        for col in valid_locations:
            row = board.get_next_open_row(col)
            board.drop_piece(row, col, PLAYER)

            _, eval_score, child_trace = minimax_search(
                board,
                depth - 1,
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

        if node_trace:
            node_trace["score"] = min_eval
            # Mark optimal child
            for child in node_trace["children"]:
                if child.get("move") == best_col and child.get("score") == min_eval:
                    child["is_best"] = True

        return best_col, min_eval, node_trace
