"""
Connect Four Board representation and primitive operations.
Grid: 6 rows (0 is top, 5 is bottom) x 7 columns (0 to 6).
"""
from typing import List, Tuple, Optional

ROWS = 6
COLS = 7
EMPTY = 0
PLAYER = 1  # Human (Red)
AI = 2      # Computer (Yellow)

# Strategic column ordering: Center column first maximizes alpha-beta pruning
COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6]


class Board:
    def __init__(self, grid: Optional[List[List[int]]] = None):
        if grid is not None:
            self.grid = [row[:] for row in grid]
        else:
            self.grid = [[EMPTY for _ in range(COLS)] for _ in range(ROWS)]

    def copy(self) -> 'Board':
        return Board(self.grid)

    def is_valid_location(self, col: int) -> bool:
        if 0 <= col < COLS:
            return self.grid[0][col] == EMPTY
        return False

    def get_valid_locations(self) -> List[int]:
        """Returns valid columns ordered for search efficiency (center outwards)."""
        valid = []
        for col in COLUMN_ORDER:
            if self.is_valid_location(col):
                valid.append(col)
        return valid

    def get_next_open_row(self, col: int) -> Optional[int]:
        """Scans from bottom row (ROWS - 1) up to row 0 for first EMPTY cell."""
        for r in range(ROWS - 1, -1, -1):
            if self.grid[r][col] == EMPTY:
                return r
        return None

    def drop_piece(self, row: int, col: int, piece: int) -> None:
        self.grid[row][col] = piece

    def make_move(self, col: int, piece: int) -> Optional[int]:
        """Helper to drop a piece into a column. Returns the row where it landed, or None if invalid."""
        if not self.is_valid_location(col):
            return None
        row = self.get_next_open_row(col)
        if row is not None:
            self.drop_piece(row, col, piece)
            return row
        return None

    def winning_move(self, piece: int) -> bool:
        """Check whether `piece` has 4 in a row in any direction."""
        # 1. Horizontal
        for r in range(ROWS):
            for c in range(COLS - 3):
                if (self.grid[r][c] == piece and
                    self.grid[r][c + 1] == piece and
                    self.grid[r][c + 2] == piece and
                    self.grid[r][c + 3] == piece):
                    return True

        # 2. Vertical
        for c in range(COLS):
            for r in range(ROWS - 3):
                if (self.grid[r][c] == piece and
                    self.grid[r + 1][c] == piece and
                    self.grid[r + 2][c] == piece and
                    self.grid[r + 3][c] == piece):
                    return True

        # 3. Positively sloped diagonals (/)
        for r in range(3, ROWS):
            for c in range(COLS - 3):
                if (self.grid[r][c] == piece and
                    self.grid[r - 1][c + 1] == piece and
                    self.grid[r - 2][c + 2] == piece and
                    self.grid[r - 3][c + 3] == piece):
                    return True

        # 4. Negatively sloped diagonals (\)
        for r in range(ROWS - 3):
            for c in range(COLS - 3):
                if (self.grid[r][c] == piece and
                    self.grid[r + 1][c + 1] == piece and
                    self.grid[r + 2][c + 2] == piece and
                    self.grid[r + 3][c + 3] == piece):
                    return True

        return False

    def get_winning_coordinates(self, piece: int) -> Optional[List[Tuple[int, int]]]:
        """Returns list of four (row, col) coordinates forming a win, or None."""
        # 1. Horizontal
        for r in range(ROWS):
            for c in range(COLS - 3):
                if all(self.grid[r][c + i] == piece for i in range(4)):
                    return [(r, c + i) for i in range(4)]

        # 2. Vertical
        for c in range(COLS):
            for r in range(ROWS - 3):
                if all(self.grid[r + i][c] == piece for i in range(4)):
                    return [(r + i, c) for i in range(4)]

        # 3. Positively sloped diagonals (/)
        for r in range(3, ROWS):
            for c in range(COLS - 3):
                if all(self.grid[r - i][c + i] == piece for i in range(4)):
                    return [(r - i, c + i) for i in range(4)]

        # 4. Negatively sloped diagonals (\)
        for r in range(ROWS - 3):
            for c in range(COLS - 3):
                if all(self.grid[r + i][c + i] == piece for i in range(4)):
                    return [(r + i, c + i) for i in range(4)]

        return None

    def is_full(self) -> bool:
        return all(self.grid[0][c] != EMPTY for c in range(COLS))

    def is_terminal_node(self) -> bool:
        return self.winning_move(PLAYER) or self.winning_move(AI) or self.is_full()

    def to_list(self) -> List[List[int]]:
        return [row[:] for row in self.grid]

    def __str__(self) -> str:
        symbols = {EMPTY: '.', PLAYER: 'X', AI: 'O'}
        lines = [' '.join(str(c) for c in range(COLS))]
        lines.append('-' * (COLS * 2 - 1))
        for row in self.grid:
            lines.append(' '.join(symbols[cell] for cell in row))
        return '\n'.join(lines)
