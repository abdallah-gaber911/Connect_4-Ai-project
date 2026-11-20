"""
Heuristic Evaluation Function for Connect Four.
Evaluates the board state from the perspective of a given piece (usually AI).
Considers center column control, horizontal, vertical, and diagonal windows of 4.
"""
from typing import List
from python.board import ROWS, COLS, EMPTY, PLAYER, AI, Board

WINDOW_LENGTH = 4


def evaluate_window(window: List[int], piece: int) -> int:
    """Scores a single 4-cell window from the perspective of `piece`."""
    score = 0
    opp_piece = PLAYER if piece == AI else AI

    count_piece = window.count(piece)
    count_empty = window.count(EMPTY)
    count_opp = window.count(opp_piece)

    if count_piece == 4:
        score += 100000
    elif count_piece == 3 and count_empty == 1:
        score += 100
    elif count_piece == 2 and count_empty == 2:
        score += 10

    # Blocking opponent threats: Penalize strongly if opponent is set to win on next move
    if count_opp == 3 and count_empty == 1:
        score -= 120
    elif count_opp == 2 and count_empty == 2:
        score -= 10

    return score


def score_position(board: Board, piece: int) -> int:
    """Evaluates the entire board state from the perspective of `piece`."""
    score = 0

    # 1. Center column control (strategic advantage in Connect 4)
    center_col = [board.grid[r][COLS // 2] for r in range(ROWS)]
    center_count = center_col.count(piece)
    score += center_count * 6

    # Inner columns (2 and 4) slight preference
    col2 = [board.grid[r][2] for r in range(ROWS)]
    col4 = [board.grid[r][4] for r in range(ROWS)]
    score += col2.count(piece) * 2 + col4.count(piece) * 2

    # 2. Horizontal evaluation
    for r in range(ROWS):
        row_array = board.grid[r]
        for c in range(COLS - 3):
            window = row_array[c:c + WINDOW_LENGTH]
            score += evaluate_window(window, piece)

    # 3. Vertical evaluation
    for c in range(COLS):
        col_array = [board.grid[r][c] for r in range(ROWS)]
        for r in range(ROWS - 3):
            window = col_array[r:r + WINDOW_LENGTH]
            score += evaluate_window(window, piece)

    # 4. Positively sloped diagonals (/)
    for r in range(3, ROWS):
        for c in range(COLS - 3):
            window = [board.grid[r - i][c + i] for i in range(WINDOW_LENGTH)]
            score += evaluate_window(window, piece)

    # 5. Negatively sloped diagonals (\)
    for r in range(ROWS - 3):
        for c in range(COLS - 3):
            window = [board.grid[r + i][c + i] for i in range(WINDOW_LENGTH)]
            score += evaluate_window(window, piece)

    return score
