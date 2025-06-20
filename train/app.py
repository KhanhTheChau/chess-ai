from flask import Flask, request, jsonify
import chess
import torch
import numpy as np
from model import DQN  # Đảm bảo bạn có file model.py với class DQN
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 
# Load model đã huấn luyện
model = DQN(773, 4672)
model.load_state_dict(torch.load("chess_dqn_model.pt", map_location=torch.device('cpu')))
model.eval()


def encode_board(board):
    encode = np.zeros(773)
    piece_map = board.piece_map()
    for sq in range(64):
        piece = piece_map.get(sq)
        if piece:
            idx = sq * 12 + piece_index(piece)
            encode[idx] = 1
    encode[-1] = int(board.turn)
    return encode


def piece_index(piece):
    types = {'P': 0, 'N': 1, 'B': 2, 'R': 3, 'Q': 4, 'K': 5}
    base = types[piece.symbol().upper()]
    return base + (0 if piece.color == chess.WHITE else 6)


def move_to_index(move):
    from_sq = move.from_square
    to_sq = move.to_square
    promotion_offset = 0
    if move.promotion:
        promo = chess.piece_symbol(move.promotion).lower()
        promotion_offset = {'n': 1, 'b': 2, 'r': 3, 'q': 4}.get(promo, 0)
    return from_sq * 64 + to_sq + promotion_offset


@app.route('/best-move', methods=['POST'])
def best_move():
    data = request.get_json()
    fen = data.get('fen')

    board = chess.Board(fen)
    state = torch.tensor(encode_board(board), dtype=torch.float).unsqueeze(0)
    with torch.no_grad():
        q_values = model(state).squeeze()

    legal_moves = list(board.legal_moves)
    best = max(legal_moves, key=lambda m: q_values[move_to_index(m)].item())

    return jsonify({"best_move": best.uci()})


if __name__ == '__main__':
    app.run(debug=True)
