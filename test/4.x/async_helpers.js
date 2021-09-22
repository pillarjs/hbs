var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

var FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

// builtin
var fs = require('fs');

var app = null

suite('express 4.x async helpers')

before(function () {
  if (utils.nodeVersionCompare(0.10) < 0) {
    this.skip()
    return
  }

  var express = require('express')
  var hbs = require('../../').create()

  app = express()

  // manually set render engine, under normal circumstances this
  // would not be needed as hbs would be installed through npm
  app.engine('hbs', hbs.__express)

  // set the view engine to use handlebars
  app.set('view cache', true)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.use(express.static(path.join(__dirname, 'public')))

  // value for async helper
  // it will be called a few times from the template
  var indx = 0
  var vals = ['foo', 'bar', 'baz']
  hbs.registerAsyncHelper('async', function (context, cb) {
    var prefix = this.prefix || ''

    process.nextTick(function () {
      cb(prefix + vals[indx++ % 3])
    })
  })

  hbs.registerAsyncHelper('async-title', function (context, cb) {
    process.nextTick(function () {
      cb('Async Title')
    })
  })

  hbs.registerAsyncHelper('async-with-params', function (a, b, ctx, cb) {
    process.nextTick(function () {
      var val = a + b
      cb(val)
    })
  })

  // fake async helper, returns immediately
  // although a regular helper could have been used we should support this use case
  var count = 0
  hbs.registerAsyncHelper('fake-async', function (context, cb) {
    var val = 'instant' + count++
    cb(val)
  })

  app.get('/', function (req, res) {
    res.render('async', {
      layout: false,
      prefix: '* '
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

  app.get('/async-with-layout', function (req, res) {
    res.render('async')
  })

  app.get('/layout-with-async', function (req, res) {
    res.render('async', {
      layout: 'layout_async'
    })
  })
})

test('index', function (done) {
  request(app)
    .get('/')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'async.html'), 'utf8'))
    .end(done)
});

test('async', function(done) {
  request(app)
    .get('/fake-async')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'fake-async.html'), 'utf8'))
    .end(done)
});

test('cached', function (done) {
  request(app)
    .get('/')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'async.html'), 'utf8'))
    .end(done)
})

test('async-with-params', function(done) {
  request(app)
    .get('/async-with-params')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'async-with-params.html'), 'utf8'))
    .end(done)
});

test('async-with-layout', function (done) {
  request(app)
    .get('/async-with-layout')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'async-with-layout.html'), 'utf8'))
    .end(done)
})

test('layout-with-async', function (done) {
  request(app)
    .get('/layout-with-async')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'layout-with-async.html'), 'utf8'))
    .end(done)
})
