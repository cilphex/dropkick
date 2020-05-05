import FileDropStore from 'stores/FileDropStore';

const rtcPeerConnectionMeta = () => {
  return {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun.comtube.com:3478',
          'stun:stun.comtube.ru:3478',
          'stun:stun.cope.es:3478',
          'stun:stun.counterpath.com:3478',
          'stun:stun.counterpath.net:3478',
          'stun:stun.cryptonit.net:3478',
          'stun:stun.darioflaccovio.it:3478',
          'stun:stun.datamanagement.it:3478',
          'stun:stun.rolmail.net:3478',
          'stun:stun.rounds.com:3478',
          'stun:stun.rynga.com:3478',
          'stun:stun.samsungsmartcam.com:3478',
          'stun:stun.schlund.de:3478',
          'stun:stun.services.mozilla.com:3478',
          'stun:stun.sigmavoip.com:3478',
        ]
      }
    ]
  };
};

// TODO: tmp
console.log(10);

const fileDropStore = new FileDropStore();

export {
  rtcPeerConnectionMeta,
  fileDropStore,
}