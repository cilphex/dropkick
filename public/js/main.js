window.RTCPeerConnection = webkitRTCPeerConnection;
navigator.getUserMedia = navigator.webkitGetUserMedia;

// ============================================================================
// Server UI

class ServerUI {
  constructor(server) {
    this.server = server;
    this.hover_counter = 0;
    this.setupListeners();
    $('.app-server').show();
  }

  fileLoaded(e) {
    $('.drop-a-file').text(this.file.name);
    $(document.body).addClass('dropped');
    $('.share-url input').val(App.url + '?c=' + this.server.uuid);
    $('.share-url').removeClass('hidden');
    console.log('file loaded', e);
  }

  fileDropped(file) {
    this.file = file; // should go in Server?
    this.server.setFile(this.file);
    let fileReader = new FileReader();
    fileReader.onload = this.fileLoaded.bind(this);
    fileReader.readAsDataURL(file);
  }

  filesDropped(files) {
    if (files.length === 1) {
      this.fileDropped(files[0]);
    }
  }

  dragEnter(e) {
    this.hover_counter += 1;
    $(document.body).addClass('drop-hover');
  }

  dragLeave(e) {
    this.hover_counter -= 1;
    if (!this.hover_counter) {
      $(document.body).removeClass('drop-hover');
    }
  }

  dragOver(e) {
    e.preventDefault();
  }

  dragDrop(e) {
    e.preventDefault();
    $(document.body).removeClass('drop-hover');
    this.filesDropped(e.originalEvent.dataTransfer.files);
  }

  selectShareUrl(e) {
    e.preventDefault();
    $('.share-url input').select();
  }

  rejectUser(e) {
    e.preventDefault();
    console.log('Server UI: rejectUser');
  }

  approveUser(e) {
    e.preventDefault();
    console.log('Server UI: approveUser');
    $('.pending-approval').hide();
    $('.sending-to-user').show();
    this.server.sendFile();
  }

  setupListeners() {
    $(document).on('dragenter', 'body', this.dragEnter.bind(this));
    $(document).on('dragleave', 'body', this.dragLeave.bind(this));
    $(document).on('dragover', 'body', this.dragOver.bind(this));
    $(document).on('drop', 'body', this.dragDrop.bind(this));
    $(document).on('focus', '.share-url input', this.selectShareUrl.bind(this));
    $(document).on('click', '.reject-user', this.rejectUser.bind(this));
    $(document).on('click', '.approve-user', this.approveUser.bind(this));
  }

  waiting() {
    console.log('waiting');
    $('.share-url').hide();
    $('.connected-and-waiting').show();
  }

  setStream(stream) {
    this.video = document.querySelector('.remote-selfie');
    this.video.src = window.URL.createObjectURL(stream);
  }

  clientSnap() {
    this.video.pause();
    $('.connected-and-waiting').hide();
    $('.pending-approval').show();
  }

  done() {
    $('.sending-to-user').hide();
    $('.sent-to-user').show();
  }
}

// ============================================================================
// Server

class Server {
  constructor() {
    console.log('Server: creating', this.uuid);
    this.setupUuidStoreObserver();
    // this.setupLocalConnection();
    this.getLocalStream();
    this.ui = new ServerUI(this);
  }

  setupUuidStoreObserver() {
    this.uuid_store.child(this.uuid).on('value', this.uuidStoreUpdated.bind(this));
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
    this.local_connection = new RTCPeerConnection(App.connection_config);
    this.local_connection.onicecandidate = this.gotLocalIceCandidate.bind(this);
    this.local_connection.onaddstream = (e) => {
      console.log('Server: onaddstream', e.stream);
      this.remote_stream = e.stream;
      this.ui.setStream(this.remote_stream);
    }
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
    this.uuid_store.child(this.uuid).child('server_desc').set(desc);
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
      this.uuid_store.child(this.uuid).child('server_candidate').set(candidate);
    }
  }

  gotRemoteIceCandidate(candidate_json) {
    console.log('Server: client candidate detected');
    let candidate = new RTCIceCandidate(candidate_json);
    this.local_connection.addIceCandidate(candidate,
      this.addIceCandidateSuccess,
      this.addIceCandidateError)
  }

  addIceCandidateSuccess() {
    console.log('Server: addIceCandidateSuccess')
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
    var file = this.file;
    var send_channel = this.send_channel;

    console.log('Server: sendFile', file);
    send_channel.send(file.name);
    send_channel.send(file.size);

    var chunkSize = 16384;
    var sliceFile = function(offset) {
      var reader = new window.FileReader();
      reader.onload = (function() {
        return function(e) {
          send_channel.send(e.target.result);
          if (file.size > offset + e.target.result.byteLength) {
            window.setTimeout(sliceFile, 0, offset + chunkSize);
          }
          // sendProgress line here
        }
      })(file);
      var slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    }
    sliceFile(0);
  }

  get uuid() {
    this.generated_uuid = this.generated_uuid || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
    return this.generated_uuid;
  }

  get uuid_store() {
    return App.uuid_store;
  }
}

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

// ============================================================================
// App

class EmptyUI {
  constructor() {
    $('.app-empty').show();
  }
}

class App {
  constructor() {
    this.encryption_key = 'asdf'; // Not used for security
    this.query_uuid = this.queryUuid();
    this.is_sender = this.isSender();
    this.is_receiver = this.isReceiver();

    if (this.is_sender) {
      this.server = new Server();
    }
    else if (this.is_receiver) {
      this.client = new Client(this.query_uuid);
    }
    else {
      new EmptyUI();
    }
  }

  isSender() {
    return location.search === '';
  }

  isReceiver() {
    return !!this.query_uuid;
  }

  queryUuid() {
    let match = location.search.match(/\?c=([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i)
    return match && match[1];
  }

  static get connection_config() {
    return {
      iceServers: [
        { url:'stun:stun.l.google.com:19302' }
      ]
    };
  }

  static get uuid_store() {
    return new Firebase('https://cryptorun.firebaseio.com/descriptions');
  }

  static get url() {
    let l = location;
    return l.protocol + '//' + l.hostname + (l.port ? ':' + l.port: '') + l.pathname;
  }
}

// ============================================================================
// Startup

const app = new App();



