import { observable, computed } from 'mobx';
import { fileDropStore, rtcPeerConnectionMeta } from 'lib/globals';

class ServerRTCStore {
  firebaseStore   = null;
  stream          = null;
  localConnection = null;

  @observable sendChannel = null;
  @observable remoteStream = null;
  @observable clientSnap = false;
  @observable doneReceiving = false;
  @observable error = null;

  constructor(firebaseStore) {
    this.firebaseStore = firebaseStore;
    this.getLocalStream();
  }

  @computed get waiting() {
    const { sendChannel } = this;
    return sendChannell && sendChannel.readyState === 'open';
  }

  @computed get videoStream() {
    const { remoteStream } = this;
    return remoteStream && window.URL.createObjectURL(stream);
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
  };

  sendChannelError = (err) => {
    console.log('Server: sendChannelError', err);
  };

  sendChannelMessage = (e) => {
    console.log('Server: sendChannelMessage', e.data);

    switch(e.data) {
      case 'client-snap':
        this.clientSnap = true;
        break;
      case 'done-receiving':
        this.doneReceiving = true;
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
    console.log('serverRTCStore: gotLocalIceCandidate');

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
    const { file } = fileDropStore;
    const sendChannel = this.sendChannel;

    console.log('Server: sendFile', file);

    sendChannel.send(file.name);
    sendChannel.send(file.size);

    const chunkSize = 16384;
    const sliceFile = (offset) => {
      const reader = new window.FileReader();
      reader.onload = (() => {
        return (e) => {
          sendChannel.send(e.target.result);
          if (file.size > offset + e.target.result.byteLength) {
            window.setTimeout(sliceFile, 0, offset + chunkSize);
          }
          // sendProgress line here
        }
      })(file);
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    sliceFile(0);
  };
}

export default ServerRTCStore;