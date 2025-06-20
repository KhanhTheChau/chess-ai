var board,
            game = new Chess();

        async function getBestMoveFromServer(fen) {
            const response = await fetch('http://localhost:5000/best-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fen: fen })
            });
            const data = await response.json();
            return data.best_move;
        }

        async function makeBestMove() {
            const bestMove = await getBestMoveFromServer(game.fen());
            game.move({
                from: bestMove.substring(0, 2),
                to: bestMove.substring(2, 4),
                promotion: 'q'
            });

            board.position(game.fen());
            renderMoveHistory(game.history());
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
            window.setTimeout(makeBestMove, 250);
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