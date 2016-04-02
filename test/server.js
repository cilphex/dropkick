'use strict';

const path = require('path');
const httpServer = require('http-server');
const Browser = require('zombie');
Browser.localhost('127.0.0.1', 3333);

describe('page load', function() {
  const browser = new Browser();

  before('start the http server', function(done) {
    let root_path = path.join(__dirname, '..')
    let server = httpServer.createServer({
      root: root_path
    });
    server.listen(3333);
    done();
  });

  before('visit the main page', function(done) {
    browser.visit('/', done);
  });

  it('should be successful', function(done) {
    browser.assert.success();
  });

  it('should find basic elements', function(done) {
    browser.assert.text('h1', 'dropkick');
  });
});
