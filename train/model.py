import random
import numpy as np
import chess
import chess.engine
import chess.pgn
from collections import deque
import torch
import torch.nn as nn
import torch.optim as optim


# --- Deep Q-Network ---
class DQN(nn.Module):
    def __init__(self, input_size, output_size):
        super(DQN, self).__init__()
        self.fc1 = nn.Linear(input_size, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, output_size)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)


# --- DQN Agent ---
class ChessDQNAgent:
    def __init__(self):
        self.board = chess.Board()
        self.memory = deque(maxlen=10000)
        self.gamma = 0.99
        self.epsilon = 1.0
        self.epsilon_min = 0.05
        self.epsilon_decay = 0.995
        self.learning_rate = 0.001

        self.model = DQN(773, 4672)  # 773: board input, 4672: legal move space
        self.optimizer = optim.Adam(self.model.parameters(), lr=self.learning_rate)
        self.criterion = nn.MSELoss()

    def board_to_tensor(self, board):
        return torch.tensor(self.encode_board(board), dtype=torch.float).unsqueeze(0)

    def encode_board(self, board):
        # Simple one-hot encoding of 64 squares * 12 piece types + side to move
        encode = np.zeros(773)
        piece_map = board.piece_map()
        offset = 0
        for sq in range(64):
            piece = piece_map.get(sq)
            if piece:
                idx = sq * 12 + self.piece_index(piece)
                encode[idx] = 1
        encode[-1] = int(board.turn)
        return encode

    def piece_index(self, piece):
        types = {'P': 0, 'N': 1, 'B': 2, 'R': 3, 'Q': 4, 'K': 5}
        base = types[piece.symbol().upper()]
        return base + (0 if piece.color == chess.WHITE else 6)

    def select_action(self, board):
        legal_moves = list(board.legal_moves)
        if np.random.rand() < self.epsilon:
            return random.choice(legal_moves)

        state_tensor = self.board_to_tensor(board)
        with torch.no_grad():
            q_values = self.model(state_tensor).squeeze()
        best_move = max(legal_moves, key=lambda move: q_values[self.move_to_index(move)].item())
        return best_move

    def move_to_index(self, move):
        # Naive mapping: 64*64 = 4096 possible moves + promotion types
        from_sq = move.from_square
        to_sq = move.to_square
        promotion_offset = 0
        if move.promotion:
            promotion_offset = {'n': 1, 'b': 2, 'r': 3, 'q': 4}.get(chess.piece_symbol(move.promotion).lower(), 0)
        return from_sq * 64 + to_sq + promotion_offset

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def train(self, batch_size=64):
        if len(self.memory) < batch_size:
            return

        minibatch = random.sample(self.memory, batch_size)

        for state, action, reward, next_state, done in minibatch:
            state_tensor = torch.tensor(state, dtype=torch.float).unsqueeze(0)
            next_tensor = torch.tensor(next_state, dtype=torch.float).unsqueeze(0)

            target = reward
            if not done:
                target += self.gamma * torch.max(self.model(next_tensor)).item()

            output = self.model(state_tensor)
            target_f = output.clone()
            target_f[0][action] = target

            self.optimizer.zero_grad()
            loss = self.criterion(output, target_f.detach())
            loss.backward()
            self.optimizer.step()

        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay


# --- Example training loop ---
def train_agent(episodes=100):
    agent = ChessDQNAgent()

    for e in range(episodes):
        board = chess.Board()
        while not board.is_game_over():
            state = agent.encode_board(board)
            move = agent.select_action(board)
            board.push(move)

            reward = 0
            if board.is_checkmate():
                reward = 1
            elif board.is_stalemate() or board.is_insufficient_material():
                reward = 0.5

            next_state = agent.encode_board(board)
            done = board.is_game_over()
            action_idx = agent.move_to_index(move)

            agent.remember(state, action_idx, reward, next_state, done)
            agent.train()

        print(f"Episode {e+1}/{episodes} finished, Epsilon: {agent.epsilon:.2f}")

    torch.save(agent.model.state_dict(), "chess_dqn_model.pt")


if __name__ == '__main__':
    train_agent(episodes=10)