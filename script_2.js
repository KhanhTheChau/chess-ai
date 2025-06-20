var board,
            game = new Chess();

        function heuristicBestMove(game, isWhite) {
            var possibleMoves = game.moves({ verbose: true });
            var bestMove = null;
            var bestScore = -Infinity;

            for (var i = 0; i < possibleMoves.length; i++) {
                var move = possibleMoves[i];
                game.move(move);

                var score = evaluateBoard(game.board());
                if (!isWhite) score = -score;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }

                game.undo();
            }

            if (bestMove === null && possibleMoves.length > 0) {
                bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }

            return bestMove;
        }

        function evaluateBoard(board) {
            var total = 0;
            for (var y = 0; y < 8; y++) {
                for (var x = 0; x < 8; x++) {
                    var piece = board[y][x];
                    if (piece) total += getPieceValue(piece);
                }
            }
            return total;
        }

        function getPieceValue(piece) {
            var values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
            var val = values[piece.type] || 0;
            return piece.color === 'w' ? val : -val;
        }

        function makeHeuristicMove() {
            var bestMove = heuristicBestMove(game, game.turn() === 'w');
            if (bestMove) {
                game.move(bestMove);
                board.position(game.fen());
                renderMoveHistory(game.history());
            }
            if (game.game_over()) {
                alert("Game Over");
            }
        }

        function renderMoveHistory(moves) {
            var historyElement = document.getElementById('move-history');
            historyElement.innerHTML = '';
            for (var i = 0; i < moves.length; i += 2) {
                var moveStr = moves[i] + (moves[i + 1] ? " " + moves[i + 1] : "");
                historyElement.innerHTML += (Math.floor(i / 2) + 1) + '. ' + moveStr + '\n';
            }
            historyElement.scrollTop = historyElement.scrollHeight;
        }

        function onDragStart(source, piece, position, orientation) {
            if (game.in_checkmate() || game.in_draw() || piece.search(/^b/) !== -1) {
                return false;
            }
        }

        function onSnapEnd() {
            board.position(game.fen());
        }

        function onMouseoverSquare(square, piece) {
            var moves = game.moves({ square: square, verbose: true });
            if (moves.length === 0) return;
            greySquare(square);
            for (var i = 0; i < moves.length; i++) {
                greySquare(moves[i].to);
            }
        }

        function onMouseoutSquare(square, piece) {
            removeGreySquares();
        }

        function removeGreySquares() {
            var squares = document.querySelectorAll('#board .square-55d63');
            for (var i = 0; i < squares.length; i++) {
                squares[i].style.background = '';
            }
        }

        function greySquare(square) {
            var squareEl = document.querySelector('#board .square-' + square);
            if (!squareEl) return;
            var background = squareEl.classList.contains('black-3c85d') ? '#696969' : '#a9a9a9';
            squareEl.style.background = background;
        }

        var onDrop = function (source, target) {
            var move = game.move({
                from: source,
                to: target,
                promotion: 'q'
            });

            removeGreySquares();
            if (move === null) return 'snapback';

            renderMoveHistory(game.history());
            window.setTimeout(makeHeuristicMove, 250);
        };

        var cfg = {
            draggable: true,
            position: 'start',
            onDrop: onDrop,
            onDragStart: onDragStart,
            onSnapEnd: onSnapEnd,
            onMouseoutSquare: onMouseoutSquare,
            onMouseoverSquare: onMouseoverSquare
        };

        board = ChessBoard('board', cfg);
