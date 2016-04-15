let connection = () => {
  // TODO (craig): is this necessary? returning null seems to work here.
  // (At least, locally...)
  return {
    iceServers: [
      { url: 'stun:stun.l.google.com:19302' }
    ]
  };
}

let uuid_store = () => {
  return new Firebase('https://cryptorun.firebaseio.com/descriptions');
}

let url = () => {
  let l = location;
  return l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + l.pathname;
}

module.exports.connection = connection();
module.exports.uuid_store = uuid_store();
module.exports.url = url();
