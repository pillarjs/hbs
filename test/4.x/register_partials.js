var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

before(function () {
  if (utils.nodeVersionCompare(0.10) < 0) {
    this.skip()
  }
})

test('render waits on register partials', function (done) {
  var express = require('express')
  var app = express()
  var hbs = require('../../').create()

  app.engine('hbs', hbs.__express)
  app.engine('html', hbs.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/', function (req, res) {
    hbs.registerPartials(path.join(__dirname, 'views', 'partials'))
    res.render('partials', { layout: false })
  })

  request(app)
    .get('/')
    .expect('Test Partial 1Test Partial 2Test Partial 3Test Partial 4Test Partial 5')
    .end(done)
})

test('render waits on multiple register partials', function (done) {
  var express = require('express')
  var app = express()
  var hbs = require('../../').create()

  app.engine('hbs', hbs.__express)
  app.engine('html', hbs.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/', function (req, res) {
    hbs.registerPartials(path.join(__dirname, 'views', 'partials', 'subdir'))
    hbs.registerPartials(path.join(__dirname, 'views', 'partials'))
    res.render('partials', { layout: false })
  })

  request(app)
    .get('/')
    .expect('Test Partial 1Test Partial 2Test Partial 3Test Partial 4Test Partial 5')
    .end(done)
})

test('register partials callback', function (done) {
  var hbs = require('../../').create()

  hbs.registerPartials(path.join(__dirname, 'views', 'partials'), done)
})

test('register partials name', function (done) {
  var express = require('express')
  var app = express()
  var hbs = require('../../').create()

  hbs.registerPartials(path.join(__dirname, 'views', 'partials'), {
    rename: function (name) { return name.replace(/(^|\s)(\w)/g, function (s, p, c) { return p + c.toUpperCase() }) }
  })

  app.engine('hbs', hbs.__express)
  app.engine('html', hbs.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/', function (req, res) {
    res.render('partials2', { layout: false })
  })

  request(app)
    .get('/')
    .expect('Test Partial 1Test Partial 2Test Partial 3Test Partial 4Test Partial 5')
    .end(done)
})
