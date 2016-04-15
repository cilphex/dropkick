let Config = require('./config');
let ServerUI = require('./server_ui');

class Server {
  constructor(app) {
    console.log('Server: creating', this.uuid);
    this.app = app;
    this.setupUuidStoreObserver();
    this.getLocalStream();
    this.ui = new ServerUI(this);
  }

  setupUuidStoreObserver() {
    Config.uuid_store.child(this.uuid).on('value', this.uuidStoreUpdated.bind(this));
  }

  uuidStoreUpdated(snapshot) {
    let val = snapshot.val();
    if (val.client_desc && !this.client_desc_received) {
      this.client_desc_received = true;
      this.answerReceived(val.client_desc);
    }
    else if (val.client_candidate && !this.client_candidate_received) {
      this.client_candidate_received = true;
      this.gotRemoteIceCandidate(val.client_candidate);
    }
  }

  getLocalStream() {
    let constraints = { video: true };
    navigator.getUserMedia(constraints,
      this.getLocalStreamSuccess.bind(this),
      this.getLocalStreamError.bind(this));
  }

  getLocalStreamSuccess(stream) {
    console.log('Server: getLocalStreamSuccess');
    this.stream = stream;
    this.setupLocalConnection();
  }

  getLocalStreamError(err) {
    console.log('Server: navigator.getUserMedia error:', err);
  }

  setupLocalConnection() {
    this.local_connection = new RTCPeerConnection(Config.connection);
    this.local_connection.onicecandidate = this.gotLocalIceCandidate.bind(this);
    this.local_connection.onaddstream = (e) => {
      console.log('Server: onaddstream', e.stream);
      this.remote_stream = e.stream;
      this.ui.setStream(this.remote_stream);
    };
    this.local_connection.addStream(this.stream);

    this.send_channel = this.local_connection.createDataChannel('my-test-channel', {});
    this.send_channel.binaryType = 'arraybuffer';
    this.send_channel.onopen = this.sendChannelStateChange.bind(this);
    this.send_channel.onclose = this.sendChannelStateChange.bind(this);
    this.send_channel.onerror = this.sendChannelError.bind(this);
    this.send_channel.onmessage = this.sendChannelMessage.bind(this);

    this.local_connection.createOffer(this.gotLocalDescription.bind(this), this.createSessionDescriptionError.bind(this));
  }

  sendChannelStateChange() {
    console.log('Server: sendChannelStateChange', this.send_channel.readyState);
    if (this.send_channel.readyState === 'open') {
      this.ui.waiting();
    }
  }

  sendChannelError(err) {
    console.log('Server: sendChannelError', err);
  }

  sendChannelMessage(e) {
    console.log('Server: sendChannelMessage', e.data);
    switch(e.data) {
      case 'client-snap':
        this.ui.clientSnap();
        break;
      case 'done-receiving':
        this.ui.done();
        break;
    }
  }

  gotLocalDescription(desc) {
    console.log('Server: gotLocalDescription');
    this.local_connection.setLocalDescription(desc);
    desc = this.local_connection.localDescription.toJSON();
    Config.uuid_store.child(this.uuid).child('server_desc').set(desc);
  }

  answerReceived(answer_desc_json) {
    console.log('Server: answer_desc_json');
    let answer_desc = new RTCSessionDescription(answer_desc_json);
    this.local_connection.setRemoteDescription(answer_desc);
  }

  gotLocalIceCandidate(e) {
    console.log('Server: gotLocalIceCandidate');
    if (e.candidate) {
      let candidate = e.candidate.toJSON();
      Config.uuid_store.child(this.uuid).child('server_candidate').set(candidate);
    }
  }

  gotRemoteIceCandidate(candidate_json) {
    console.log('Server: client candidate detected');
    let candidate = new RTCIceCandidate(candidate_json);
    this.local_connection.addIceCandidate(candidate,
      this.addIceCandidateSuccess,
      this.addIceCandidateError);
  }

  addIceCandidateSuccess() {
    console.log('Server: addIceCandidateSuccess');
  }

  addIceCandidateError(err) {
    console.log('Server: addIceCandidateError', err);
  }

  createSessionDescriptionError(err) {
    console.log('Server: createSessionDescriptionError', err);
  }

  setFile(file) {
    this.file = file;
  }

  sendFile() {
    let file = this.file;
    let send_channel = this.send_channel;

    console.log('Server: sendFile', file);
    send_channel.send(file.name);
    send_channel.send(file.size);

    let chunkSize = 16384;
    let sliceFile = function(offset) {
      let reader = new window.FileReader();
      reader.onload = (function() {
        return function(e) {
          send_channel.send(e.target.result);
          if (file.size > offset + e.target.result.byteLength) {
            window.setTimeout(sliceFile, 0, offset + chunkSize);
          }
          // sendProgress line here
        };
      })(file);
      let slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };
    sliceFile(0);
  }

  get uuid() {
    this.generated_uuid = this.generated_uuid || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
    return this.generated_uuid;
  }
}

module.exports = Server;
