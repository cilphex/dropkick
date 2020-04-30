import FileDropStore from 'stores/FileDropStore';

const rtcPeerConnectionMeta = () => {
  return {
    iceServers: [
      { url: 'stun:stun.l.google.com:19302' }
    ]
  };
};

const fileDropStore = new FileDropStore();

export {
  rtcPeerConnectionMeta,
  fileDropStore,
}