"""
Unit tests for Minimax algorithm implementation.
"""
import unittest
from python.board import Board, ROWS, COLS, EMPTY, PLAYER, AI
from python.minimax import minimax_search
from python.ai_engine import AIEngine


class TestMinimax(unittest.TestCase):
    def test_immediate_winning_move_ai(self):
        """AI has 3 in a row at bottom (cols 0, 1, 2) and should pick col 3 for the win."""
        board = Board()
        board.drop_piece(5, 0, AI)
        board.drop_piece(5, 1, AI)
        board.drop_piece(5, 2, AI)

        stats = {"nodes_visited": 0, "pruned_nodes": 0}
        best_col, score, _ = minimax_search(board, depth=2, maximizing_player=True, stats=stats)
        self.assertEqual(best_col, 3)
        self.assertGreater(score, 100000)

    def test_block_opponent_winning_move(self):
        """Human has 3 in a row at bottom (cols 0, 1, 2). AI must block at col 3."""
        board = Board()
        board.drop_piece(5, 0, PLAYER)
        board.drop_piece(5, 1, PLAYER)
        board.drop_piece(5, 2, PLAYER)

        stats = {"nodes_visited": 0, "pruned_nodes": 0}
        best_col, _, _ = minimax_search(board, depth=3, maximizing_player=True, stats=stats)
        self.assertEqual(best_col, 3)

    def test_depth_1_search(self):
        """At depth 1, search visits only immediate valid children."""
        board = Board()
        stats = {"nodes_visited": 0, "pruned_nodes": 0}
        best_col, score, _ = minimax_search(board, depth=1, maximizing_player=True, stats=stats)
        self.assertIn(best_col, range(COLS))
        # Root (1) + 7 children = 8 nodes
        self.assertEqual(stats["nodes_visited"], 8)

    def test_ai_engine_minimax_wrapper(self):
        board = Board()
        res = AIEngine.get_best_move(board.to_list(), algorithm="minimax", depth=2, player=AI)
        self.assertTrue(res["success"])
        self.assertEqual(res["algorithm_name"], "Minimax")
        self.assertIn(res["selected_column"], range(COLS))
        self.assertGreater(res["nodes_visited"], 1)


if __name__ == "__main__":
    unittest.main()
