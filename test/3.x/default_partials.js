// builtin
var fs = require('fs');
var assert = require('assert');

// 3rd party
var express = require('express');
var request = require('request');

// local
var hbs = require('../../').create();

var app = express();

// manually set render engine, under normal circumstances this
// would not be needed as hbs would be installed through npm
app.engine('hbs', hbs.__express);

// set the view engine to use handlebars
app.set('view engine', 'hbs');

// manually set view directory to the default for these tests,
// normally not needed unless a different directory is used
app.set('views', __dirname + '/views');

app.get('/partials', function(req, res) {
  res.render('partials', { layout: false });
});

app.use(function(err, req, res, next) {
  res.status(500).send(err.stack.toString());
});

test('default partials', function(done) {
  var server = app.listen(3000, function() {

    var expected = 'Test Partial 1Test Partial 2Test Partial 3';

    request('http://localhost:3000/partials', function(err, res, body) {
      assert.equal(body.trim(), expected.trim());
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});
