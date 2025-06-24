function onScriptLoaded(gameInstance, boardInstance) {
    let positionCount = 0;

    const minimaxRoot = function (depth, game, isMaximisingPlayer) {
        const newGameMoves = game.ugly_moves();
        let bestMove = -9999;
        let bestMoveFound;

        for (let i = 0; i < newGameMoves.length; i++) {
            const newGameMove = newGameMoves[i];
            game.ugly_move(newGameMove);
            const value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
            game.undo();
            if (value >= bestMove) {
                bestMove = value;
                bestMoveFound = newGameMove;
            }
        }
        return bestMoveFound;
    };

    const minimax = function (depth, game, alpha, beta, isMaximisingPlayer) {
        positionCount++;
        if (depth === 0) return -evaluateBoard(game.board());

        const newGameMoves = game.ugly_moves();

        if (isMaximisingPlayer) {
            let bestMove = -9999;
            for (let i = 0; i < newGameMoves.length; i++) {
                game.ugly_move(newGameMoves[i]);
                bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, false));
                game.undo();
                alpha = Math.max(alpha, bestMove);
                if (beta <= alpha) return bestMove;
            }
            return bestMove;
        } else {
            let bestMove = 9999;
            for (let i = 0; i < newGameMoves.length; i++) {
                game.ugly_move(newGameMoves[i]);
                bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, true));
                game.undo();
                beta = Math.min(beta, bestMove);
                if (beta <= alpha) return bestMove;
            }
            return bestMove;
        }
    };

    const evaluateBoard = function (board) {
        let totalEvaluation = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                totalEvaluation += getPieceValue(board[i][j], i, j);
            }
        }
        return totalEvaluation;
    };

    const getPieceValue = function (piece, x, y) {
        if (piece === null) return 0;

        const getAbsoluteValue = function (piece, isWhite, x, y) {
            if (piece.type === 'p') return 10 + (isWhite ? pawnEvalWhite[y][x] : pawnEvalBlack[y][x]);
            if (piece.type === 'r') return 50 + (isWhite ? rookEvalWhite[y][x] : rookEvalBlack[y][x]);
            if (piece.type === 'n') return 30 + knightEval[y][x];
            if (piece.type === 'b') return 30 + (isWhite ? bishopEvalWhite[y][x] : bishopEvalBlack[y][x]);
            if (piece.type === 'q') return 90 + evalQueen[y][x];
            if (piece.type === 'k') return 900 + (isWhite ? kingEvalWhite[y][x] : kingEvalBlack[y][x]);
            throw 'Unknown piece type: ' + piece.type;
        };

        const absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
        return piece.color === 'w' ? absoluteValue : -absoluteValue;
    };

    const makeBestMove = function () {
        const bestMove = getBestMove(gameInstance);
        gameInstance.ugly_move(bestMove);
        boardInstance.position(gameInstance.fen());
        renderMoveHistory(gameInstance.history());

        if (gameInstance.game_over()) {
            alert('Game over');
        }
    };

    const getBestMove = function (game) {
        if (game.game_over()) {
            alert('Game over');
        }

        positionCount = 0;
        const depth = parseInt($('#search-depth').find(':selected').text());

        const start = new Date().getTime();
        const bestMove = minimaxRoot(depth, game, true);
        const end = new Date().getTime();

        const moveTime = (end - start);
        const positionsPerS = (positionCount * 1000 / moveTime).toFixed(2);

        $('#position-count').text(positionCount);
        $('#time').text((moveTime / 1000).toFixed(2) + 's');
        $('#positions-per-s').text(positionsPerS);

        return bestMove;
    };

    const renderMoveHistory = function (moves) {
        const historyElement = $('#move-history');
        historyElement.empty();
        for (let i = 0; i < moves.length; i += 2) {
            const moveStr = `<span>${moves[i]} ${moves[i + 1] || ''}</span><br>`;
            historyElement.append(moveStr);
        }
        historyElement.scrollTop(historyElement[0].scrollHeight);
    };

    const onDragStart = function (source, piece) {
        if (gameInstance.in_checkmate() || gameInstance.in_draw() || piece.startsWith('b')) {
            return false;
        }
    };

    const onDrop = function (source, target) {
        const move = gameInstance.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        removeGreySquares();
        if (move === null) return 'snapback';

        renderMoveHistory(gameInstance.history());
        window.setTimeout(makeBestMove, 250);
    };

    const onSnapEnd = function () {
        boardInstance.position(gameInstance.fen());
    };

    const onMouseoverSquare = function (square) {
        const moves = gameInstance.moves({ square, verbose: true });
        if (moves.length === 0) return;

        greySquare(square);
        for (const move of moves) {
            greySquare(move.to);
        }
    };

    const onMouseoutSquare = function () {
        removeGreySquares();
    };

    const greySquare = function (square) {
        const squareEl = $('#board .square-' + square);
        const background = squareEl.hasClass('black-3c85d') ? '#696969' : '#a9a9a9';
        squareEl.css('background', background);
    };

    const removeGreySquares = function () {
        $('#board .square-55d63').css('background', '');
    };

    // Evaluation tables
    const reverseArray = arr => arr.slice().reverse();

    const pawnEvalWhite = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [5, 5, 5, 5, 5, 5, 5, 5],
        [1, 1, 2, 3, 3, 2, 1, 1],
        [0.5, 0.5, 1, 2.5, 2.5, 1, 0.5, 0.5],
        [0, 0, 0, 2, 2, 0, 0, 0],
        [0.5, -0.5, -1, 0, 0, -1, -0.5, 0.5],
        [0.5, 1, 1, -2, -2, 1, 1, 0.5],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const pawnEvalBlack = reverseArray(pawnEvalWhite);

    const knightEval = [
        [-5, -4, -3, -3, -3, -3, -4, -5],
        [-4, -2, 0, 0, 0, 0, -2, -4],
        [-3, 0, 1, 1.5, 1.5, 1, 0, -3],
        [-3, 0.5, 1.5, 2, 2, 1.5, 0.5, -3],
        [-3, 0, 1.5, 2, 2, 1.5, 0, -3],
        [-3, 0.5, 1, 1.5, 1.5, 1, 0.5, -3],
        [-4, -2, 0, 0.5, 0.5, 0, -2, -4],
        [-5, -4, -3, -3, -3, -3, -4, -5]
    ];

    const bishopEvalWhite = [
        [-2, -1, -1, -1, -1, -1, -1, -2],
        [-1, 0, 0, 0, 0, 0, 0, -1],
        [-1, 0, 0.5, 1, 1, 0.5, 0, -1],
        [-1, 0.5, 0.5, 1, 1, 0.5, 0.5, -1],
        [-1, 0, 1, 1, 1, 1, 0, -1],
        [-1, 1, 1, 1, 1, 1, 1, -1],
        [-1, 0.5, 0, 0, 0, 0, 0.5, -1],
        [-2, -1, -1, -1, -1, -1, -1, -2]
    ];

    const bishopEvalBlack = reverseArray(bishopEvalWhite);
    const rookEvalWhite = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0.5, 1, 1, 1, 1, 1, 1, 0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
        [0, 0, 0, 0.5, 0.5, 0, 0, 0]
    ];

    const rookEvalBlack = reverseArray(rookEvalWhite);
    const evalQueen = [
        [-2, -1, -1, -0.5, -0.5, -1, -1, -2],
        [-1, 0, 0, 0, 0, 0, 0, -1],
        [-1, 0, 0.5, 0.5, 0.5, 0.5, 0, -1],
        [-0.5, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
        [0, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
        [-1, 0.5, 0.5, 0.5, 0.5, 0.5, 0, -1],
        [-1, 0, 0.5, 0, 0, 0, 0, -1],
        [-2, -1, -1, -0.5, -0.5, -1, -1, -2]
    ];

    const kingEvalWhite = [
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-2, -3, -3, -4, -4, -3, -3, -2],
        [-1, -2, -2, -2, -2, -2, -2, -1],
        [2, 2, 0, 0, 0, 0, 2, 2],
        [2, 3, 1, 0, 0, 1, 3, 2]
    ];

    const kingEvalBlack = reverseArray(kingEvalWhite);

    // Gán lại board với config
    boardInstance = ChessBoard('board', {
        draggable: true,
        position: 'start',
        onDragStart,
        onDrop,
        onSnapEnd,
        onMouseoverSquare,
        onMouseoutSquare
    });
}
