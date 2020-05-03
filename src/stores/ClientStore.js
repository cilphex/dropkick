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
  receivedBuffer = [];
  receivedSize = 0;

  @observable alreadyUsed = false;
  @observable connectionReady = false;
  @observable rejected = false;
  @observable fileName = null;
  @observable receiveChannel = null;
  @observable receivingFile = false;
  @observable receivedFile = false;
  @observable localVideoStream = null;
  @observable error = null;

  constructor(uuid) {
    this.uuid = uuid;
    this.initFirebase();
    this.getLocalStream();
  }

  @computed get fileObjectURL() {
    const { receivedFile, receivedBuffer } = this;

    if (!receivedFile) return null;

    const blob = new Blob(receivedBuffer);
    return URL.createObjectURL(blob);
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

  setupDbListener() {
    this.doc.onSnapshot(this.onSnapshot);
  }

  onSnapshot = (doc) => {
    const data = doc.data();
    const { connectionReady } = this;
    const { connection_made, server_desc, server_candidate } = data;

    if (!connectionReady && connection_made) {
      this.alreadyUsed = true;
      return;
    }

    if (server_desc && !this.serverDescReceived) {
      this.serverDescReceived = true;
      this.gotRemoteOffer(server_desc);
    }
    else if (server_candidate && !this.serverCandidateReceived) {
      this.serverCandidateReceived = true;
      this.gotRemoteIceCandidate(server_candidate);
    }
  };

  updateClientDesc = async (desc) => {
    console.log('firebaseStore: updateClientDesc');

    try {
      await this.doc.update({ client_desc: desc });
    }
    catch(e) {
      console.log('client: error setting client_desc', desc);
    }
  };

  // ==========================================================================
  // WebRTC

  getLocalStream = async () => {
    const constraints = { video: true };

    try {
      console.log('Client: getLocalStream: success');
      this.localVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupDbListener();
    }
    catch(err) {
      console.log('Client: getLocalStream: error');
      if (err.message == 'Permission denied' || err.message == 'Requested device not found') {
        this.error = 'Please enable your webcam';
      }
      else {
        this.error = err.message;
      }
    }
  };

  gotRemoteOffer = async (offerDescJson) => {
    const offerDesc = new RTCSessionDescription(offerDescJson);
    this.localConnection = new RTCPeerConnection(rtcPeerConnectionMeta);
    this.localConnection.ondatachannel = this.gotRemoteDataChannel;
    this.localConnection.onicecandidate = this.gotLocalIceCandidate;
    this.localConnection.onaddstream = (e) => { /* Do nothing in client */ };
    this.localConnection.addTrack(this.localVideoStream.getTracks()[0], this.localVideoStream);
    this.localConnection.setRemoteDescription(offerDesc);

    try {
      const answerDesc = await this.localConnection.createAnswer();
      this.localConnection.setLocalDescription(answerDesc);
      console.log('Client: local answer created');
      const desc = this.localConnection.localDescription.toJSON();
      if (desc.type === 'answer') {
        this.updateClientDesc(desc);
      }
    }
    catch(err) {
      this.error = err.message;
      console.log('Client: answer description error', err);
    }
  };

  gotRemoteDataChannel = (e) => {
    console.log('Client: gotRemoteDataChannel', e);
    this.receiveChannel = e.channel;
    this.receiveChannel.binaryType = 'arraybuffer';
    this.receiveChannel.onmessage = this.receiveChannelMessage;
    this.receiveChannel.onopen = this.receiveChannelStateChange;
    this.receiveChannel.onclose = this.receiveChannelStateChange;
    this.receiveChannel.onerror = this.receiveChannelError;
  };

  gotLocalIceCandidate = (e) => {
    console.log('Client: gotLocalIceCandidate');
    if (e.candidate) {
      const candidate = e.candidate.toJSON();
      this.doc.update({ client_candidate: candidate });
    }
  };

  gotRemoteIceCandidate = async (candidateJson) => {
    console.log('Client: gotRemoteIceCandidate');
    const candidate = new RTCIceCandidate(candidateJson);

    try {
      await this.localConnection.addIceCandidate(candidate);
      console.log('Client: added ice candidate');
      this.connectionReady = true;
    }
    catch(err) {
      this.error = err.message;
      console.log('Client: error adding ice candidate', err);
    }
  };

  receiveChannelMessage = (e) => {
    console.log('Client: receiveChannelMessage', e);

    if (e.data === 'rejected') {
      this.rejected = true;
      return;
    }

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

      this.receivingFile = false;
      this.receivedFile = true;
      this.receiveChannel.send('done-receiving');
    }
  };

  receiveChannelStateChange = () => {
    const { readyState } = this.receiveChannel;
    console.log('Client: receiveChannelStateChange', readyState);
    if (readyState === 'closed') {
      this.error = 'The sender disconnected (channel closed)';
    }
  };

  receiveChannelError = (err) => {
    console.log('Client: receiveChannelError', err);
    this.error = 'The sender disconnected (channel error)'
  }
}

export default ClientStore;