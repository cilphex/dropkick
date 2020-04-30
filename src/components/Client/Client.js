import React from 'react';
import ClientStore from 'stores/ClientStore';

import styles from './Client.scss';

class Client extends React.Component {
  constructor(props) {
    super(props);

    this.clientStore = new ClientStore();
  }

  render() {
    return (
      <div className={styles.clientView}>
        Client view.
      </div>
    );
  }
}

export default Client;