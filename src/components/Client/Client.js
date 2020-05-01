import React from 'react';
import { observer } from 'mobx-react';
import ClientStore from 'stores/ClientStore';

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
    const {
      stream: videoStream,
      paused,
    } = this.clientStore;

    if (paused) {
      this.videoRef.current.pause();
    }
    else {
      this.videoRef.current.srcObject = videoStream;
    }
  }

  render() {
    const {
      stream: videoStream,
      paused,
      error,
    } = this.clientStore;

    return (
      <div className={styles.clientView}>
        {videoStream && (
          <div className={styles.idRequired}>
            <p>Identity required &mdash; take a photo</p>
            <video
              ref={this.videoRef}
              autoPlay={true}
            />
            
            <div className={styles.snap}>
              <button onClick={this.clientStore.snap}>Snap</button>
            </div>
          </div>
        )}

        {error && (
          <div>Error: {error}</div>
        )}
      </div>
    );
  }
}

export default Client;