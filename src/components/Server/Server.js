import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { observer } from 'mobx-react';
// TODO: Is this not needed here?
import { fileDropStore } from 'lib/globals';
import ServerStore from 'stores/ServerStore';

import appStyles from 'app.scss';
import styles from './Server.scss';

@observer
class Server extends React.Component {
  constructor(props) {
    super(props);

    this.videoRef = React.createRef();
    this.serverStore = new ServerStore(this.uuid);
  }

  get uuid() {
    this.generated_uuid = this.generated_uuid || uuidv4();
    return this.generated_uuid;
  }

  get shareUrl() {
    const l = location;
    const loc = l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + l.pathname;
    const url = `${loc}?c=${this.uuid}`;
    return url;
  }

  rejectUser = () => {
    console.log('reject user');
    this.serverStore.rejectUser();
  };

  approveUser = () => {
    console.log('approve user');

    this.serverStore.sendFile();
  };

  componentDidUpdate = () => {
    const { remoteVideoStream } = this.serverStore;
    const { current: videoElement } = this.videoRef;

    if (!videoElement) return;

    videoElement.srcObject = remoteVideoStream;
  };

  render() {
    const {
      isHovering,
      hasDropped,
      fileName,
    } = fileDropStore;

    const {
      remoteVideoStream,
      rejected,
      sendingFile,
      sentFile,
      error,
    } = this.serverStore;

    const hoverClass = isHovering ? styles.hover : '';
    const droppedClass = hasDropped ? styles.dropped : '';
    const rejectedClass = rejected ? styles.rejected : '';

    return (
      <div className={`${styles.serverView} ${hoverClass} ${droppedClass}`}>
        <p className={`${styles.fileDrop} ${rejectedClass}`}>
          {fileName ? (
            <span className={styles.fileName}>📎 {fileName}</span>
          ) : (
            <span className={styles.dropText}>Drop a file</span>
          )}
        </p>

        {error && (
          <div className={appStyles.error}>
            <p>Error: {error}</p>
          </div>
        )}

        {!sentFile && !remoteVideoStream && (
          <div className={`${styles.shareUrl} ${styles.hidden}`}>
            <p>Share this link:</p>
            <input
              type="text"
              spellCheck="false"
              value={this.shareUrl}
              readOnly={true}
            />
          </div>
        )}

        {remoteVideoStream && (
          <div className={styles.pendingApproval}>
            <p>Recepient Identity</p>
            <video
              ref={this.videoRef}
              autoPlay={true}
            />

            {sendingFile ? (
              <p>Sending file...</p>
            ) : (
              !rejected && (
                <div className={styles.buttons}>
                  <button onClick={this.rejectUser}>Reject</button>
                  <button onClick={this.approveUser}>Approve</button>
                </div>
              )
            )}
          </div>
        )}

        {rejected && (
          <div className={styles.rejected}>
            <p><strong>Rejected</strong></p>
            <p>The file will not be sent</p>
          </div>
        )}

        {sentFile && (
          <div className={styles.fileSent}>
            <p>File sent! 🎉</p>
          </div>
        )}
      </div>
    );
  }
}

export default Server;