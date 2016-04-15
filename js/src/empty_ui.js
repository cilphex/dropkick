let EmptyUITemplate = require('./templates/empty');

let EmptyUIELement = React.createClass({
  render: function() {
    return EmptyUITemplate;
  }
});

class EmptyUI {
  constructor() {
    ReactDOM.render(
      <EmptyUIELement/>,
      document.getElementById('view')
    );
  }
}

module.exports = EmptyUI;
