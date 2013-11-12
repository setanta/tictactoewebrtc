var TicTacToe = function(boardCanvas, messageCanvas, statusCanvas) {
    this.enabled = false;
    this.canvas = boardCanvas;
    this.cellSize = this.canvas.width / 3;

    this.messageCanvas = messageCanvas;
    this.statusCanvas = statusCanvas;

    this.onclick = null; // function(column, line)
    this.onconnecting = null; // function()
    this.onfinish = null; // function(winner)

    this.drawInitialBoard();
    this.drawStatus(TicTacToe.NO_PLAYER);

    this.changeState(TicTacToe.STATE_NOT_CONNECTED);

    var clicked = function(tictactoe, event) {
        if (!tictactoe.enabled || tictactoe.player !== tictactoe.turn)
            return;
        var boardPos = tictactoe.canvasPositionFromEvent(event);
        var cellPos = tictactoe.getCellLocation(boardPos[0], boardPos[1]);
        if (tictactoe.board[cellPos[1]][cellPos[0]] !== TicTacToe.NO_PLAYER)
            return;
        if (tictactoe.onclick)
            tictactoe.onclick(cellPos[0], cellPos[1]);
    };
    this.canvas.onclick = function(tictactoe) { return function(event) { clicked.call(this, tictactoe, event); }; }(this);

    var msgClicked = function(tictactoe, event) {
        if (tictactoe.state === TicTacToe.STATE_NOT_CONNECTED) {
            tictactoe.onconnecting();
        } else if (tictactoe.state === TicTacToe.STATE_END_GAME) {
            tictactoe.onfinish();
        }
    };
    this.messageCanvas.onclick = function(tictactoe) { return function(event) { msgClicked.call(this, tictactoe, event); }; }(this);
};

TicTacToe.NO_PLAYER = 0;
TicTacToe.PLAYER_1 = 1;
TicTacToe.PLAYER_2 = 2;

TicTacToe.STATE_NOT_CONNECTED = 0;
TicTacToe.STATE_CONNECTING = 1;
TicTacToe.STATE_PLAYING = 2;
TicTacToe.STATE_END_GAME = 3;

TicTacToe.prototype.start = function(player) {
    this.board = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    this.turn = TicTacToe.PLAYER_1;
    this.player = player ? player : this.turn;
    this.winner = TicTacToe.NO_PLAYER;
    this.enabled = true;

    this.changeState(TicTacToe.STATE_PLAYING);
    this.drawInitialBoard();
    this.drawStatus(this.turn);
};

TicTacToe.prototype.changeCurrentPlayer = function() {
    this.turn = (this.turn === TicTacToe.PLAYER_1) ? TicTacToe.PLAYER_2 : TicTacToe.PLAYER_1;
    this.drawStatus(this.turn);
};

TicTacToe.prototype.move = function(column, line) {
    this.board[line][column] = this.turn;

    var context = this.canvas.getContext('2d');
    var pos = this.calculateCellPosition(column, line);

    if (this.turn === TicTacToe.PLAYER_1)
        this.drawX(context, pos[0], pos[1], this.cellSize);
    else if (this.turn === TicTacToe.PLAYER_2)
        this.drawCircle(context, pos[0], pos[1], this.cellSize);
    else
        context.clearRect(pos[0], pos[1], this.cellSize, this.cellSize);

    var winner = TicTacToe.NO_PLAYER;
    for (var l = 0; l < 3; ++l) {
        if (this.board[l][0] === this.board[l][1] && this.board[l][1] === this.board[l][2]) {
            winner = this.board[l][0];
            break;
        }
    }
    if (winner === TicTacToe.NO_PLAYER) {
        for (var c = 0; c < 3; ++c) {
            if (this.board[0][c] === this.board[1][c] && this.board[1][c] === this.board[2][c]) {
                winner = this.board[0][c];
                break;
            }
        }
    }
    if (winner === TicTacToe.NO_PLAYER
        && ((this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2])
            || (this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]))) {
        winner = this.board[1][1];
    }

    var finished = true;
    if (winner === TicTacToe.NO_PLAYER) {
        for (var l = 0; l < 3; ++l) {
            for (var c = 0; c < 3; ++c) {
                if (this.board[l][c] === TicTacToe.NO_PLAYER) {
                    finished = false;
                    break;
                }
            }
            if (!finished)
                break;
        }
    }

    this.changeCurrentPlayer();
    if (finished) {
        this.winner = winner;
        Game.board.changeState(TicTacToe.STATE_END_GAME);
    }
};

