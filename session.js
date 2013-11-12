var Session = {
    socket: null,
    room: 'tictactoe',
    has2Players: false,
    isStarted: false
};

Session.sendMessage = function(message) {
    Session.socket.emit('message', message);
};

Session.init = function(onPeerConnectionReady) {
    Session.socket = io.connect();
    window.onbeforeunload = function(e) { Session.sendMessage('bye'); };

    var maybeStart = function() {
        if (Session.isStarted || !Session.has2Players)
            return;
        Session.isStarted = true;
        RTC.createPeerConnection(Session.sendMessage, onPeerConnectionReady);
    };

    Session.socket.emit('create or join', Session.room);

    Session.socket.on('created', function(room) {
        console.log('Created room ' + room);
        RTC.isInitiator = true;
    });

    Session.socket.on('full', function(room) {
        console.log('Room ' + room + ' is full');
    });

    Session.socket.on('join', function(room) {
        console.log('Another peer made a request to join room ' + room);
        console.log('This peer is the initiator of room ' + room + '!');
        Session.has2Players = true;
        maybeStart();
    });

    Session.socket.on('joined', function(room) {
        console.log('This peer has joined room ' + room);
        Session.has2Players = true;
    });

    Session.socket.on('log', function(array) {
        console.log.apply(console, array);
    });

    Session.socket.on('message', function (message) {
        if (message.type === 'offer') {
            if (!Session.isStarted && !RTC.isInitiator)
                maybeStart();
            RTC.setOffer(message);
        } else if (Session.isStarted) {
            if (message.type === 'candidate') {
                RTC.addCandidateMessage(message.label, message.candidate);
            } else if (message.type === 'answer') {
                RTC.setAnswer(message);
            } else if (message === 'bye') {
                console.log('Session terminated.');
                Session.isStarted = false;
                RTC.closePeerConnection();
            }
        }
    });
};
