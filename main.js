var Game = {
    board: null,
    dataChannel: null
};

Game.sendMove = function(col, lin) {
    Game.board.move(col, lin);
    Game.dataChannel.send(JSON.stringify({
        type: 'move',
        column: col,
        line: lin
    }));
};

Game.restart = function() {
    var player = Game.board.player === TicTacToe.PLAYER_1 ? TicTacToe.PLAYER_2 : TicTacToe.PLAYER_1;
    Game.board.start(player);
};

Game.init = function() {
    Game.board = new TicTacToe(document.getElementById('board'),
                               document.getElementById('message'),
                               document.getElementById('status'));
    Game.board.enabled = false;
    Game.board.onclick = function(column, line) {
        Game.sendMove(column, line);
    };
    Game.board.onfinish = function() {
        Game.restart();
        Game.dataChannel.send(JSON.stringify({type: 'restart'}));
    };
    Game.board.onconnecting = function() {
        Game.board.changeState(TicTacToe.STATE_CONNECTING);
        Session.init(function(channel, isInitiator) {
            Game.dataChannel = channel;
            Game.board.start(isInitiator ? TicTacToe.PLAYER_1 : TicTacToe.PLAYER_2);
            Game.dataChannel.onmessage = function(event) {
                var message = JSON.parse(event.data);
                if (message.type === 'restart')
                    Game.restart();
                else if (message.type === 'move')
                    Game.board.move(message.column, message.line);
                else
                    console.log('Unknown message from session manager.');
            };
        });
    };
};
