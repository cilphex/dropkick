import { observable, computed } from 'mobx';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { fileDropStore, rtcPeerConnectionMeta } from 'lib/globals';

class ServerStore {
  uuid = null;
  doc = null;
  clientDescReceived = false;
  clientCandidateReceived = false;
  stream = null;
  localConnection = null;

  @observable sendChannel = null;
  @observable remoteVideoStream = null;
  @observable rejected = false;
  @observable sendingFile = false;
  @observable sentFile = false;
  @observable error = null;

  constructor(uuid) {
    this.uuid = uuid;
    this.initFirebase();
    this.setupDbListener();
    this.getLocalStream();
    // this.setupLocalConnection();
    // setTimeout(this.setupLocalConnection, 2000);
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
    this.doc.set({});
  }

  onSnapshot = (doc) => {
    const data = doc.data();
    const { client_desc, client_candidate } = data;

    if (client_desc && !this.clientDescReceived) {
      console.log('firebaseStore: onSnapshot: answer received');
      this.clientDescReceived = true;
      this.answerReceived(client_desc);
    }
    else if (client_candidate && !this.clientCandidateReceived) {
      console.log('firebaseStore: onSnapshot: got remote ice candidate');
      this.clientCandidateReceived = true;
      this.gotRemoteIceCandidate(client_candidate);
    }
  };

  updateServerDesc = async (desc) => {
    console.log('firebaseStore: updateServerDesc');

    try {
      await this.doc.update({ server_desc: desc });
    }
    catch(err) {
      console.log('firebaseStore: error setting server_desc', this.uuid, desc);
    }
  };

  updateServerCandidate = async (candidate) => {
    console.log('firebaseStore: updateServerCandidate');

    try {
      await this.doc.update({ server_candidate: candidate });
    }
    catch(err) {
      console.log('firebaseStore: error setting server_candidate', this.uuid, candidate);
    }
  };

  // ==========================================================================
  // WebRTC
  //
  getLocalStream = async () => {
    const constraints = { video: true };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Server: getLocalStream: success');
      this.setupLocalConnection();
    }
    catch(err) {
      console.log('Server: getLocalStream: error', err);
      if (err.message == 'Permission denied' || err.message == 'Requested device not found') {
        this.error = 'Please enable your webcam';
      }
      else {
        this.error = err.message;
      }
    }
  };

  setupLocalConnection = () => {
    this.localConnection = new RTCPeerConnection(rtcPeerConnectionMeta);
    this.localConnection.onicecandidate = this.gotLocalIceCandidate;
    this.localConnection.onaddstream = this.getRemoteStreamSuccess;
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
  };

  getRemoteStreamSuccess = async (e) => {
    console.log('Server: getRemoteStreamSuccess', e.stream);
    try {
      await this.doc.update({ connection_made: true });
    }
    catch(err) {
      this.error = err;
      return;
    }
    this.remoteVideoStream = e.stream;
  };

  localDescriptionSuccess = (desc) => {
    console.log('Server: gotLocalDescription');
    this.localConnection.setLocalDescription(desc);
    desc = this.localConnection.localDescription.toJSON();
    this.updateServerDesc(desc);
  };

  localDescriptionError = (err) => {
    console.log('Server: localDescriptionError', err);
  };

  sendChannelStateChange = () => {
    console.log('Server: sendChannelStateChange', this.sendChannel.readyState);
  };

  sendChannelError = (err) => {
    console.log('Server: sendChannelError', err);
    this.error = 'The other side disconnected';
  };

  sendChannelMessage = (e) => {
    console.log('Server: sendChannelMessage', e.data);

    switch(e.data) {
      case 'done-receiving':
        this.sendFileComplete();
        break;
    }
  };

  answerReceived = (answerDescJson) => {
    console.log('Server: answer_desc_json');
    const answerDesc = new RTCSessionDescription(answerDescJson);
    this.localConnection.setRemoteDescription(answerDesc);
  };

  gotLocalIceCandidate = (e) => {
    console.log('Server: gotLocalIceCandidate');

    if (e.candidate) {
      const candidate = e.candidate.toJSON();
      this.updateServerCandidate(candidate);
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

  rejectUser = async () => {
    this.sendChannel.send('rejected');
    this.rejected = true;
  };

  sendFile = async () => {
    this.sendingFile = true;

    const { file } = fileDropStore;
    const { sendChannel }  = this;

    console.log('Server: sendFile', file);

    sendChannel.send(file.name);
    sendChannel.send(file.size);

    const chunkSize = 16384;
    const sliceFile = (offset) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        sendChannel.send(e.target.result);
        if (file.size > offset + e.target.result.byteLength) {
          setTimeout(sliceFile, 0, offset + chunkSize);
        }
        // Could update progress with e.loaded/e.total here.
      };

      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    sliceFile(0);
  };

  sendFileComplete = async () => {
    this.sendingFile = false;
    this.sentFile = true;
    this.remoteVideoStream = null;
  }
}

export default ServerStore;