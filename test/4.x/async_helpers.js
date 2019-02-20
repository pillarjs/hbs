var path = require('path')

// builtin
var fs = require('fs');
var assert = require('assert');

// 3rd party
var request = require('request');

var app = null

before(function () {
  var express = require('express')
  var hbs = require('../../').create()

  app = express()

  // manually set render engine, under normal circumstances this
  // would not be needed as hbs would be installed through npm
  app.engine('hbs', hbs.__express)

  // set the view engine to use handlebars
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.use(express.static(path.join(__dirname, 'public')))

  // value for async helper
  // it will be called a few times from the template
  var vals = ['foo', 'bar', 'baz']
  hbs.registerAsyncHelper('async', function (context, cb) {
    process.nextTick(function () {
      cb(vals.shift())
    })
  })

  hbs.registerAsyncHelper('async-with-params', function (a, b, ctx, cb) {
    process.nextTick(function () {
      var val = a + b
      cb(val)
    })
  })

  var count = 0

  // fake async helper, returns immediately
  // although a regular helper could have been used we should support this use case
  hbs.registerAsyncHelper('fake-async', function (context, cb) {
    var val = 'instant' + count++
    cb(val)
  })

  app.get('/', function (req, res) {
    res.render('async', {
      layout: false
    })
  })

  app.get('/fake-async', function (req, res) {
    res.render('fake-async', {
      layout: false
    })
  })

  app.get('/async-with-params', function (req, res) {
    res.render('async-with-params', {
      layout: false
    })
  })
})

suite('express 4.x async helpers')

test('index', function (done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/async.html', 'utf8');

    request('http://localhost:3000', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('async', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/fake-async.html', 'utf8');

    request('http://localhost:3000/fake-async', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('async-with-params', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/async-with-params.html', 'utf8');

    request('http://localhost:3000/async-with-params', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});
