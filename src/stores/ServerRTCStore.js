import { observable } from 'mobx';
import { rtcPeerConnectionMeta } from 'lib/globals';

class ServerRTCStore {
  firebaseStore   = null;
  stream          = null;
  localConnection = null;
  remoteStream    = null; // observable?

  @observable error = null;

  constructor(firebaseStore) {
    this.firebaseStore = firebaseStore;
    this.getLocalStream();
  }

  getLocalStream = () => {
    const constraints = { video: true };
    navigator.getUserMedia(
      constraints,
      this.getLocalStreamSuccess,
      this.getLocalStreamError
    );
  };

  getLocalStreamSuccess = (stream) => {
    console.log('Server: getLocalStreamSuccess');
    this.stream = stream;
    this.setupLocalConnection();
  };

  getLocalStreamError = (err) => {
    if (err instanceof DOMException && err.message == 'Requested device not found') {
      this.error = 'Please enable your webcam';
    }
    else {
      this.error = err.message;
    }
  };

  setupLocalConnection = () => {
    this.localConnection = new RTCPeerConnection(rtcPeerConnectionMeta);
    this.localConnection.onicecandidate = this.gotLocalIceCandidate;
    this.localConnection.onaddstream = (e) => {
      console.log('Server: onaddstream', e.stream);
      this.remoteStream = e.stream;
    }
    this.localConnection.addStream(this.stream);

    this.sendChannel = this.localConnection.createDataChannel('my-test-channel', {});
    this.sendChannel.binaryType = 'arraybuffer';
    this.sendChannel.onopen = this.sendChannelStateChange;
    this.sendChannel.onclose = this.sendChannelStateChange;
    this.sendChannel.onerror = this.sendChannelError;
    this.sendChannel.onmessage = this.sendChannelMessage;

    this.localConnection.createOffer(
      this.localDescriptionSuccess,
      this.localDescriptionError
    );
  }

  sendChannelStateChange = () => {
    console.log('Server: sendChannelStateChange', this.sendChannel.readyState);

    // if sendChannell.readyState === 'open'
    //   this.ui.waiting()
  };

  sendChannelError = (err) => {
    console.log('Server: sendChannelError', err);
  };

  sendChannelMessage = (e) => {
    console.log('Server: sendChannelMessage', e.data);

    switch(e.data) {
      case 'client-snap':
        // this.ui.clientSnap();
        break;
      case 'done-receiving':
        // this.ui.done()
        break;
    }
  };

  localDescriptionSuccess = (desc) => {
    console.log('Server: gotLocalDescription');
    this.localConnection.setLocalDescription(desc);
    desc = this.localConnection.localDescription.toJSON();
    this.firebaseStore.updateServerDesc(desc);
  };

  localDescriptionError = (err) => {
    console.log('Server: localDescriptionError', err);
  };

  answerReceived = (answerDescJson) => {
    console.log('Server: answer_desc_json');
    const answerDesc = new RTCSessionDescription(answerDescJson);
    this.localConnection.setRemoteDescription(answerDesc);
  };

  gotLocalIceCandidate = (e) => {
    if (e.candidate) {
      const candidate = e.candidate.toJSON();
      this.firebaseStore.updateServerCandidate(candidate);
    }
  };

  gotRemoteIceCandidate(candidateJson) {
    console.log('Server: client candidate detected');

    const candidate = new RTCIceCandidate(candidateJson);

    this.localConnection.addIceCandidate(
      candidate,
      this.addIceCandidateSuccess,
      this.addIceCandidateError
    );
  };

  addIceCandidateSuccess = () => {
    console.log('Server: addIceCandidateSuccess');
  };

  addIceCandidateError = (err) => {
    console.log('Server: addIceCandidateError', err);
  };

  sendFile = () => {
    console.log('Server: sendFile!');
  }
}

export default ServerRTCStore;