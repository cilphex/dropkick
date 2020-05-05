import React from 'react';
import { observer } from 'mobx-react';
import ClientStore from 'stores/ClientStore';

import appStyles from 'app.scss';
import styles from './Client.scss';

@observer
class Client extends React.Component {
  constructor(props) {
    super(props);

    this.uuid = this.props.queryUuid;
    this.videoRef = React.createRef();
    this.clientStore = new ClientStore(this.uuid);
  }

  componentDidUpdate() {
    const { localVideoStream } = this.clientStore;
    const { current: videoElement } = this.videoRef;

    if (!videoElement) return;
    if (videoElement.srcObject) return;

    videoElement.srcObject = localVideoStream;
  }

  render() {
    const {
      alreadyUsed,
      connectionReady,
      localVideoStream,
      rejected,
      receivingFile,
      receivedFile,
      fileName,
      fileObjectURL,
      error,
    } = this.clientStore;

    if (!receivedFile && error) {
      return (
        <div className={styles.clientView}>
          <p className={appStyles.error}>
            {error}
          </p>
        </div>
      );
    }

    if (alreadyUsed) {
      return (
        <div className={styles.clientView}>
          <p className={styles.settingUp}>
            URLs can only be used once, and this one has already been used.
          </p>
        </div>
      );
    }

    if (!connectionReady) {
      return (
        <div className={styles.clientView}>
          <p className={styles.settingUp}>
            Setting up...
          </p>
        </div>
      );
    }

    return (
      <div className={styles.clientView}>
        {!rejected && !receivingFile && !receivedFile && localVideoStream && (
          <div className={styles.idRequired}>
            <p>Identity required &mdash; show yourself</p>
            <video
              ref={this.videoRef}
              autoPlay={true}
            />
            <p className={styles.waitingForApproval}>
              Waiting for approval&hellip;
            </p>
          </div>
        )}

        {rejected && (
          <div className={styles.rejected}>
            <p><strong>Rejected</strong></p>
            <p>Not your lucky day</p>
          </div>
        )}

        {receivingFile && (
          <div className={styles.receivingFile}>
            <p>Receiving file...</p>
          </div>
        )}

        {receivedFile && (
          <div className={styles.receivedFile}>
            <p>Received file!</p>
            <div>
              <a
                className={appStyles.btn}
                href={fileObjectURL}
                download={fileName}
              >
                Download {fileName}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Client;