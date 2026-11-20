"""
Unit tests for Alpha-Beta Pruning algorithm and comparison with Minimax.
"""
import unittest
from python.board import Board, ROWS, COLS, EMPTY, PLAYER, AI
from python.minimax import minimax_search
from python.alpha_beta import alpha_beta_search
from python.ai_engine import AIEngine


class TestAlphaBeta(unittest.TestCase):
    def test_immediate_winning_move_alpha_beta(self):
        """Alpha-Beta finds the immediate win in column 3."""
        board = Board()
        board.drop_piece(5, 0, AI)
        board.drop_piece(5, 1, AI)
        board.drop_piece(5, 2, AI)

        stats = {"nodes_visited": 0, "pruned_nodes": 0, "prune_events": 0}
        best_col, score, _ = alpha_beta_search(board, depth=2, maximizing_player=True, stats=stats)
        self.assertEqual(best_col, 3)
        self.assertGreater(score, 100000)

    def test_pruning_reduces_visited_nodes(self):
        """Alpha-Beta visits significantly fewer nodes than Minimax on the same board and depth."""
        board = Board()
        # Create an active game state with a few moves played
        board.drop_piece(5, 3, PLAYER)
        board.drop_piece(4, 3, AI)
        board.drop_piece(5, 2, PLAYER)
        board.drop_piece(5, 4, AI)

        depth = 3
        stats_mm = {"nodes_visited": 0, "pruned_nodes": 0}
        best_mm, score_mm, _ = minimax_search(board.copy(), depth=depth, maximizing_player=True, stats=stats_mm)

        stats_ab = {"nodes_visited": 0, "pruned_nodes": 0, "prune_events": 0}
        best_ab, score_ab, _ = alpha_beta_search(board.copy(), depth=depth, maximizing_player=True, stats=stats_ab)

        # Both must produce the EXACT same optimal decision and evaluation
        self.assertEqual(best_mm, best_ab)
        self.assertEqual(score_mm, score_ab)

        # Alpha-Beta must visit fewer nodes
        self.assertLess(stats_ab["nodes_visited"], stats_mm["nodes_visited"])
        self.assertGreater(stats_ab["pruned_nodes"], 0)

    def test_ai_engine_benchmark(self):
        """Benchmark comparison correctly reports equivalence and savings."""
        board = Board()
        board.drop_piece(5, 3, PLAYER)
        board.drop_piece(4, 3, AI)

        bench = AIEngine.run_benchmark(board.to_list(), depth=3)
        self.assertTrue(bench["comparison"]["equivalent_decision"])
        self.assertTrue(bench["comparison"]["equivalent_score"])
        self.assertGreater(bench["comparison"]["nodes_saved"], 0)
        self.assertGreater(bench["comparison"]["reduction_percentage"], 0)

    def test_search_trace_generation(self):
        """Generates valid tree trace for AI Lab visualization."""
        board = Board()
        board.drop_piece(5, 3, PLAYER)

        trace_res = AIEngine.get_tree_trace(board.to_list(), algorithm="alpha_beta", depth=2)
        self.assertTrue(trace_res["success"])
        self.assertIn("search_trace", trace_res)
        root_trace = trace_res["search_trace"]
        self.assertIn("id", root_trace)
        self.assertIn("children", root_trace)
        self.assertGreater(len(root_trace["children"]), 0)


if __name__ == "__main__":
    unittest.main()
