// Code taken from:
// https://bitbucket.org/webrtc/codelab/src/1394694193d4f88f005aa6b049975030e229f748/complete/step7/js/main.js?at=master

var SDP = {};

SDP.preferOpus = function(sdp) {
    var sdpLines = sdp.split('\r\n');
    var mLineIndex;
    // Search for m line.
    for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
            mLineIndex = i;
            break;
        }
    }
    if (mLineIndex === null)
        return sdp;

    // If Opus is available, set it as the default in m line.
    for (i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('opus/48000') !== -1) {
            var opusPayload = SDP.extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
            if (opusPayload)
                sdpLines[mLineIndex] = SDP.setDefaultCodec(sdpLines[mLineIndex], opusPayload);
            break;
        }
    }

    // Remove CN in m line and sdp.
    sdpLines = SDP.removeCN(sdpLines, mLineIndex);

    sdp = sdpLines.join('\r\n');
    return sdp;
}

SDP.removeCN = function(sdpLines, mLineIndex) {
    var mLineElements = sdpLines[mLineIndex].split(' ');
    // Scan from end for the convenience of removing an item.
    for (var i = sdpLines.length-1; i >= 0; i--) {
        var payload = SDP.extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload) {
            var cnPos = mLineElements.indexOf(payload);
            if (cnPos !== -1) {
                // Remove CN payload from m line.
                mLineElements.splice(cnPos, 1);
            }
            // Remove CN line in sdp
            sdpLines.splice(i, 1);
        }
    }

    sdpLines[mLineIndex] = mLineElements.join(' ');
    return sdpLines;
}

SDP.extractSdp = function(sdpLine, pattern) {
    var result = sdpLine.match(pattern);
    return result && result.length === 2 ? result[1] : null;
}

SDP.setDefaultCodec = function(mLine, payload) {
    var elements = mLine.split(' ');
    var newLine = [];
    var index = 0;
    for (var i = 0; i < elements.length; i++) {
        if (index === 3) // Format of media starts from the fourth.
            newLine[index++] = payload; // Put target payload to the first.
        if (elements[i] !== payload)
            newLine[index++] = elements[i];
    }
    return newLine.join(' ');
}
