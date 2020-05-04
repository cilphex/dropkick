import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { fileDropStore } from 'lib/globals';

import Client from './components/Client';
import Server from './components/Server';
import Empty from './components/Empty';

import styles from './app.scss';
import adapter from 'webrtc-adapter';

@observer
class App extends React.Component {
  constructor(props) {
    super(props);
  }

  isSender() {
    return location.pathname === '/' && location.search === '';
  }

  isReceiver() {
    return !!this.queryUuid;
  }

  get queryUuid() {
    const match = location.search.match(/\?c=([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i);
    return match && match[1];
  }

  get appProps() {
    const props = {};

    if (this.isSender()) {
      props.onDragEnter = fileDropStore.onDragEnter;
      props.onDragLeave = fileDropStore.onDragLeave;
      props.onDragOver = fileDropStore.onDragOver;
      props.onDrop = fileDropStore.onDrop;
    }

    return props;
  }

  pageView() {
    if (this.isReceiver()) {
      return <Client queryUuid={this.queryUuid} />;
    }

    if (this.isSender()) {
      return <Server />;
    }

    return <Empty />;
  }

  render() {
    return (
      <div className={styles.app} {...this.appProps}>
        <div className={styles.content}>
          <h1><a href="/">dropkick</a></h1>
          {this.pageView()}
        </div>
        <div className={styles.footer}>
          <a href="https://github.com/cilphex/dropkick">Open source</a>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <App/>,
  document.getElementById("root")
);
