# Smart Chess AI 

Đây là một hệ thống cờ vua thông minh kết hợp nhiều giải thuật AI:

* Minimax + Alpha-Beta Pruning: thuật toán tìm nước đi tốt nhất theo cây trạng thái.
* Heuristic Evaluation: đánh giá bàn cờ theo trọng số vị trí quân.
* Deep Q-Network (DQN): học sâu dùng reinforcement learning để huấn luyện AI tự chơi.



## Giới thiệu

* Giao diện web sử dụng thư viện `chess.js` và `chessboard.js`.
* Có thể chuyển đổi giữa Minimax, DQN hoặc Heuristic để chọn nước đi.
* Flask backend dùng mô hình DQN đã huấn luyện để tính nước đi.


## Các giải thuật AI

### 1. Minimax + Alpha-Beta Pruning

* Duyệt theo cây nước đi ở độ sâu cho trước.
* Cắt tỉa những nhánh không tối ưu.
* Dùng hàm đánh giá heuristic để chấm điểm bàn cờ.

### 2. Heuristic Evaluation

* Đánh giá bàn cờ dựa vào:

  * Giá trị quân cờ (Vd: quân Hậu = 90, Xe = 50,...)
  * Vị trí của quân cờ trên bàn (theo bảng trọng số)

### 3. DQN (Deep Q-Network)

* Mô hình học sâu chọn nước đi dựa trên FEN (mã hóa trạng thái bàn cờ).
* Được huấn luyện trước với tự chơi (self-play).



## Hướng dẫn chạy dự án

### 1. Cài đặt Python backend

```bash
pip install -r requirements.txt
```

### 2. Chuẩn bị model

Huấn luyện trước với mã DQN hoặc tải sẵn file `chess_dqn_model.pt`. Bạn cần có:

* `model.py`: chứa kiến trúc class `DQN`
* `chess_dqn_model.pt`: mô hình đã huấn luyện

### 3. Chạy server Flask

```bash
python app.py
```

Server sẽ chạy tại: `http://127.0.0.1:5000`

### 4. Mở file HTML giao diện

Mở `index.html` trong trình duyệt (hoặc `script.js` đã tích hợp sẵn).

> Web sẽ gửi FEN qua API và nhận lại nước đi tốt nhất từ AI.

### 5. Chọn thuật toán

Trong web hoặc cấu hình JavaScript, chọn thuật toán muốn dùng: `minimax`, `dqn`, `heuristic`.

