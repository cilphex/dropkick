var path = require('path');
var express = require('express');

var app = express();

app.set('views', path.join(__dirname, 'views'));
