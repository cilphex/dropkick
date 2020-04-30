import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { observer } from 'mobx-react';
import { fileDropStore } from 'lib/globals';
import FirebaseStore from 'stores/FirebaseStore';
import ServerRTCStore from 'stores/ServerRTCStore';

import styles from './Server.scss';

@observer
class Server extends React.Component {
  constructor(props) {
    super(props);

    this.firebaseStore = new FirebaseStore(this.uuid);
    this.serverRTCStore = new ServerRTCStore(this.firebaseStore);
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

  render() {
    const { isHovering, hasDropped, fileName } = fileDropStore;
    const { error: rtcError } = this.serverRTCStore;

    const hoverClass = isHovering ? styles.hover : '';
    const droppedClass = hasDropped ? styles.dropped : '';

    return (
      <div className={`${styles.serverView} ${hoverClass} ${droppedClass}`}>
        <p className={styles.fileDrop}>
          {fileName ? fileName : 'Drop a file'}
        </p>

        <div className={`${styles.shareUrl} ${styles.hidden}`}>
          <p>Share this url:</p>
          <input
            type="text"
            spellCheck="false"
            value={this.shareUrl}
            readOnly={true}
          />
        </div>

        {rtcError && <div>RTC Error: {rtcError}</div>}
      </div>
    );
  }
}

export default Server;