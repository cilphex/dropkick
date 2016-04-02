// ============================================================================
// App

class EmptyUI {
  constructor() {
    $('.app-empty').show();
  }
}

class App {
  constructor() {
    this.encryption_key = 'asdf'; // Not used for security
    this.query_uuid = this.queryUuid();
    this.is_sender = this.isSender();
    this.is_receiver = this.isReceiver();

    if (this.is_sender) {
      this.server = new Server();
    }
    else if (this.is_receiver) {
      this.client = new Client(this.query_uuid);
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

  static get connection_config() {
    // TODO (craig): is this necessary? returning null seems to work here.
    // (At least, locally...)
    return {
      iceServers: [
        { url: 'stun:stun.l.google.com:19302' }
      ]
    };
  }

  static get uuid_store() {
    return new Firebase('https://cryptorun.firebaseio.com/descriptions');
  }

  static get url() {
    let l = location;
    return l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + l.pathname;
  }
}

// ============================================================================
// Startup

new App();