TicTacToe.prototype.drawInitialBoard = function() {
    var context = this.canvas.getContext('2d');

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.beginPath();
    context.strokeStyle ='#999999';
    context.lineWidth = 4;

    // Horizontal lines
    var y = this.canvas.height * 0.33;
    context.moveTo(0, y);
    context.lineTo(this.canvas.width, y);
    y = this.canvas.height * 0.66;
    context.moveTo(0, y);
    context.lineTo(this.canvas.width, y);

    // Vertical lines
    var x = this.canvas.width * 0.33;
    context.moveTo(x, 0);
    context.lineTo(x, this.canvas.height);
    x = this.canvas.width * 0.66;
    context.moveTo(x, 0);
    context.lineTo(x, this.canvas.height);

    context.closePath();
    context.stroke();
};

TicTacToe.prototype.changeState = function(state) {
    this.state = state;

    var text;
    switch (state) {
        case TicTacToe.STATE_PLAYING:
            this.messageCanvas.style.visibility = 'hidden';
            return;
        case TicTacToe.STATE_NOT_CONNECTED:
            this.messageCanvas.style.visibility = 'visible';
            text = 'Connect';
            break;
        case TicTacToe.STATE_CONNECTING:
            this.messageCanvas.style.visibility = 'visible';
            text = 'Connecting';
            break;
        case TicTacToe.STATE_END_GAME:
            this.messageCanvas.style.visibility = 'visible';
            if (this.winner === TicTacToe.PLAYER_1)
                text = 'Player 1 won!';
            else if (this.winner === TicTacToe.PLAYER_2)
                text = 'Player 2 won!';
            else
                text = 'Tie! :(';
            break;
        default:
            text = 'ERROR!';
    }

    var context = this.messageCanvas.getContext('2d');

    context.clearRect(0, 0, this.messageCanvas.width, this.messageCanvas.height);

    context.beginPath();
    var centerX = this.messageCanvas.width / 2;
    var centerY = this.messageCanvas.height / 2;
    var width = this.messageCanvas.width * 0.8;
    var height = this.messageCanvas.height * 0.4;
    context.rect(centerX - width / 2, centerY - height / 2, width, height);

    context.fillStyle = 'rgba(0, 200, 0, 0.2)';
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = 'rgb(0, 200, 0)';
    context.stroke();

    context.fillStyle = 'rgb(0, 200, 0)';

    context.font = 'bold 40px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    context.closePath();
    context.stroke();
};

TicTacToe.prototype.getCellLocation = function(x, y) {
    var column;
    var line;
    if (x < this.canvas.width * 0.33)
        column = 0;
    else if (x < this.canvas.width * 0.66)
        column = 1;
    else
        column = 2;
    if (y < this.canvas.height * 0.33)
        line = 0;
    else if (y < this.canvas.height * 0.66)
        line = 1;
    else
        line = 2;
    return [column, line];
};

TicTacToe.prototype.drawStatus = function(player) {
    var context = this.statusCanvas.getContext('2d');
    context.clearRect(0, 0, this.statusCanvas.width, this.statusCanvas.height);
    if (player === TicTacToe.PLAYER_1)
        this.drawX(context, 0, 0, this.statusCanvas.width);
    else if (player === TicTacToe.PLAYER_2)
        this.drawCircle(context, 0, 0, this.statusCanvas.width);
};

TicTacToe.prototype.canvasPositionFromEvent = function(event) {
    var rect = this.canvas.getBoundingClientRect();
    var x = event.x - rect.left;
    var y = event.y - rect.top;
    return [x, y];
};

TicTacToe.prototype.calculateCellPosition = function(column, line) {
    var x = this.canvas.width * (0.33 * column);
    var y = this.canvas.height * (0.33 * line);
    return [x, y];
};

TicTacToe.prototype.drawCircle = function(context, x, y, size) {
    context.beginPath();
    context.strokeStyle ='#ff0000';
    context.lineWidth = size / 16;
    context.arc(x + size / 2, y + size / 2, size / 2.8, 0, Math.PI * 2, false);
    context.closePath();
    context.stroke();
};

TicTacToe.prototype.drawX = function(context, x, y, size) {
    context.beginPath();
    context.strokeStyle ='#0000ff';
    context.lineWidth = size / 16;
    var padding = size / 8;
    context.moveTo(x + padding, y + padding);
    context.lineTo(x + size - padding, y + size - padding);
    context.moveTo(x + padding, y + size - padding);
    context.lineTo(x + size - padding, y + padding);
    context.closePath();
    context.stroke();
};
