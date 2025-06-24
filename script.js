function onScriptLoaded(gameInstance, boardInstance) {
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
        const bestMove = await getBestMoveFromServer(gameInstance.fen());
        gameInstance.move({
            from: bestMove.substring(0, 2),
            to: bestMove.substring(2, 4),
            promotion: 'q'
        });

        boardInstance.position(gameInstance.fen());
        renderMoveHistory(gameInstance.history());
        if (gameInstance.game_over()) {
            alert("Game Over");
        }
    }

    function renderMoveHistory(moves) {
        const historyElement = document.getElementById('move-history');
        historyElement.innerHTML = '';
        for (let i = 0; i < moves.length; i += 2) {
            const moveStr = moves[i] + (moves[i + 1] ? " " + moves[i + 1] : "");
            historyElement.innerHTML += (Math.floor(i / 2) + 1) + '. ' + moveStr + '<br>';
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
        setTimeout(makeBestMove, 250);
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
