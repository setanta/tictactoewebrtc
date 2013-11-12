var RTC = {
    config: {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]},
    constraints: {
        'optional': [
            {'DtlsSrtpKeyAgreement': false},
            {'RtpDataChannels': true}
        ]
    },
    sdpConstraints: {
        'mandatory': {
            'OfferToReceiveAudio': false
        }
    },
    peerConnection: null,
    channel: null,
    isInitiator: false,
    Signaling: {
        onPeerConnectionReady: null,
        send: null
    }
};

RTC.createPeerConnection = function(signalingCallback, onPeerConnectionReady) {
    RTC.Signaling.send = signalingCallback;
    RTC.onPeerConnectionReady = onPeerConnectionReady;
    try {
        RTC.peerConnection = new webkitRTCPeerConnection(RTC.config, RTC.constraints);
        RTC.peerConnection.onicecandidate = function(event) {
            if (event.candidate) {
                RTC.Signaling.send({
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                });
            }
        };
        console.log('Created RTCPeerConnnection with:\n' +
                    '  config: \'' + JSON.stringify(RTC.config) + '\';\n' +
                    '  constraints: \'' + JSON.stringify(RTC.constraints) + '\'.');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }

    if (RTC.isInitiator) {
        try {
            RTC.channel = RTC.peerConnection.createDataChannel('sendDataChannel', {reliable: false});
        } catch (e) {
            alert('Failed to create data channel. You need Chrome M25 or later with RtpDataChannel enabled');
        }
        RTC.channel.onopen = function() { RTC.onPeerConnectionReady(RTC.channel, RTC.isInitiator); };

        console.log('Sending offer to peer, with constraints: \n  \'' + JSON.stringify(RTC.constraints) + '\'.');
        RTC.peerConnection.createOffer(RTC.setLocalAndCallSignaling, null, RTC.constraints);
    } else {
        RTC.peerConnection.ondatachannel = function(event) {
            RTC.channel = event.channel;
            RTC.channel.onopen = function() { RTC.onPeerConnectionReady(RTC.channel, RTC.isInitiator); };
        }
    }
};

RTC.closePeerConnection = function() {
    RTC.isInitiator = false;
    RTC.peerConnection.close();
    RTC.peerConnection = null;
};

RTC.setOffer = function(offer) {
    RTC.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    RTC.peerConnection.createAnswer(RTC.setLocalAndCallSignaling, null, RTC.sdpConstraints);
};

RTC.setAnswer = function(answer) {
    RTC.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

RTC.setLocalAndCallSignaling = function(sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    sessionDescription.sdp = SDP.preferOpus(sessionDescription.sdp);
    RTC.peerConnection.setLocalDescription(sessionDescription);
    RTC.Signaling.send(sessionDescription);
};

RTC.addCandidateMessage = function(label, candidate) {
    var rtcCandidate = new RTCIceCandidate({sdpMLineIndex: label, candidate: candidate});
    RTC.peerConnection.addIceCandidate(rtcCandidate,
        function() { console.log('OnIceSuccess'); },
        function() { console.log('OnIceFailure'); }
    );
};
