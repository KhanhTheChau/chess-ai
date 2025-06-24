function onScriptLoaded(gameInstance, boardInstance) {
    function heuristicBestMove(game, isWhite) {
        const possibleMoves = game.moves({ verbose: true });
        let bestMove = null;
        let bestScore = -Infinity;

        for (let move of possibleMoves) {
            game.move(move);
            let score = evaluateBoard(game.board());
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
        let total = 0;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];
                if (piece) total += getPieceValue(piece);
            }
        }
        return total;
    }

    function getPieceValue(piece) {
        const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
        const val = values[piece.type] || 0;
        return piece.color === 'w' ? val : -val;
    }

    function makeHeuristicMove() {
        const bestMove = heuristicBestMove(gameInstance, gameInstance.turn() === 'w');
        if (bestMove) {
            gameInstance.move(bestMove);
            boardInstance.position(gameInstance.fen());
            renderMoveHistory(gameInstance.history());
        }
        if (gameInstance.game_over()) {
            alert("Game Over");
        }
    }

    function renderMoveHistory(moves) {
        const historyElement = document.getElementById('move-history');
        historyElement.innerHTML = '';
        for (let i = 0; i < moves.length; i += 2) {
            const moveStr = `${i / 2 + 1}. ${moves[i]} ${moves[i + 1] || ''}`;
            historyElement.innerHTML += moveStr + '<br>';
        }
        historyElement.scrollTop = historyElement.scrollHeight;
    }

    function onDragStart(source, piece) {
        if (gameInstance.in_checkmate() || gameInstance.in_draw() || piece.search(/^b/) !== -1) {
            return false;
        }
    }

    function onSnapEnd() {
        boardInstance.position(gameInstance.fen());
    }

    function onMouseoverSquare(square) {
        const moves = gameInstance.moves({ square: square, verbose: true });
        if (moves.length === 0) return;
        greySquare(square);
        for (const move of moves) {
            greySquare(move.to);
        }
    }

    function onMouseoutSquare() {
        removeGreySquares();
    }

    function removeGreySquares() {
        const squares = document.querySelectorAll('#board .square-55d63');
        for (const square of squares) {
            square.style.background = '';
        }
    }

    function greySquare(square) {
        const squareEl = document.querySelector('#board .square-' + square);
        if (!squareEl) return;
        const background = squareEl.classList.contains('black-3c85d') ? '#696969' : '#a9a9a9';
        squareEl.style.background = background;
    }

    const onDrop = function (source, target) {
        const move = gameInstance.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        removeGreySquares();
        if (move === null) return 'snapback';

        renderMoveHistory(gameInstance.history());
        window.setTimeout(makeHeuristicMove, 250);
    };

    boardInstance = ChessBoard('board', {
        draggable: true,
        position: 'start',
        onDrop: onDrop,
        onDragStart: onDragStart,
        onSnapEnd: onSnapEnd,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare
    });
}
