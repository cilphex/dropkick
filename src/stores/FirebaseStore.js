import { observable } from 'mobx';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

class FirebaseStore {
  uuid = null;
  doc = null;
  clientDescReceived = false;
  clientCandidateReceived = false;

  constructor(uuid) {
    this.uuid = uuid;
    this.initFirebase();
    this.setupDbListener();
  }

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
    console.log('setupDbListener');
    this.doc.onSnapshot(this.onSnapshot);
    this.doc.set({});
  }

  onSnapshot = (doc) => {
    const data = doc.data();

    if (data.client_desc && !this.clientDescReceived) {
      console.log('firebaseStore: onSnapshot: answer received');
      this.clientDescReceived = true;
      // this.answerReceived(data.client_desc);
    }
    else if (data.client_candidate && !this.clientCandidateReceived) {
      console.log('firebaseStore: onSnapshot: got remote ice candidate');
      this.clientCandidateReceived = true;
      // this.gotRemoteIceCandidate(data.client_candidate);
    }

    console.log('snapshot updated', doc.data());
  };

  updateServerDesc = async (desc) => {
    try {
      await this.doc.update({
        server_desc: desc,
      });
    }
    catch(err) {
      console.log('firebaseStore: error setting server_desc', this.uuid, desc);
    }
  };

  updateServerCandidate = async (candidate) => {
    try {
      await this.doc.update({
        server_candidate: candidate,
      });
    }
    catch(err) {
      console.log('firebaseStore: error setting server_candidate', this.uuid, candidate);
    }
  }
}

export default FirebaseStore;