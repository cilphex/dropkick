import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { fileDropStore } from 'lib/globals';

import Client from './components/Client';
import Server from './components/Server';
import Empty from './components/Empty';

import styles from './app.scss';

@observer
class App extends React.Component {
  constructor(props) {
    super(props);
  }

  isSender() {
    return location.search === '';
  }

  isReceiver() {
    return !!this.queryUuid;
  }

  get queryUuid() {
    const match = location.search.match(/\?c=([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i);
    return match && match[1];
  }

  render() {
    if (this.isReceiver()) {
      return (
        <div>
          <h1>dropkick</h1>
          <Client queryUuid={this.queryUuid} />
        </div>
      );
    }

    if (this.isSender()) {
      return (
        <div
            className={styles.app}
            onDragEnter={fileDropStore.onDragEnter}
            onDragLeave={fileDropStore.onDragLeave}
            onDragOver={fileDropStore.onDragOver}
            onDrop={fileDropStore.onDrop}
        >
          <h1>dropkick</h1>
          <Server />
        </div>
      );
    }

    return <Empty />;
  }
}

ReactDOM.render(
  <App/>,
  document.getElementById("root")
);
