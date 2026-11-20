"""
High-level Connect Four Game State Manager.
Handles turns, move history, validation, and terminal condition checking.
"""
from typing import List, Dict, Any, Optional
from python.board import Board, ROWS, COLS, EMPTY, PLAYER, AI


class ConnectFourGame:
    def __init__(self):
        self.board = Board()
        self.current_turn = PLAYER  # Human plays first by default
        self.move_history: List[Dict[str, Any]] = []
        self.winner: Optional[int] = None
        self.winning_coords: Optional[List[tuple]] = None
        self.is_over: bool = False

    def reset(self, first_turn: int = PLAYER) -> None:
        self.board = Board()
        self.current_turn = first_turn
        self.move_history = []
        self.winner = None
        self.winning_coords = None
        self.is_over = False

    def make_move(self, col: int) -> Dict[str, Any]:
        """Applies a move for the current player in column `col`. Returns move details."""
        if self.is_over:
            return {"success": False, "error": "Game is already over"}

        if not self.board.is_valid_location(col):
            return {"success": False, "error": f"Column {col} is full or invalid"}

        row = self.board.make_move(col, self.current_turn)
        move_info = {
            "move_number": len(self.move_history) + 1,
            "player": self.current_turn,
            "column": col,
            "row": row,
        }
        self.move_history.append(move_info)

        # Check win condition
        if self.board.winning_move(self.current_turn):
            self.winner = self.current_turn
            self.winning_coords = self.board.get_winning_coordinates(self.current_turn)
            self.is_over = True
            return {
                "success": True,
                "move": move_info,
                "status": "win",
                "winner": self.winner,
                "winning_coords": self.winning_coords,
            }

        # Check draw condition
        if self.board.is_full():
            self.winner = None
            self.is_over = True
            return {
                "success": True,
                "move": move_info,
                "status": "draw",
                "winner": None,
                "winning_coords": None,
            }

        # Switch turn
        self.current_turn = AI if self.current_turn == PLAYER else PLAYER
        return {
            "success": True,
            "move": move_info,
            "status": "in_progress",
            "next_turn": self.current_turn,
        }

    def undo_move(self) -> Optional[Dict[str, Any]]:
        """Undo last single move."""
        if not self.move_history:
            return None

        last_move = self.move_history.pop()
        r = last_move["row"]
        c = last_move["column"]
        self.board.grid[r][c] = EMPTY
        self.current_turn = last_move["player"]
        self.winner = None
        self.winning_coords = None
        self.is_over = False
        return last_move

    def get_state(self) -> Dict[str, Any]:
        return {
            "grid": self.board.to_list(),
            "current_turn": self.current_turn,
            "is_over": self.is_over,
            "winner": self.winner,
            "winning_coords": self.winning_coords,
            "history": self.move_history,
            "valid_columns": [c for c in range(COLS) if self.board.is_valid_location(c)],
        }
