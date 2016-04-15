let Server = require('./server');
let Client = require('./client');
let EmptyUI = require('./empty_ui');

class App {
  constructor() {
    this.query_uuid = this.queryUuid();
    this.is_sender = this.isSender();
    this.is_receiver = this.isReceiver();

    if (this.is_sender) {
      new Server(this);
    }
    else if (this.is_receiver) {
      new Client(this, this.query_uuid);
    }
    else {
      new EmptyUI();
    }
  }

  isSender() {
    return location.search === '';
  }

  isReceiver() {
    return !!this.query_uuid;
  }

  queryUuid() {
    let match = location.search.match(/\?c=([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i);
    return match && match[1];
  }
}

module.exports = App;
