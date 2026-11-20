"""
Unit tests for Connect Four game logic and board state.
"""
import unittest
from python.board import Board, ROWS, COLS, EMPTY, PLAYER, AI
from python.game_logic import ConnectFourGame


class TestConnectFourGame(unittest.TestCase):
    def setUp(self):
        self.game = ConnectFourGame()

    def test_initial_board_empty(self):
        for r in range(ROWS):
            for c in range(COLS):
                self.assertEqual(self.game.board.grid[r][c], EMPTY)
        self.assertEqual(self.game.current_turn, PLAYER)
        self.assertFalse(self.game.is_over)

    def test_piece_drop_gravity(self):
        # Dropping a piece in column 3 should land in bottom row (row 5)
        res = self.game.make_move(3)
        self.assertTrue(res["success"])
        self.assertEqual(self.game.board.grid[ROWS - 1][3], PLAYER)
        self.assertEqual(res["move"]["row"], ROWS - 1)

        # Next piece in column 3 should land at row 4
        res2 = self.game.make_move(3)
        self.assertTrue(res2["success"])
        self.assertEqual(self.game.board.grid[ROWS - 2][3], AI)
        self.assertEqual(res2["move"]["row"], ROWS - 2)

    def test_horizontal_win(self):
        # Red wins horizontally along bottom row: cols 0, 1, 2, 3
        moves = [(0, PLAYER), (0, AI), (1, PLAYER), (1, AI), (2, PLAYER), (2, AI), (3, PLAYER)]
        for col, expected_player in moves:
            self.assertEqual(self.game.current_turn, expected_player)
            res = self.game.make_move(col)

        self.assertTrue(self.game.is_over)
        self.assertEqual(self.game.winner, PLAYER)
        coords = self.game.winning_coords
        self.assertIsNotNone(coords)
        self.assertEqual(len(coords), 4)
        for i in range(4):
            self.assertIn((ROWS - 1, i), coords)

    def test_vertical_win(self):
        # AI wins vertically on col 2
        moves = [(0, PLAYER), (2, AI), (1, PLAYER), (2, AI), (0, PLAYER), (2, AI), (1, PLAYER), (2, AI)]
        for col, _ in moves:
            self.game.make_move(col)

        self.assertTrue(self.game.is_over)
        self.assertEqual(self.game.winner, AI)
        coords = self.game.winning_coords
        self.assertIsNotNone(coords)
        self.assertEqual(len(coords), 4)

    def test_diagonal_positive_win(self):
        # Positive diagonal (/) win
        board = Board()
        # Row 5 col 0 (P)
        # Row 4 col 1 (P)
        # Row 3 col 2 (P)
        # Row 2 col 3 (P)
        board.grid[5][0] = PLAYER
        board.grid[4][1] = PLAYER
        board.grid[3][2] = PLAYER
        board.grid[2][3] = PLAYER

        self.assertTrue(board.winning_move(PLAYER))
        self.assertFalse(board.winning_move(AI))
        coords = board.get_winning_coordinates(PLAYER)
        self.assertEqual(set(coords), {(5, 0), (4, 1), (3, 2), (2, 3)})

    def test_diagonal_negative_win(self):
        # Negative diagonal (\) win
        board = Board()
        board.grid[2][0] = AI
        board.grid[3][1] = AI
        board.grid[4][2] = AI
        board.grid[5][3] = AI

        self.assertTrue(board.winning_move(AI))
        self.assertFalse(board.winning_move(PLAYER))
        coords = board.get_winning_coordinates(AI)
        self.assertEqual(set(coords), {(2, 0), (3, 1), (4, 2), (5, 3)})

    def test_full_column_rejection(self):
        # Fill column 0 with 6 pieces
        for _ in range(ROWS):
            self.game.board.drop_piece(self.game.board.get_next_open_row(0), 0, PLAYER)
        self.assertFalse(self.game.board.is_valid_location(0))
        res = self.game.make_move(0)
        self.assertFalse(res["success"])

    def test_undo_move(self):
        self.game.make_move(3)
        self.game.make_move(4)
        self.assertEqual(len(self.game.move_history), 2)

        undone = self.game.undo_move()
        self.assertEqual(undone["column"], 4)
        self.assertEqual(self.game.current_turn, AI)
        self.assertEqual(self.game.board.grid[ROWS - 1][4], EMPTY)


if __name__ == "__main__":
    unittest.main()
