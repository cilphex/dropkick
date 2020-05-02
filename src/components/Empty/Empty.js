import React from 'react';

import styles from './Empty.scss';

class Empty extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.empty}>
        <p>Sorry, nothing is here.</p>
      </div>
    );
  }
}

export default Empty;