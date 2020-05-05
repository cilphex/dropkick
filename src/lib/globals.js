import FileDropStore from 'stores/FileDropStore';

const rtcPeerConnectionMeta = () => {
  return {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302'
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