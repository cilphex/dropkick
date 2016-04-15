let adapt = () => {
  window.RTCPeerConnection = window.RTCPeerConnection ||
    window.webkitRTCPeerConnection;

  window.navigator.getUserMedia = window.navigator.getUserMedia ||
    window.navigator.webkitGetUserMedia;
}

module.exports.adapt = adapt;
