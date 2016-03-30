// ============================================================================
// Client UI

class ClientUI {
  constructor(client, stream) {
    this.client = client;
    this.stream = stream;
    this.setupListeners();
    this.setupVideo();
    // this.setupSelfie(); // has to be called from Client after stuff is loaded
    $('.app-client').show();
  }

  setupListeners() {
    // ideally this would not be allowed until the video.loadedmetadata callback
    $(document).on('click', '.snap-photo', this.snapPhoto.bind(this));
  }

  setupVideo() {
    this.video = window.video = document.querySelector('.local-selfie');
    this.video.src = window.URL.createObjectURL(this.stream);
  }

  snapPhoto(e) {
    this.video.pause();
    $(this.video).addClass('paused');
    $('.snap-button').hide();
    $('.waiting-for-decision').show();
    this.client.sendSnap();
  }
}

// ============================================================================
// Client

class Client {
  constructor(connection_uuid) {
    console.log('Client: creating');
    this.connection_uuid = connection_uuid;
    this.receivedBuffer = [];
    this.receivedSize = 0;
    this.setupUuidStoreObserver();
    this.getLocalStream();
    // this.getRemoteOffer(); // moved down
  }

  setupUuidStoreObserver() {
    this.uuid_store.child(this.connection_uuid).on('value', this.uuidStoreUpdated.bind(this));
  }

  uuidStoreUpdated(snapshot) {
    let val = snapshot.val();
    if (val.server_desc && !this.server_desc_received) {
      this.server_desc_received = true;
      this.gotRemoteOffer(val.server_desc);
    }
    else if (val.server_candidate && !this.server_candidate_received) {
      this.server_candidate_received = true;
      this.gotRemoteIceCandidate(val.server_candidate);
    }
  }

  getLocalStream() {
    let constraints = { video: true };
    navigator.getUserMedia(constraints,
      this.getLocalStreamSuccess.bind(this),
      this.getLocalStreamError.bind(this));
  }

  getLocalStreamSuccess(stream) {
    console.log('Client: getLocalStreamSuccess');
    this.stream = stream;
    this.getRemoteOffer();
  }

  getLocalStreamError(err) {
    console.log('Client: navigator.getUserMedia error:', err);
  }

  getRemoteOffer() {
    this.uuid_store.child(this.connection_uuid).once('value', this.uuidStoreUpdated.bind(this));
  }

  gotRemoteOffer(offer_desc_json) {
    let offer_desc = new RTCSessionDescription(offer_desc_json);
    this.local_connection = new RTCPeerConnection(App.connection_config);
    this.local_connection.ondatachannel = this.gotRemoteDataChannel.bind(this);
    this.local_connection.onicecandidate = this.gotLocalIceCandidate.bind(this);
    this.local_connection.onaddstream = (e) => {
      console.log('Client: onaddstream', e.stream);
      this.remote_stream = e.stream;
    }
    this.local_connection.addStream(this.stream);
    this.local_connection.setRemoteDescription(offer_desc);
    this.local_connection.createAnswer(this.answerCreated.bind(this), this.createSessionDescriptionError.bind(this));
  }

  answerCreated(answer_desc) {
    console.log('Client: answer');
    this.local_connection.setLocalDescription(answer_desc);
    let desc = this.local_connection.localDescription.toJSON();
    if (desc.type === 'answer') {
      this.uuid_store.child(this.connection_uuid).child('client_desc').set(desc);
    }
  }

  gotLocalIceCandidate(e) {
    console.log('Client: gotLocalIceCandidate');
    if (e.candidate) {
      let candidate = e.candidate.toJSON();
      this.uuid_store.child(this.connection_uuid).child('client_candidate').set(candidate);
    }
  }

  gotRemoteIceCandidate(candidate_json) {
    console.log('Client: server candidate detected');
    let candidate = new RTCIceCandidate(candidate_json);
    this.local_connection.addIceCandidate(candidate,
      this.addIceCandidateSuccess,
      this.addIceCandidateError)
  }

  addIceCandidateSuccess() {
    console.log('Client: addIceCandidateSuccess')
  }

  addIceCandidateError(err) {
    console.log('Client: addIceCandidateError', err);
  }

  gotRemoteDataChannel(e) {
    console.log('Client: got remote data channel', e);
    this.receive_channel = e.channel;
    this.receive_channel.binaryType = 'arraybuffer';
    this.receive_channel.onmessage = this.receiveChannelMessage.bind(this)
    this.receive_channel.onopen = this.receiveChannelStateChange.bind(this);
    this.receive_channel.onclose = this.receiveChannelStateChange.bind(this);
  }

  receiveChannelStateChange() {
    console.log('Client: receiveChannelStateChange', this.receive_channel.readyState);
    if (this.receive_channel.readyState === 'open') {
      this.ui = new ClientUI(this, this.stream);
    }
  }

  receiveChannelError(err) {
    console.log('Client: receiveChannelError', err);
  }

  receiveChannelMessage(e) {
    console.log('Client: receiveChannelMessage', e.data);

    // should be in client ui
    if (!this.showed_receiving) {
      $('.waiting-for-decision').hide();
      $('.receiving-file').show();
      this.showed_receiving = true;
    }

    if (this.file_size === undefined || this.file_size === null) {
      this.file_size = 0;
    }

    if (!this.file_name) {
      this.file_name = e.data;
      console.log('Client: file name received:', this.file_name);
      return;
    }

    if (!this.file_size) {
      this.file_size = parseInt(e.data);
      console.log('Client: file size received:', this.file_size, (typeof this.file_size));
      return;
    }
    else {
      console.log('Client: new file size:', this.file_size);
    }

    this.receivedBuffer.push(e.data);
    this.receivedSize += e.data.byteLength;

    if (this.receivedSize == this.file_size) {
      console.log('Client: done receiving file');

      var received = new window.Blob(this.receivedBuffer);
      this.receivedBuffer = [];

      let anchor = document.querySelector('a.download');
      anchor.href = URL.createObjectURL(received);
      anchor.download = this.file_name;

      $('.id-required, .receiving-file').hide();
      $('.received-file').show();

      this.receive_channel.send('done-receiving');
    }
  }

  createSessionDescriptionError(err) {
    console.log('Client: createSessionDescriptionError', err);
  }

  sendSnap() {
    console.log('Client: sendSnap');
    this.receive_channel.send('client-snap');
  }

  // addStream(stream) {
  //   console.log('Client: addStream', stream);
  //   this.local_connection.onaddstream({stream: stream});
  //   this.local_connection.addStream(stream);
  // }

  get uuid_store() {
    return App.uuid_store;
  }
}
