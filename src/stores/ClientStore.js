import { observable, computed } from 'mobx';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { rtcPeerConnectionMeta } from 'lib/globals';

class ClientStore {
  uuid = null;
  doc = null;
  serverDescReceived = false;
  serverCandidateReceived = false;

  localConnection = null;
  fileSize = 0;
  fileName = null;
  receivedBuffer = [];
  receivedSize = 0;

  remoteStream = null; // observable?
  @observable receiveChannel = null;
  receivingFile = false;
  receivedFile = false;

  @observable stream = null;
  @observable paused = false;
  @observable error = null;

  constructor(uuid) {
    this.uuid = uuid;
    this.initFirebase();
    this.setupDbListener();
    this.getLocalStream();
  }

  // ==========================================================================
  // Firebase

  initFirebase() {
    firebase.initializeApp({
      apiKey: "AIzaSyDGHYeXsm1N9Bd06CqE_WoC_qaPu0nI5i8",
      authDomain: "dropkick-730ba.firebaseapp.com",
      databaseURL: "https://dropkick-730ba.firebaseio.com",
      projectId: "dropkick-730ba",
      storageBucket: "dropkick-730ba.appspot.com",
      messagingSenderId: "299886330652",
      appId: "1:299886330652:web:157bdcbc808ef8a6abb0d9",
      measurementId: "G-1YP59MM7CK"
    });

    const db = firebase.firestore();
    this.doc = db.collection('uuids').doc(this.uuid);
  }

  @computed get fileDownloadURL() {
    const { fileReceived, receivedBuffer } = this;

    return fileReceived && new window.Blob(receivedBuffer);
  }

  setupDbListener() {
    this.doc.onSnapshot(this.onSnapshot);
  }

  onSnapshot = (doc) => {
    const data = doc.data();
    const { server_desc, server_candidate } = data;

    if (server_desc && !this.serverDescReceived) {
      this.serverDescReceived = true;
      this.gotRemoteOffer(server_desc);
    }
    else if (server_candidate && !this.serverCandidateReceived) {
      this.serverCandidateReceived = true;
      this.gotRemoteIceCandidate(server_candidate);
    }
  };

  // ==========================================================================
  // WebRTC

  getLocalStream = () => {
    const constraints = { video: true };
    navigator.getUserMedia(
      constraints,
      this.getLocalStreamSuccess,
      this.getLocalStreamError
    );
  };

  getLocalStreamSuccess = (stream) => {
    console.log('Client: getLocalStreamSuccess');
    this.stream = stream;
    this.getRemoteOffer();
  };

  getLocalStreamError = (err) => {
    console.log('Client: getLocalStreamError', err);
    this.error = err.message;
  };

  getRemoteOffer = () => {
    this.doc.get().then(this.onSnapshot);
  };

  gotRemoteOffer = (offerDescJson) => {
    const offerDesc = new RTCSessionDescription(offerDescJson);
    this.localConnection = new RTCPeerConnection(rtcPeerConnectionMeta);
    this.localConnection.ondatachannel = this.gotRemoteDataChannel;
    this.localConnection.onicecandidate = this.gotLocalIceCandidate;
    this.localConnection.onaddstream = (e) => {
      console.log('Client: onaddstream');
      this.remoteStream = e.stream;
    };
    this.localConnection.addStream(this.stream);
    this.localConnection.setRemoteDescription(offerDesc);
    this.localConnection.createAnswer(
      this.localAnswerSuccess,
      this.localAnswerError
    );
  };

  localAnswerSuccess = async (answerDesc) => {
    console.log('Client: localAnswerSuccess');
    this.localConnection.setLocalDescription(answerDesc);
    const desc = this.localConnection.localDescription.toJSON();
    if (desc.type === 'answer') {
      try {
        await this.doc.update({ client_desc: desc });
      }
      catch(e) {
        console.log('client: error setting client_desc', this.uuid, desc);
      }
    }
  };

  localAnswerError = (err) => {
    console.log('Client: localAnswerError', err);
  };

  gotRemoteDataChannel = (e) => {
    console.log('Client: gotRemoteDataChannel', e);
    this.receiveChannel = e.channel;
    this.receiveChannel.binaryType = 'arraybuffer';
    this.receiveChannel.onmessage = this.receiveChannelMessage;
    this.receiveChannel.onopen = this.receiveChannelStateChange;
    this.receiveChannel.onclose = this.receiveChannelStateChange;
  };

  gotLocalIceCandidate = (e) => {
    console.log('Client: gotLocalIceCandidate');
    if (e.candidate) {
      const candidate = e.candidate.toJSON();
      this.doc.update({ client_candidate: candidate });
    }
  };

  gotRemoteIceCandidate = (candidateJson) => {
    console.log('Client: gotRemoteIceCandidate');
    const candidate = new RTCIceCandidate(candidateJson);
    this.localConnection.addIceCandidate(
      candidate,
      this.addIceCandidateSuccess,
      this.addIceCandidateError
    );
  };

  addIceCandidateSuccess = () => {
    console.log('Client: addIceCandidateSuccess');
  };

  addIceCandidateError = (err) => {
    console.log('Client: addIceCandidateError', err);
  };

  receiveChannelMessage = (e) => {
    console.log('Client: receiveChannelMessage', e);

    this.receivingFile = true;

    if (!this.fileName) {
      this.fileName = e.data;
      console.log('Client: file name received', this.fileName);
      return;
    }

    if (!this.fileSize) {
      this.fileSize = parseInt(e.data);
      console.log('Client: file size received', this.fileSize, typeof this.fileSize);
      return;
    }
    else {
      console.log('Client: new file size', this.fileSize);
    }

    this.receivedBuffer.push(e.data);
    this.receivedSize += e.data.byteLength;

    if (this.receivedSize === this.fileSize) {
      console.log('Client: done receiving file');

      const received = new window.Blob(this.receivedBuffer);
      this.receivedBuffer = [];

      this.receivedFile = true;
      this.receiveChannel.send('done-receiving');
    }
  };

  receiveChannelStateChange = () => {
    console.log('Client: receiveChannelStateChange', this.receiveChannel.readyState);
  };

  sendSnap = () => {
    this.receiveChannel.send('client-snap');
  };

  snap = () => {
    console.log(1)
    this.paused = true;
    console.log(2)
  }
}

export default ClientStore;